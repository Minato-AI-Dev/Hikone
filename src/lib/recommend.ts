import { Answers, Experience, HistoryState, Recommendation, WalkingLevel } from '../types';
import { completedIds, lastCompletedId } from './history';

const returnTimes: Record<string, number> = { '彦根駅':12, '彦根城周辺':6, '京橋口駐車場':8, '二の丸駐車場':7, 'その他':12 };
const outboundByArea: Record<string,number> = { '足軽屋敷周辺':8,'芹橋周辺':12,'玄宮園周辺':6,'夢京橋キャッスルロード':7,'四番町スクエア':8,'彦根城下町':8,'彦根駅〜彦根城':5,'彦根城周辺':5,'城下町中心部':7 };
const walkRank:Record<WalkingLevel,number>={low:0,medium:1,high:2};

export function recommend(all:Experience[], answers:Answers, history:HistoryState|null, mode:'normal'|'continue'|'different'='normal'):Recommendation[]{
  const done=completedIds(history); const prev=lastCompletedId(history); const prevExp=all.find(x=>x.id===prev); const buffer=8;
  return all.filter(e=>e.active && !done.has(e.id)).map(e=>{
    const travelOut=outboundByArea[e.area] ?? 8; const travelBack=returnTimes[answers.returnTo] ?? 12; const totalMinutes=travelOut+e.durationMinutes+travelBack+buffer;
    let score=0;
    if(answers.interests.includes('おまかせ') || e.category.some(c=>answers.interests.includes(c))) score+=4;
    if(walkRank[e.walkingLevel] <= walkRank[answers.walking]) score+=2; else score-=6;
    if(answers.firstVisit && e.recommendedForFirstVisit) score+=2;
    if(!answers.firstVisit && e.recommendedForRepeatVisit) score+=2;
    if(prev){ if(e.continuationOf?.includes(prev) || e.relatedExperienceIds.includes(prev)) score += mode==='continue'?8:4; if(prevExp && e.theme.some(t=>prevExp.theme.includes(t))) score += mode==='continue'?4:1; }
    if(mode==='different' && prevExp){ const overlap=e.category.filter(c=>prevExp.category.includes(c)).length; score += overlap===0?5:-overlap*2; }
    const reason = prev && mode==='continue' && (e.continuationOf?.includes(prev)||e.relatedExperienceIds.includes(prev)) ? `前回の「${prevExp?.name ?? '体験'}」から自然に続けられる候補です。` : mode==='different' && prevExp ? '前回とは違う切り口を優先して選びました。' : `${answers.time}分以内で${answers.returnTo}まで戻れる見込みです。`;
    return {experience:e,score,totalMinutes,travelOut,travelBack,buffer,reason};
  }).filter(r=>r.totalMinutes<=answers.time && (answers.budget===null || r.experience.budgetMin<=answers.budget) && walkRank[r.experience.walkingLevel]<=walkRank[answers.walking]).sort((a,b)=>b.score-a.score || a.totalMinutes-b.totalMinutes).slice(0,3);
}
