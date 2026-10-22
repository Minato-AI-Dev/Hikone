/**
 * Operational facts are separate from the places catalogue and from walking
 * route/visit-time data. Publication is not proof of today's opening status.
 * All nulls are intentional; unknown must never become zero or "open".
 */
export type ShopOperationalFacts = {
  shopId: string;
  publishedPhone: string | null;
  businessHours: Array<{dayType:'all'|'weekday'|'weekend_holiday';opens:string;closes:string;season?:'winter'}>;
  closureRule: string;
  hoursSourceUrl: string;
  hoursCheckedOn: string; // Date the published page was reviewed, not date of merchant verification
  openNowVerified: false;
  hoursExceptionsVerified: false;
  /** Pedestrian door coordinates, not a building centroid or parent area point. */
  pedestrianEntrance: {latitude:number;longitude:number;verifiedOn:string;method:'field'} | null;
  googlePlaceId: string | null;
  accessNotes: string | null;
  /** Measured/minimum in-store activity time; never estimate silently. */
  minimumActivityMinutes: number | null;
  activityTimeMethod: 'field' | null;
  priceYen: {min:number;max:number}|null;
  wheelchairAccessVerified: boolean | null;
  canAutoRecommend: false;
};
export const shopOperationalFacts: Record<string,ShopOperationalFacts> = {
  SHOP001: {
    shopId:'SHOP001', publishedPhone:'0749-27-7755',
    businessHours:[{dayType:'all',opens:'10:00',closes:'18:00'},{dayType:'all',opens:'10:00',closes:'17:00',season:'winter'}],
    closureRule:'無休（公式掲載）',hoursSourceUrl:'https://www.4bancho.com/members/moheron-studio',
    hoursCheckedOn:'2026-10-22',openNowVerified:false,hoursExceptionsVerified:false,
    pedestrianEntrance:null,googlePlaceId:null,accessNotes:null,minimumActivityMinutes:null,
    activityTimeMethod:null,priceYen:null,wheelchairAccessVerified:null,canAutoRecommend:false
  },
  SHOP002: {
    shopId:'SHOP002',publishedPhone:null,
    businessHours:[{dayType:'weekday',opens:'10:00',closes:'17:30'},{dayType:'weekend_holiday',opens:'10:00',closes:'18:00'}],
    closureRule:'水曜日・隔週木曜日（該当週は未確定）',hoursSourceUrl:'https://www.4bancho.com/members/sengoku-zakura',
    hoursCheckedOn:'2026-10-22',openNowVerified:false,hoursExceptionsVerified:false,
    pedestrianEntrance:null,googlePlaceId:null,accessNotes:null,minimumActivityMinutes:null,
    activityTimeMethod:null,priceYen:null,wheelchairAccessVerified:null,canAutoRecommend:false
  },
  SHOP003: {
    shopId:'SHOP003',publishedPhone:'0749-22-0275',
    businessHours:[{dayType:'all',opens:'10:00',closes:'17:00'}],
    closureRule:'不定休',hoursSourceUrl:'https://www.4bancho.com/members/shikano',
    hoursCheckedOn:'2026-10-22',openNowVerified:false,hoursExceptionsVerified:false,
    pedestrianEntrance:null,googlePlaceId:null,accessNotes:null,minimumActivityMinutes:null,
    activityTimeMethod:null,priceYen:null,wheelchairAccessVerified:null,canAutoRecommend:false
  }
};
