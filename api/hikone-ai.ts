import { isRecord, prepareJson, type ApiRequest, type ApiResponse } from '../server/http';
import { reserveBudget } from '../server/rateLimit';
type JsonRecord=Record<string,unknown>;
const allowedNodeIds=['S01','D01','P01','P02'];
const allowedTags=['T_HIKONYAN','T_PHOTO','T_WALK','T_FOOD','T_SHOP','T_HISTORY','T_MODERN','T_ARCH','T_LAKE','T_SCENERY','T_STREETSCAPE','T_NATURE','T_RIVER','T_GARDEN'];
function outputText(data:any):string{if(typeof data?.output_text==='string')return data.output_text;for(const item of data?.output||[])for(const c of item?.content||[])if(c?.type==='output_text'&&typeof c.text==='string')return c.text;return ''}
function parseJson(text:string):JsonRecord{return JSON.parse(text.trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim())}
async function callOpenAI(instructions:string,input:string){
 const key=process.env.OPENAI_API_KEY,model=process.env.OPENAI_MODEL;if(!key||!model)throw new Error('AI env missing');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({model,instructions,input,max_output_tokens:800,store:false})});if(!r.ok)throw new Error('AI unavailable');const d=await r.json(),t=outputText(d);if(!t)throw new Error('No output');return parseJson(t)}finally{clearTimeout(timer)}
}
export default async function handler(req:ApiRequest,res:ApiResponse){
 if(!prepareJson(req,res))return;
 if(!isRecord(req.body))return res.status(400).json({error:'Invalid request'});
 const {mode,message,candidates}=req.body;
 if(typeof message!=='string'||!message.trim()||message.length>2000||!['extract-v4','present-v4'].includes(String(mode)))return res.status(400).json({error:'Invalid request'});
 if(mode==='present-v4'&&(!Array.isArray(candidates)||candidates.length>3||candidates.some(c=>!isRecord(c)||typeof c.id!=='string'||typeof c.node!=='string'||typeof c.action!=='string')))return res.status(400).json({error:'Invalid candidates'});
 if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)return res.status(503).json({error:'AI not configured'});
 const limit=await reserveBudget(req,'ai',1);
 if(limit!=='allowed'){if(limit==='limited')res.setHeader('Retry-After','60');return res.status(limit==='limited'?429:503).json({error:'AI protection unavailable'})}
 try{
  if(mode==='extract-v4'){const result=await callOpenAI([
   'You extract Hikone recommendation DB V4 user context only. Do not recommend places or invent data.',
   'Return JSON only: {"message":"short Japanese","answers":{"currentNodeId":string?,"finalNodeId":string?,"remainingTimeMin":number?,"maxWalkMin":number?,"walkingPace":"standard|relaxed|slow"?,"walkingConditions":"normal|rain|heat"?,"interestTagIds":string[]?,"detourPreference":"最短|少しなら|積極"?,"discoveryOptIn":boolean?}}',
   'Only extract explicitly stated walking pace and conditions; never infer physical ability from age or identity. Distinguish total remaining time from maximum walking time.',
   'Allowed node ids: '+allowedNodeIds.join(', ')+'. Allowed tags: '+allowedTags.join(', ')+'. Omit unknown fields.'
  ].join('\n'),message);const raw:any=result.answers||{};const a:any={};if(allowedNodeIds.includes(raw.currentNodeId))a.currentNodeId=raw.currentNodeId;if(allowedNodeIds.includes(raw.finalNodeId))a.finalNodeId=raw.finalNodeId;if(Number.isFinite(raw.remainingTimeMin))a.remainingTimeMin=Math.round(raw.remainingTimeMin);if(Number.isFinite(raw.maxWalkMin)&&raw.maxWalkMin>=0&&raw.maxWalkMin<=1440)a.maxWalkMin=Math.floor(raw.maxWalkMin);if(['standard','relaxed','slow'].includes(raw.walkingPace))a.walkingPace=raw.walkingPace;if(['normal','rain','heat'].includes(raw.walkingConditions))a.walkingConditions=raw.walkingConditions;if(Array.isArray(raw.interestTagIds))a.interestTagIds=raw.interestTagIds.filter((x:string)=>allowedTags.includes(x));if(['最短','少しなら','積極'].includes(raw.detourPreference))a.detourPreference=raw.detourPreference;if(typeof raw.discoveryOptIn==='boolean')a.discoveryOptIn=raw.discoveryOptIn;return res.status(200).json({message:typeof result.message==='string'?result.message:'条件を読み取りました。',answers:a})}
  if(mode==='present-v4'){const result=await callOpenAI(['You are only a presentation layer. The V4 deterministic engine already decided feasibility. Never add/reorder places, travel times, actions or facts. Return JSON only: {"intro":"short Japanese","reasons":{"candidate-id":"short reason"}}'].join('\n'),JSON.stringify({message,candidates}));return res.status(200).json(result)}
  return res.status(400).json({error:'Unknown mode'});
 }catch{return res.status(502).json({error:'Hikone AI unavailable'})}}
