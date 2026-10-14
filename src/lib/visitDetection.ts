// Pilot geofences: area representative points, not certified entrances.
// Confirm onsite before treating proximity as evidence of a visit.
export const pilotPlaces = [
 {id:'P01', name:'夢京橋キャッスルロード', lat:35.272167, lng:136.252010, radiusM:75, source:'https://www.westjr.co.jp/global/en/ticket/hokuriku-arch-pass/Explore_Japan/spot/shiga/yumekyobashi-castle-road/'},
 {id:'P02', name:'四番町スクエア', lat:35.2697815, lng:136.2511518, radiusM:75, source:'https://mapfan.com/spots/S34HY%2CJ%2C3AZU4'}
] as const;
export type VisitEvidence = 'gps_candidate'|'self_report';
export type DetectedVisit = {nodeId:string; firstSeenAt:string; method:VisitEvidence; confirmed:boolean};
const KEY='hikone-visit-checks-v1';
export function readVisits():DetectedVisit[]{
 try {const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>typeof x.nodeId==='string'&&typeof x.firstSeenAt==='string'&&
   (x.method==='gps_candidate'||x.method==='self_report')&&typeof x.confirmed==='boolean').slice(-100):[];}catch{return [];}
}
export function writeVisits(v:DetectedVisit[]):void{try{localStorage.setItem(KEY,JSON.stringify(v.slice(-100)));}catch{/* browser storage disabled */}}
export function clearVisits():void{try{localStorage.removeItem(KEY)}catch{/* browser storage disabled */}}
function meters(lat1:number,lng1:number,lat2:number,lng2:number){
 const rad=Math.PI/180,dLat=(lat2-lat1)*rad,dLng=(lng2-lng1)*rad;
 const a=Math.sin(dLat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLng/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
export type CandidateState={nodeId:string;since:number}|null;
// Two accurate observations >=20 seconds apart, same place. Never persist raw coordinates.
export function evaluateFix(fix:{latitude:number;longitude:number;accuracy:number},at:number,previous:CandidateState):{candidate:CandidateState;arrived:string|null}{
 if(!Number.isFinite(fix.latitude)||!Number.isFinite(fix.longitude)||!Number.isFinite(fix.accuracy)||
    fix.accuracy<0||fix.accuracy>60)return {candidate:null,arrived:null};
 const nearby=pilotPlaces.map(place=>({place,d:meters(fix.latitude,fix.longitude,place.lat,place.lng)}))
  .filter(x=>x.d<=x.place.radiusM).sort((a,b)=>a.d-b.d)[0];
 if(!nearby)return {candidate:null,arrived:null};
 if(previous?.nodeId===nearby.place.id){
  return {candidate:previous,arrived:at-previous.since>=20000?nearby.place.id:null};
 }
 return {candidate:{nodeId:nearby.place.id,since:at},arrived:null};
}
