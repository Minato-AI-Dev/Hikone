import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import handler from '../api/walking-routes';
import { reserveBudget } from '../server/rateLimit';
import aiHandler from '../api/hikone-ai';
const req=(pairs:unknown=[{from:'S01',to:'D01'}])=>({method:'POST',headers:{origin:'https://minato-ai-dev.github.io','content-type':'application/json','x-vercel-forwarded-for':'203.0.113.8'},body:{pairs}});
const res=()=>({code:0,body:{} as any,headers:{} as Record<string,string>,setHeader(k:string,v:string){this.headers[k]=v},status(c:number){this.code=c;return this},json(b:unknown){this.body=b;return this},end(){return this}});
beforeEach(()=>{
  vi.stubEnv('HIKONE_ALLOWED_ORIGIN','https://minato-ai-dev.github.io');vi.stubEnv('GOOGLE_MAPS_API_KEY','server-secret-test');
  vi.stubEnv('UPSTASH_REDIS_REST_URL','https://redis.example');vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','redis-secret-test');vi.stubEnv('HIKONE_RATE_LIMIT_SALT','01234567890123456789012345678901');
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url==='https://redis.example'?{ok:true,json:async()=>({result:1})}:{ok:true,json:async()=>({routes:[{duration:'600.5s',distanceMeters:800}]})}));
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.useRealTimers()});
it('uses server addresses and walking-only fields without returning keys',async()=>{
  const r=res();await handler(req(),r);expect(r.code).toBe(200);expect(r.body.legs['S01>D01']).toEqual({seconds:600.5,meters:800});
  const calls=vi.mocked(fetch).mock.calls;const sent=JSON.parse(calls[1][1]!.body as string);
  expect(sent).toMatchObject({travelMode:'WALK',languageCode:'ja-JP',origin:{address:'彦根城 表門券売所付近 滋賀県彦根市'}});
  expect(JSON.stringify(r.body)).not.toContain('secret');expect(r.headers['Cache-Control']).toBe('no-store');
});
it('deduplicates and resolves same-place pairs without Google',async()=>{
  const r=res();await handler(req([{from:'S01',to:'S01'},{from:'S01',to:'D01'},{from:'S01',to:'D01'}]),r);
  expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);expect(r.body.legs['S01>S01']).toEqual({seconds:0,meters:0});
});
it.each([[],Array.from({length:18},()=>({from:'S01',to:'D01'})),null,[{from:'__proto__',to:'D01'}]])('rejects invalid pair batches %j',async(pairs)=>{const r=res();await handler(req(pairs),r);expect(r.code).toBe(400);expect(fetch).not.toHaveBeenCalled()});
it('missing key returns controlled 503',async()=>{vi.stubEnv('GOOGLE_MAPS_API_KEY','');const r=res();await handler(req(),r);expect(r.code).toBe(503);expect(fetch).not.toHaveBeenCalled()});
it('invalid method returns 405',async()=>{const r=res();await handler({...req(),method:'GET'},r);expect(r.code).toBe(405)});
it('missing allowed origin fails closed',async()=>{vi.stubEnv('HIKONE_ALLOWED_ORIGIN','');const r=res();await handler(req(),r);expect(r.code).toBe(503)});
it('enforces byte limits',async()=>{const r=res();await handler({...req(),body:{pairs:[],padding:'x'.repeat(17000)}},r);expect(r.code).toBe(413)});
it('rate limit rejects before Google and sends Retry-After',async()=>{vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({result:0})} as Response);const r=res();await handler(req(),r);expect(r.code).toBe(429);expect(r.headers['Retry-After']).toBe('60');expect(fetch).toHaveBeenCalledTimes(1)});
it('store failure never bypasses protection',async()=>{vi.mocked(fetch).mockRejectedValue(new Error('redis-secret-test'));const r=res();await handler(req(),r);expect(r.code).toBe(503);expect(fetch).toHaveBeenCalledTimes(1);expect(JSON.stringify(r.body)).not.toContain('secret')});
it('does not trust client x-forwarded-for',async()=>{const r=req();delete (r.headers as any)['x-vercel-forwarded-for'];(r.headers as any)['x-forwarded-for']='203.0.113.9';expect(await reserveBudget(r,'routes',1)).toBe('unavailable');expect(fetch).not.toHaveBeenCalled()});
it('hashes the IP in atomic store command and reserves units',async()=>{await reserveBudget(req(),'routes',17);const body=JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);expect(body[0]).toBe('EVAL');expect(body.at(-1)).toBe(17);expect(JSON.stringify(body)).not.toContain('203.0.113.8')});
it('reserves a bounded shared daily budget as well as minute limits',async()=>{
  await reserveBudget(req(),'routes',17);
  const body=JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(body[2]).toBe(3);expect(body[5]).toMatch(/^hikone:routes:day:/);
  expect(body.slice(-4)).toEqual([6,120,300,17]);
});
it('accepts native Vercel Marketplace Redis variables',async()=>{
  vi.stubEnv('UPSTASH_REDIS_REST_URL','');vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','');
  vi.stubEnv('KV_REST_API_URL','https://redis.example');vi.stubEnv('KV_REST_API_TOKEN','marketplace-test-token');
  expect(await reserveBudget(req(),'routes',1)).toBe('allowed');
});
it('never mixes a custom Redis URL with the Marketplace token',async()=>{
  vi.stubEnv('UPSTASH_REDIS_REST_URL','https://custom.example');vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','');
  vi.stubEnv('KV_REST_API_URL','https://redis.example');vi.stubEnv('KV_REST_API_TOKEN','marketplace-test-token');
  expect(await reserveBudget(req(),'routes',1)).toBe('unavailable');expect(fetch).not.toHaveBeenCalled();
});
it('omits failed legs without inventing results',async()=>{
  vi.mocked(fetch).mockImplementation(async(url)=>String(url)==='https://redis.example'?{ok:true,json:async()=>({result:1})} as Response: {ok:true,json:async()=>({routes:[{duration:'bad',distanceMeters:-1}]})} as Response);
  const r=res();await handler(req(),r);expect(r.code).toBe(502);
});
it('rejects a partial geocoding match even when walking duration is valid',async()=>{
  vi.mocked(fetch).mockResolvedValueOnce({ok:true,json:async()=>({result:1})} as Response)
    .mockResolvedValueOnce({ok:true,json:async()=>({routes:[{duration:'600s',distanceMeters:800}],geocodingResults:{origin:{partialMatch:true},destination:{placeId:'test-id'}}})} as Response);
  const r=res();await handler(req(),r);expect(r.code).toBe(502);
  expect(r.body.unresolvedPairs).toEqual(['S01>D01']);
});
it('returns partial success without filling failed legs',async()=>{
  vi.mocked(fetch).mockResolvedValueOnce({ok:true,json:async()=>({result:1})} as Response)
    .mockResolvedValueOnce({ok:true,json:async()=>({routes:[{duration:'600s',distanceMeters:800}]})} as Response)
    .mockResolvedValueOnce({ok:false} as Response);
  const r=res();await handler(req([{from:'S01',to:'D01'},{from:'S01',to:'P01'}]),r);expect(r.code).toBe(200);expect(r.body.partial).toBe(true);expect(Object.keys(r.body.legs)).toEqual(['S01>D01']);
});
it('aborts Google after four seconds',async()=>{
  vi.useFakeTimers();vi.mocked(fetch).mockImplementation(async(url,init)=>String(url)==='https://redis.example'?{ok:true,json:async()=>({result:1})} as Response:await new Promise((_resolve,reject)=>init!.signal!.addEventListener('abort',()=>reject(new Error('aborted')))));
  const r=res();const task=handler(req(),r);await vi.advanceTimersByTimeAsync(4001);await task;expect(r.code).toBe(502);
});
it('protects AI endpoint origins as well',async()=>{const r=res();await aiHandler({...req(),headers:{...req().headers,origin:'https://evil.example'},body:{mode:'extract-v4',message:'写真'}},r);expect(r.code).toBe(403)});
it('protects AI endpoint when limiter is unavailable',async()=>{vi.stubEnv('OPENAI_API_KEY','ai-secret');vi.stubEnv('OPENAI_MODEL','test-model');vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','');const r=res();await aiHandler({...req(),body:{mode:'extract-v4',message:'写真'}},r);expect(r.code).toBe(503)});
it('cloud extraction validates pace, weather and walking limit',async()=>{
  vi.stubEnv('OPENAI_API_KEY','ai-secret');vi.stubEnv('OPENAI_MODEL','test-model');
  vi.mocked(fetch).mockResolvedValueOnce({ok:true,json:async()=>({result:1})} as Response)
    .mockResolvedValueOnce({ok:true,json:async()=>({output_text:JSON.stringify({answers:{remainingTimeMin:45,walkingPace:'slow',walkingConditions:'rain',maxWalkMin:15}})})} as Response);
  const r=res();await aiHandler({...req(),body:{mode:'extract-v4',message:'雨で休憩しながら、徒歩15分まで、残り45分'}},r);
  expect(r.code).toBe(200);expect(r.body.answers).toMatchObject({walkingPace:'slow',walkingConditions:'rain',maxWalkMin:15,remainingTimeMin:45});
});
