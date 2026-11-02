import {expect,it} from 'vitest';
import {recommend,routingCandidateIds} from '../src/lib/recommend';
import {actionsForNode} from '../src/data/dbV4';
import type {Answers} from '../src/types';
const answers:Answers={currentNodeId:'S01',finalNodeId:'D01',remainingTimeMin:60,interestTagIds:['T_SHOP'],availableMode:'徒歩',maxWalkMin:null,detourPreference:'少しなら',discoveryOptIn:true,firstVisit:true};
it('does not present unverified store-entry activity as a feasible timed recommendation',()=>{
 const storeDependent=actionsForNode('P02').filter(a=>a.publicCondition==='店舗依存').map(a=>a.id);
 const legs={'S01>D01':{minutes:16,distance:1100},'S01>P02':{minutes:13,distance:900},'P02>D01':{minutes:21,distance:1500}};
 expect(recommend(answers,null,legs).every(rec=>!storeDependent.includes(rec.actionId))).toBe(true);
 expect(routingCandidateIds(answers,null).includes('P02')).toBe(false);
});
