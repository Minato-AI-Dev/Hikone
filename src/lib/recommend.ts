import { hooksForPlace } from '../data/hooks';
import { microExperiences } from '../data/microExperiences';
import { placeById, placeByName, places } from '../data/places';
import { Answers, HistoryState, Hook, Recommendation, RecommendationMode, WalkingLevel } from '../types';
import { completedIds } from './history';
import { routeMetrics } from './route';

const walkRank:Record<WalkingLevel,number>={low:0,medium:1,high:2};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));

function interestOverlap(tags:string[], interests:string[]){
  if(interests.includes('おまかせ')) return .7;
  const matches=tags.filter(tag=>interests.includes(tag)).length;
  return matches ? Math.min(1,.65+matches*.2) : 0;
}

function chooseHook(placeId:string, interests:string[]):Hook|null{
  const options=hooksForPlace(placeId);
  return options.sort((a,b)=>interestOverlap(b.interests,interests)-interestOverlap(a.interests,interests))[0] || null;
}

function withMode(r:Recommendation, mode:RecommendationMode, reason:string):Recommendation{
  return {...r,mode,reason};
}

export function recommend(answers:Answers, history:HistoryState|null):Recommendation[]{
  const start=placeByName(answers.currentLocation);
  const end=placeByName(answers.finalDestination);
  if(!start||!end) return [];

  const original=routeMetrics(start.id,end.id);
  if(!original) return [];

  const done=completedIds(history);
  const donePlaceIds=new Set(microExperiences.filter(e=>done.has(e.id)).map(e=>e.placeId));
  const buffer=5;
  const candidates:Recommendation[]=[];

  for(const exp of microExperiences){
    if(!exp.active || exp.staffRequired || exp.reservationRequired || done.has(exp.id)) continue;
    if(walkRank[exp.walkingLevel] > walkRank[answers.walking]) continue;
    if(answers.budget!==null && exp.costYen>answers.budget) continue;

    const place=placeById(exp.placeId);
    if(!place?.active) continue;
    const hook=chooseHook(place.id,answers.interests);
    if(!hook) continue;

    const out=routeMetrics(start.id,place.id);
    const back=routeMetrics(place.id,end.id);
    if(!out||!back) continue;

    const totalJourneyMinutes=out.minutes+exp.durationMinutes+back.minutes;
    if(totalJourneyMinutes+buffer>answers.time) continue;

    const detourMinutes=Math.max(0,totalJourneyMinutes-original.minutes);
    const additionalWalkingMeters=Math.max(0,out.walkingMeters+back.walkingMeters-original.walkingMeters);
    const interestMatch=Math.max(interestOverlap(hook.interests,answers.interests),interestOverlap(exp.interestTags,answers.interests));
    const routeFit=clamp(1-detourMinutes/Math.max(answers.time,1));
    const regionalPriority=clamp(place.regionalPriority/5);
    const detourEfficiency=clamp(1-detourMinutes/Math.max(30,answers.time));
    const novelty=donePlaceIds.has(place.id)?.25:1;
    const score=.30*routeFit+.25*interestMatch+.15*exp.experienceQuality+.15*regionalPriority+.10*detourEfficiency+.05*novelty;

    candidates.push({
      id:exp.id, mode:'best_match', place, hook, experience:exp, score,
      originalRouteMinutes:original.minutes, totalJourneyMinutes, detourMinutes, additionalWalkingMeters,
      travelOut:out.minutes, travelBack:back.minutes, buffer,
      reason:answers.finalDestination+'へ向かう流れを保ったまま、+'+detourMinutes+'分で入れられる体験です。'
    });
  }

  if(!candidates.length) return [];

  const used=new Set<string>();
  const pick=(sorted:Recommendation[], mode:RecommendationMode, reason:(r:Recommendation)=>string)=>{
    const found=sorted.find(r=>!used.has(r.id)) || sorted[0];
    if(!found) return null;
    used.add(found.id);
    return withMode(found,mode,reason(found));
  };

  const minimum=pick(
    [...candidates].sort((a,b)=>a.detourMinutes-b.detourMinutes || b.score-a.score),
    'minimum_detour',
    r=>'予定を最も崩しにくい候補です。元の移動に+'+r.detourMinutes+'分だけ足します。'
  );
  const best=pick(
    [...candidates].sort((a,b)=>b.score-a.score || a.detourMinutes-b.detourMinutes),
    'best_match',
    r=>'興味・体験・寄り道量のバランスが最も高い候補です。追加は+'+r.detourMinutes+'分です。'
  );
  const explore=pick(
    [...candidates].sort((a,b)=>b.place.regionalPriority-a.place.regionalPriority || b.score-a.score || a.detourMinutes-b.detourMinutes),
    'explore_hikone',
    r=>'少しだけ足を伸ばし、普段の導線から外れた彦根へつなぐ候補です。追加は+'+r.detourMinutes+'分です。'
  );

  return [minimum,best,explore].filter((x):x is Recommendation=>Boolean(x));
}

export const recommendationPlaces=places;
