import { useState } from 'react';
import { Answers, HistoryState, Recommendation } from './types';
import { recommend } from './lib/recommend';
import { applyAIPresentation, presentWithHikoneAI, understandWithHikoneAI } from './lib/hikoneAI';
import { track } from './lib/analytics';

export default function HikoneAI({
  answers,history,onResolved,onBack,
}:{
  answers:Answers;
  history:HistoryState|null;
  onResolved:(answers:Answers,recommendations:Recommendation[],intro:string,source:'ai'|'fallback')=>void;
  onBack:()=>void;
}){
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');

  const examples=[
    '今、彦根城を見終わった。あと45分で彦根駅へ戻りたい。ひこにゃんが好き。',
    '四番町にいる。駅まで30分。あまり歩かず、何か食べたい。',
    '彦根城から駅へ。1時間ある。写真を撮りながら観光地っぽくない所も見たい。',
  ];

  const submit=async()=>{
    const text=message.trim();
    if(!text||busy) return;
    setBusy(true);
    setStatus('出発地・目的地・残り時間を読み取っています…');
    track('hikone_ai_started');
    try{
      const understood=await understandWithHikoneAI(text);
      const merged:Answers={
        ...answers,
        ...understood.answers,
        interests:understood.answers.interests?.length?understood.answers.interests:answers.interests,
      };

      setStatus('元のルートを保てる寄り道だけを計算しています…');
      const deterministic=recommend(merged,history);
      if(!deterministic.length){
        onResolved(merged,[],'今の条件では、安全に入れられる寄り道が見つかりませんでした。残り時間か歩く量を広げてください。',understood.source);
        return;
      }

      setStatus('3つの寄り道を、分かりやすい言葉に整えています…');
      const presentation=await presentWithHikoneAI(text,merged,deterministic);
      const finalRecommendations=applyAIPresentation(deterministic,presentation);
      const source=understood.source==='ai'&&presentation.source==='ai'?'ai':'fallback';
      track('hikone_ai_completed',{source,count:finalRecommendations.length});
      onResolved(merged,finalRecommendations,presentation.intro||understood.message,source);
    }finally{
      setBusy(false);
    }
  };

  return <section className="ai-panel">
    <p className="eyebrow">HIKONE AI</p>
    <h2>行き先は変えずに、寄り道を考えます。</h2>
    <p>今いる場所、最後に行く場所、残り時間、気になることを分かる範囲で話してください。</p>
    <textarea className="ai-input" value={message} onChange={e=>setMessage(e.target.value)}
      placeholder="例：彦根城を見終わった。あと40分で彦根駅に戻りたい。ひこにゃんが好き。"
      rows={6} disabled={busy}/>
    <div className="ai-examples"><span>入力例</span>{examples.map(example=>
      <button key={example} type="button" onClick={()=>setMessage(example)} disabled={busy}>{example}</button>
    )}</div>
    {status&&<p className="ai-status">{status}</p>}
    <button className="primary" onClick={submit} disabled={!message.trim()||busy}>{busy?'計算しています…':'寄り道を相談する'}</button>
    <button className="link" onClick={onBack} disabled={busy}>戻る</button>
    <p className="note">移動時間・実現可能性はAIではなく構造化データと決定ロジックで判定します。現在のルートデータはMVP用サンプルです。</p>
  </section>;
}
