import { useEffect, useMemo, useState } from 'react';
import { actions, nodeById, tagNames } from './data/dbV4';
import { Answers, HistoryState, Recommendation, ResearchCandidate } from './types';
import { addValidation, completeExperience, lastCompletedId, loadHistory, startExperience } from './lib/history';
import { dbStats, knownActionCount, nodeOptions, recommend, researchCandidates, researchNodeCount } from './lib/recommend';
import { track } from './lib/analytics';
import HikoneAI from './HikoneAI';
import DestinationCatalog from './DestinationCatalog';

type Screen='home'|'ai'|'questions'|'results'|'detail'|'go'|'done'|'history'|'catalog';
const defaultAnswers:Answers={currentNodeId:'S01',finalNodeId:'D01',remainingTimeMin:35,interestTagIds:[],availableMode:'徒歩',maxWalkMin:null,detourPreference:'少しなら',discoveryOptIn:true,firstVisit:true};
const debugMode=new URLSearchParams(window.location.search).get('debug')==='1';

export default function App(){
 const [history,setHistory]=useState<HistoryState|null>(()=>loadHistory());
 const [screen,setScreen]=useState<Screen>('home');
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<Answers>(defaultAnswers);
 const [recs,setRecs]=useState<Recommendation[]>([]);
 const [research,setResearch]=useState<ResearchCandidate[]>([]);
 const [selected,setSelected]=useState<Recommendation|null>(null);
 const [helpful,setHelpful]=useState<'great'|'okay'|'not'>('great');
 const [counter,setCounter]=useState<'no'|'probablyNo'|'yes'>('probablyNo');
 const [aiIntro,setAiIntro]=useState<string|null>(null);
 const [aiSource,setAiSource]=useState<'ai'|'fallback'|null>(null);

 useEffect(()=>{track('app_open');if(history)track('returning_user_detected')},[]);
 const last=useMemo(()=>actions.find(a=>a.id===lastCompletedId(history)),[history]);
 const currentName=nodeById(answers.currentNodeId)?.name||answers.currentNodeId;
 const finalName=nodeById(answers.finalNodeId)?.name||answers.finalNodeId;

 const run=(a=answers,h=history)=>{
   const r=recommend(a,h);
   setRecs(r);
   setResearch(debugMode?researchCandidates(a):[]);
   setAiIntro(null);
   setAiSource(null);
   setScreen('results');
   track('recommendation_viewed',{count:r.length,currentNodeId:a.currentNodeId,finalNodeId:a.finalNodeId});
 };
 const beginQuestions=()=>{setStep(0);setAiIntro(null);setAiSource(null);setAnswers(a=>({...a,firstVisit:!history}));setScreen('questions');track('questionnaire_started')};
 const beginAI=()=>{setAiIntro(null);setAiSource(null);setScreen('ai');track('hikone_ai_opened')};
 const selectRec=(r:Recommendation)=>{setSelected(r);setScreen('detail');track('recommendation_selected',{id:r.id,detourMinutes:r.detourMinutes})};
 const beginExperience=()=>{if(!selected)return;const h=startExperience({experienceId:selected.actionId,startedAt:new Date().toISOString(),completed:false},answers);setHistory(h);setScreen('go');track('experience_started',{id:selected.actionId,detourMinutes:selected.detourMinutes})};
 const markCompleted=(ok:boolean)=>{if(!selected)return;if(ok){const h=completeExperience(selected.actionId);setHistory(h);setScreen('done');track('experience_completed',{id:selected.actionId,method:'manual'})}else{setScreen('home');track('experience_not_completed',{id:selected.actionId})}};
 const reset=()=>{setSelected(null);setRecs([]);setResearch([]);setAiIntro(null);setScreen('home')};

 return <div className="app">
  <header className="top">
   <button className="brand" onClick={reset}>次の彦根</button>
   <span className="demo">{debugMode?'DEBUG':'DEMO'}</span>
  </header>
  <main>
   {screen==='home'&&<section className="hero cardless">
    <p className="eyebrow">HIKONE DETOUR</p>
    <h1>あと少し、<br/>彦根に寄り道しませんか？</h1>
    <p>今いる場所と帰る場所、残り時間に合わせて、今からできることを3つまで提案します。</p>
    {last&&<p className="muted">前回は「{last.type}」を体験しました。</p>}
    <button className="primary" onClick={beginQuestions}>選択肢から探す<span>5回ほどタップするだけです。</span></button>
    <button className="secondary" onClick={()=>setScreen('catalog')}>彦根の行き先一覧を見る<span>歴史・ひこにゃん・写真・食などから探せます。</span></button>
    <button className="secondary ai-entry" onClick={beginAI}>自由入力で相談する<span>細かい希望があるときはこちら。</span></button>
    <p className="note">現在は徒歩での寄り道を中心に試作しています。時間は一部、公開情報や仮値を使っています。</p>
    {debugMode&&<DebugSummary/>}
   </section>}

   {screen==='catalog'&&<DestinationCatalog onBack={()=>setScreen('home')}/>}

   {screen==='ai'&&<HikoneAI answers={answers} history={history} onBack={()=>setScreen('home')} onResolved={(a,r,intro,source)=>{
     setAnswers(a);setRecs(r);setResearch(debugMode?researchCandidates(a):[]);setAiIntro(intro);setAiSource(source);setScreen('results');
   }}/>}

   {screen==='questions'&&<Questionnaire step={step} setStep={setStep} answers={answers} setAnswers={setAnswers} onDone={()=>{track('questionnaire_completed');run(answers)}}/>}

   {screen==='results'&&<section>
    <p className="eyebrow">今から行けるところ</p>
    <h2>{recs.length?'このあたりがおすすめです':'今の条件では、寄り道なしが安心です'}</h2>
    {aiIntro&&<div className="ai-summary"><span className="pill">{aiSource==='ai'?'Hikone AI':'自動判定'}</span><p>{aiIntro}</p></div>}
    <div className="route-context"><b>{shortName(currentName)}</b><span>→</span><b>{shortName(finalName)}</b><small>残り {answers.remainingTimeMin}分</small></div>
    {answers.interestTagIds.length>0&&<div className="selected-tags">{friendlySelectedTags(answers.interestTagIds).map(t=><span key={t}>{t}</span>)}</div>}
    {!recs.length&&<div className="strict-empty"><b>今回は無理に寄り道をおすすめしません。</b><p>残り時間を増やすか、興味を変えると候補が出ることがあります。</p></div>}
    <div className="cards">{recs.map(r=><div key={r.id} className="result-card">
      <button className="exp-card strategy-card" onClick={()=>selectRec(r)}>
        <div className="strategy-head"><span className="pill">{r.matchingTags.length?'あなた向け':'ちょっと発見'}</span><span className="detour-badge">+{r.detourMinutes}分</span></div>
        <h3>{friendlyNodeName(r.nodeName)}</h3>
        <p className="experience-line">{friendlyAction(r.actionName)}</p>
        {r.matchingTags.length>0&&<p className="match-line">{r.matchingTags.join('・')}</p>}
        <p className="reason">{friendlyReason(r)}</p>
        <small>{shortName(finalName)}まで含めて 約{r.viaRouteMinutes}分{r.additionalDistanceM!==null?' / 追加約'+r.additionalDistanceM+'m':''}</small>
      </button>
      <a className="result-map-link" href={googleMapsDirectionsUrl(currentName,r.nodeName,finalName)} target="_blank" rel="noopener noreferrer" onClick={()=>track('navigation_clicked',{id:r.actionId,from:'results'})}>
        Google Mapsで経路を見る ↗
      </a>
    </div>)}</div>
    {debugMode&&<DebugResults recs={recs} research={research}/>}
    <button className="secondary" onClick={()=>setScreen('catalog')}>ほかの彦根の行き先も見る</button>
    <button className="secondary" onClick={beginQuestions}>条件を変える</button>
   </section>}

   {screen==='detail'&&selected&&<section>
    <p className="eyebrow">寄り道プラン</p>
    <div className="detail-detour">+{selected.detourMinutes}分</div>
    <h2>{friendlyNodeName(selected.nodeName)}</h2>
    <p>{friendlyReason(selected)}</p>
    <div className="mission"><small>ここですること</small><br/><b>{friendlyAction(selected.actionName)}</b></div>
    <MapEmbed placeName={selected.nodeName}/>
    <a className="result-map-link detail-map-link" href={googleMapsDirectionsUrl(currentName,selected.nodeName,finalName)} target="_blank" rel="noopener noreferrer" onClick={()=>track('navigation_clicked',{id:selected.actionId,from:'detail'})}>Google Mapsで経路を見る ↗</a>
    <div className="breakdown">
      <div><b>{shortName(finalName)}へ直行</b><span>約{selected.originalRouteMinutes}分</span></div>
      <div><b>この寄り道をする</b><span>約{selected.viaRouteMinutes}分</span></div>
      {selected.additionalDistanceM!==null&&<div><b>追加で歩く距離</b><span>約{selected.additionalDistanceM}m</span></div>}
    </div>
    <p className="route-result">帰る場所はそのまま。寄り道で <b>+{selected.detourMinutes}分</b> です。</p>
    <p className="note">所要時間は目安です。現地の状況により変わることがあります。</p>
    {debugMode&&<div className="debug-box"><b>Debug</b><p>{selected.dataStatus}</p><p>ID: {selected.id} / Layer: {selected.layer}</p></div>}
    <button className="primary" onClick={beginExperience}>ここに寄る</button>
    <button className="link" onClick={()=>setScreen('results')}>別の候補を見る</button>
   </section>}

   {screen==='go'&&selected&&<section className="center">
    <p className="eyebrow">寄り道スタート</p>
    <h1>いってらっしゃい。</h1>
    <p>「{friendlyNodeName(selected.nodeName)}」で、<br/><b>{friendlyAction(selected.actionName)}</b></p>
    <div className="time-big">+{selected.detourMinutes}分</div>
    <MapEmbed placeName={selected.nodeName}/>
    <a className="secondary anchor map-open" href={googleMapsDirectionsUrl(currentName,selected.nodeName,finalName)} target="_blank" rel="noopener noreferrer" onClick={()=>track('navigation_clicked',{id:selected.actionId,from:'go'})}>Google Mapsで経路案内を開く ↗</a>
    <div className="checkpoint-box"><b>寄り道できたら</b><p>戻って「行ってきた」を押してください。寄り道の記録が残ります。</p></div>
    <button className="primary" onClick={()=>markCompleted(true)}>行ってきた</button>
    <button className="link" onClick={()=>markCompleted(false)}>今回は行かなかった</button>
   </section>}

   {screen==='done'&&selected&&<section className="center">
    <p className="eyebrow">おかえりなさい</p>
    <h2>彦根を、ひとつ足せました。</h2>
    <div className="validation">
      <p>このおすすめは役に立ちましたか？</p>
      <Choice value={helpful} setValue={setHelpful} options={[['great','とても役立った'],['okay','まあ役立った'],['not','あまり役立たなかった']]}/>
      <p>この提案がなければ、ここに行っていましたか？</p>
      <Choice value={counter} setValue={setCounter} options={[['no','行かなかったと思う'],['probablyNo','たぶん行かなかった'],['yes','行ったと思う']]}/>
    </div>
    <button className="primary" onClick={()=>{const h=addValidation(selected.actionId,helpful,counter);setHistory(h);run(answers,h)}}>まだ時間があるので、もう一つ見る</button>
    <button className="secondary" onClick={()=>{setHistory(addValidation(selected.actionId,helpful,counter));setScreen('home')}}>今日はここまで</button>
   </section>}

   {screen==='history'&&<section><p className="eyebrow">これまでの彦根</p><h2>寄り道の記録</h2><p>この端末で寄り道した記録を保存しています。</p><button className="link" onClick={()=>setScreen('home')}>戻る</button></section>}
  </main>
  <nav><button onClick={()=>setScreen('home')}>ホーム</button><button onClick={beginQuestions}>寄り道を探す</button><button onClick={()=>setScreen('history')}>履歴</button></nav>
 </div>
}

function Questionnaire({step,setStep,answers,setAnswers,onDone}:{step:number;setStep:(n:number)=>void;answers:Answers;setAnswers:(a:Answers)=>void;onDone:()=>void}){
 const locs=nodeOptions.map(n=>[n.id,shortName(n.name)]);
 const qs=[
  {q:'今どこにいますか？',body:<Choice value={answers.currentNodeId} setValue={v=>setAnswers({...answers,currentNodeId:String(v)})} options={locs}/>},
  {q:'最後にどこへ行きますか？',body:<Choice value={answers.finalNodeId} setValue={v=>setAnswers({...answers,finalNodeId:String(v)})} options={locs}/>},
  {q:'あとどのくらい時間がありますか？',body:<Choice value={answers.remainingTimeMin} setValue={v=>setAnswers({...answers,remainingTimeMin:Number(v)})} options={[[20,'20分'],[35,'35分'],[60,'60分'],[90,'90分以上']]}/>},
  {q:'今、何がしたいですか？',body:<InterestChoices values={answers.interestTagIds} setValues={v=>setAnswers({...answers,interestTagIds:v})}/>},
  {q:'寄り道はどのくらいならOK？',body:<Choice value={answers.detourPreference} setValue={v=>{const x=String(v) as Answers['detourPreference'];setAnswers({...answers,detourPreference:x,discoveryOptIn:x!=='最短'})}} options={[['最短','なるべく寄り道しない'],['少しなら','少しならOK'],['積極','せっかくなので寄りたい']]}/>}
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
 if(r.matchingTags.length) return `${r.matchingTags.join('・')}が気になるなら、今の予定に+${r.detourMinutes}分で入れられます。`;
 return `帰る方向を大きく変えず、+${r.detourMinutes}分で少し違う彦根を見られます。`;
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

function DebugSummary(){return <div className="debug-box"><b>開発用情報</b><div className="db-kpis"><div><b>{dbStats.nodeCount}</b><span>NODE</span></div><div><b>{dbStats.provisionalUsableEdgeCount}</b><span>EDGE</span></div><div><b>{knownActionCount}</b><span>ACTION</span></div><div><b>{researchNodeCount}</b><span>RESEARCH</span></div></div></div>}

function DebugResults({recs,research}:{recs:Recommendation[];research:ResearchCandidate[]}){return <div className="debug-box"><p className="eyebrow">DEBUG</p><h3>推薦エンジン確認</h3>{recs.map(r=><div className="debug-row" key={r.id}><b>{r.id}</b><span>{r.layer} / +{r.detourMinutes}分</span><p>{r.dataStatus}</p></div>)}<ResearchList items={research}/></div>}

function ResearchList({items}:{items:ResearchCandidate[]}){if(!items.length)return null;return <div className="research-panel"><h3>調査中候補</h3>{items.map(x=><div className="research-item" key={x.nodeId}><div><b>{x.nodeName}</b>{x.priority&&<span className="pill">PHOTO {x.priority}</span>}</div><small>{x.category} / {x.status}</small>{x.matchingTags.length>0&&<p>一致：{x.matchingTags.join('・')}</p>}<p className="blockers">不足：{x.blockers.join(' / ')}</p></div>)}</div>}
