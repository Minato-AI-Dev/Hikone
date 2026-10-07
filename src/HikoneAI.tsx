import { useState } from 'react';
import { experiences } from './data/experiences';
import { HistoryState, Answers, Recommendation } from './types';
import { recommend } from './lib/recommend';
import {
  applyAIRanking,
  rankWithHikoneAI,
  understandWithHikoneAI,
} from './lib/hikoneAI';
import { track } from './lib/analytics';

export default function HikoneAI({
  answers,
  history,
  onResolved,
  onBack,
}: {
  answers: Answers;
  history: HistoryState | null;
  onResolved: (answers: Answers, recommendations: Recommendation[], intro: string, source: 'ai' | 'fallback') => void;
  onBack: () => void;
}) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const examples = [
    'あと45分。彦根駅に戻りたい。あまり歩かず歴史を見たい',
    '1時間くらい。甘いものか買い物。予算は1000円くらい',
    '前にも来た。今日は観光地っぽくない彦根を歩きたい',
  ];

  const submit = async () => {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setStatus('話を読み取っています…');
    track('hikone_ai_started');

    try {
      const understood = await understandWithHikoneAI(text);
      const merged: Answers = {
        ...answers,
        ...understood.answers,
        interests: understood.answers.interests?.length ? understood.answers.interests : answers.interests,
      };

      setStatus('時間と条件に合う候補を確認しています…');
      const deterministic = recommend(experiences, merged, history, 'normal');

      if (!deterministic.length) {
        onResolved(merged, [], '条件に合う候補が見つかりませんでした。時間・予算・歩く量を少し広げてください。', understood.source);
        return;
      }

      setStatus('候補の中から、今のあなたに合う順を考えています…');
      const ranked = await rankWithHikoneAI(text, merged, deterministic);
      const finalRecommendations = applyAIRanking(deterministic, ranked);
      const source = understood.source === 'ai' && ranked.source === 'ai' ? 'ai' : 'fallback';

      track('hikone_ai_completed', {
        source,
        count: finalRecommendations.length,
      });
      onResolved(merged, finalRecommendations, ranked.intro || understood.message, source);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ai-panel">
      <p className="eyebrow">HIKONE AI</p>
      <h2>今の状況を、そのまま話してください。</h2>
      <p>
        「あと何分」「どこへ戻る」「何が気になる」「どれくらい歩ける」など、
        分かる範囲だけで大丈夫です。
      </p>

      <textarea
        className="ai-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="例：彦根城を見終わった。あと50分で駅に戻りたい。夫婦で、あまり歩きたくない。歴史か甘いものが気になる。"
        rows={6}
        disabled={busy}
      />

      <div className="ai-examples">
        <span>入力例</span>
        {examples.map((example) => (
          <button key={example} type="button" onClick={() => setMessage(example)} disabled={busy}>
            {example}
          </button>
        ))}
      </div>

      {status && <p className="ai-status">{status}</p>}

      <button className="primary" onClick={submit} disabled={!message.trim() || busy}>
        {busy ? '考えています…' : 'Hikone AIに相談する'}
      </button>
      <button className="link" onClick={onBack} disabled={busy}>戻る</button>

      <p className="note">
        Hikone AIは、登録済みの候補から提案します。営業時間・価格など、登録されていない事実は生成しません。
      </p>
    </section>
  );
}
