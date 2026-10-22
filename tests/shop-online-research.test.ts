import {describe,it,expect} from 'vitest';
import {onlineShopResearch} from '../src/data/shopOnlineResearch';
import {shoppingPlaces} from '../src/data/shoppingPlaces';
import {shopOperationalFacts} from '../src/data/shopOperationalFacts';
describe('Internet shop research provenance and safeguards',()=>{
 it('links internet evidence to exactly the researched shop IDs',()=>{
   expect(Object.keys(onlineShopResearch).sort()).toEqual(shoppingPlaces.map(p=>p.id).sort());
   for(const shop of shoppingPlaces){
     const r=onlineShopResearch[shop.id as keyof typeof onlineShopResearch];
     expect(r.officialDirectoryUrl).toBe(shop.source);
     expect(r.verifiedAt).toBe('2026-10-22');
     expect(r.evidenceStatus).toBe('published_online_only');
     expect(r.onlineConfirmedCategories.length).toBeGreaterThan(0);
   }
 });
 it('does not convert online listings or ecommerce prices to real-store route/stock/availability claims',()=>{
  for(const shop of shoppingPlaces){
   const r=onlineShopResearch[shop.id as keyof typeof onlineShopResearch];
   expect(r.pedestrianEntranceVerified).toBe(false);
   expect(r.storeSpecificItemStockVerified).toBe(false);
   expect(r.paymentMethodsVerified).toBe(false);
   expect(r.onSitePriceRangeYen).toBeNull();
   expect(r.minimumVisitMinutes).toBeNull();
   expect(shopOperationalFacts[shop.id].canAutoRecommend).toBe(false);
  }
 });
});
