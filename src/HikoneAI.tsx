import { useState } from 'react';
import { Answers, HistoryState, Recommendation } from './types';
import { recommend } from './lib/recommend';
import { applyAIPresentation, presentWithHikoneAI, understandWithHikoneAI } from './lib/hikoneAI';
import { track } from './lib/analytics';

export default function HikoneAI({answers,history,onResolved,onBack}:{answers:Answers;history:HistoryState|null;onResolved:(a:Answers,r:Recommendation[],intro:string,source:'ai'|'fallback')=>void;onBack:()=>void}){
 const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');
 const examples=['彦根城を出た。あと35分で彦根駅。街歩きなら少し寄り道したい','彦根城から駅へ。写真が撮りたい。あと60分','彦根城から駅まで。ひこにゃん関連を見たい'];
 const submit=async()=>{const text=message.trim();if(!text||busy)return;setBusy(true);track('hikone_ai_started');setStatus('希望に合う寄り道を探しています…');
 try{
  const understood=await understandWithHikoneAI(text);const merged:Answers={...answers,...understood.answers,interestTagIds:understood.answers.interestTagIds??answers.interestTagIds};
  setStatus('時間に合う場所を確認しています…');const base=recommend(merged,history);
  if(!base.length){onResolved(merged,[],'今の条件では寄り道候補が見つかりませんでした。時間や行き先を変えてみてください。',understood.source);return}
  setStatus('おすすめを準備しています…');const presentation=await presentWithHikoneAI(text,merged,base);const final=applyAIPresentation(base,presentation);
  const source=understood.source==='ai'&&presentation.source==='ai'?'ai':'fallback';track('hikone_ai_completed',{source,count:final.length});onResolved(merged,final,presentation.intro,source);
 }finally{setBusy(false)}};
 return <section className="ai-panel"><p className="eyebrow">彦根の寄り道相談</p><h2>今の気分を教えてください。</h2>
 <p>今いる場所、帰る場所、残り時間、やってみたいことを自由に書いてください。</p>
 <textarea className="ai-input" value={message} onChange={e=>setMessage(e.target.value)} rows={6} placeholder="例：彦根城を出た。あと35分で彦根駅。街歩きなら少し寄り道したい" disabled={busy}/>
 <div className="ai-examples"><span>入力例</span>{examples.map(x=><button key={x} onClick={()=>setMessage(x)} disabled={busy}>{x}</button>)}</div>
 {status&&<p className="ai-status">{status}</p>}<button className="primary" onClick={submit} disabled={!message.trim()||busy}>{busy?'探しています…':'寄り道を探す'}</button>
 <button className="link" onClick={onBack}>戻る</button></section>;
}
