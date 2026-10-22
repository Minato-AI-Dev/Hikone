import {describe,expect,it} from 'vitest';
import {shoppingPlaces} from '../src/data/shoppingPlaces';
import {shopOperationalFacts} from '../src/data/shopOperationalFacts';
import {routingLocations} from '../server/locations';

describe('individual shop operational data',()=>{
 it('has operational records linked one-to-one to the registered shops',()=>{
   expect(Object.keys(shopOperationalFacts).sort()).toEqual(shoppingPlaces.map(x=>x.id).sort());
   for(const shop of shoppingPlaces) {
     const fact=shopOperationalFacts[shop.id];
     expect(fact.shopId).toBe(shop.id);
     expect(fact.hoursSourceUrl).toBe(shop.source);
     expect(fact.businessHours.length).toBeGreaterThan(0);
     expect(fact.businessHours.every(h=>/^\d{2}:\d{2}$/.test(h.opens)&&/^\d{2}:\d{2}$/.test(h.closes))).toBe(true);
   }
 });
 it('never mistakes published schedule or parent area waypoint for verified shop availability',()=>{
   for(const shop of shoppingPlaces) {
     const fact=shopOperationalFacts[shop.id];
     expect(fact.openNowVerified).toBe(false);
     expect(fact.hoursExceptionsVerified).toBe(false);
     expect(fact.pedestrianEntrance).toBeNull();
     expect(fact.googlePlaceId).toBeNull();
     expect(fact.minimumActivityMinutes).toBeNull();
     expect(fact.activityTimeMethod).toBeNull();
     expect(fact.canAutoRecommend).toBe(false);
     expect(shop.recommendationEligible).toBe(false);
     expect(routingLocations[shop.id]).toBeUndefined();
   }
 });
});
