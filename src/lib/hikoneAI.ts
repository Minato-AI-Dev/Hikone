import { Answers, Recommendation } from '../types';
import { nodeById, tagNames } from '../data/dbV4';

export type AIBackendSource='ai'|'fallback';
export type AIUnderstandResult={answers:Partial<Answers>;message:string;source:AIBackendSource};
export type AIPresentationResult={intro:string;reasons:Record<string,string>;source:AIBackendSource};
const endpoint=import.meta.env.VITE_HIKONE_AI_ENDPOINT||'/api/hikone-ai';

async function postJson<T>(body:unknown):Promise<T>{
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!response.ok) throw new Error('Hikone AI API error: '+response.status);return response.json() as Promise<T>;
}
export async function understandWithHikoneAI(message:string):Promise<AIUnderstandResult>{
 try{const result=await postJson<{answers:Partial<Answers>;message:string}>({mode:'extract-v4',message});return {...result,source:'ai'}}
 catch{return {answers:inferLocally(message),message:'V4の入力項目として読み取れる範囲を反映しました。',source:'fallback'}}
}
export async function presentWithHikoneAI(message:string,answers:Answers,recommendations:Recommendation[]):Promise<AIPresentationResult>{
 const candidates=recommendations.map(r=>({id:r.id,node:r.nodeName,action:r.actionName,layer:r.layer,detourMinutes:r.detourMinutes,matchingTags:r.matchingTags}));
 try{const result=await postJson<{intro:string;reasons:Record<string,string>}>({mode:'present-v4',message,answers,candidates});return {...result,source:'ai'}}
 catch{return {intro:'V4のハード制約で成立した候補だけを表示しています。',reasons:Object.fromEntries(recommendations.map(r=>[r.id,r.reason])),source:'fallback'}}
}
export function applyAIPresentation(recommendations:Recommendation[],p:AIPresentationResult){return recommendations.map(r=>({...r,reason:p.reasons[r.id]||r.reason}))}

function inferLocally(text:string):Partial<Answers>{
 const a:Partial<Answers>={};const t=text.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0));
 const m=t.match(/(?:あと|残り)?\s*(\d{1,3})\s*分/);if(m)a.remainingTimeMin=Number(m[1]);
 if(/彦根城/.test(t)) a.currentNodeId='S01';
 if(/(?:彦根駅|駅).*(?:戻|行|向か)|(?:戻|行|向か).*彦根駅/.test(t)) a.finalNodeId='D01';
 if(/キャッスルロード/.test(t)&&/(?:いる|から|出た)/.test(t))a.currentNodeId='P01';
 if(/四番町/.test(t)&&/(?:いる|から|出た)/.test(t))a.currentNodeId='P02';
 const tags:string[]=[];
 const maps:Array<[RegExp,string]>=[[/ひこにゃん|キャラクター/,'T_HIKONYAN'],[/写真|撮影|映え/,'T_PHOTO'],[/街歩き|散歩|路地/,'T_WALK'],[/食|ごはん|甘い|カフェ/,'T_FOOD'],[/買い物|土産|おみやげ/,'T_SHOP'],[/近代|洋館|建築/,'T_MODERN'],[/琵琶湖|湖岸/,'T_LAKE'],[/景色|眺め/,'T_SCENERY'],[/歴史|史跡/,'T_HISTORY']];
 for(const [re,id] of maps)if(re.test(t))tags.push(id);if(tags.length)a.interestTagIds=[...new Set(tags)];
 if(/最短|寄り道したくない/.test(t)){a.detourPreference='最短';a.discoveryOptIn=false}
 else if(/積極|寄り道したい|いろいろ見たい/.test(t)){a.detourPreference='積極';a.discoveryOptIn=true}
 return a;
}
export const describeAnswers=(a:Answers)=>({current:nodeById(a.currentNodeId)?.name||a.currentNodeId,final:nodeById(a.finalNodeId)?.name||a.finalNodeId,tags:a.interestTagIds.map(t=>tagNames[t]||t)});
