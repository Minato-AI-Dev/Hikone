import { shopOperationalFacts } from '../src/data/shopOperationalFacts.js';

export type ShopHoursStatus='scheduled_open'|'scheduled_closed'|'unknown';
export type ShopHoursResult={
  shopId:string;status:ShopHoursStatus;checkedAt:string|null;
  source:'google_places'|'not_checked';sourceUrl:string;reason:string;nextCloseTime?:string|null;
};

export function unknownShop(shopId:string,reason:string):ShopHoursResult{
  return {shopId,status:'unknown',checkedAt:null,source:'not_checked',sourceUrl:shopOperationalFacts[shopId]?.hoursSourceUrl??'',reason};
}
export function validateShopPlaceIds(raw:string|undefined):Record<string,string>{
  if(!raw)return {};
  try{
    const value:unknown=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    const ids:Record<string,string>={};
    for(const [shopId,placeId] of Object.entries(value)){
      if(!Object.hasOwn(shopOperationalFacts,shopId)||typeof placeId!=='string'||!/^[-A-Za-z0-9_]{12,200}$/.test(placeId))continue;
      ids[shopId]=placeId;
    }
    return ids;
  }catch{return {};}
}
const aliases:Record<string,string[]>={
 SHOP001:['moheron','モヘロン'],
 SHOP002:['戦国桜','sengokuzakura'],
 SHOP003:['しかの商店','しかの']
};
const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function matchesKnownShop(shopId:string,place:unknown,expectedPlaceId:string):boolean{
  if(!place||typeof place!=='object'||!Object.hasOwn(shopOperationalFacts,shopId))return false;
  const p=place as {id?:unknown;displayName?:{text?:unknown};formattedAddress?:unknown};
  if(typeof p.id!=='string'||p.id!==expectedPlaceId||typeof p.displayName?.text!=='string'||typeof p.formattedAddress!=='string')return false;
  const name=normalize(p.displayName.text),address=normalize(p.formattedAddress);
  return (address.includes('彦根')||address.includes('hikone'))&&aliases[shopId].some(alias=>name.includes(normalize(alias)));
}
export function parsePlacesHours(shopId:string,payload:unknown,checkedAt:string):ShopHoursResult{
  if(!payload||typeof payload!=='object')return unknownShop(shopId,'営業時間情報を取得できません');
  const p=payload as {businessStatus?:unknown;currentOpeningHours?:{openNow?:unknown;nextCloseTime?:unknown}};
  if(p.businessStatus!=='OPERATIONAL')return unknownShop(shopId,'Google掲載の営業状態を確認できません');
  const hours=p.currentOpeningHours;
  if(typeof hours?.openNow!=='boolean')return unknownShop(shopId,'現在の営業状況が掲載されていません');
  return {
    shopId,status:hours.openNow?'scheduled_open':'scheduled_closed',checkedAt,
    source:'google_places',sourceUrl:shopOperationalFacts[shopId]?.hoursSourceUrl??'',
    reason:hours.openNow?'Google掲載情報では取得時点で営業中':'Google掲載情報では取得時点で営業時間外',
    nextCloseTime:typeof hours.nextCloseTime==='string'?hours.nextCloseTime:null
  };
}
