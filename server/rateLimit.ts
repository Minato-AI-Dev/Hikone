import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { header, type ApiRequest } from './http.js';
export type LimitResult = 'allowed'|'limited'|'unavailable';
// Atomic reservations; fixed windows can double bursts at a boundary. Also set Google quotas.
const script=`local ip = tonumber(redis.call('GET', KEYS[1]) or '0')
local total = tonumber(redis.call('GET', KEYS[2]) or '0')
local daily = tonumber(redis.call('GET', KEYS[3]) or '0')
if ip >= tonumber(ARGV[1]) or total + tonumber(ARGV[4]) > tonumber(ARGV[2]) or daily + tonumber(ARGV[4]) > tonumber(ARGV[3]) then return 0 end
redis.call('INCR', KEYS[1]); redis.call('EXPIRE', KEYS[1], 120)
redis.call('INCRBY', KEYS[2], ARGV[4]); redis.call('EXPIRE', KEYS[2], 120)
redis.call('INCRBY', KEYS[3], ARGV[4]); redis.call('EXPIRE', KEYS[3], 172800)
return 1`;
export async function reserveBudget(req:ApiRequest,service:'routes'|'ai'|'shops',units:number):Promise<LimitResult> {
  // Select a complete namespace; never send one provider's token to another URL.
  const custom=Boolean(process.env.UPSTASH_REDIS_REST_URL||process.env.UPSTASH_REDIS_REST_TOKEN);
  const url=custom?process.env.UPSTASH_REDIS_REST_URL:process.env.KV_REST_API_URL;
  const token=custom?process.env.UPSTASH_REDIS_REST_TOKEN:process.env.KV_REST_API_TOKEN;
  const salt=process.env.HIKONE_RATE_LIMIT_SALT;
  // Vercel overwrites this header. Never trust generic x-forwarded-for.
  const ip=header(req,'x-vercel-forwarded-for').trim();
  if(!url||!/^https:\/\//.test(url)||!token||!salt||salt.length<32||!isIP(ip))return 'unavailable';
  const identity=createHmac('sha256',salt).update(ip).digest('hex'),now=Date.now(),minute=Math.floor(now/60000),day=Math.floor(now/86400000);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2000);
  try {
    const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},signal:controller.signal,
      body:JSON.stringify(['EVAL',script,3,`hikone:${service}:ip:${minute}:${identity}`,`hikone:${service}:global:${minute}`,`hikone:${service}:day:${day}`,service==='routes'?6:service==='shops'?6:4,service==='routes'?120:service==='shops'?60:30,service==='routes'?300:service==='shops'?250:50,units])});
    if(!response.ok)return 'unavailable';
    const data=await response.json() as {result?:unknown};return data.result===1?'allowed':data.result===0?'limited':'unavailable';
  } catch {return 'unavailable';} finally {clearTimeout(timer);}
}
