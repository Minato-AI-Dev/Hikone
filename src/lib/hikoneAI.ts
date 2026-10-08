import { Answers, Recommendation } from '../types';

export type AIBackendSource = 'ai' | 'fallback';
export type AIUnderstandResult = { answers: Partial<Answers>; message: string; source: AIBackendSource };
export type AIPresentationResult = { intro: string; reasons: Record<string,string>; source: AIBackendSource };

const endpoint = import.meta.env.VITE_HIKONE_AI_ENDPOINT || '/api/hikone-ai';

async function postJson<T>(body: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body),
  });
  if(!response.ok) throw new Error('Hikone AI API error: '+response.status);
  return response.json() as Promise<T>;
}

export async function understandWithHikoneAI(message:string):Promise<AIUnderstandResult>{
  try{
    const result=await postJson<{answers:Partial<Answers>;message:string}>({mode:'extract',message});
    return {...result,source:'ai'};
  }catch{
    return {
      answers:inferAnswersLocally(message),
      message:'読み取れた条件で寄り道を計算します。足りない条件は現在の設定を使います。',
      source:'fallback'
    };
  }
}

export async function presentWithHikoneAI(message:string, answers:Answers, recommendations:Recommendation[]):Promise<AIPresentationResult>{
  const candidates=recommendations.map(r=>({
    id:r.id,
    strategy:r.mode,
    place:r.place.name,
    hook:r.hook.headline,
    hookBody:r.hook.body,
    experience:r.experience.name,
    experienceDescription:r.experience.description,
    detourMinutes:r.detourMinutes,
    additionalWalkingMeters:r.additionalWalkingMeters,
    totalJourneyMinutes:r.totalJourneyMinutes,
    finalDestination:answers.finalDestination,
  }));
  try{
    const result=await postJson<{intro:string;reasons:Record<string,string>}>({
      mode:'present',message,answers,candidates
    });
    return {...result,source:'ai'};
  }catch{
    return {
      intro:'行き先は変えず、今のルートに入る寄り道を3つの考え方で出しました。',
      reasons:Object.fromEntries(recommendations.map(r=>[r.id,r.reason])),
      source:'fallback'
    };
  }
}

export function applyAIPresentation(recommendations:Recommendation[], presentation:AIPresentationResult){
  return recommendations.map(r=>({...r,reason:presentation.reasons[r.id] || r.reason}));
}

function inferAnswersLocally(text:string):Partial<Answers>{
  const answers:Partial<Answers>={};
  const normalized=text.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0));

  const minutes=normalized.match(/(?:あと|残り)?\s*(\d{1,3})\s*分/);
  const hours=normalized.match(/(?:あと|残り)?\s*(\d(?:\.5)?)\s*時間/);
  if(minutes) answers.time=Number(minutes[1]);
  else if(/1\s*時間\s*半/.test(normalized)) answers.time=90;
  else if(hours) answers.time=Math.round(Number(hours[1])*60);

  if(/彦根城.*(?:見終|出た|いる|から)/.test(normalized)) answers.currentLocation='彦根城';
  else if(/キャッスルロード.*(?:いる|から|出た)/.test(normalized)) answers.currentLocation='夢京橋キャッスルロード';
  else if(/四番町.*(?:いる|から|出た)/.test(normalized)) answers.currentLocation='四番町スクエア';
  else if(/彦根駅.*(?:いる|から|出た)/.test(normalized)) answers.currentLocation='彦根駅';

  if(/(?:彦根駅|駅).*(?:戻|行|向か)|(?:戻|行|向か).*彦根駅/.test(normalized)) answers.finalDestination='彦根駅';
  else if(/京橋口.*(?:戻|行|向か)|(?:戻|行|向か).*京橋口/.test(normalized)) answers.finalDestination='京橋口駐車場';
  else if(/二の丸.*(?:戻|行|向か)|(?:戻|行|向か).*二の丸/.test(normalized)) answers.finalDestination='二の丸駐車場';
  else if(/彦根城.*(?:戻|行|向か)|(?:戻|行|向か).*彦根城/.test(normalized)) answers.finalDestination='彦根城';

  const interests:string[]=[];
  const map:Array<[RegExp,string]>=[
    [/ひこにゃん|キャラクター|ゆるキャラ/,'ひこにゃん・キャラクター'],
    [/食|ごはん|ランチ|甘い|スイーツ|カフェ|お菓子/,'食'],
    [/写真|撮影|映え|レトロ/,'写真'],
    [/街歩き|散歩|路地|歩いて/,'街歩き'],
    [/工芸|職人|ものづくり|仏壇/,'工芸'],
    [/景色|庭園|琵琶湖|川/,'景色'],
    [/歴史|史跡|城下町/,'歴史'],
    [/買い物|土産|おみやげ/,'買い物'],
    [/地元|ローカル|暮らし|観光地っぽくない/,'地元らしさ'],
    [/おまかせ|任せる|なんでも/,'おまかせ'],
  ];
  for(const [pattern,value] of map) if(pattern.test(normalized)) interests.push(value);
  if(interests.length) answers.interests=[...new Set(interests)];

  if(/歩きたくない|あまり歩|疲れ|足が痛|短め/.test(normalized)) answers.walking='low';
  else if(/たくさん歩|しっかり歩|歩くのが好き|長く歩/.test(normalized)) answers.walking='high';
  else if(/普通くらい|ほどほど|少し歩/.test(normalized)) answers.walking='medium';

  if(/無料|お金をかけたくない/.test(normalized)) answers.budget=0;
  else{
    const budget=normalized.match(/(?:予算|以内|まで)[^\d]{0,5}(\d{3,5})\s*円|([1-9]\d{2,4})\s*円(?:以内|まで)/);
    const value=budget?.[1]||budget?.[2];
    if(value) answers.budget=Number(value);
  }

  if(/初めて|初訪問|初回/.test(normalized)) answers.firstVisit=true;
  else if(/前にも|来たこと|再訪|何度目|リピーター/.test(normalized)) answers.firstVisit=false;

  return answers;
}
