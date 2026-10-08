import { Answers, HistoryState, VisitRecord } from '../types';
const KEY='hikone-next-history-v2-db4';
export function loadHistory():HistoryState|null{try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):null}catch{return null}}
export function saveHistory(state:HistoryState){localStorage.setItem(KEY,JSON.stringify(state))}
export function startExperience(record:VisitRecord,answers:Answers){
 const now=new Date().toISOString();const current=loadHistory();
 const next:HistoryState=current?{...current,lastVisitAt:now,preferences:answers,visitHistory:[...current.visitHistory,record]}:{firstVisitAt:now,lastVisitAt:now,preferences:answers,visitHistory:[record]};
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
export const completedIds=(h:HistoryState|null)=>new Set((h?.visitHistory||[]).filter(v=>v.completed).map(v=>v.experienceId));
export const lastCompletedId=(h:HistoryState|null)=>[...(h?.visitHistory||[])].reverse().find(v=>v.completed)?.experienceId;
