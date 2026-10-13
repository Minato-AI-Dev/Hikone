import { nodes } from '../src/data/dbV4.js';
import { provisionalNodeIds } from '../src/data/provisionalWalking.js';
export type RoutingLocation = { nodeId:string; name:string; address:string; verificationStatus:'verified'|'provisional'|'unresolved' };
// No entrance coordinates have been verified. API success does not certify geocoding.
export const routingLocations:Record<string,RoutingLocation> = Object.fromEntries(nodes
  .filter(n=>['S01','D01','P01','P02','PK01','PK02','PK03','PK04'].includes(n.id) || ((n.status==='ACTIVE'||provisionalNodeIds.has(n.id))&&n.modes.includes('徒歩')))
  .map(n=>[n.id,{nodeId:n.id,name:n.name,address:n.name+' 滋賀県彦根市',verificationStatus:'provisional' as const}]));
export function routingLocation(id:string):RoutingLocation|undefined { return Object.hasOwn(routingLocations,id)?routingLocations[id]:undefined; }
