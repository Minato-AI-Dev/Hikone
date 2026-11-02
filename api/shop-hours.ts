import { prepareJson,isRecord,type ApiRequest,type ApiResponse } from '../server/http.js';
import { reserveBudget } from '../server/rateLimit.js';
import { shopOperationalFacts } from '../src/data/shopOperationalFacts.js';
import { unknownShop,validateShopPlaceIds,parsePlacesHours,matchesKnownShop,type ShopHoursResult } from '../server/shopHours.js';

export default async function handler(req:ApiRequest,res:ApiResponse){
  if(!prepareJson(req,res))return;
  const body=req.body;
  if(!isRecord(body)||Object.keys(body).some(k=>k!=='shopIds')||!Array.isArray(body.shopIds)||
     body.shopIds.length<1||body.shopIds.length>3||
     body.shopIds.some(id=>typeof id!=='string'||!Object.hasOwn(shopOperationalFacts,id)))
    return res.status(400).json({error:'Unknown shop ID'});
  const ids=[...new Set(body.shopIds as string[])];
  const placeIds=validateShopPlaceIds(process.env.HIKONE_SHOP_PLACE_IDS_JSON);
  const key=process.env.GOOGLE_MAPS_API_KEY;
  if(!key||!ids.some(id=>placeIds[id]))return res.status(200).json({
    results:ids.map(id=>unknownShop(id,!key?'Google Places APIが未設定です':'店舗のGoogle Place IDが未登録です'))
  });
  const billable=ids.filter(id=>placeIds[id]);
  const budget=await reserveBudget(req,'shops',billable.length);
  if(budget!=='allowed'){
    if(budget==='limited')res.setHeader('Retry-After','60');
    return res.status(budget==='limited'?429:503).json({error:budget==='limited'?'Request limit reached':'Shop lookup protection unavailable'});
  }
  const results:ShopHoursResult[]=[];
  for(const id of ids){
    const placeId=placeIds[id];
    if(!placeId){results.push(unknownShop(id,'店舗のGoogle Place IDが未登録です'));continue;}
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
    try{
      const response=await fetch('https://places.googleapis.com/v1/places/'+encodeURIComponent(placeId)+'?languageCode=ja',{
        headers:{'X-Goog-Api-Key':key,'X-Goog-FieldMask':'id,displayName,formattedAddress,businessStatus,currentOpeningHours.openNow,currentOpeningHours.nextCloseTime'},
        signal:controller.signal
      });
      if(!response.ok){results.push(unknownShop(id,'営業情報を取得できません'));continue;}
      const payload:unknown=await response.json();
      if(!matchesKnownShop(id,payload,placeId)){results.push(unknownShop(id,'店舗情報が一致しないため営業判定を保留しました'));continue;}
      results.push(parsePlacesHours(id,payload,new Date().toISOString()));
    }catch{results.push(unknownShop(id,'営業情報を取得できません'));}
    finally{clearTimeout(timer);}
  }
  return res.status(200).json({
    results,notice:'Google Places掲載情報の取得時点における参考表示です。臨時休業や到着時の営業は保証しません。'
  });
}
