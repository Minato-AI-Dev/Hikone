type JsonRecord=Record<string,unknown>;

const allowedInterests=['ひこにゃん・キャラクター','食','写真','街歩き','工芸','景色','歴史','買い物','地元らしさ','おまかせ'];
const allowedLocations=['彦根城','彦根駅','夢京橋キャッスルロード','四番町スクエア','京橋口駐車場','二の丸駐車場'];
const allowedWalking=['low','medium','high'];

function setCors(res:any){
  res.setHeader('Access-Control-Allow-Origin',process.env.HIKONE_ALLOWED_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
}

function outputText(data:any):string{
  if(typeof data?.output_text==='string') return data.output_text;
  for(const item of data?.output||[]) for(const content of item?.content||[])
    if(content?.type==='output_text'&&typeof content.text==='string') return content.text;
  return '';
}

function parseJson(text:string):JsonRecord{
  const cleaned=text.trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  return JSON.parse(cleaned);
}

async function callOpenAI(instructions:string,input:string){
  const apiKey=process.env.OPENAI_API_KEY;
  const model=process.env.OPENAI_MODEL;
  if(!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  if(!model) throw new Error('OPENAI_MODEL is not configured');
  const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify({model,instructions,input,max_output_tokens:900,store:false}),
  });
  if(!response.ok){
    const detail=await response.text();
    throw new Error('OpenAI API error '+response.status+': '+detail.slice(0,500));
  }
  const data=await response.json();
  const text=outputText(data);
  if(!text) throw new Error('OpenAI returned no text');
  return parseJson(text);
}

function sanitizeAnswers(value:any){
  const out:Record<string,unknown>={};
  if(Number.isFinite(value?.time)&&value.time>=10&&value.time<=480) out.time=Math.round(value.time);
  if(allowedLocations.includes(value?.currentLocation)) out.currentLocation=value.currentLocation;
  if(allowedLocations.includes(value?.finalDestination)) out.finalDestination=value.finalDestination;
  if(Array.isArray(value?.interests)){
    const interests=value.interests.filter((x:unknown)=>typeof x==='string'&&allowedInterests.includes(x));
    if(interests.length) out.interests=[...new Set(interests)];
  }
  if(allowedWalking.includes(value?.walking)) out.walking=value.walking;
  if(value?.budget===null||(Number.isFinite(value?.budget)&&value.budget>=0&&value.budget<=100000)) out.budget=value.budget;
  if(typeof value?.firstVisit==='boolean') out.firstVisit=value.firstVisit;
  return out;
}

export default async function handler(req:any,res:any){
  setCors(res);
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const {mode,message}=req.body||{};
    if(typeof message!=='string'||!message.trim()) return res.status(400).json({error:'message is required'});

    if(mode==='extract'){
      const result=await callOpenAI([
        'You are the input-understanding layer for Hikone AI.',
        'The product preserves the tourist original destination and inserts only feasible detours.',
        'In this step ONLY extract conditions. Do not recommend a place and do not invent local facts.',
        'Return ONLY valid JSON:',
        '{"message":"short Japanese confirmation","answers":{"currentLocation":string?,"finalDestination":string?,"time":number?,"interests":string[]?,"walking":"low|medium|high"?,"budget":number|null?,"firstVisit":boolean?}}',
        'Allowed locations: '+allowedLocations.join(', ')+'.',
        'Allowed interests: '+allowedInterests.join(', ')+'.',
        'Omit conditions that are not stated instead of guessing.',
        'Respond in Japanese.'
      ].join('\n'),message);
      return res.status(200).json({
        message:typeof result.message==='string'?result.message:'条件を読み取りました。',
        answers:sanitizeAnswers(result.answers)
      });
    }

    if(mode==='present'){
      const {answers,candidates}=req.body||{};
      if(!Array.isArray(candidates)||!candidates.length) return res.status(400).json({error:'candidates are required'});
      const ids=new Set(candidates.map((c:any)=>c?.id).filter(Boolean));
      const result=await callOpenAI([
        'You are the presentation layer for Hikone AI.',
        'The deterministic engine has already chosen the three strategies and calculated feasibility.',
        'DO NOT reorder candidates. DO NOT introduce any new place, fact, opening hour, price, event, travel time, or historical claim.',
        'Explain only the supplied data. Emphasize what the tourist gets and how little the original plan changes.',
        'Return ONLY valid JSON:',
        '{"intro":"1-2 short Japanese sentences","reasons":{"candidate-id":"one concise Japanese reason"}}',
        'Every reason key must be one of the supplied candidate ids.',
        'Respond in Japanese.'
      ].join('\n'),JSON.stringify({userMessage:message,answers,candidates}));

      const reasons:Record<string,string>={};
      if(result.reasons&&typeof result.reasons==='object'){
        for(const id of ids){
          const value=(result.reasons as Record<string,unknown>)[String(id)];
          if(typeof value==='string') reasons[String(id)]=value;
        }
      }
      return res.status(200).json({
        intro:typeof result.intro==='string'?result.intro:'行き先を変えずに入れられる寄り道です。',
        reasons
      });
    }

    return res.status(400).json({error:'Unknown mode'});
  }catch(error){
    console.error(error);
    return res.status(502).json({error:'Hikone AI is temporarily unavailable'});
  }
}
