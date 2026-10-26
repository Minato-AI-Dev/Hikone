import { shopOperationalFacts } from '../src/data/shopOperationalFacts.js';

export type ShopHoursStatus='scheduled_open'|'scheduled_closed'|'unknown';
export type ShopHoursResult={
  shopId:string; status:ShopHoursStatus; checkedAt:string|null;
  source:'google_places'|'not_checked'; sourceUrl:string;
  reason:string; nextCloseTime?:string|null;
};

export function unknownShop(shopId:string,reason:string):ShopHoursResult {
  return {shopId,status:'unknown',checkedAt:null,source:'not_checked',sourceUrl:shopOperationalFacts[shopId]?.hoursSourceUrl??'',reason};
}

export function validateShopPlaceIds(raw:string|undefined):Record<string,string> {
  if(!raw)return {};
  try {
    const value:unknown=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    const result:Record<string,string>={};
    for(const [id,placeId] of Object.entries(value)){
      if(!Object.hasOwn(shopOperationalFacts,id)||typeof placeId!=='string'||!/^ChIJ[A-Za-z0-9_-]{10,}$/.test(placeId))continue;
      result[id]=placeId;
    }
    return result;
  }catch{return {};}
}
export function parsePlacesHours(shopId:string,payload:unknown,checkedAt:string):ShopHoursResult {
  const sourceUrl=shopOperationalFacts[shopId]?.hoursSourceUrl??'';
  if(!payload||typeof payload!=='object')return unknownShop(shopId,'営業時間情報を取得できません');
  const place=payload as {currentOpeningHours?:{openNow?:unknown;nextCloseTime?:unknown}};
  const hours=place.currentOpeningHours;
  if(typeof hours?.openNow!=='boolean')return unknownShop(shopId,'本日の営業状況は掲載されていません');
  return {
    shopId,status:hours.openNow?'scheduled_open':'scheduled_closed',checkedAt,
    source:'google_places',sourceUrl,
    reason:hours.openNow?'Google掲載情報では取得時点で営業中':'Google掲載情報では取得時点で営業時間外',
    nextCloseTime:typeof hours.nextCloseTime==='string'?hours.nextCloseTime:null
  };
}
