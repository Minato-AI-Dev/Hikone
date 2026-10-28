import {describe,it,expect} from 'vitest';
import {parseAggregateEvent,dayInTokyo,metricKey} from '../server/aggregateAnalytics';
describe('consented aggregate analytics',()=>{
 it('accepts only allowlisted event and no payload fields',()=>{
  expect(parseAggregateEvent({event:'recommendation_selected'})).toBe('recommendation_selected');
  expect(parseAggregateEvent({event:'recommendation_selected',gps:'35,136'})).toBeNull();
  expect(parseAggregateEvent({event:'made_up'})).toBeNull();
 });
 it('groups by Japan calendar day',()=>{
  expect(dayInTokyo(new Date('2026-10-26T16:00:00Z'))).toBe('2026-10-27');
  expect(metricKey('2026-10-27','experience_completed')).toBe('hikone:aggregate:v1:2026-10-27:experience_completed');
 });
});
