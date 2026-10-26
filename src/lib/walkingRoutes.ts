import type { Answers, HistoryState } from '../types';
import { nodeById } from '../data/dbV4';
import { recommend, routingCandidateIds, type RoutedLegs } from './recommend';
import { adjustedMinutes } from './walkingModel';

export type AutoRouteResult={recommendations:ReturnType<typeof recommend>;source:'maps'|'demo'|'unavailable';warning:string};
export async function autoRecommend(answers:Answers,history:HistoryState|null,_originGps?:{lat:number;lng:number}|null,signal?:AbortSignal):Promise<AutoRouteResult> {
  const fallback=(message:string):AutoRouteResult=>{
    const demo=import.meta.env.VITE_ROUTING_DEMO==='true';
    const recommendations=demo?recommend(answers,history,undefined,'demo'):[];
    return {recommendations,source:demo?'demo':'unavailable',warning:message+(demo?' 机上概算によるデモ用参考値です。実際の移動時間を保証しません。Google Mapsで経路をご確認ください。':' 参考徒歩時間を取得できないため、時間に余裕があると判断できる候補は表示しません。Google Mapsでご確認ください。')};
  };
  if(!nodeById(answers.currentNodeId)||!nodeById(answers.finalNodeId)||!Number.isFinite(answers.remainingTimeMin)||answers.remainingTimeMin<0)
    return {recommendations:[],source:'unavailable',warning:'出発地・帰着地・残り時間を確認してください。'};
  const candidates=routingCandidateIds(answers,history);
  if(!candidates.length)return {recommendations:[],source:'unavailable',warning:'現在の条件に合う候補がありません。'};
  const endpoint=import.meta.env.VITE_WALKING_ROUTE_ENDPOINT?.trim() || (import.meta.env.DEV?'/api/walking-routes':'');
  if(!endpoint)return fallback('徒歩経路サービスが未設定です。');
  const pairs=[{from:answers.currentNodeId,to:answers.finalNodeId},...candidates.flatMap(id=>[{from:answers.currentNodeId,to:id},{from:id,to:answers.finalNodeId}])].filter(p=>p.from!==p.to);
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
    if(answers.currentNodeId!==answers.finalNodeId&&!routed[answers.currentNodeId+'>'+answers.finalNodeId])throw new Error('Missing direct route');
    const partial=Object.keys(routed).length<unique.length;
    return {recommendations:recommend(answers,history,routed),source:'maps',warning:'Google Maps の参考徒歩時間を歩行ペース・天候で補正し、計画上の余裕5分を加えています。混雑・個人差・寄り道によって変動し、時間内の到着は保証しません。地点の入口・座標と一部の滞在時間は未検証です。'+(partial?' 一部の経路を取得できず、候補を省略しました。':'')};
  } catch {
    if(signal?.aborted)return {recommendations:[],source:'unavailable',warning:''};
    return fallback('現在、徒歩経路を取得できません。');
  } finally {clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
