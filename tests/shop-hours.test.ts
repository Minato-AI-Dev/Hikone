import {describe,it,expect} from 'vitest';
import {parsePlacesHours,unknownShop,validateShopPlaceIds} from '../server/shopHours';

describe('shop hours safety',()=>{
  it('rejects unregistered shop/place IDs',()=>{
    expect(validateShopPlaceIds(JSON.stringify({SHOP001:'ChIJabcdefghijklmn',BAD:'ChIJabcdefghijklmn',SHOP002:'garbage'})))
      .toEqual({SHOP001:'ChIJabcdefghijklmn'});
  });
  it('does not assume missing hours mean open',()=>{
    expect(parsePlacesHours('SHOP001',{},'2026-10-27T00:00:00Z').status).toBe('unknown');
    expect(unknownShop('SHOP002','not checked').checkedAt).toBeNull();
  });
  it('treats a published current openNow value only as lookup-time status',()=>{
    expect(parsePlacesHours('SHOP001',{currentOpeningHours:{openNow:true}},'2026-10-27T00:00:00Z').status).toBe('scheduled_open');
    expect(parsePlacesHours('SHOP001',{currentOpeningHours:{openNow:false}},'2026-10-27T00:00:00Z').status).toBe('scheduled_closed');
  });
});
