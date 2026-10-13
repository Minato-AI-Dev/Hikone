import { afterEach, expect, it, vi } from 'vitest';
import { autoRecommend } from '../src/lib/walkingRoutes';
import { recommend } from '../src/lib/recommend';
const a={currentNodeId:'S01',finalNodeId:'D01',remainingTimeMin:35,interestTagIds:['T_PHOTO'],availableMode:'徒歩' as const,maxWalkMin:null,detourPreference:'少しなら' as const,discoveryOptIn:true,firstVisit:true};
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('frontend timeout aborts and returns a safe empty result',async()=>{
  vi.useFakeTimers();vi.stubEnv('VITE_WALKING_ROUTE_ENDPOINT','https://api.example/api/walking-routes');
  vi.stubGlobal('fetch',vi.fn((_url,init)=>new Promise((_resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new Error('aborted'))))));
  const task=autoRecommend(a,null);await vi.advanceTimersByTimeAsync(25001);const result=await task;expect(result.source).toBe('unavailable');expect(result.recommendations).toEqual([]);
});
it('provisional recommendations require explicit demo mode',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));vi.stubEnv('VITE_ROUTING_DEMO','true');
  const result=await autoRecommend(a,null);expect(result.source).toBe('demo');expect(result.recommendations.length).toBeGreaterThan(0);expect(result.warning).toContain('デモ');
});
it('completed actions are excluded from future recommendations',()=>{
  const legs={'S01>D01':{minutes:10,distance:700},'S01>P01':{minutes:5,distance:300},'P01>D01':{minutes:10,distance:600}};
  const h={firstVisitAt:'2026-10-13',lastVisitAt:'2026-10-13',visitHistory:[{experienceId:'PH001',startedAt:'2026-10-13',completed:true}]};
  expect(recommend(a,h,legs).some(r=>r.actionId==='PH001')).toBe(false);
});
