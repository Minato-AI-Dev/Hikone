import { useEffect, useMemo, useState } from 'react';
import { microExperiences } from './data/microExperiences';
import { placeById } from './data/places';
import { Answers, HistoryState, Recommendation, WalkingLevel } from './types';
import { addValidation, completeExperience, lastCompletedId, loadHistory, startExperience } from './lib/history';
import { recommend } from './lib/recommend';
import { track } from './lib/analytics';
import QrScanner from './QrScanner';
import HikoneAI from './HikoneAI';

type Screen='home'|'ai'|'questions'|'results'|'detail'|'go'|'scan'|'return'|'done'|'history';
const defaultAnswers:Answers={currentLocation:'彦根城',finalDestination:'彦根駅',time:60,interests:['ひこにゃん・キャラクター'],walking:'medium',budget:null,firstVisit:true};
const walkLabel:Record<WalkingLevel,string>={low:'あまり歩かない',medium:'普通',high:'しっかり歩く'};
const modeLabel={minimum_detour:'最小の寄り道',best_match:'いちばん合う',explore_hikone:'もう一歩、彦根へ'} as const;

export default function App(){
 const [history,setHistory]=useState<HistoryState|null>(()=>loadHistory());
 const [screen,setScreen]=useState<Screen>('home');
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<Answers>(defaultAnswers);
 const [recs,setRecs]=useState<Recommendation[]>([]);
 const [selected,setSelected]=useState<Recommendation|null>(null);
 const [helpful,setHelpful]=useState<'great'|'okay'|'not'>('great');
 const [counter,setCounter]=useState<'no'|'probablyNo'|'yes'>('probablyNo');
 const [aiIntro,setAiIntro]=useState<string|null>(null);
 const [aiSource,setAiSource]=useState<'ai'|'fallback'|null>(null);

 useEffect(()=>{track('app_open');if(history)track('returning_user_detected');},[]);
 const last=useMemo(()=>microExperiences.find(e=>e.id===lastCompletedId(history)),[history]);

 const runRecommendations=(a=answers,h=history)=>{
   const r=recommend(a,h);setRecs(r);setAiIntro(null);setAiSource(null);setScreen('results');
   track('recommendation_viewed',{count:r.length,currentLocation:a.currentLocation,finalDestination:a.finalDestination});
 };
 const beginQuestions=()=>{setStep(0);setAiIntro(null);setAiSource(null);setAnswers(a=>({...a,firstVisit:!history}));setScreen('questions');track('questionnaire_started');};
 const beginAI=()=>{setAiIntro(null);setAiSource(null);setScreen('ai');track('hikone_ai_opened');};
 const selectRec=(r:Recommendation)=>{setSelected(r);setScreen('detail');track('recommendation_selected',{id:r.id,mode:r.mode,detourMinutes:r.detourMinutes,distanceAdded:r.additionalWalkingMeters});};
 const beginExperience=()=>{if(!selected)return;const h=startExperience({experienceId:selected.experience.id,startedAt:new Date().toISOString(),completed:false},answers);setHistory(h);setScreen('go');track('experience_started',{id:selected.experience.id,detourMinutes:selected.detourMinutes});};
 const markCompleted=(completed:boolean)=>{if(!selected)return;if(completed){const h=completeExperience(selected.experience.id);setHistory(h);setScreen('done');track('experience_completed',{id:selected.experience.id,method:'manual'});}else{setScreen('home');track('experience_not_completed',{id:selected.experience.id});}};
 const markQrCompleted=()=>{if(!selected)return;const h=completeExperience(selected.experience.id);setHistory(h);setScreen('done');track('qr_checkin_success',{id:selected.experience.id});track('experience_completed',{id:selected.experience.id,method:'qr'});};
 const resetFlow=()=>{setSelected(null);setRecs([]);setAiIntro(null);setAiSource(null);setScreen('home');};

 return <div className="app"><header className="top"><button className="brand" onClick={resetFlow}>次の彦根</button><span className="demo">寄り道MVP</span></header><main>
 {screen==='home'&&<section className="hero cardless">{history&&last?<><p className="eyebrow">また彦根へ</p><h1>おかえりなさい。</h1><p>前回は「{last.name}」を体験しました。今日は行き先を変えずに、その途中へもう一つ彦根を入れます。</p></>:<><p className="eyebrow">DETOUR RECOMMENDATION</p><h1>行き先はそのまま。<br/>彦根を、ひとつ足す。</h1><p>今いる場所から目的地までの予定を守りながら、残り時間に入る小さな体験を提案します。</p></>}
 <button className="primary ai-entry" onClick={beginAI}>Hikone AIに相談する<span>「彦根城から駅へ。あと40分」から話せます。</span></button>
 <button className="secondary" onClick={beginQuestions}>条件から寄り道を探す</button>
 {history&&<button className="link" onClick={()=>setScreen('history')}>これまでに見た彦根</button>}
 <p className="muted">場所の人気順ではなく、「元の予定 + 許容できる寄り道 + あなたに合う体験」で選びます。</p></section>}

 {screen==='ai'&&<HikoneAI answers={answers} history={history} onBack={()=>setScreen('home')} onResolved={(nextAnswers,nextRecs,intro,source)=>{
   setAnswers(nextAnswers);setRecs(nextRecs);setAiIntro(intro);setAiSource(source);setScreen('results');
   track('recommendation_viewed',{count:nextRecs.length,mode:'ai',source});
 }}/>}

 {screen==='questions'&&<Questionnaire step={step} setStep={setStep} answers={answers} setAnswers={setAnswers} onDone={()=>{track('questionnaire_completed');runRecommendations(answers)}}/>}

 {screen==='results'&&<section><p className="eyebrow">寄り道候補</p><h2>{recs.length?'予定を守れる候補です':'今の条件では寄り道なしが安全です'}</h2>
 {aiIntro&&<div className="ai-summary"><span className="pill">{aiSource==='ai'?'Hikone AI':'ローカル判定'}</span><p>{aiIntro}</p></div>}
 <div className="route-context"><b>{answers.currentLocation}</b><span>→</span><b>{answers.finalDestination}</b><small>残り {answers.time}分</small></div>
 {!recs.length&&<><p>目的地までの移動と余裕時間を考えると、登録済み体験を安全に差し込めません。残り時間か歩く量を広げてください。</p><button className="secondary" onClick={()=>aiIntro?setScreen('ai'):beginQuestions()}>条件を変える</button></>}
 <div className="cards">{recs.map(r=><button key={r.id+'-'+r.mode} className="exp-card strategy-card" onClick={()=>selectRec(r)}>
   <div className="strategy-head"><span className="pill">{modeLabel[r.mode]}</span><span className="detour-badge">+{r.detourMinutes}分</span></div>
   <h3>{r.hook.headline}</h3><p>{r.place.name}</p><p className="experience-line">体験：{r.experience.name}</p><p className="reason">{r.reason}</p>
   <small>追加歩行 約{r.additionalWalkingMeters}m ・ 最終目的地 {answers.finalDestination}</small>
 </button>)}</div>
 {recs.length>0&&aiIntro&&<button className="link" onClick={()=>setScreen('ai')}>条件を言い直す</button>}
 </section>}

 {screen==='detail'&&selected&&<section><p className="eyebrow">{modeLabel[selected.mode]}</p><div className="detail-detour">+{selected.detourMinutes}分</div><h2>{selected.hook.headline}</h2><p>{selected.hook.body}</p>
 <div className="mission"><small>ここですること</small><br/><b>{selected.experience.name}</b><p>{selected.experience.description}</p></div>
 <div className="breakdown"><div><b>元の移動</b><span>{selected.originalRouteMinutes}分</span></div><div><b>寄り道先まで</b><span>{selected.travelOut}分</span></div><div><b>体験</b><span>{selected.experience.durationMinutes}分</span></div><div><b>{answers.finalDestination}まで</b><span>{selected.travelBack}分</span></div><div><b>余裕</b><span>{selected.buffer}分</span></div></div>
 <p className="route-result">寄り道込み 約{selected.totalJourneyMinutes}分 <b>（元の予定から +{selected.detourMinutes}分）</b></p>
 <p className="note">現在の移動時間・距離・観光内容はMVP用サンプルです。実運用では検証済みデータと外部経路APIに置き換えます。</p>
 <button className="primary" onClick={beginExperience}>この寄り道にする</button><button className="link" onClick={()=>setScreen('results')}>別の寄り道を見る</button></section>}

 {screen==='go'&&selected&&<section className="center"><p className="eyebrow">寄り道スタート</p><h1>いってらっしゃい。</h1><p>最終目的地は <b>{answers.finalDestination}</b> のままです。<br/>途中で「{selected.experience.name}」をやってみましょう。</p><div className="time-big">+{selected.detourMinutes}分</div>
 <a className="secondary anchor" href={selected.place.navigationUrl} target="_blank" rel="noreferrer" onClick={()=>track('navigation_clicked',{id:selected.experience.id})}>寄り道先の地図を開く</a>
 <div className="checkpoint-box"><b>現地に着いたら</b><p>QRコードを読み取ると、その場所へ実際に到達した記録を残せます。</p></div>
 <button className="primary" onClick={()=>{setScreen('scan');track('qr_scanner_opened',{id:selected.experience.id});}}>現地のQRコードを読み取る</button><button className="link" onClick={()=>setScreen('return')}>QRコードが使えない場合</button></section>}

 {screen==='scan'&&selected&&<QrScanner experienceId={selected.experience.id} experienceName={selected.experience.name} onVerified={markQrCompleted} onCancel={()=>setScreen('go')}/>}
 {screen==='return'&&selected&&<section className="center"><p className="eyebrow">代替チェック</p><h2>寄り道先には行けましたか？</h2><p>「{selected.place.name}」で「{selected.experience.name}」を試しましたか？</p><button className="primary" onClick={()=>markCompleted(true)}>行ってきた</button><button className="secondary" onClick={()=>markCompleted(false)}>今回は行かなかった</button><button className="link" onClick={()=>setScreen('go')}>戻る</button></section>}

 {screen==='done'&&selected&&<section className="center"><p className="eyebrow">おかえりなさい</p><h2>元の予定に、彦根がひとつ増えました。</h2>
 <div className="validation"><p>この寄り道は役に立ちましたか？</p><Choice value={helpful} setValue={setHelpful} options={[['great','とても役立った'],['okay','まあ役立った'],['not','あまり役立たなかった']]}/>
 <p>この提案がなければ、ここに行っていましたか？</p><Choice value={counter} setValue={setCounter} options={[['no','行かなかったと思う'],['probablyNo','たぶん行かなかった'],['yes','行ったと思う']]}/></div>
 <button className="primary" onClick={()=>{const h=addValidation(selected.experience.id,helpful,counter);setHistory(h);runRecommendations(answers,h);track('second_experience_selected');}}>まだ時間があるので、もう一つ見る</button>
 <button className="secondary" onClick={()=>{setHistory(addValidation(selected.experience.id,helpful,counter));setScreen('home')}}>今日はここまで</button></section>}

 {screen==='history'&&<HistoryView history={history} onBack={()=>setScreen('home')} onNext={beginQuestions}/>}
 </main><nav><button onClick={()=>setScreen('home')}>ホーム</button><button onClick={beginAI}>寄り道相談</button><button onClick={()=>setScreen('history')}>履歴</button></nav></div>
}

function Questionnaire({step,setStep,answers,setAnswers,onDone}:{step:number;setStep:(n:number)=>void;answers:Answers;setAnswers:(a:Answers)=>void;onDone:()=>void}){
 const qs=[
  {q:'今どこにいますか？',body:<Choice value={answers.currentLocation} setValue={v=>setAnswers({...answers,currentLocation:String(v)})} options={['彦根城','夢京橋キャッスルロード','四番町スクエア','彦根駅'].map(x=>[x,x])}/>},
  {q:'最後にどこへ行きますか？',body:<Choice value={answers.finalDestination} setValue={v=>setAnswers({...answers,finalDestination:String(v)})} options={['彦根駅','京橋口駐車場','二の丸駐車場','彦根城','夢京橋キャッスルロード'].map(x=>[x,x])}/>},
  {q:'あとどのくらい時間がありますか？',body:<Choice value={answers.time} setValue={v=>setAnswers({...answers,time:Number(v)})} options={[[15,'15分'],[30,'30分'],[60,'60分'],[90,'90分以上']]}/>},
  {q:'今、何が気になりますか？',body:<Multi values={answers.interests} setValues={v=>setAnswers({...answers,interests:v})} options={['ひこにゃん・キャラクター','食','写真','街歩き','工芸','景色','歴史','買い物','地元らしさ','おまかせ']}/>},
  {q:'どのくらい歩けますか？',body:<Choice value={answers.walking} setValue={v=>setAnswers({...answers,walking:v as WalkingLevel})} options={[['low','あまり歩きたくない'],['medium','普通'],['high','しっかり歩ける']]}/>}
 ];
 return <section><div className="progress"><span style={{width:String(((step+1)/qs.length)*100)+'%'}}/></div><p className="eyebrow">{step+1} / {qs.length}</p><h2>{qs[step].q}</h2>{qs[step].body}<div className="actions">{step>0&&<button className="link" onClick={()=>setStep(step-1)}>戻る</button>}<button className="primary" onClick={()=>step===qs.length-1?onDone():setStep(step+1)}>{step===qs.length-1?'寄り道を見る':'次へ'}</button></div></section>;
}
function Choice({value,setValue,options}:{value:any;setValue:(v:any)=>void;options:any[][]}){return <div className="choice-grid">{options.map(([v,l])=><button key={String(v)} className={value===v?'choice active':'choice'} onClick={()=>setValue(v)}>{l}</button>)}</div>}
function Multi({values,setValues,options}:{values:string[];setValues:(v:string[])=>void;options:string[]}){return <div className="choice-grid">{options.map(v=><button key={v} className={values.includes(v)?'choice active':'choice'} onClick={()=>setValues(values.includes(v)?values.filter(x=>x!==v):[...values,v])}>{v}</button>)}</div>}
function HistoryView({history,onBack,onNext}:{history:HistoryState|null;onBack:()=>void;onNext:()=>void}){const completed=(history?.visitHistory||[]).filter(v=>v.completed);return <section><p className="eyebrow">履歴</p><h2>これまでに足した彦根</h2>{completed.length===0?<p>まだ寄り道履歴はありません。</p>:completed.slice().reverse().map(v=>{const e=microExperiences.find(x=>x.id===v.experienceId);const p=e?placeById(e.placeId):null;return e?<div className="history-item" key={v.startedAt}><small>{new Date(v.completedAt||v.startedAt).toLocaleDateString('ja-JP')}</small><h3>{p?.name||'彦根'} — {e.name}</h3><p>{e.interestTags.join(' ・ ')}</p></div>:null})}<button className="primary" onClick={onNext}>次の寄り道を探す</button><button className="link" onClick={onBack}>ホームへ戻る</button></section>}
