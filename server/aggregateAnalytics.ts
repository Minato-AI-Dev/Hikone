import { isRecord } from './http.js';
export const AGGREGATE_EVENTS=[
  'app_open','questionnaire_started','questionnaire_completed','recommendation_viewed',
  'recommendation_selected','experience_started','navigation_clicked','experience_completed',
  'experience_not_completed','second_experience_selected','returning_user_detected',
  'continue_previous_selected','different_hikone_selected','qr_scanner_opened',
  'qr_checkin_success','hikone_ai_opened','hikone_ai_started','hikone_ai_completed'
] as const;
export type AggregateEvent=typeof AGGREGATE_EVENTS[number];
const known=new Set<string>(AGGREGATE_EVENTS);
export function parseAggregateEvent(value:unknown):AggregateEvent|null {
  if(!isRecord(value)||Object.keys(value).some(k=>k!=='event')||typeof value.event!=='string'||!known.has(value.event))return null;
  return value.event as AggregateEvent;
}
export function dayInTokyo(now:Date):string {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function redisConnection():{url:string;token:string}|null {
  const custom=Boolean(process.env.UPSTASH_REDIS_REST_URL||process.env.UPSTASH_REDIS_REST_TOKEN);
  const url=custom?process.env.UPSTASH_REDIS_REST_URL:process.env.KV_REST_API_URL;
  const token=custom?process.env.UPSTASH_REDIS_REST_TOKEN:process.env.KV_REST_API_TOKEN;
  if(!url||!url.startsWith('https://')||!token)return null;
  return {url,token};
}
export async function redisCommand(cmd:string[]):Promise<unknown>{
  const connection=redisConnection();
  if(!connection)throw new Error('Analytics storage unavailable');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),3000);
  try{
    const response=await fetch(connection.url,{method:'POST',headers:{Authorization:'Bearer '+connection.token,'Content-Type':'application/json'},body:JSON.stringify(cmd),signal:controller.signal});
    if(!response.ok)throw new Error('Storage error');
    const data=await response.json() as {result?:unknown;error?:unknown};
    if(data.error||data.result===undefined)throw new Error('Storage error');
    return data.result;
  }finally{clearTimeout(timeout);}
}
// A preview must explicitly opt into an isolated run; it can never use research keys.
export function analyticsTestRun():string|null {
  const run=process.env.HIKONE_ANALYTICS_TEST_RUN;
  if(process.env.VERCEL_ENV==='preview'){
    if(!run||!/^test-[a-z0-9-]{8,64}$/.test(run))throw new Error('Analytics test run not configured');
    return run;
  }
  if(run)throw new Error('Analytics test runs require a preview deployment');
  return null;
}
export function analyticsPrefix():string {
  const run=analyticsTestRun();
  return run?'hikone:aggregate:test:v1:'+run:'hikone:aggregate:v1';
}
export const metricKey=(day:string,event:AggregateEvent)=>analyticsPrefix()+':'+day+':'+event;
export async function incrementMetric(day:string,event:AggregateEvent):Promise<unknown> {
  const run=analyticsTestRun(),key=metricKey(day,event);
  // Test keys also expire if a verifier is interrupted before cleanup.
  return redisCommand(run
    ?['EVAL',"local n=redis.call('INCR',KEYS[1]); redis.call('EXPIRE',KEYS[1],86400); return n",'1',key]
    :['INCR',key]);
}
