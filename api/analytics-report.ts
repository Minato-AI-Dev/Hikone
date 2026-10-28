import { timingSafeEqual } from 'node:crypto';
import { header,type ApiRequest,type ApiResponse } from '../server/http.js';
import { AGGREGATE_EVENTS,metricKey,redisCommand,analyticsTestRun } from '../server/aggregateAnalytics.js';

// Private operational endpoint. Never expose the secret in VITE_ variables.
export default async function handler(req:ApiRequest,res:ApiResponse){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  let testRun:string|null;
  try{testRun=analyticsTestRun();}catch{return res.status(503).json({error:'Report unavailable'});}
  // Production remains read-only, even for an authenticated administrator.
  if(req.method!=='GET'&&!(req.method==='DELETE'&&testRun))
    return res.status(405).json({error:'Method not allowed'});
  const secret=process.env.HIKONE_ANALYTICS_ADMIN_TOKEN;
  const auth=header(req,'authorization');
  const supplied=auth.startsWith('Bearer ')?auth.slice(7):'';
  const a=Buffer.from(secret||''),b=Buffer.from(supplied);
  if(!secret||secret.length<32||a.length!==b.length||!timingSafeEqual(a,b))
    return res.status(401).json({error:'Unauthorized'});
  const query=(req as ApiRequest&{query?:Record<string,unknown>}).query;
  const day=typeof query?.day==='string'?query.day:'';
  const parsedDay=new Date(day+'T00:00:00Z');
  if(!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(day)||!Number.isFinite(parsedDay.getTime())||parsedDay.toISOString().slice(0,10)!==day)
    return res.status(400).json({error:'Use day=YYYY-MM-DD'});
  try{
    if(req.method==='DELETE'){
      const removed=await redisCommand(['DEL',...AGGREGATE_EVENTS.map(e=>metricKey(day,e))]);
      return res.status(200).json({day,testRun,removed});
    }
    const values=await Promise.all(AGGREGATE_EVENTS.map(e=>redisCommand(['GET',metricKey(day,e)])));
    return res.status(200).json({day,...(testRun?{testRun}:{}),counts:Object.fromEntries(AGGREGATE_EVENTS.map((event,i)=>[event,Number(values[i]??0)]))});
  }catch{return res.status(503).json({error:'Report unavailable'});}
}
