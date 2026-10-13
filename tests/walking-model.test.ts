import { describe, expect, it } from 'vitest';
import { adjustedMinutes } from '../src/lib/walkingModel';
import type { Answers } from '../src/types';
const a={walkingPace:'standard',walkingConditions:'normal'} as Answers;
describe('walking planning factors',()=>{
  it.each([
    ['standard','normal',10],['relaxed','normal',12],['slow','normal',15],
    ['standard','rain',12],['standard','heat',13],['relaxed','rain',14],
    ['relaxed','heat',15],['slow','rain',17],['slow','heat',19],
  ] as const)('%s + %s rounds conservatively to %s',(walkingPace,walkingConditions,expected)=>{
    expect(adjustedMinutes(600,{...a,walkingPace,walkingConditions})).toBe(expected);
  });
  it('rounds fractional seconds up and preserves zero',()=>{expect(adjustedMinutes(60.1,a)).toBe(2);expect(adjustedMinutes(0,a)).toBe(0)});
  it('rejects negative and nonfinite values',()=>{for(const n of [-1,NaN,Infinity])expect(()=>adjustedMinutes(n,a)).toThrow()});
});
