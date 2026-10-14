import { Answers, HistoryState, Recommendation, ResearchCandidate } from '../types';
import { actions, actionsForNode, DB_V4_META, edges, locationStatus, nodeById, nodes, nodeTags, photoPriority, tagNames } from '../data/dbV4';
import { completedIds } from './history';
import { provisionalActions,provisionalEdges,provisionalNodeIds } from '../data/provisionalWalking';
import { measuredEdges } from '../data/measuredWalking';
import { adjustedMinutes, WALKING_MODEL } from './walkingModel';

export type Route={minutes:number;distance:number|null};
export type RoutedLegs=Record<string,Route>;
const legKey=(from:string,to:string)=>from+'>'+to;

function usableEdges(mode:string,measuredOnly=false){
  const verifiedPairs=new Set(measuredEdges.map(e=>[e.from,e.to].sort().join('|')));
  return [...measuredEdges,...edges,...provisionalEdges].filter(e=>
    e.mode===mode && (measuredOnly?e.policy==='実測済':['実測済','暫定可','仮運用','概算Demo'].includes(e.policy)) &&
    typeof e.time==='number' &&
    (e.policy==='実測済'||!verifiedPairs.has([e.from,e.to].sort().join('|')))
  );
}
function shortest(from:string,to:string,mode:string,measuredOnly=false):Route|null{
  if(from===to) return {minutes:0,distance:0};
  const es=usableEdges(mode,measuredOnly);
  const adj=new Map<string,Array<{to:string;minutes:number;distance:number|null}>>();
  const add=(a:string,b:string,m:number,d:number|null)=>{
    const list=adj.get(a)||[];list.push({to:b,minutes:m,distance:d});adj.set(a,list);
  };
  for(const e of es){
    add(e.from,e.to,e.time as number,e.distance);
    if(e.direction==='both') add(e.to,e.from,e.time as number,e.distance);
  }
  const best=new Map<string,Route>();
  const q:Array<{id:string;minutes:number;distance:number|null}>=[{id:from,minutes:0,distance:0}];
  best.set(from,{minutes:0,distance:0});
  while(q.length){
    q.sort((a,b)=>a.minutes-b.minutes);
    const cur=q.shift()!;
    if(cur.id===to) return {minutes:cur.minutes,distance:cur.distance};
    const known=best.get(cur.id); if(known && cur.minutes>known.minutes) continue;
    for(const n of adj.get(cur.id)||[]){
      const distance=cur.distance===null||n.distance===null?null:cur.distance+n.distance;
      const cand={minutes:cur.minutes+n.minutes,distance};
      const prev=best.get(n.to);
      if(!prev||cand.minutes<prev.minutes){best.set(n.to,cand);q.push({id:n.to,...cand});}
    }
  }
  return null;
}
function matchingTags(nodeId:string,selected:string[]){
  const tags=nodeTags[nodeId]||[];
  return selected.filter(t=>tags.includes(t));
}
function actionSupportsExplicitTheme(actionName:string,selected:string[]){
  if(!selected.length) return true;
  const checks:Record<string,RegExp>={
    T_PHOTO:/写真|撮影/,
    T_FOOD:/食べ|飲食|購入|カステラ|メニュー/,
    T_SHOP:/店|土産|ショップ|グッズ|購入/,
    T_HIKONYAN:/ひこにゃん|キャラ|マンホール|グッズ|赤備え/,
  };
  const strict=selected.filter(t=>checks[t]);
  if(!strict.length) return true;
  return strict.some(t=>checks[t].test(actionName));
}
function layerFor(nodeId:string,answers:Answers):'L1'|'L2'{
  return matchingTags(nodeId,answers.interestTagIds).length?'L1':'L2';
}
export function recommend(answers:Answers,history:HistoryState|null,routed?:RoutedLegs,source:'maps'|'measured'|'demo'=routed?'maps':'demo'):Recommendation[]{
  if(!Number.isFinite(answers.remainingTimeMin)||answers.remainingTimeMin<0||
    (answers.maxWalkMin!==null&&(!Number.isFinite(answers.maxWalkMin)||answers.maxWalkMin<0)))return [];
  const route=(a:string,b:string)=>routed
    ? (a===b?{minutes:0,distance:0}:routed[legKey(a,b)]||null)
    : (()=>{const leg=shortest(a,b,answers.availableMode,source==='measured');return leg?{...leg,minutes:adjustedMinutes(leg.minutes*60,answers)}:null;})();
  const planned=answers.plannedNodeId;
  if(planned&&(!nodeById(planned)||[answers.currentNodeId,answers.finalNodeId].includes(planned)||
    !Number.isFinite(answers.plannedStayMin)||Number(answers.plannedStayMin)<0))return [];
  const baseline=[answers.currentNodeId,...(planned?[planned]:[]),answers.finalNodeId];
  const sum=(ids:string[])=>{
    const legs=ids.slice(1).map((to,i)=>route(ids[i],to));
    if(legs.some(l=>!l))return null;
    return {minutes:legs.reduce((v,l)=>v+l!.minutes,0),
      distance:legs.some(l=>l!.distance===null)?null:legs.reduce((v,l)=>v+l!.distance!,0)};
  };
  const original=sum(baseline);
  if(!original)return [];
  const plannedStay=planned?Number(answers.plannedStayMin):0;
  const done=completedIds(history);
  const out:Recommendation[]=[];
  for(const node of nodes){
    if(node.type!=='poi'&&node.type!=='area') continue;
    if(baseline.includes(node.id)) continue;
    if(node.status!=='ACTIVE'&&!provisionalNodeIds.has(node.id)) continue;
    if(!node.modes.includes(answers.availableMode)) continue;
    if(!node.publicStatus.includes('公開')&&!provisionalNodeIds.has(node.id)) continue;
    const usableActions=[...actionsForNode(node.id),...provisionalActions.filter(a=>a.nodeId===node.id)]
      .filter(a=>typeof a.minStay==='number'&&(a.timeStatus==='KNOWN'||a.timeStatus==='仮設定'||a.timeStatus==='概算Demo')&&!done.has(a.id))
      .sort((a,b)=>{
        const am=actionSupportsExplicitTheme(a.type,answers.interestTagIds)?1:0;
        const bm=actionSupportsExplicitTheme(b.type,answers.interestTagIds)?1:0;
        return bm-am || (a.minStay as number)-(b.minStay as number);
      });
    const knownAction=usableActions[0];
    if(!knownAction) continue;
    const layer=layerFor(node.id,answers);
    if(layer==='L2'&&(!answers.discoveryOptIn||answers.detourPreference==='最短')) continue;
    if(layer==='L1'&&!actionSupportsExplicitTheme(knownAction.type,answers.interestTagIds)) continue;

    const positions=baseline.slice(1).map((_,i)=>[...baseline.slice(0,i+1),node.id,...baseline.slice(i+1)]);
    const valid=positions.map(ids=>({ids,leg:sum(ids)})).filter(x=>x.leg!==null)
      .sort((x,y)=>x.leg!.minutes-y.leg!.minutes);
    const chosen=valid[0];
    if(!chosen)continue;
    const walking=chosen.leg!.minutes,margin=WALKING_MODEL.safetyMinutes;
    if(answers.maxWalkMin!==null&&walking>answers.maxWalkMin)continue;
    const via=walking+plannedStay+(knownAction.minStay as number)+margin;
    if(via>answers.remainingTimeMin)continue;
    const viaDistance=chosen.leg!.distance;
    const additionalDistance=original.distance===null||viaDistance===null?null:Math.max(0,viaDistance-original.distance);
    const matches=matchingTags(node.id,answers.interestTagIds);
    out.push({
      id:node.id+'-'+knownAction.id,nodeId:node.id,nodeName:node.name,actionId:knownAction.id,actionName:knownAction.type,layer,
      originalRouteMinutes:original.minutes+plannedStay,viaRouteMinutes:via,detourMinutes:Math.max(0,via-original.minutes-plannedStay),
      walkingMinutes:walking,additionalWalkingMinutes:Math.max(0,walking-original.minutes),experienceMinutes:(knownAction.minStay as number)+plannedStay,safetyBufferMinutes:margin,routeNodeIds:chosen.ids,
      originalDistanceM:original.distance,viaDistanceM:viaDistance,additionalDistanceM:additionalDistance,
      matchingTags:matches.map(t=>tagNames[t]||t),
      reason:layer==='L1'
        ?'選んだテーマに合い、現在のV4データで時間成立を判定できる候補です。'
        :'明示テーマを置き換えず、発見枠として追加できる候補です。',
      dataStatus:source==='maps'?'Google Maps の徒歩推定に歩行ペース・天候補正と余裕5分を加算。地点の入口・座標は未検証、滞在時間は一部仮設定です。':source==='measured'?'現地実測の区間に歩行ペース・天候補正と余裕5分を加算。個人差があり、滞在時間は一部仮設定です。':'徒歩時間・滞在時間は机上の概算です。安全余裕5分を含む現地未検証のDemo表示です。'
    });
  }
  out.sort((a,b)=>{
    if(a.layer!==b.layer) return a.layer==='L1'?-1:1;
    if(answers.detourPreference==='積極') return b.matchingTags.length-a.matchingTags.length || a.detourMinutes-b.detourMinutes;
    return a.detourMinutes-b.detourMinutes || b.matchingTags.length-a.matchingTags.length;
  });
  return out.slice(0,3);
}

function candidateBlockers(nodeId:string,answers:Answers){
  const node=nodeById(nodeId); if(!node) return ['NODE不明'];
  const blockers:string[]=[];
  if(node.status!=='ACTIVE') blockers.push('MVP状態: '+node.status);
  if(!node.modes.includes(answers.availableMode)) blockers.push('徒歩モード未確定');
  const known=[...actionsForNode(nodeId),...provisionalActions.filter(a=>a.nodeId===nodeId)].some(a=>typeof a.minStay==='number'&&['KNOWN','仮設定','概算Demo'].includes(a.timeStatus));
  if(!known) blockers.push('最低ACTION時間が未実測');
  const a=shortest(answers.currentNodeId,nodeId,answers.availableMode);
  const b=shortest(nodeId,answers.finalNodeId,answers.availableMode);
  if(!a||!b) blockers.push('使用可能EDGEが不足');
  if(locationStatus[nodeId]) blockers.push(locationStatus[nodeId]);
  if(!node.publicStatus.includes('公開')&& !node.publicStatus.includes('屋外公開')) blockers.push(node.publicStatus);
  return [...new Set(blockers)];
}

export function researchCandidates(answers:Answers):ResearchCandidate[]{
  const selected=answers.interestTagIds;
  let pool=nodes.filter(n=>(n.type==='poi'||n.type==='area')&&n.id!==answers.currentNodeId&&n.id!==answers.finalNodeId);
  if(selected.length) pool=pool.filter(n=>matchingTags(n.id,selected).length);
  else pool=pool.filter(n=>n.status!=='ACTIVE');

  const ranked=pool.map(node=>{
    const tags=matchingTags(node.id,selected);
    let themeRank=0;
    const nts=nodeTags[node.id]||[];
    if(selected.includes('T_HIKONYAN')){
      if(nts.includes('T_HIK_DIRECT')) themeRank=30;
      else if(nts.includes('T_CHAR_HISTORY')) themeRank=20;
      else if(nts.includes('T_HIK_ORIGIN')) themeRank=10;
    }
    const pp=photoPriority[node.id];
    if(selected.includes('T_PHOTO')&&pp==='A') themeRank+=30;
    if(selected.includes('T_PHOTO')&&pp==='B') themeRank+=20;
    return {node,tags,themeRank,priority:pp};
  }).filter(x=>candidateBlockers(x.node.id,answers).length>0);

  ranked.sort((a,b)=>b.themeRank-a.themeRank || b.tags.length-a.tags.length || (a.node.status==='RESEARCH'?-1:1));
  return ranked.slice(0,6).map(x=>({
    nodeId:x.node.id,nodeName:x.node.name,status:x.node.status,category:x.node.category,
    matchingTags:x.tags.map(t=>tagNames[t]||t),priority:x.priority,blockers:candidateBlockers(x.node.id,answers),note:x.node.note
  }));
}

export const dbStats=DB_V4_META;
export const nodeOptions=nodes.filter(n=>['S01','D01','P01','P02','PK01','PK02','PK03','PK04'].includes(n.id));
export const researchNodeCount=nodes.filter(n=>n.status==='RESEARCH'||n.status==='BACKLOG'||n.status==='CONDITIONAL').length;
export const knownActionCount=actions.filter(a=>typeof a.minStay==='number'&&(a.timeStatus==='KNOWN'||a.timeStatus==='仮設定')).length+provisionalActions.length;

// The same eligibility screen used for the API-powered and offline recommendations.
export function routingCandidateIds(a:Answers,h:HistoryState|null):string[]{
 const done=completedIds(h);
 return nodes.filter(n=>(n.type==='poi'||n.type==='area') && n.id!==a.currentNodeId && n.id!==a.finalNodeId && n.id!==a.plannedNodeId && (n.status==='ACTIVE'||provisionalNodeIds.has(n.id)) && n.modes.includes('徒歩') && (n.publicStatus.includes('公開')||provisionalNodeIds.has(n.id)))
 .filter(n=>[...actionsForNode(n.id),...provisionalActions.filter(x=>x.nodeId===n.id)].some(x=>typeof x.minStay==='number'&&x.minStay+WALKING_MODEL.safetyMinutes<=a.remainingTimeMin&&!done.has(x.id)&&['KNOWN','仮設定','概算Demo'].includes(x.timeStatus)&&actionSupportsExplicitTheme(x.type,a.interestTagIds)))
 .filter(n=>{const tags=matchingTags(n.id,a.interestTagIds);return tags.length>0||a.discoveryOptIn&&a.detourPreference!=='最短';})
 .sort((x,y)=>matchingTags(y.id,a.interestTagIds).length-matchingTags(x.id,a.interestTagIds).length)
 .slice(0,8).map(n=>n.id);
}
