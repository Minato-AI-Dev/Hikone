/**
 * Shop candidates sourced from the Shibancho Square association's public listings.
 * Deliberately separate from dbV4 nodes/actions: no measured store-entry waypoint,
 * live opening-status check, or verified minimum stay exists for these shops.
 * They MUST NOT be included in time-feasibility recommendations until validated.
 */
export type ShoppingPlace = {
  id: string;
  parentNodeId: 'P02';
  name: string;
  area: '四番町スクエア';
  address: string;
  product: string;
  suggestedActivity: string;
  interestTags: string[];
  publishedHours: string;
  publishedClosures: string;
  source: string;
  sourceKind: 'association';
  locationStatus: 'address_published_entrance_unverified';
  hoursStatus: 'published_not_live_verified';
  experienceMinutes: null;
  routingNodeId: null;
  recommendationEligible: false;
};
export const shoppingPlaces: ShoppingPlace[] = [
  {
    id: 'SHOP001', parentNodeId: 'P02', name: 'MOHERON STUDIO ひこにゃんショップ',
    area: '四番町スクエア', address: '滋賀県彦根市本町1丁目7-34',
    product: 'ひこにゃんの作者監修オリジナルグッズ',
    suggestedActivity: 'ひこにゃんグッズを探す',
    interestTags: ['T_SHOP','T_HIKONYAN','T_HIK_DIRECT'],
    publishedHours: '10:00〜18:00（冬季17:00まで）', publishedClosures: '無休（公開案内）',
    source: 'https://www.4bancho.com/members/moheron-studio', sourceKind: 'association',
    locationStatus: 'address_published_entrance_unverified', hoursStatus: 'published_not_live_verified',
    experienceMinutes: null, routingNodeId: null, recommendationEligible: false
  },
  {
    id: 'SHOP002', parentNodeId: 'P02', name: '戦国桜 sengoku zakura',
    area: '四番町スクエア', address: '滋賀県彦根市本町1丁目11-3',
    product: '戦国武将グッズ・武将印',
    suggestedActivity: '武将に関連するグッズを探す',
    interestTags: ['T_SHOP','T_HISTORY'],
    publishedHours: '平日10:00〜17:30／土日祝10:00〜18:00',
    publishedClosures: '水曜・隔週木曜',
    source: 'https://www.4bancho.com/members/sengoku-zakura', sourceKind: 'association',
    locationStatus: 'address_published_entrance_unverified', hoursStatus: 'published_not_live_verified',
    experienceMinutes: null, routingNodeId: null, recommendationEligible: false
  },
  {
    id: 'SHOP003', parentNodeId: 'P02', name: 'しかの商店',
    area: '四番町スクエア', address: '滋賀県彦根市本町1丁目12-7',
    product: '琵琶湖の湖魚を使った手作り佃煮',
    suggestedActivity: '琵琶湖の食文化を感じるお土産を探す',
    interestTags: ['T_SHOP','T_FOOD'],
    publishedHours: '10:00〜17:00', publishedClosures: '不定休',
    source: 'https://www.4bancho.com/members/shikano', sourceKind: 'association',
    locationStatus: 'address_published_entrance_unverified', hoursStatus: 'published_not_live_verified',
    experienceMinutes: null, routingNodeId: null, recommendationEligible: false
  }
];
