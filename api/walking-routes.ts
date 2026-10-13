import { isRecord, prepareJson, type ApiRequest, type ApiResponse } from '../server/http.js';
import { routingLocation } from '../server/locations.js';
import { reserveBudget } from '../server/rateLimit.js';
type Pair={from:string;to:string};
export default async function handler(req:ApiRequest,res:ApiResponse) {
  if(!prepareJson(req,res))return;
  const body=req.body;
  if(!isRecord(body)||Object.keys(body).some(k=>k!=='pairs')||!Array.isArray(body.pairs)||body.pairs.length<1||body.pairs.length>17)
    return res.status(400).json({error:'Invalid route batch'});
  const pairs:Pair[]=[];
  for(const p of body.pairs) {
    if(!isRecord(p)||Object.keys(p).some(k=>k!=='from'&&k!=='to')||typeof p.from!=='string'||typeof p.to!=='string'||!routingLocation(p.from)||!routingLocation(p.to))
      return res.status(400).json({error:'Unknown location'});
    pairs.push({from:p.from,to:p.to});
  }
  const key=process.env.GOOGLE_MAPS_API_KEY;
  if(!key)return res.status(503).json({error:'Walking routing not configured'});
  const unique=[...new Map(pairs.map(p=>[p.from+'>'+p.to,p])).values()];
  const paid=unique.filter(p=>p.from!==p.to);
  const budget=await reserveBudget(req,'routes',paid.length);
  if(budget!=='allowed') {
    if(budget==='limited')res.setHeader('Retry-After','60');
    return res.status(budget==='limited'?429:503).json({error:budget==='limited'?'Request limit reached':'Routing protection unavailable'});
  }
  const legs:Record<string,{seconds:number;meters:number}>={};
  for(const p of unique)if(p.from===p.to)legs[p.from+'>'+p.to]={seconds:0,meters:0};
  const deadline=Date.now()+18000;let index=0;
  const worker=async()=>{while(index<paid.length&&Date.now()<deadline) {
    const p=paid[index++],controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),Math.min(4000,Math.max(1,deadline-Date.now())));
    try {
      const response=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{
        method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.duration,routes.distanceMeters'},signal:controller.signal,
        body:JSON.stringify({origin:{address:routingLocation(p.from)!.address},destination:{address:routingLocation(p.to)!.address},travelMode:'WALK',languageCode:'ja-JP',units:'METRIC'})
      });
      if(!response.ok)continue;
      const data=await response.json();const route=data?.routes?.[0];
      if(typeof route?.duration!=='string'||!/^\d+(?:\.\d+)?s$/.test(route.duration))continue;
      const seconds=Number(route.duration.slice(0,-1)),meters=route.distanceMeters;
      if(Number.isFinite(seconds)&&seconds>0&&seconds<=86400&&typeof meters==='number'&&Number.isFinite(meters)&&meters>0&&meters<=100000)
        legs[p.from+'>'+p.to]={seconds,meters};
    } catch {/* Upstream errors must not disclose credentials. */} finally {clearTimeout(timer);}
  }};
  await Promise.all(Array.from({length:Math.min(4,paid.length)},worker));
  if(!Object.keys(legs).length)return res.status(502).json({error:'Walking routes unavailable'});
  return res.status(200).json({legs,locationVerification:'provisional',partial:Object.keys(legs).length<unique.length});
}
