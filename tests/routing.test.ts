import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recommend } from '../src/lib/recommend';
import { autoRecommend } from '../src/lib/walkingRoutes';
import handler from '../api/walking-routes';
import type { Answers } from '../src/types';

export const answers: Answers = { currentNodeId:'S01', finalNodeId:'D01', remainingTimeMin:35, interestTagIds:['T_PHOTO'], availableMode:'徒歩', maxWalkMin:null, detourPreference:'少しなら', discoveryOptIn:true, firstVisit:true };
function response() {
  return { code:0, body:undefined as any, headers:{} as Record<string,string>, setHeader(k:string,v:string){this.headers[k]=v}, status(n:number){this.code=n;return this}, json(b:unknown){this.body=b;return this}, end(){return this} };
}
const request = (body:unknown = {pairs:[{from:'S01',to:'D01'}]}) => ({method:'POST', headers:{origin:'https://minato-ai-dev.github.io','content-type':'application/json','x-vercel-forwarded-for':'203.0.113.4'},body});
beforeEach(()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('mock unavailable')));vi.stubEnv('HIKONE_ALLOWED_ORIGIN','https://minato-ai-dev.github.io');vi.stubEnv('GOOGLE_MAPS_API_KEY','test-server-key');vi.stubEnv('VITE_WALKING_ROUTE_ENDPOINT','https://backend.example/api/walking-routes');});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();vi.restoreAllMocks()});

describe('deterministic feasibility',()=>{
  const legs={'S01>D01':{minutes:10,distance:700},'S01>P01':{minutes:5,distance:300},'P01>D01':{minutes:10,distance:600}};
  it('includes stay and safety at the exact boundary',()=>{
    expect(recommend({...answers,remainingTimeMin:25},null,legs).find(r=>r.nodeId==='P01')).toBeDefined();
    expect(recommend({...answers,remainingTimeMin:24},null,legs).find(r=>r.nodeId==='P01')).toBeUndefined();
  });
  it('does not fill missing legs with provisional edges',()=>{expect(recommend(answers,null,{'S01>D01':legs['S01>D01'] })).toEqual([])});
  it('honors maximum total walking time',()=>{expect(recommend({...answers,maxWalkMin:14},null,legs)).toEqual([])});
  it('separates added walking from experience and safety',()=>{
    const r=recommend(answers,null,legs).find(r=>r.nodeId==='P01')!;
    expect(r).toMatchObject({additionalWalkingMinutes:5,walkingMinutes:15,experienceMinutes:5,safetyBufferMinutes:5,viaRouteMinutes:25,detourMinutes:15});
  });
});

describe('frontend routes',()=>{
  it('returns no provisional recommendations on network failure',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
    expect((await autoRecommend(answers,null)).recommendations).toEqual([]);
  });
  it('supports a same-start/final loop without asking for a direct leg',async()=>{
    const mock=vi.fn().mockResolvedValue({ok:true,json:async()=>({legs:{'S01>P01':{seconds:300,meters:300},'P01>S01':{seconds:300,meters:300}}})});
    vi.stubGlobal('fetch',mock);
    const result=await autoRecommend({...answers,finalNodeId:'S01'},null);
    expect(result.source).toBe('maps');expect(result.recommendations.length).toBeGreaterThan(0);
    expect(JSON.parse(mock.mock.calls[0][1].body).pairs.some((p:any)=>p.from===p.to)).toBe(false);
  });
  it('rejects negative route data',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({legs:{'S01>D01':{seconds:600,meters:700},'S01>P01':{seconds:-300,meters:-1},'P01>D01':{seconds:600,meters:600}}})}));
    expect((await autoRecommend(answers,null)).recommendations).toEqual([]);
  });
  it('does not send addresses or GPS, and bounds pair count',async()=>{
    const mock=vi.fn().mockResolvedValue({ok:false});vi.stubGlobal('fetch',mock);
    await autoRecommend(answers,null,{lat:35,lng:136});
    const body=JSON.parse(mock.mock.calls[0][1].body);expect(Object.keys(body)).toEqual(['pairs']);expect(body.pairs.length).toBeLessThanOrEqual(17);
  });
});

describe('API boundary',()=>{
  it('rejects unknown origins',async()=>{const res=response();await handler({...request(),headers:{...request().headers,origin:'https://attacker.example'}},res);expect(res.code).toBe(403)});
  it('handles allowed preflight without credentials',async()=>{vi.stubEnv('GOOGLE_MAPS_API_KEY','');const res=response();await handler({...request(),method:'OPTIONS'},res);expect(res.code).toBe(204);expect(res.headers['Vary']).toBe('Origin')});
  it('requires JSON',async()=>{const res=response();await handler({...request(),headers:{...request().headers,'content-type':'text/plain'}},res);expect(res.code).toBe(415)});
  it('rejects client addresses',async()=>{const res=response();await handler(request({pairs:[{from:'S01',to:'D01'}],names:{S01:'彦根城',D01:'彦根駅'}}),res);expect(res.code).toBe(400)});
  it('rejects unknown IDs before contacting providers',async()=>{const mock=vi.fn();vi.stubGlobal('fetch',mock);const res=response();await handler(request({pairs:[{from:'UNKNOWN',to:'D01'}]}),res);expect(res.code).toBe(400);expect(mock).not.toHaveBeenCalled()});
  it('requires a shared limiter before paid calls',async()=>{vi.stubEnv('UPSTASH_REDIS_REST_URL','');vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','');const res=response();await handler(request(),res);expect(res.code).toBe(503)});
});

