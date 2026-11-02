import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import handler from '../api/shop-hours';
import {matchesKnownShop,parsePlacesHours,unknownShop,validateShopPlaceIds} from '../server/shopHours';

const request=(shopIds:unknown=['SHOP001'])=>({method:'POST',headers:{origin:'https://minato-ai-dev.github.io','content-type':'application/json','x-vercel-forwarded-for':'203.0.113.40'},body:{shopIds}});
const response=()=>({code:0,body:{} as any,headers:{} as Record<string,string>,setHeader(k:string,v:string){this.headers[k]=v;return this},status(n:number){this.code=n;return this},json(body:unknown){this.body=body;return this},end(){return this}});
const validPlace={id:'ChIJabcdefghijklmnop',displayName:{text:'MOHERON STUDIO ひこにゃんショップ'},formattedAddress:'日本、滋賀県彦根市本町1丁目7-34',businessStatus:'OPERATIONAL',currentOpeningHours:{openNow:true}};
beforeEach(()=>{
 vi.stubEnv('HIKONE_ALLOWED_ORIGIN','https://minato-ai-dev.github.io');
 vi.stubEnv('GOOGLE_MAPS_API_KEY','test-key');
 vi.stubEnv('HIKONE_SHOP_PLACE_IDS_JSON',JSON.stringify({SHOP001:'ChIJabcdefghijklmnop'}));
 vi.stubEnv('UPSTASH_REDIS_REST_URL','https://redis.example');
 vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','test-redis-token');
 vi.stubEnv('HIKONE_RATE_LIMIT_SALT','01234567890123456789012345678901');
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>url==='https://redis.example'?{ok:true,json:async()=>({result:1})}:{ok:true,json:async()=>validPlace}));
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('places identity and hours',()=>{
 it('rejects unknown configured shops and invalid IDs',()=>{
   expect(validateShopPlaceIds(JSON.stringify({SHOP001:'ChIJabcdefghijklmnop',BAD:'ChIJabcdefghijklmnop',SHOP002:'../../evil'}))).toEqual({SHOP001:'ChIJabcdefghijklmnop'});
 });
 it('requires known shop ID, matching place identity and Hikone address',()=>{
   expect(matchesKnownShop('SHOP001',validPlace,validPlace.id)).toBe(true);
   expect(matchesKnownShop('SHOP001',{...validPlace,formattedAddress:'大阪市'},validPlace.id)).toBe(false);
   expect(matchesKnownShop('SHOP001',{...validPlace,displayName:{text:'別のひこにゃん店'}},validPlace.id)).toBe(false);
   expect(matchesKnownShop('SHOP001',validPlace,'another-id')).toBe(false);
 });
 it('never treats missing or inactive opening data as open',()=>{
   expect(parsePlacesHours('SHOP001',{},'2026-11-02T00:00:00Z').status).toBe('unknown');
   expect(parsePlacesHours('SHOP001',{...validPlace,businessStatus:'CLOSED_PERMANENTLY'},'2026-11-02T00:00:00Z').status).toBe('unknown');
   expect(parsePlacesHours('SHOP001',{businessStatus:'OPERATIONAL'},'2026-11-02T00:00:00Z').status).toBe('unknown');
   expect(unknownShop('SHOP001','未確認').checkedAt).toBe(null);
 });
 it('describes opening only at the time checked',()=>{
   expect(parsePlacesHours('SHOP001',validPlace,'2026-11-02T00:00:00Z').status).toBe('scheduled_open');
   expect(parsePlacesHours('SHOP001',{...validPlace,currentOpeningHours:{openNow:false}},'2026-11-02T00:00:00Z').status).toBe('scheduled_closed');
 });
});
describe('restricted shop-hours endpoint',()=>{
 it('looks up whitelisted shops only and never returns keys',async()=>{
   const res=response();await handler(request(),res);
   expect(res.code).toBe(200);expect(res.body.results[0].status).toBe('scheduled_open');
   expect(String(vi.mocked(fetch).mock.calls[1][0])).toContain('places.googleapis.com/v1/places/');
   expect(vi.mocked(fetch).mock.calls[1][1]?.headers).toMatchObject({'X-Goog-Api-Key':'test-key'});
   expect(JSON.stringify(res.body)).not.toContain('test-key');
 });
 it('unknown Place IDs remain unknown without a paid API call',async()=>{
   vi.stubEnv('HIKONE_SHOP_PLACE_IDS_JSON','');
   const res=response();await handler(request(),res);expect(res.code).toBe(200);
   expect(res.body.results[0].status).toBe('unknown');expect(fetch).not.toHaveBeenCalled();
 });
 it('mismatched identity cannot produce an open status',async()=>{
   vi.mocked(fetch).mockResolvedValueOnce({ok:true,json:async()=>({result:1})} as Response)
    .mockResolvedValueOnce({ok:true,json:async()=>({...validPlace,formattedAddress:'大阪府'})} as Response);
   const res=response();await handler(request(),res);expect(res.body.results[0].status).toBe('unknown');
 });
 it('rejects unknown shops, arbitrary input, and disallowed origins',async()=>{
   const bad=response();await handler(request(['SHOP999']),bad);expect(bad.code).toBe(400);
   const extra=response();await handler({...request(),body:{shopIds:['SHOP001'],url:'https://example.com'}},extra);expect(extra.code).toBe(400);
   const origin=response();await handler({...request(),headers:{...request().headers,origin:'https://other.example'}},origin);expect(origin.code).toBe(403);
   expect(fetch).not.toHaveBeenCalled();
 });
 it('fails closed without shared protection and before paid requests',async()=>{
   vi.stubEnv('UPSTASH_REDIS_REST_URL','');
   const res=response();await handler(request(),res);expect(res.code).toBe(503);expect(fetch).not.toHaveBeenCalled();
 });
 it('enforces quota before a Google request',async()=>{
   vi.mocked(fetch).mockResolvedValueOnce({ok:true,json:async()=>({result:0})} as Response);
   const res=response();await handler(request(),res);expect(res.code).toBe(429);expect(fetch).toHaveBeenCalledTimes(1);
 });
});
