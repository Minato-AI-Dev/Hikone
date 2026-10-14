import { nodes } from '../src/data/dbV4.js';
import { provisionalNodeIds } from '../src/data/provisionalWalking.js';
export type RoutingLocation = { nodeId:string; name:string; address:string; placeId?:string; verificationStatus:'verified'|'provisional'|'unresolved' };
// Canonical names resolved without partialMatch on 2026-10-13. Place identity
// does not certify an entrance: station exit and street endpoint need field QA.
const canonicalPlaces:Record<string,string>={
  S01:'ChIJFUSUCwDVA2ARZupipKG4HAU', // 彦根城 表門券売所
  D01:'ChIJqSwSmsjUA2ARUaJr69Vmcc4', // 彦根駅 (west-side routing observed)
  P01:'ChIJT3sbj9bUA2ARhBtpwGzb1ZI', // 夢京橋キャッスルロード (street, not certified north endpoint)
};
// No entrance coordinates have been verified. API success does not certify geocoding.
export const routingLocations:Record<string,RoutingLocation> = Object.fromEntries(nodes
  .filter(n=>['S01','D01','P01','P02','P40','PK01','PK02','PK03','PK04'].includes(n.id) || ((n.status==='ACTIVE'||provisionalNodeIds.has(n.id))&&n.modes.includes('徒歩')))
  .map(n=>[n.id,{nodeId:n.id,name:n.name,address:n.name+' 滋賀県彦根市',placeId:canonicalPlaces[n.id],verificationStatus:'provisional' as const}]));
export function routingLocation(id:string):RoutingLocation|undefined { return Object.hasOwn(routingLocations,id)?routingLocations[id]:undefined; }
export function routingWaypoint(id:string) { const location=routingLocation(id)!;return location.placeId?{placeId:location.placeId}:{address:location.address}; }
