import { useState } from 'react';
import { Answers, HistoryState, Recommendation } from './types';
import { recommend } from './lib/recommend';
import { applyAIPresentation, presentWithHikoneAI, understandWithHikoneAI } from './lib/hikoneAI';
import { track } from './lib/analytics';

export default function HikoneAI({answers,history,onResolved,onBack}:{answers:Answers;history:HistoryState|null;onResolved:(a:Answers,r:Recommendation[],intro:string,source:'ai'|'fallback')=>void;onBack:()=>void}){
 const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');
 const examples=['彦根城を出た。あと35分で彦根駅。街歩きなら少し寄り道したい','彦根城から駅へ。写真が撮りたい。あと60分','彦根城から駅まで。ひこにゃん関連を見たい'];
 const submit=async()=>{const text=message.trim();if(!text||busy)return;setBusy(true);track('hikone_ai_started');setStatus('V4の入力項目に変換しています…');
 try{
  const understood=await understandWithHikoneAI(text);const merged:Answers={...answers,...understood.answers,interestTagIds:understood.answers.interestTagIds??answers.interestTagIds};
  setStatus('EDGEと最低ACTION時間を使って成立判定しています…');const base=recommend(merged,history);
  if(!base.length){onResolved(merged,[],'V4のハード制約では成立する実運用候補がありません。調査中候補と不足データを確認できます。',understood.source);return}
  setStatus('成立候補の説明を整えています…');const presentation=await presentWithHikoneAI(text,merged,base);const final=applyAIPresentation(base,presentation);
  const source=understood.source==='ai'&&presentation.source==='ai'?'ai':'fallback';track('hikone_ai_completed',{source,count:final.length});onResolved(merged,final,presentation.intro,source);
 }finally{setBusy(false)}};
 return <section className="ai-panel"><p className="eyebrow">HIKONE AI / DB V4</p><h2>予定を壊さず、生成に使えるデータだけで考えます。</h2>
 <p>現在地・最終目的地・残り時間・興味をそのまま入力してください。未実測のEDGEやACTION時間は推測しません。</p>
 <textarea className="ai-input" value={message} onChange={e=>setMessage(e.target.value)} rows={6} placeholder="例：彦根城を出た。あと35分で彦根駅。街歩きなら少し寄り道したい" disabled={busy}/>
 <div className="ai-examples"><span>入力例</span>{examples.map(x=><button key={x} onClick={()=>setMessage(x)} disabled={busy}>{x}</button>)}</div>
 {status&&<p className="ai-status">{status}</p>}<button className="primary" onClick={submit} disabled={!message.trim()||busy}>{busy?'判定中…':'V4データで相談する'}</button>
 <button className="link" onClick={onBack}>戻る</button><p className="note">GitHub Pages版ではAI API未接続時にローカル解析へフォールバックします。推薦判定自体は同じV4ルールです。</p></section>;
}
