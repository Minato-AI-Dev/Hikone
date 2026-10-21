import { describe, expect, it } from 'vitest';
import { shoppingPlaces } from '../src/data/shoppingPlaces';
import { nodes, actions } from '../src/data/dbV4';
import { routingLocations } from '../server/locations';

describe('Shibancho shop research candidates', () => {
  it('registers three unique official-listing-backed shops linked to the P02 area', () => {
    expect(shoppingPlaces).toHaveLength(3);
    expect(new Set(shoppingPlaces.map(s => s.id)).size).toBe(3);
    expect(shoppingPlaces.map(s => s.parentNodeId)).toEqual(['P02','P02','P02']);
    for (const shop of shoppingPlaces) {
      expect(shop.source).toMatch(/^https:\/\/www\.4bancho\.com\/members\//);
      expect(shop.address).toContain('彦根市本町');
      expect(shop.publishedHours.length).toBeGreaterThan(0);
    }
  });

  it('does not reuse area routing as store-specific travel or assert live hours', () => {
    for (const shop of shoppingPlaces) {
      expect(shop.recommendationEligible).toBe(false);
      expect(shop.routingNodeId).toBeNull();
      expect(shop.experienceMinutes).toBeNull();
      expect(shop.locationStatus).toBe('address_published_entrance_unverified');
      expect(shop.hoursStatus).toBe('published_not_live_verified');
      expect(nodes.some(node => node.id === shop.id)).toBe(false);
      expect(actions.some(action => action.nodeId === shop.id)).toBe(false);
      expect(routingLocations[shop.id]).toBeUndefined();
    }
  });
});
