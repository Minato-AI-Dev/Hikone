import { afterEach, expect, it, vi } from 'vitest';
import { understandWithHikoneAI } from '../src/lib/hikoneAI';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('understands rain, breaks and maximum walking time offline',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  expect((await understandWithHikoneAI('彦根城から駅へ。雨で休憩しながら、歩くのは15分まで。残り45分')).answers)
    .toMatchObject({remainingTimeMin:45,walkingPace:'slow',walkingConditions:'rain',maxWalkMin:15});
});
it('understands relaxed pace and heat without inferring from age',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  expect((await understandWithHikoneAI('暑いのでゆっくり歩く')).answers).toMatchObject({walkingPace:'relaxed',walkingConditions:'heat'});
  expect((await understandWithHikoneAI('高齢者と一緒')).answers.walkingPace).toBeUndefined();
});
