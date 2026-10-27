import { prepareJson, type ApiRequest,type ApiResponse } from '../server/http.js';
import { reserveBudget } from '../server/rateLimit.js';
import { parseAggregateEvent,dayInTokyo,metricKey,redisCommand } from '../server/aggregateAnalytics.js';

// Never receive GPS, free-form text, per-person identifiers or raw history.
export default async function handler(req:ApiRequest,res:ApiResponse){
  if(!prepareJson(req,res))return;
  const event=parseAggregateEvent(req.body);
  if(!event)return res.status(400).json({error:'Invalid aggregate event'});
  const budget=await reserveBudget(req,'analytics',1);
  if(budget!=='allowed')return res.status(budget==='limited'?429:503).json({error:'Analytics unavailable'});
  try{
    await redisCommand(['INCR',metricKey(dayInTokyo(new Date()),event)]);
    return res.status(200).json({ok:true});
  }catch{return res.status(503).json({error:'Analytics unavailable'});}
}
