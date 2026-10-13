import { Answers, Recommendation } from '../types';
import { nodeById, tagNames } from '../data/dbV4';

export type AIBackendSource='ai'|'fallback';
export type AIUnderstandResult={answers:Partial<Answers>;message:string;source:AIBackendSource};
export type AIPresentationResult={intro:string;reasons:Record<string,string>;source:AIBackendSource};

async function postJson<T>(body:unknown,signal?:AbortSignal):Promise<T>{
 const endpoint=import.meta.env.VITE_HIKONE_AI_ENDPOINT?.trim()||(import.meta.env.DEV?'/api/hikone-ai':'');
 if(!endpoint)throw new Error('AI not configured');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000),cancel=()=>controller.abort();
 signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
 try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});
 if(!response.ok)throw new Error('AI unavailable');return await response.json() as T;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel)}
}
export async function understandWithHikoneAI(message:string,signal?:AbortSignal):Promise<AIUnderstandResult>{
 try{const result=await postJson<{answers:Partial<Answers>;message:string}>({mode:'extract-v4',message},signal);return {...result,source:'ai'}}
 catch{return {answers:inferLocally(message),message:'ご希望をもとに探しました。',source:'fallback'}}
}
export async function presentWithHikoneAI(message:string,answers:Answers,recommendations:Recommendation[],signal?:AbortSignal):Promise<AIPresentationResult>{
 const candidates=recommendations.map(r=>({id:r.id,node:r.nodeName,action:r.actionName,layer:r.layer,detourMinutes:r.detourMinutes,matchingTags:r.matchingTags}));
 try{const result=await postJson<{intro:string;reasons:Record<string,string>}>({mode:'present-v4',message,answers,candidates},signal);if(typeof result.intro!=='string'||!result.reasons||typeof result.reasons!=='object')throw new Error('Invalid AI presentation');return {...result,source:'ai'}}
 catch{return {intro:'',reasons:Object.fromEntries(recommendations.map(r=>[r.id,r.reason])),source:'fallback'}}
}
export function applyAIPresentation(recommendations:Recommendation[],p:AIPresentationResult){return recommendations.map(r=>({...r,reason:typeof p.reasons[r.id]==='string'?p.reasons[r.id].slice(0,500):r.reason}))}

function inferLocally(text:string):Partial<Answers>{
 const a:Partial<Answers>={};const t=text.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0));
 const walking=t.match(/(?:徒歩|歩(?:く|ける)(?:時間)?(?:のは)?)[^。\n\d]{0,12}(\d{1,3})\s*分\s*(?:まで|以内|以下|が上限)/);
 if(walking)a.maxWalkMin=Number(walking[1]);
 const remaining=t.match(/(?:あと|残り)\s*(\d{1,3})\s*分/);
 const m=remaining||t.replace(walking?.[0]||'','').match(/(\d{1,3})\s*分/);if(m)a.remainingTimeMin=Number(m[1]);
 if(/休憩しながら|休みながら/.test(t))a.walkingPace='slow';
 else if(/ゆっくり|のんびり/.test(t))a.walkingPace='relaxed';
 else if(/普通に歩|通常の速さ/.test(t))a.walkingPace='standard';
 if(/雨|足元が悪い/.test(t))a.walkingConditions='rain';
 else if(/暑い|疲れやすい|猛暑/.test(t))a.walkingConditions='heat';
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
