import { Answers, HistoryState, VisitRecord } from '../types';
const KEY='hikone-next-history-v2-db4',MAX_VISITS=500;
let temporary:HistoryState|null=null,storageFailed=false;
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const date=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function parseHistory(value:unknown):HistoryState|null{
 if(!record(value)||!Array.isArray(value.visitHistory)||!date(value.firstVisitAt)||!date(value.lastVisitAt))return null;
 const visitHistory:VisitRecord[]=value.visitHistory.filter(v=>record(v)&&typeof v.experienceId==='string'&&v.experienceId.length<=128&&date(v.startedAt)&&typeof v.completed==='boolean'&&(!v.completedAt||date(v.completedAt))).slice(-MAX_VISITS).map(v=>({
  experienceId:v.experienceId,startedAt:v.startedAt,completed:v.completed,
  ...(v.completedAt?{completedAt:v.completedAt}:{}),
  ...(['great','okay','not'].includes(v.helpful)?{helpful:v.helpful}:{}),
  ...(['no','probablyNo','yes'].includes(v.counterfactual)?{counterfactual:v.counterfactual}:{})
 }));
 return {firstVisitAt:value.firstVisitAt,lastVisitAt:value.lastVisitAt,visitHistory};
}
export function loadHistory():HistoryState|null{
 if(storageFailed)return temporary;
 try{const raw=localStorage.getItem(KEY);return raw?parseHistory(JSON.parse(raw)):null;}catch{return temporary;}
}
export function historyIsTemporary():boolean{return storageFailed;}
export function saveHistory(state:HistoryState):boolean{
 temporary={...state,visitHistory:state.visitHistory.slice(-MAX_VISITS)};
 try{localStorage.setItem(KEY,JSON.stringify(temporary));storageFailed=false;return true;}
 catch{storageFailed=true;return false;}
}
export function startExperience(record:VisitRecord,answers:Answers){
 const now=new Date().toISOString(),current=loadHistory();
 const next:HistoryState=current?{...current,lastVisitAt:now,preferences:answers,visitHistory:[...current.visitHistory,record].slice(-MAX_VISITS)}:{firstVisitAt:now,lastVisitAt:now,preferences:answers,visitHistory:[record]};
 saveHistory(next);return next;
}
export function completeExperience(experienceId:string){
 const current=loadHistory();if(!current)return null;const now=new Date().toISOString();
 const next={...current,lastVisitAt:now,visitHistory:current.visitHistory.map(v=>v.experienceId===experienceId&&!v.completed?{...v,completed:true,completedAt:now}:v)};
 saveHistory(next);return next;
}
export function addValidation(experienceId:string,helpful:VisitRecord['helpful'],counterfactual:VisitRecord['counterfactual']){
 const current=loadHistory();if(!current)return null;const idx=[...current.visitHistory].reverse().findIndex(v=>v.experienceId===experienceId);if(idx<0)return current;
 const real=current.visitHistory.length-1-idx;const visits=current.visitHistory.map((v,i)=>i===real?{...v,helpful,counterfactual}:v);const next={...current,visitHistory:visits};saveHistory(next);return next;
}
export const completedIds=(h:HistoryState|null)=>new Set((Array.isArray(h?.visitHistory)?h.visitHistory:[]).filter(v=>v&&v.completed&&typeof v.experienceId==='string').map(v=>v.experienceId));
export const lastCompletedId=(h:HistoryState|null)=>[...(Array.isArray(h?.visitHistory)?h.visitHistory:[])].reverse().find(v=>v&&v.completed)?.experienceId;
