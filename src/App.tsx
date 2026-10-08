import { useEffect, useMemo, useState } from 'react';
import { DB_V4_META, actions, nodeById, tagNames } from './data/dbV4';
import { Answers, HistoryState, Recommendation, ResearchCandidate } from './types';
import { addValidation, completeExperience, lastCompletedId, loadHistory, startExperience } from './lib/history';
import { dbStats, knownActionCount, nodeOptions, recommend, researchCandidates, researchNodeCount } from './lib/recommend';
import { track } from './lib/analytics';
import QrScanner from './QrScanner';
import HikoneAI from './HikoneAI';

type Screen='home'|'ai'|'questions'|'results'|'detail'|'go'|'scan'|'return'|'done'|'history';
const defaultAnswers:Answers={currentNodeId:'S01',finalNodeId:'D01',remainingTimeMin:35,interestTagIds:[],availableMode:'徒歩',maxWalkMin:null,detourPreference:'少しなら',discoveryOptIn:true,firstVisit:true};

export default function App(){
 const [history,setHistory]=useState<HistoryState|null>(()=>loadHistory());const [screen,setScreen]=useState<Screen>('home');const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<Answers>(defaultAnswers);const [recs,setRecs]=useState<Recommendation[]>([]);const [research,setResearch]=useState<ResearchCandidate[]>([]);
 const [selected,setSelected]=useState<Recommendation|null>(null);const [helpful,setHelpful]=useState<'great'|'okay'|'not'>('great');const [counter,setCounter]=useState<'no'|'probablyNo'|'yes'>('probablyNo');
 const [aiIntro,setAiIntro]=useState<string|null>(null);const [aiSource,setAiSource]=useState<'ai'|'fallback'|null>(null);
 useEffect(()=>{track('app_open');if(history)track('returning_user_detected')},[]);
 const last=useMemo(()=>actions.find(a=>a.id===lastCompletedId(history)),[history]);
 const currentName=nodeById(answers.currentNodeId)?.name||answers.currentNodeId;const finalName=nodeById(answers.finalNodeId)?.name||answers.finalNodeId;
 const run=(a=answers,h=history)=>{const r=recommend(a,h);setRecs(r);setResearch(researchCandidates(a));setAiIntro(null);setAiSource(null);setScreen('results');track('recommendation_viewed',{count:r.length,currentNodeId:a.currentNodeId,finalNodeId:a.finalNodeId})};
 const beginQuestions=()=>{setStep(0);setAiIntro(null);setAiSource(null);setAnswers(a=>({...a,firstVisit:!history}));setScreen('questions');track('questionnaire_started')};
 const beginAI=()=>{setAiIntro(null);setAiSource(null);setScreen('ai');track('hikone_ai_opened')};
 const selectRec=(r:Recommendation)=>{setSelected(r);setScreen('detail');track('recommendation_selected',{id:r.id,detourMinutes:r.detourMinutes})};
 const beginExperience=()=>{if(!selected)return;const h=startExperience({experienceId:selected.actionId,startedAt:new Date().toISOString(),completed:false},answers);setHistory(h);setScreen('go');track('experience_started',{id:selected.actionId,detourMinutes:selected.detourMinutes})};
 const markCompleted=(ok:boolean)=>{if(!selected)return;if(ok){const h=completeExperience(selected.actionId);setHistory(h);setScreen('done');track('experience_completed',{id:selected.actionId,method:'manual'})}else{setScreen('home');track('experience_not_completed',{id:selected.actionId})}};
 const qrComplete=()=>{if(!selected)return;const h=completeExperience(selected.actionId);setHistory(h);setScreen('done');track('qr_checkin_success',{id:selected.actionId});track('experience_completed',{id:selected.actionId,method:'qr'})};
 const reset=()=>{setSelected(null);setRecs([]);setResearch([]);setAiIntro(null);setScreen('home')};

 return <div className="app"><header className="top"><button className="brand" onClick={reset}>次の彦根</button><span className="demo">DB V4</span></header><main>
 {screen==='home'&&<section className="hero cardless"><p className="eyebrow">GRAPH RECOMMENDATION DB V4</p><h1>推測しない。<br/>測れた範囲で寄り道を出す。</h1>
 <p>新しい推薦DBを反映しました。地点数を増やすだけでなく、位置・EDGE・最低ACTION時間・公開条件が揃ったものだけを実運用推薦に使います。</p>
 <div className="db-kpis"><div><b>{dbStats.nodeCount}</b><span>登録NODE</span></div><div><b>{dbStats.provisionalUsableEdgeCount}</b><span>推薦に使うEDGE</span></div><div><b>{knownActionCount}</b><span>推薦に使うACTION</span></div><div><b>{researchNodeCount}</b><span>調査中NODE</span></div></div>
 {last&&<p className="muted">前回の記録：{last.type}</p>}
 <button className="primary" onClick={beginQuestions}>選択肢から探す<span>5回ほどタップするだけで候補を出します。</span></button><button className="secondary ai-entry" onClick={beginAI}>自由入力で相談する<span>細かい希望があるときだけ使えます。</span></button>
 <p className="note">現在は徒歩MVP。実測値に加え、公式・地図検索で確認できた一部経路と最低滞在時間を「仮運用」として追加しています。仮値は実証後に更新します。</p></section>}

 {screen==='ai'&&<HikoneAI answers={answers} history={history} onBack={()=>setScreen('home')} onResolved={(a,r,intro,source)=>{setAnswers(a);setRecs(r);setResearch(researchCandidates(a));setAiIntro(intro);setAiSource(source);setScreen('results')}}/>}
 {screen==='questions'&&<Questionnaire step={step} setStep={setStep} answers={answers} setAnswers={setAnswers} onDone={()=>{track('questionnaire_completed');run(answers)}}/>}

 {screen==='results'&&<section><p className="eyebrow">V4 成立判定</p><h2>{recs.length?'実運用候補として成立':'成立候補なし'}</h2>
 {aiIntro&&<div className="ai-summary"><span className="pill">{aiSource==='ai'?'Hikone AI':'ローカル解析'}</span><p>{aiIntro}</p></div>}
 <div className="route-context"><b>{currentName}</b><span>→</span><b>{finalName}</b><small>残り {answers.remainingTimeMin}分 / 徒歩</small></div>
 {answers.interestTagIds.length>0&&<div className="selected-tags">{answers.interestTagIds.map(t=><span key={t}>{tagNames[t]}</span>)}</div>}
 {!recs.length&&<div className="strict-empty"><b>無理に推薦しません。</b><p>テーマに合う地点がDBにあっても、EDGE・最低ACTION時間・位置・公開条件が不足している場合は実運用候補から外します。</p></div>}
 <div className="cards">{recs.map(r=><button key={r.id} className="exp-card strategy-card" onClick={()=>selectRec(r)}><div className="strategy-head"><span className="pill">{r.layer}</span><span className="detour-badge">+{r.detourMinutes}分</span></div>
 <h3>{r.nodeName}</h3><p className="experience-line">成立ACTION：{r.actionName}</p>{r.matchingTags.length>0&&<p>一致：{r.matchingTags.join('・')}</p>}<p className="reason">{r.reason}</p>
 <small>直行 {r.originalRouteMinutes}分 → 経由 {r.viaRouteMinutes}分{r.additionalDistanceM!==null?' / 追加約'+r.additionalDistanceM+'m':''}</small></button>)}</div>
 <ResearchList items={research}/>
 <button className="secondary" onClick={beginQuestions}>条件を変える</button></section>}

 {screen==='detail'&&selected&&<section><p className="eyebrow">V4 / {selected.layer}</p><div className="detail-detour">+{selected.detourMinutes}分</div><h2>{selected.nodeName}</h2>
 <div className="mission"><small>成立判定に使ったACTION</small><br/><b>{selected.actionName}</b></div>
 <div className="breakdown"><div><b>直行</b><span>{selected.originalRouteMinutes}分</span></div><div><b>寄り道込み</b><span>{selected.viaRouteMinutes}分</span></div>{selected.additionalDistanceM!==null&&<div><b>追加距離</b><span>約{selected.additionalDistanceM}m</span></div>}</div>
 <p>{selected.reason}</p><p className="note">{selected.dataStatus}</p><p className="note">店舗利用・写真撮影など最低時間が未実測のACTIONは、この判定には使っていません。</p>
 <button className="primary" onClick={beginExperience}>この成立ACTIONで試す</button><button className="link" onClick={()=>setScreen('results')}>戻る</button></section>}

 {screen==='go'&&selected&&<section className="center"><p className="eyebrow">実証</p><h1>いってらっしゃい。</h1><p>{selected.nodeName}で「{selected.actionName}」を確認します。</p><div className="time-big">+{selected.detourMinutes}分</div>
 <div className="checkpoint-box"><b>V4実証ポイント</b><p>到達できたか、ACTIONが実際に何分かかったかを記録すると、RESEARCH地点を将来ACTIVEへ昇格できます。</p></div>
 <button className="primary" onClick={()=>{setScreen('scan');track('qr_scanner_opened',{id:selected.actionId})}}>現地QRを読み取る</button><button className="link" onClick={()=>setScreen('return')}>QRなしで記録する</button></section>}
 {screen==='scan'&&selected&&<QrScanner experienceId={selected.actionId} experienceName={selected.actionName} onVerified={qrComplete} onCancel={()=>setScreen('go')}/>}
 {screen==='return'&&selected&&<section className="center"><h2>到達しましたか？</h2><p>{selected.nodeName}</p><button className="primary" onClick={()=>markCompleted(true)}>到達した</button><button className="secondary" onClick={()=>markCompleted(false)}>今回は到達しなかった</button></section>}
 {screen==='done'&&selected&&<section className="center"><p className="eyebrow">実証ログ</p><h2>推薦が新しい回遊を生んだか確認します。</h2><div className="validation"><p>この推薦は役に立ちましたか？</p><Choice value={helpful} setValue={setHelpful} options={[['great','とても役立った'],['okay','まあ役立った'],['not','あまり役立たなかった']]}/><p>この提案がなければ行っていましたか？</p><Choice value={counter} setValue={setCounter} options={[['no','行かなかった'],['probablyNo','たぶん行かなかった'],['yes','行ったと思う']]}/></div>
 <button className="primary" onClick={()=>{const h=addValidation(selected.actionId,helpful,counter);setHistory(h);run(answers,h)}}>もう一度候補を見る</button><button className="secondary" onClick={()=>{setHistory(addValidation(selected.actionId,helpful,counter));setScreen('home')}}>今日はここまで</button></section>}
 {screen==='history'&&<section><h2>実証履歴</h2><p>この画面では、到達したACTIONを端末内に匿名保存しています。</p><button className="link" onClick={()=>setScreen('home')}>戻る</button></section>}
 </main><nav><button onClick={()=>setScreen('home')}>ホーム</button><button onClick={beginAI}>AI相談</button><button onClick={()=>setScreen('history')}>履歴</button></nav></div>
}

function Questionnaire({step,setStep,answers,setAnswers,onDone}:{step:number;setStep:(n:number)=>void;answers:Answers;setAnswers:(a:Answers)=>void;onDone:()=>void}){
 const locs=nodeOptions.map(n=>[n.id,n.name]);
 const qs=[
  {q:'今どこにいますか？',body:<Choice value={answers.currentNodeId} setValue={v=>setAnswers({...answers,currentNodeId:String(v)})} options={locs}/>},
  {q:'最後にどこへ行きますか？',body:<Choice value={answers.finalNodeId} setValue={v=>setAnswers({...answers,finalNodeId:String(v)})} options={locs}/>},
  {q:'あと何分ありますか？',body:<Choice value={answers.remainingTimeMin} setValue={v=>setAnswers({...answers,remainingTimeMin:Number(v)})} options={[[20,'20分'],[35,'35分'],[60,'60分'],[90,'90分']]}/>},
  {q:'今、何がしたい？',body:<InterestChoices values={answers.interestTagIds} setValues={v=>setAnswers({...answers,interestTagIds:v})}/>},
  {q:'寄り道はどこまで許容しますか？',body:<Choice value={answers.detourPreference} setValue={v=>{const x=String(v) as Answers['detourPreference'];setAnswers({...answers,detourPreference:x,discoveryOptIn:x!=='最短'})}} options={[['最短','最短を優先'],['少しなら','少しなら寄り道'],['積極','積極的に発見']]}/>}
 ];
 return <section><div className="progress"><span style={{width:String(((step+1)/qs.length)*100)+'%'}}/></div><p className="eyebrow">{step+1} / {qs.length}</p><h2>{qs[step].q}</h2>{qs[step].body}<div className="actions">{step>0&&<button className="link" onClick={()=>setStep(step-1)}>戻る</button>}<button className="primary" onClick={()=>step===qs.length-1?onDone():setStep(step+1)}>{step===qs.length-1?'V4で判定':'次へ'}</button></div></section>
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
function ResearchList({items}:{items:ResearchCandidate[]}){if(!items.length)return null;return <div className="research-panel"><p className="eyebrow">DBにはあるが、まだ推薦しない候補</p><h3>調査中候補</h3><p className="muted">V4の方針どおり、不足データを補完せず理由を表示します。</p>{items.map(x=><div className="research-item" key={x.nodeId}><div><b>{x.nodeName}</b>{x.priority&&<span className="pill">PHOTO {x.priority}</span>}</div><small>{x.category} / {x.status}</small>{x.matchingTags.length>0&&<p>一致：{x.matchingTags.join('・')}</p>}<p className="blockers">不足：{x.blockers.join(' / ')}</p></div>)}</div>}
