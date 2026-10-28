import { useEffect, useRef, useState } from 'react';
import { nodeById, tagNames } from './data/dbV4';
import { Answers, HistoryState, Recommendation } from './types';
import { addValidation, completeExperience, historyIsTemporary, loadHistory, startExperience } from './lib/history';
import { nodeOptions } from './lib/recommend';
import { track, hasAnalyticsConsent, setAnalyticsConsent, hasAnalyticsChoice, recordAnalyticsChoice } from './lib/analytics';
import { visitorStory } from './data/visitorStories';
import ResearchExplanation from './ResearchExplanation';
import { autoRecommend } from './lib/walkingRoutes';

type Screen='home'|'questions'|'results'|'detail'|'go'|'done';
const defaultAnswers:Answers={currentNodeId:'S01',finalNodeId:'D01',remainingTimeMin:35,interestTagIds:[],availableMode:'徒歩',maxWalkMin:null,detourPreference:'少しなら',discoveryOptIn:true,firstVisit:true,walkingPace:'standard',walkingConditions:'normal'};
type GPSPosition={lat:number;lng:number;accuracy:number};
function getGps():Promise<GPSPosition>{
 return new Promise((resolve,reject)=>{
  if(!navigator.geolocation){reject(new Error('このブラウザは位置情報に対応していません。'));return;}
  navigator.geolocation.getCurrentPosition(
   p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy}),
   e=>reject(new Error(e.code===1?'位置情報の許可がありません。ブラウザの設定を確認してください。':e.code===3?'位置情報の取得がタイムアウトしました。':'現在地を取得できませんでした。')),
   {enableHighAccuracy:true,timeout:12000,maximumAge:60000}
  );
 });
}

export default function App(){
 const [history,setHistory]=useState<HistoryState|null>(()=>loadHistory());
 const [needsConsentChoice,setNeedsConsentChoice]=useState(()=>!hasAnalyticsChoice());
 const [analyticsConsent,setConsent]=useState<boolean>(()=>hasAnalyticsConsent());
 const [temporaryHistory,setTemporaryHistory]=useState(false);
 const [screen,setScreenState]=useState<Screen>('home');
 const pendingRoute=useRef<AbortController|null>(null);
 const setScreen=(next:Screen)=>{if(next!=='results')pendingRoute.current?.abort();setScreenState(next)};
 useEffect(()=>()=>pendingRoute.current?.abort(),[]);
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<Answers>(defaultAnswers);
 const [recs,setRecs]=useState<Recommendation[]>([]);
 const [selected,setSelected]=useState<Recommendation|null>(null);
 const [helpful,setHelpful]=useState<'great'|'okay'|'not'>('great');
 const [counter,setCounter]=useState<'no'|'probablyNo'|'yes'>('probablyNo');
 const [gps,setGps]=useState<GPSPosition|null>(null);
 const [gpsBusy,setGpsBusy]=useState(false);
 const [gpsError,setGpsError]=useState('');
 const [routingBusy,setRoutingBusy]=useState(false);
 const [routingNotice,setRoutingNotice]=useState('');
 const [routingSource,setRoutingSource]=useState('unavailable');
 const requestGps=async()=>{
  setGpsBusy(true);setGpsError('');
  try{
   const p=await getGps();
   setGps(p);
   // GPS is deliberately not mapped to a DB node: node-level travel times
   // cannot be inferred from device coordinates without a routing service.
  }catch(e){setGpsError(e instanceof Error?e.message:'現在地を取得できませんでした。');}
  finally{setGpsBusy(false);}
 };

 useEffect(()=>{
  if(needsConsentChoice){setAnalyticsConsent(false);return;}
  track('app_open');if(history)track('returning_user_detected');
 },[needsConsentChoice]);
 const currentName=nodeById(answers.currentNodeId)?.name||answers.currentNodeId;
 const finalName=nodeById(answers.finalNodeId)?.name||answers.finalNodeId;

 const run=async(a=answers,h=history)=>{
   pendingRoute.current?.abort();const controller=new AbortController();pendingRoute.current=controller;
   setRecs([]);setRoutingBusy(true);setRoutingNotice('徒歩経路を計算しています…');setScreen('results');
   try{
    const result=await autoRecommend(a,h,undefined,controller.signal);if(controller.signal.aborted)return;
    const r=result.recommendations;
    setRoutingNotice(result.warning);setRoutingSource(result.source);setRecs(r);
    if(r.length>0)track('recommendation_viewed',{count:r.length,currentNodeId:a.currentNodeId,finalNodeId:a.finalNodeId});
   }catch{
    if(!controller.signal.aborted){setRecs([]);setRoutingSource('unavailable');setRoutingNotice('おすすめを取得できませんでした。通信環境を確認して、もう一度お試しください。');}
   }finally{if(!controller.signal.aborted)setRoutingBusy(false);}
 };
 const beginQuestions=()=>{setStep(0);setAnswers(a=>({...a,firstVisit:!history}));setScreen('questions');track('questionnaire_started')};
 const selectRec=(r:Recommendation)=>{setSelected(r);setScreen('detail');track('recommendation_selected',{id:r.id,detourMinutes:r.detourMinutes})};
 const beginExperience=()=>{if(!selected)return;const h=startExperience({experienceId:selected.actionId,startedAt:new Date().toISOString(),completed:false},answers);setHistory(h);setTemporaryHistory(historyIsTemporary());setScreen('go');track('experience_started',{id:selected.actionId,detourMinutes:selected.detourMinutes})};
 const markCompleted=(ok:boolean)=>{if(!selected)return;if(ok){const h=completeExperience(selected.actionId);setHistory(h);setTemporaryHistory(historyIsTemporary());setScreen('done');track('experience_completed',{id:selected.actionId,method:'manual'})}else{setScreen('home');track('experience_not_completed',{id:selected.actionId})}};
 const reset=()=>{setSelected(null);setRecs([]);setScreen('home')};

 const chooseResearch=(enabled:boolean)=>{
  recordAnalyticsChoice(enabled);setConsent(enabled);setNeedsConsentChoice(false);beginQuestions();
 };
 return <div className="app">
  <header className="top"><button className="brand" onClick={reset} disabled={needsConsentChoice}>次の彦根</button></header>
  <main>
   {temporaryHistory&&<p className="note" role="status">この端末には記録を保存できませんが、このまま利用できます。タブを閉じると今回の記録は失われます。</p>}
   {needsConsentChoice?<section className="consent-intro" aria-labelledby="consent-title">
    <p className="eyebrow">ようこそ、彦根へ</p>
    <h1 id="consent-title">観光案内の調査に<br/>協力しますか？</h1>
    <p>このアプリが、彦根の寄り道を楽しむきっかけになるかを調べています。</p>
    <p>協力いただける場合、おすすめを見た回数や選んだ回数などを、匿名で集計します。</p>
    <p className="note">名前や位置情報は調査の集計に送りません。協力は自由で、あとから変更できます。協力しなくても、同じように使えます。</p>
    <div className="consent-options">
     <button className="secondary" onClick={()=>chooseResearch(true)}>協力してはじめる</button>
     <button className="secondary" onClick={()=>chooseResearch(false)}>協力せずにはじめる</button>
    </div>
    <ResearchExplanation/>
   </section>:<>
   {screen==='home'&&<section className="hero cardless">
    <p className="eyebrow">次の彦根</p>
    <h1>あと少し、<br/>彦根に寄り道しませんか？</h1>
    <p>今いる場所と残り時間に合わせて、おすすめの寄り道を提案します。</p>
    <button className="primary" onClick={beginQuestions}>寄り道を探す<span>6つの質問に答えるだけ</span></button>
   </section>}

   {screen==='questions'&&<Questionnaire step={step} setStep={setStep} answers={answers} setAnswers={setAnswers} gps={gps} gpsBusy={gpsBusy} gpsError={gpsError} requestGps={requestGps} onDone={()=>{track('questionnaire_completed');run(answers)}}/>}

   {screen==='results'&&<section>
    <p className="eyebrow">今から行けるところ</p>
    <h2>{routingBusy?'徒歩経路を確認中…':recs.length?'このあたりがおすすめです':'今の条件では、寄り道なしが安心です'}</h2>
    {routingBusy?<p className="note" role="status">歩いて行ける寄り道を探しています…</p>:<p className="note" role="status">{routingNotice||(recs.length?'移動時間は目安です。余裕をもってお出かけください。':'条件を変えて、もう一度お試しください。')}</p>}
    {!routingBusy&&routingSource==='maps'&&<p className="maps-attribution" translate="no">Google Maps</p>}
    {gps&&<p className="gps-notice">地図の道案内には現在地を使います。所要時間は{shortName(currentName)}からの目安です。</p>}
    <div className="route-context"><b>{shortName(currentName)}</b><span>→</span><b>{shortName(finalName)}</b><small>残り {answers.remainingTimeMin}分</small></div>
    <p className="note">歩行ペース：{answers.walkingPace==='slow'?'休憩しながら':answers.walkingPace==='relaxed'?'ゆっくり':'普通'} ／ 状況：{answers.walkingConditions==='rain'?'雨・足元が悪い':answers.walkingConditions==='heat'?'暑い・疲れやすい':'通常'}{answers.maxWalkMin!==null?' ／ 徒歩は合計'+answers.maxWalkMin+'分まで':''}。</p>
    {answers.interestTagIds.length>0&&<div className="selected-tags">{friendlySelectedTags(answers.interestTagIds).map(t=><span key={t}>{t}</span>)}</div>}
    {!routingBusy&&!recs.length&&<div className="strict-empty"><b>今回は無理に寄り道をおすすめしません。</b><p>残り時間が足りないか、必要な徒歩経路を取得できませんでした。帰る場所までの経路をGoogle Mapsで確認し、余裕を持って移動してください。</p></div>}
    <div className="cards">{recs.map(r=><div key={r.id} className="result-card">
      <button className="exp-card strategy-card" onClick={()=>selectRec(r)}>
        <div className="strategy-head"><span className="pill">{r.matchingTags.length?'あなた向け':'ちょっと発見'}</span><span className="detour-badge"><small>寄り道で追加</small><strong>＋{r.detourMinutes}分</strong></span></div>
        <h3>{friendlyNodeName(r.nodeName)}</h3>
        {r.dataStatus.includes('机上の概算')&&<small className="note">時間は仮の目安（現地未検証）</small>}
        <p className="experience-line">{friendlyAction(r.actionName)}</p>
        {r.matchingTags.length>0&&<p className="match-line">{r.matchingTags.join('・')}</p>}
        <p className="reason">{friendlyReason(r)}</p>
<span className="time-summary"><span>{shortName(finalName)}に着くまで</span><strong>約{r.viaRouteMinutes}分</strong></span>
      </button>
      {visitorStory(r.nodeId,nodeById(r.nodeId)?.category||'').source&&<a className="story-source" href={visitorStory(r.nodeId,nodeById(r.nodeId)?.category||'').source} target="_blank" rel="noopener noreferrer">このお話の参考資料を見る ↗</a>}
      <a className="result-map-link" href={googleMapsDirectionsUrl(gps?gps.lat+','+gps.lng:currentName,r.nodeName,finalName)} target="_blank" rel="noopener noreferrer" onClick={()=>track('navigation_clicked',{id:r.actionId,from:'results'})}>
        Google Mapsで経路を見る ↗
      </a>
    </div>)}</div>
    <button className="secondary" onClick={beginQuestions}>条件を変える</button>
   </section>}

   {screen==='detail'&&selected&&<section>
    <p className="eyebrow">寄り道プラン</p>
    <div className="detail-detour"><small>寄り道で追加</small>＋{selected.detourMinutes}分</div>
    <h2>{friendlyNodeName(selected.nodeName)}</h2>
    <p>{friendlyReason(selected)}</p>
    {visitorStory(selected.nodeId,nodeById(selected.nodeId)?.category||'').source&&<a className="story-source" href={visitorStory(selected.nodeId,nodeById(selected.nodeId)?.category||'').source} target="_blank" rel="noopener noreferrer">このお話の参考資料を見る ↗</a>}
    <div className="mission"><small>ここですること</small><br/><b>{friendlyAction(selected.actionName)}</b></div>
    <MapEmbed placeName={selected.nodeName}/>
    <a className="result-map-link detail-map-link" href={googleMapsDirectionsUrl(gps?gps.lat+','+gps.lng:currentName,selected.nodeName,finalName)} target="_blank" rel="noopener noreferrer" onClick={()=>track('navigation_clicked',{id:selected.actionId,from:'detail'})}>Google Mapsで経路を見る ↗</a>
    <div className="time-summary"><span>{shortName(finalName)}に着くまで</span><strong>約{selected.viaRouteMinutes}分</strong></div>
    <p className="note">時間は目安です。開館時間や道の状況を確認してお出かけください。</p>
    {selected.dataStatus.includes('Google Maps')&&<p className="maps-attribution" translate="no">Google Maps</p>}
    <button className="primary" onClick={beginExperience}>ここに寄る</button>
    <button className="link" onClick={()=>setScreen('results')}>別の候補を見る</button>
   </section>}

   {screen==='go'&&selected&&<section className="center">
    <p className="eyebrow">寄り道スタート</p>
    <h1>いってらっしゃい。</h1>
    <p>「{friendlyNodeName(selected.nodeName)}」で、<br/><b>{friendlyAction(selected.actionName)}</b></p>
    <div className="time-big">+{selected.detourMinutes}分</div>
    <MapEmbed placeName={selected.nodeName}/>
    <a className="secondary anchor map-open" href={googleMapsDirectionsUrl(gps?gps.lat+','+gps.lng:currentName,selected.nodeName,finalName)} target="_blank" rel="noopener noreferrer" onClick={()=>track('navigation_clicked',{id:selected.actionId,from:'go'})}>Google Mapsで経路案内を開く ↗</a>
    <div className="checkpoint-box"><b>寄り道できたら</b><p>戻って「行ってきた」を押してください。寄り道の記録が残ります。</p></div>
    <button className="primary" onClick={()=>markCompleted(true)}>行ってきた</button>
    <button className="link" onClick={()=>markCompleted(false)}>今回は行かなかった</button>
   </section>}

   {screen==='done'&&selected&&<section className="center">
    <p className="eyebrow">おかえりなさい</p>
    <h2>彦根を、ひとつ足せました。</h2>
    {analyticsConsent&&<details className="validation"><summary>よければ感想を教えてください</summary>
      <p>このおすすめは役に立ちましたか？</p>
      <Choice value={helpful} setValue={setHelpful} options={[['great','とても役立った'],['okay','まあ役立った'],['not','あまり役立たなかった']]}/>
      <p>この提案がなければ、ここに行っていましたか？</p>
      <Choice value={counter} setValue={setCounter} options={[['no','行かなかったと思う'],['probablyNo','たぶん行かなかった'],['yes','行ったと思う']]}/>
    </details>}
    <button className="primary" onClick={()=>{const h=analyticsConsent?addValidation(selected.actionId,helpful,counter):history;setHistory(h);run(answers,h)}}>まだ時間があるので、もう一つ見る</button>
    <button className="secondary" onClick={()=>{if(analyticsConsent)setHistory(addValidation(selected.actionId,helpful,counter));setScreen('home')}}>今日はここまで</button>
   </section>}

   </>}
  </main>
  <footer className="note"><a href={import.meta.env.BASE_URL+'privacy.html'} target="_blank" rel="noopener noreferrer">プライバシー</a> · <a href={import.meta.env.BASE_URL+'terms.html'} target="_blank" rel="noopener noreferrer">利用規約</a></footer>
  {!needsConsentChoice&&<details className="research-settings">
   <summary>調査への協力</summary>
   <p className="note">{analyticsConsent?'現在、調査に協力しています。':'現在、調査には協力していません。'}</p>
   {analyticsConsent?<button className="link" onClick={()=>{recordAnalyticsChoice(false);setConsent(false);}}>協力をやめる</button>:<button className="link" onClick={()=>{pendingRoute.current?.abort();setScreen('home');setNeedsConsentChoice(true);}}>協力するか選び直す</button>}
  </details>}
 </div>
}

function Questionnaire({step,setStep,answers,setAnswers,gps,gpsBusy,gpsError,requestGps,onDone}:{step:number;setStep:(n:number)=>void;answers:Answers;setAnswers:(a:Answers)=>void;gps:GPSPosition|null;gpsBusy:boolean;gpsError:string;requestGps:()=>void;onDone:()=>void}){
 const locs=nodeOptions.map(n=>[n.id,shortName(n.name)]);
 const qs=[
  {q:'今どこにいますか？',body:<>
    <button type="button" className="secondary gps-button" disabled={gpsBusy} onClick={requestGps}>{gpsBusy?'現在地を取得中…':gps?'現在地を取得済み（再取得）':'現在地を取得する'}</button>
    {gps&&<p className="gps-notice">現在地を取得しました（精度 約{Math.round(gps.accuracy)}m）。Google Mapsの道案内に使います。</p>}
    {gpsError&&<p role="alert" className="gps-error">{gpsError}</p>}
    <p className="note">出発する場所を選んでください。現在地の取得は、地図の道案内に使います。</p>
    <Choice value={answers.currentNodeId} setValue={v=>setAnswers({...answers,currentNodeId:String(v)})} options={locs}/>
   </>},
  {q:'最後にどこへ行きますか？',body:<Choice value={answers.finalNodeId} setValue={v=>setAnswers({...answers,finalNodeId:String(v)})} options={locs}/>},
  {q:'あとどのくらい時間がありますか？',body:<Choice value={answers.remainingTimeMin} setValue={v=>setAnswers({...answers,remainingTimeMin:Number(v)})} options={[[20,'20分'],[35,'35分'],[60,'60分'],[90,'90分以上']]}/>},
  {q:'今、何がしたいですか？',body:<InterestChoices values={answers.interestTagIds} setValues={v=>setAnswers({...answers,interestTagIds:v})}/>},
  {q:'寄り道はどのくらいならOK？',body:<Choice value={answers.detourPreference} setValue={v=>{const x=String(v) as Answers['detourPreference'];setAnswers({...answers,detourPreference:x,discoveryOptIn:x!=='最短'})}} options={[['最短','なるべく寄り道しない'],['少しなら','少しならOK'],['積極','せっかくなので寄りたい']]}/>} ,
  {q:'歩く速さ・今日の状況は？',body:<><p>歩く速さ</p><Choice value={answers.walkingPace||'standard'} setValue={v=>setAnswers({...answers,walkingPace:v})} options={[['standard','普通'],['relaxed','ゆっくり'],['slow','休憩しながら']]}/><p>天候など</p><Choice value={answers.walkingConditions||'normal'} setValue={v=>setAnswers({...answers,walkingConditions:v})} options={[['normal','通常'],['rain','雨・足元が悪い'],['heat','暑い・疲れやすい']]}/><p>歩く時間の合計上限</p><Choice value={answers.maxWalkMin} setValue={v=>setAnswers({...answers,maxWalkMin:v})} options={[[null,'上限なし'],[15,'15分まで'],[30,'30分まで'],[60,'60分まで'],...(answers.maxWalkMin!==null&&![15,30,60].includes(answers.maxWalkMin)?[[answers.maxWalkMin,answers.maxWalkMin+'分まで（入力値）']]:[])]}/><p className="note">無理なく歩ける条件を選んでください。</p></>}
 ];
 return <section>
  <div className="progress"><span style={{width:String(((step+1)/qs.length)*100)+'%'}}/></div>
  <p className="eyebrow">{step+1} / {qs.length}</p>
  <h2>{qs[step].q}</h2>
  {qs[step].body}
  <div className="actions">{step>0&&<button className="link" onClick={()=>setStep(step-1)}>戻る</button>}<button className="primary" onClick={()=>step===qs.length-1?onDone():setStep(step+1)}>{step===qs.length-1?'おすすめを見る':'次へ'}</button></div>
 </section>
}

function Choice({value,setValue,options}:{value:any;setValue:(v:any)=>void;options:any[][]}){return <div className="choice-grid">{options.map(([v,l])=><button key={String(v)} className={value===v?'choice active':'choice'} onClick={()=>setValue(v)}>{l}</button>)}</div>}

const interestChoices=[
 {label:'ひこにゃん',tags:['T_HIKONYAN']},
 {label:'写真を撮りたい',tags:['T_PHOTO']},
 {label:'街を歩きたい',tags:['T_WALK','T_STREETSCAPE']},
 {label:'食べたい',tags:['T_FOOD']},
 {label:'買い物したい',tags:['T_SHOP']},
 {label:'歴史を見たい',tags:['T_HISTORY']},
 {label:'近代建築',tags:['T_MODERN','T_ARCH']},
 {label:'琵琶湖・景色',tags:['T_LAKE','T_SCENERY','T_NATURE']},
];

function InterestChoices({values,setValues}:{values:string[];setValues:(v:string[])=>void}){return <div className="choice-grid">{interestChoices.map(c=>{const active=c.tags.some(t=>values.includes(t));return <button key={c.label} className={active?'choice active':'choice'} onClick={()=>{const next=active?values.filter(v=>!c.tags.includes(v)):[...new Set([...values,...c.tags])];setValues(next)}}>{c.label}</button>})}</div>}

function googleMapsQuery(placeName:string){
 // Raw coordinates are passed through for the GPS origin only.
 if(/^-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?$/.test(placeName)) return placeName;
 return friendlyNodeName(placeName)+' 彦根市 滋賀県';
}

function googleMapsEmbedUrl(placeName:string){
 return 'https://www.google.com/maps?q='+encodeURIComponent(googleMapsQuery(placeName))+'&output=embed';
}

function googleMapsDirectionsUrl(current:string,stop:string,final:string){
 const p=new URLSearchParams({
  api:'1',
  origin:googleMapsQuery(current),
  destination:googleMapsQuery(final),
  waypoints:googleMapsQuery(stop),
  travelmode:'walking'
 });
 return 'https://www.google.com/maps/dir/?'+p.toString();
}

function googleMapsOpenUrl(placeName:string){
 return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(googleMapsQuery(placeName));
}

function MapEmbed({placeName}:{placeName:string}){
 return <div className="map-card">
  <iframe
   title={friendlyNodeName(placeName)+'の地図'}
   src={googleMapsEmbedUrl(placeName)}
   loading="lazy"
   referrerPolicy="no-referrer-when-downgrade"
   allowFullScreen
  />
  <small>Google Mapsで場所を確認できます。</small>
 </div>;
}

function friendlyAction(action:string){
 return action
  .replace('入口通過・街並み確認','城下町の街並みを少し見る')
  .replace('代表地点通過・景観確認','レトロな街並みを少し見る')
  .replace('けやき並木・川沿いを撮影','けやき並木と川沿いの景色を撮る')
  .replace('路地・板塀を撮影','路地や板塀のある街並みを撮る')
  .replace('井伊家・赤備え文脈を見る','井伊家と赤備えの展示を少し見る')
  .replace('町家風街並みを撮影','町家風の街並みを撮る')
  .replace('レトロ街並みを撮影','レトロな街並みを撮る');
}

function friendlyNodeName(name:string){
 return name
  .replace('彦根城 表門券売所付近','彦根城')
  .replace('JR彦根駅 西口','彦根駅')
  .replace('夢京橋キャッスルロード北端（京橋南詰）','夢京橋キャッスルロード')
  .replace('四番町スクエア代表点','四番町スクエア');
}

function shortName(name:string){return friendlyNodeName(name)}

function friendlyReason(r:Recommendation){
 return visitorStory(r.nodeId,nodeById(r.nodeId)?.category||'').text;
}

function friendlySelectedTags(ids:string[]){
 const labels=ids.map(id=>tagNames[id]||id);
 return [...new Set(labels.map(x=>{
  if(['街歩き','街並み'].includes(x)) return '街歩き';
  if(['琵琶湖','景色','自然'].includes(x)) return '琵琶湖・景色';
  if(['近代史','近代建築'].includes(x)) return '近代建築';
  return x;
 }))];
}

