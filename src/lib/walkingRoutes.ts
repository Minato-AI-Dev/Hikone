import type { Answers, HistoryState } from '../types';
import { nodeById } from '../data/dbV4';
import { recommend, routingCandidateIds, type RoutedLegs, type Route } from './recommend';

const endpoint=import.meta.env.VITE_WALKING_ROUTE_ENDPOINT||'/api/walking-routes';
const paceFactor={standard:1,relaxed:1.2,slow:1.45};
const conditionFactor={normal:1,rain:1.15,heat:1.25};
export type AutoRouteResult={recommendations:ReturnType<typeof recommend>;source:'maps'|'offline';warning:string};
export async function autoRecommend(answers:Answers,history:HistoryState|null,originGps?:{lat:number;lng:number}|null):Promise<AutoRouteResult>{
 const fallback=()=>({recommendations:recommend(answers,history),source:'offline' as const,warning:'経路APIを利用できないため、未実測の仮時間を使用しています。駐車場発着など計算できない場所は表示されません。'});
 const candidates=routingCandidateIds(answers,history);
 const start=nodeById(answers.currentNodeId),end=nodeById(answers.finalNodeId);
 if(!start||!end||!candidates.length)return fallback();
 const names:Record<string,string>={};
 for(const n of [start,end,...candidates.map(id=>nodeById(id)).filter((n):n is NonNullable<typeof n>=>Boolean(n))]){
   names[n.id]=n.name+' 滋賀県彦根市';
 }
 // GPS is not sent without an explicit location consent; selected nodes remain the ETA reference.
 const pairs=[{from:start.id,to:end.id},...candidates.flatMap(id=>[{from:start.id,to:id},{from:id,to:end.id}])];
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pairs,names})});
  if(!response.ok)throw new Error('Routing not configured');
  const data=await response.json() as {legs:Record<string,{seconds:number;meters:number}>};
  if(!data.legs||!data.legs[start.id+'>'+end.id])throw new Error('No direct route');
  const factor=paceFactor[answers.walkingPace||'standard']*conditionFactor[answers.walkingConditions||'normal'];
  const routed:RoutedLegs={};
  for(const [key,leg] of Object.entries(data.legs)){
    if(!Number.isFinite(leg.seconds)||!Number.isFinite(leg.meters))continue;
    const minutes=Math.ceil(leg.seconds/60*factor);
    const route:Route={minutes,distance:Math.round(leg.meters)};
    routed[key]=route;
  }
  return {recommendations:recommend(answers,history,routed),source:'maps',warning:'地図経路を基準に歩行ペース・天候の目安を補正。信号待ち・疲労・混雑・施設滞在は状況により変化します。'};
 }catch{return fallback();}
}
