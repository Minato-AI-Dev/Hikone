import {describe,it,expect} from 'vitest';
import {evaluateFix} from '../src/lib/visitDetection';
const here={latitude:35.272167,longitude:136.252010,accuracy:12};
describe('visit detection',()=>{
 it('requires two reliable observations at least 20 seconds apart',()=>{
  const first=evaluateFix(here,1000,null);
  expect(first.arrived).toBeNull();
  expect(evaluateFix(here,15000,first.candidate).arrived).toBeNull();
  expect(evaluateFix(here,22000,first.candidate).arrived).toBe('P01');
 });
 it('rejects inaccurate or distant observations',()=>{
  const first=evaluateFix(here,1000,null);
  expect(evaluateFix({...here,accuracy:100},23000,first.candidate)).toEqual({candidate:null,arrived:null});
  expect(evaluateFix({...here,latitude:36},23000,first.candidate)).toEqual({candidate:null,arrived:null});
 });
 it('does not treat a single point near the second district as a visit',()=>{
  expect(evaluateFix({latitude:35.2697815,longitude:136.2511518,accuracy:10},1000,null).arrived).toBeNull();
 });
});
