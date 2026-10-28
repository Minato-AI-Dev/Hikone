import { prepareJson, type ApiRequest,type ApiResponse } from '../server/http.js';
import { reserveBudget } from '../server/rateLimit.js';
import { parseAggregateEvent,dayInTokyo,incrementMetric,analyticsCollectionOpen } from '../server/aggregateAnalytics.js';

// Never receive GPS, free-form text, per-person identifiers or raw history.
export default async function handler(req:ApiRequest,res:ApiResponse){
  if(!prepareJson(req,res))return;
  const event=parseAggregateEvent(req.body);
  if(!event)return res.status(400).json({error:'Invalid aggregate event'});
  try{if(!analyticsCollectionOpen())return res.status(410).json({error:'Research collection has ended'});}
  catch{console.error('analytics_configuration_unavailable');return res.status(503).json({error:'Analytics unavailable'});}
  const budget=await reserveBudget(req,'analytics',1);
  if(budget!=='allowed'){
    if(budget==='unavailable')console.error('analytics_protection_unavailable');
    else console.warn('analytics_rate_limit_reached');
    return res.status(budget==='limited'?429:503).json({error:'Analytics unavailable'});
  }
  try{
    await incrementMetric(dayInTokyo(new Date()),event);
    return res.status(200).json({ok:true});
  }catch{console.error('analytics_storage_unavailable');return res.status(503).json({error:'Analytics unavailable'});}
}
