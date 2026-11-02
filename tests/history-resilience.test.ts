// @vitest-environment jsdom
import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const key='hikone-next-history-v2-db4';
beforeEach(()=>{localStorage.clear();vi.resetModules();});
afterEach(()=>vi.restoreAllMocks());
it.each(['{','null','{}','{"visitHistory":{}}','{"firstVisitAt":"bad","lastVisitAt":"bad","visitHistory":[]}'])('ignores invalid saved history %s',async raw=>{
 localStorage.setItem(key,raw);const h=await import('../src/lib/history');expect(h.loadHistory()).toBeNull();
});
it('discards invalid visits without losing valid visits',async()=>{
 const good={experienceId:'A01',startedAt:'2026-10-28T00:00:00Z',completed:true};
 localStorage.setItem(key,JSON.stringify({firstVisitAt:good.startedAt,lastVisitAt:good.startedAt,visitHistory:[null,good,{completed:true}]}));
 const h=await import('../src/lib/history');expect(h.loadHistory()?.visitHistory).toEqual([good]);expect(h.completedIds(h.loadHistory()).has('A01')).toBe(true);
});
it('continues starting and completing a visit when storage writes fail',async()=>{
 const h=await import('../src/lib/history');vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('storage blocked')});
 const started=h.startExperience({experienceId:'A01',startedAt:'2026-10-28T00:00:00Z',completed:false},{} as any);
 expect(started.visitHistory).toHaveLength(1);expect(h.historyIsTemporary()).toBe(true);
 expect(h.completeExperience('A01')?.visitHistory[0].completed).toBe(true);
});
it('bounds stored visit history',async()=>{
 const h=await import('../src/lib/history');const date='2026-10-28T00:00:00Z';
 h.saveHistory({firstVisitAt:date,lastVisitAt:date,visitHistory:Array.from({length:600},(_,i)=>({experienceId:String(i),startedAt:date,completed:false}))});
 expect(h.loadHistory()?.visitHistory).toHaveLength(500);
});
