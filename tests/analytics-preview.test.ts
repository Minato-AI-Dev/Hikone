import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import collect from '../api/analytics-collect';
import report from '../api/analytics-report';
import dashboard from '../api/analytics-dashboard';
import {analyticsTestRun,metricKey,AGGREGATE_EVENTS} from '../server/aggregateAnalytics';
import {reserveBudget} from '../server/rateLimit';
const run='test-ci-isolated-20261028',token='unit-test-token-not-a-secret-12345678';
const response=()=>({code:200,body:{} as any,headers:{} as Record<string,string>,setHeader(k:string,v:string){this.headers[k]=v;},status(n:number){this.code=n;return this;},json(b:unknown){this.body=b;return this;},end(b?:string){this.body=b;return this;}});
const request=(body:unknown={event:'recommendation_viewed'})=>({method:'POST',headers:{origin:'https://frontend.example','content-type':'application/json','x-vercel-forwarded-for':'192.0.2.1'},body});
const read=(day='2026-10-28',method='GET',auth=token)=>({method,headers:{authorization:'Bearer '+auth,'x-vercel-forwarded-for':'192.0.2.1'},query:{day}});
let counters:Map<string,number>,commands:any[][];
beforeEach(()=>{
 vi.stubEnv('HIKONE_ANALYTICS_END_AT','');
 vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('HIKONE_ANALYTICS_TEST_RUN',run);
 vi.stubEnv('HIKONE_ANALYTICS_ADMIN_TOKEN',token);vi.stubEnv('HIKONE_ALLOWED_ORIGIN','https://frontend.example');
 vi.stubEnv('UPSTASH_REDIS_REST_URL','');vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','');
 vi.stubEnv('KV_REST_API_URL','https://redis.example');vi.stubEnv('KV_REST_API_TOKEN','unit-test-redis');
 vi.stubEnv('HIKONE_RATE_LIMIT_SALT','unit-test-salt-12345678901234567890');
 counters=new Map();commands=[];
 vi.stubGlobal('fetch',vi.fn(async(_url:unknown,init?:RequestInit)=>{
  const cmd=JSON.parse(init!.body as string);commands.push(cmd);let result:unknown;
  if(cmd[0]==='EVAL'&&cmd[2]==='1'){result=(counters.get(cmd[3])??0)+1;counters.set(cmd[3],result as number);}
  else if(cmd[0]==='EVAL')result=1;
  else if(cmd[0]==='INCR'){result=(counters.get(cmd[1])??0)+1;counters.set(cmd[1],result as number);}
  else if(cmd[0]==='MGET')result=cmd.slice(1).map((k:string)=>counters.get(k)??null);
  else if(cmd[0]==='GET')result=counters.get(cmd[1])??null;
  else if(cmd[0]==='DEL'){result=cmd.slice(1).filter((k:string)=>counters.delete(k)).length;}
  else throw new Error('Unexpected Redis command');
  return {ok:true,json:async()=>({result})};
 }));
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('isolated preview analytics',()=>{
 it('adds, reports and deletes test counts while preserving research data',async()=>{
  const productionKey='hikone:aggregate:v1:2026-10-28:recommendation_viewed';counters.set(productionKey,7);
  const r=response();await collect(request(),r);expect(r.code).toBe(200);
  const testKey=[...counters.keys()].find(k=>k.startsWith('hikone:aggregate:test:'))!;
  const day=testKey.split(':').at(-2)!;
  const s=response();await report(read(day),s);expect(s.code).toBe(200);expect(s.body.testRun).toBe(run);
  expect(s.body.counts.recommendation_viewed).toBe(1);
  const d=response();await report(read(day,'DELETE'),d);expect(d.code).toBe(200);expect(d.body.removed).toBe(1);
  const after=response();await report(read(day),after);expect(Object.values(after.body.counts).every(n=>n===0)).toBe(true);
  expect(counters.get(productionKey)).toBe(7);
  const del=commands.find(c=>c[0]==='DEL')!;expect(del).toHaveLength(AGGREGATE_EVENTS.length+1);
  expect(del.slice(1).every(k=>k.startsWith('hikone:aggregate:test:v1:'+run+':'+day+':'))).toBe(true);
 });
 it('expires test counters atomically after 24 hours',async()=>{
  const r=response();await collect(request(),r);const cmd=commands.find(c=>c[2]==='1')!;
  expect(cmd[0]).toBe('EVAL');expect(cmd[1]).toContain('EXPIRE');expect(cmd[1]).toContain('86400');
 });
 it('separates preview rate-limit keys too',async()=>{
  expect(await reserveBudget(request(),'analytics',1)).toBe('allowed');
  expect(commands[0].slice(3,6).every(k=>k.startsWith('hikone:aggregate:test:v1:'+run+':limit:'))).toBe(true);
 });
 it.each(['routes','ai'] as const)('keeps %s limiter keys unchanged',async service=>{
  await reserveBudget(request(),service,1);expect(commands[0][3]).toMatch(new RegExp('^hikone:'+service+':ip:'));
 });
 it('marks the preview dashboard',()=>{
  const r=response();dashboard({method:'GET',headers:{}},r);expect(r.code).toBe(200);expect(r.body).toContain('テスト専用');expect(r.body).toContain(run);
 });
 it.each(['','bad','test-../../research','test-short'])('fails closed for invalid preview run %s',async value=>{
  vi.stubEnv('HIKONE_ANALYTICS_TEST_RUN',value);
  const r=response();await collect(request(),r);expect(r.code).toBe(503);
  const s=response();await report(read(),s);expect(s.code).toBe(503);expect(fetch).not.toHaveBeenCalled();
 });
 it('rejects unauthorized cleanup before Redis',async()=>{
  const r=response();await report(read('2026-10-28','DELETE','invalid'),r);expect(r.code).toBe(401);expect(fetch).not.toHaveBeenCalled();
 });
 it.each(['2026-02-30','2026-01-00','invalid'])('rejects impossible date %s before cleanup',async day=>{
  const r=response();await report(read(day,'DELETE'),r);expect(r.code).toBe(400);expect(fetch).not.toHaveBeenCalled();
 });
 it('does not let query parameters choose another namespace',async()=>{
  const r=response();await report({...read('2026-10-28','DELETE'),query:{day:'2026-10-28',testRun:'research',key:'hikone:aggregate:v1:*'}},r);
  expect(r.code).toBe(200);expect(commands.find(cmd=>cmd[0]==='DEL')!.slice(1).every(k=>k.startsWith('hikone:aggregate:test:v1:'+run+':'))).toBe(true);
 });
 it('returns a controlled storage error on cleanup failure',async()=>{
  vi.mocked(fetch).mockRejectedValue(new Error('do not expose secret'));
  const r=response();await report(read('2026-10-28','DELETE'),r);expect(r.code).toBe(503);expect(JSON.stringify(r.body)).not.toContain('secret');
 });
 it('preserves production keys, limiter and read-only methods',async()=>{
  vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('HIKONE_ANALYTICS_TEST_RUN','');
  expect(analyticsTestRun()).toBeNull();expect(metricKey('2026-10-28','app_open')).toBe('hikone:aggregate:v1:2026-10-28:app_open');
  const r=response();await collect(request(),r);expect(r.code).toBe(200);
  expect(commands[0][3]).toMatch(/^hikone:analytics:ip:/);expect(commands[1][0]).toBe('INCR');
  commands=[];const d=response();await report(read('2026-10-28','DELETE'),d);expect(d.code).toBe(405);expect(commands).toEqual([]);
 });
 it('fails closed if a test run is mistakenly configured on production',async()=>{
  vi.stubEnv('VERCEL_ENV','production');
  const r=response();await collect(request(),r);expect(r.code).toBe(503);expect(fetch).not.toHaveBeenCalled();
 });
 it.each([{event:'unknown'},{event:'app_open',gps:'test'},{event:'app_open',text:'test'},{event:'app_open',userId:'test'}])('retains collector validation for %j',async body=>{
  const r=response();await collect(request(body),r);expect(r.code).toBe(400);expect(fetch).not.toHaveBeenCalled();
 });
 it('retains origin rejection',async()=>{
  const q=request();q.headers.origin='https://other.example';const r=response();await collect(q,r);expect(r.code).toBe(403);expect(fetch).not.toHaveBeenCalled();
 });
});

it('stops collecting at the configured end date before touching Redis',async()=>{
 vi.stubEnv('HIKONE_ANALYTICS_END_AT','2020-01-01T00:00:00+09:00');
 const r=response();await collect(request(),r);expect(r.code).toBe(410);expect(fetch).not.toHaveBeenCalled();
});
it('gets all report counts in a single Redis batch',async()=>{
 const r=response();await report(read(),r);expect(r.code).toBe(200);
 expect(commands.filter(c=>c[0]==='MGET')).toHaveLength(1);expect(commands.filter(c=>c[0]==='GET')).toHaveLength(0);
});
it('limits authenticated report reads before fetching counters',async()=>{
 vi.mocked(fetch).mockResolvedValueOnce({ok:true,json:async()=>({result:0})} as Response);
 const r=response();await report(read(),r);expect(r.code).toBe(429);expect(fetch).toHaveBeenCalledTimes(1);
});
