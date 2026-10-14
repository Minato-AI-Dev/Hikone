import type { Answers, HistoryState } from '../types';
import { nodeById } from '../data/dbV4';
import { recommend, routingCandidateIds, type RoutedLegs } from './recommend';
import { adjustedMinutes } from './walkingModel';

export type AutoRouteResult={recommendations:ReturnType<typeof recommend>;source:'maps'|'measured'|'demo'|'unavailable';warning:string};
export async function autoRecommend(answers:Answers,history:HistoryState|null,_originGps?:{lat:number;lng:number}|null,signal?:AbortSignal):Promise<AutoRouteResult> {
  const fallback=(message:string):AutoRouteResult=>{
    const demo=import.meta.env.VITE_ROUTING_DEMO==='true';
    const recommendations=recommend(answers,history,undefined,demo?'demo':'measured');
    return {recommendations,source:demo?'demo':recommendations.length?'measured':'unavailable',warning:message+(demo?' 以下は現地未検証のデモです。移動前にGoogle Mapsで確認してください。':recommendations.length?' 現地実測の区間を基準とした目安を表示します。':' 信頼できる徒歩時間が揃わないため、時間内に行ける候補は表示できません。Google Mapsで確認してください。')};
  };
  if(!nodeById(answers.currentNodeId)||!nodeById(answers.finalNodeId)||!Number.isFinite(answers.remainingTimeMin)||answers.remainingTimeMin<0)
    return {recommendations:[],source:'unavailable',warning:'出発地・帰着地・残り時間を確認してください。'};
  if(answers.plannedNodeId&&(!nodeById(answers.plannedNodeId)||
    [answers.currentNodeId,answers.finalNodeId].includes(answers.plannedNodeId)||
    !Number.isFinite(answers.plannedStayMin)||Number(answers.plannedStayMin)<0))
    return {recommendations:[],source:'unavailable',warning:'必ず行く予定の場所と滞在時間を確認してください。'};
  const candidates=routingCandidateIds(answers,history).slice(0,answers.plannedNodeId?3:8);
  if(!candidates.length)return {recommendations:[],source:'unavailable',warning:'現在の条件に合う候補がありません。'};
  const endpoint=import.meta.env.VITE_WALKING_ROUTE_ENDPOINT?.trim() || (import.meta.env.DEV?'/api/walking-routes':'');
  if(!endpoint)return fallback('徒歩経路サービスが未設定です。');
  const baseline=[answers.currentNodeId,...(answers.plannedNodeId?[answers.plannedNodeId]:[]),answers.finalNodeId];
  const pairs=[...baseline.slice(1).map((to,i)=>({from:baseline[i],to})),
    ...candidates.flatMap(id=>baseline.slice(1).flatMap((to,i)=>[{from:baseline[i],to:id},{from:id,to}]))]
    .filter(p=>p.from!==p.to);
  const unique=[...new Map(pairs.map(p=>[p.from+'>'+p.to,p])).values()];
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  const cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  try {
    // Send only repository IDs. GPS and client-provided addresses are never included.
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pairs:unique}),signal:controller.signal});
    if(!response.ok)throw new Error('Routing unavailable');
    const data=await response.json();
    if(!data||typeof data.legs!=='object'||!data.legs||Array.isArray(data.legs))throw new Error('Invalid routes');
    const routed:RoutedLegs={};
    for(const p of unique) {
      const key=p.from+'>'+p.to,leg=data.legs[key];
      if(!leg||typeof leg.seconds!=='number'||typeof leg.meters!=='number'||!Number.isFinite(leg.seconds)||!Number.isFinite(leg.meters)||leg.seconds<=0||leg.meters<=0||leg.seconds>86400||leg.meters>100000)continue;
      routed[key]={minutes:adjustedMinutes(leg.seconds,answers),distance:Math.round(leg.meters)};
    }
    if(baseline.slice(1).some((to,i)=>baseline[i]!==to&&!routed[baseline[i]+'>'+to]))throw new Error('Missing mandatory route');
    const partial=Object.keys(routed).length<unique.length;
    return {recommendations:recommend(answers,history,routed),source:'maps',warning:'Google Maps の徒歩推定を歩行ペース・天候で補正し、計画の余裕5分を加えています。地点の入口・座標と一部の滞在時間は未検証です。'+(partial?' 一部の経路を取得できず、候補を省略しました。':'')};
  } catch {
    if(signal?.aborted)return {recommendations:[],source:'unavailable',warning:''};
    return fallback('現在、徒歩経路を取得できません。');
  } finally {clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
