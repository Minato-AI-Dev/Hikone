import { Answers, Recommendation } from '../types';

export type AIBackendSource = 'ai' | 'fallback';

export type AIUnderstandResult = {
  answers: Partial<Answers>;
  message: string;
  source: AIBackendSource;
};

export type AIRankResult = {
  orderedIds: string[];
  reasons: Record<string, string>;
  intro: string;
  source: AIBackendSource;
};

const endpoint = import.meta.env.VITE_HIKONE_AI_ENDPOINT || '/api/hikone-ai';

async function postJson<T>(body: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Hikone AI API error: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function understandWithHikoneAI(message: string): Promise<AIUnderstandResult> {
  try {
    const result = await postJson<{ answers: Partial<Answers>; message: string }>({
      mode: 'extract',
      message,
    });
    return { ...result, source: 'ai' };
  } catch {
    return {
      answers: inferAnswersLocally(message),
      message: '読み取れた条件で候補を絞ります。足りない条件は、現在の設定を使います。',
      source: 'fallback',
    };
  }
}

export async function rankWithHikoneAI(
  message: string,
  answers: Answers,
  recommendations: Recommendation[],
): Promise<AIRankResult> {
  const candidates = recommendations.map((r) => ({
    id: r.experience.id,
    name: r.experience.name,
    description: r.experience.shortDescription,
    area: r.experience.area,
    category: r.experience.category,
    theme: r.experience.theme,
    totalMinutes: r.totalMinutes,
    walkingLevel: r.experience.walkingLevel,
    budgetMin: r.experience.budgetMin,
    budgetMax: r.experience.budgetMax,
  }));

  try {
    const result = await postJson<{
      orderedIds: string[];
      reasons: Record<string, string>;
      intro: string;
    }>({
      mode: 'rank',
      message,
      answers,
      candidates,
    });
    return { ...result, source: 'ai' };
  } catch {
    return {
      orderedIds: recommendations.map((r) => r.experience.id),
      reasons: Object.fromEntries(recommendations.map((r) => [r.experience.id, r.reason])),
      intro: '今の条件で、無理なく行ける候補に絞りました。',
      source: 'fallback',
    };
  }
}

export function applyAIRanking(recommendations: Recommendation[], ranking: AIRankResult): Recommendation[] {
  const order = new Map(ranking.orderedIds.map((id, index) => [id, index]));
  return recommendations
    .map((r) => ({
      ...r,
      reason: ranking.reasons[r.experience.id] || r.reason,
    }))
    .sort((a, b) => (order.get(a.experience.id) ?? 999) - (order.get(b.experience.id) ?? 999));
}

function inferAnswersLocally(text: string): Partial<Answers> {
  const answers: Partial<Answers> = {};
  const normalized = text.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

  const minutes = normalized.match(/(?:あと|残り)?\s*(\d{1,3})\s*分/);
  const hours = normalized.match(/(?:あと|残り)?\s*(\d(?:\.5)?)\s*時間/);
  if (minutes) answers.time = Number(minutes[1]);
  else if (/1\s*時間\s*半/.test(normalized)) answers.time = 90;
  else if (hours) answers.time = Math.round(Number(hours[1]) * 60);

  if (/彦根駅|駅に戻|駅まで/.test(normalized)) answers.returnTo = '彦根駅';
  else if (/京橋口/.test(normalized)) answers.returnTo = '京橋口駐車場';
  else if (/二の丸/.test(normalized)) answers.returnTo = '二の丸駐車場';
  else if (/彦根城|城周辺|城に戻/.test(normalized)) answers.returnTo = '彦根城周辺';

  const interests: string[] = [];
  const interestMap: Array<[RegExp, string]> = [
    [/歴史|史跡|城下町/, '歴史'],
    [/街歩き|散歩|歩いて|路地/, '街歩き'],
    [/食|ごはん|ランチ|甘い|スイーツ|カフェ/, '食'],
    [/買い物|土産|おみやげ/, '買い物'],
    [/景色|写真|庭園|琵琶湖/, '景色'],
    [/地元|ローカル|暮らし|観光地っぽくない/, '地元らしさ'],
    [/おまかせ|任せる|なんでも/, 'おまかせ'],
  ];
  for (const [pattern, value] of interestMap) if (pattern.test(normalized)) interests.push(value);
  if (interests.length) answers.interests = [...new Set(interests)];

  if (/歩きたくない|あまり歩|疲れ|足が痛|短め/.test(normalized)) answers.walking = 'low';
  else if (/たくさん歩|しっかり歩|歩くのが好き|長く歩/.test(normalized)) answers.walking = 'high';
  else if (/普通くらい|ほどほど|少し歩/.test(normalized)) answers.walking = 'medium';

  if (/無料|お金をかけたくない/.test(normalized)) answers.budget = 0;
  else {
    const budget = normalized.match(/(?:予算|以内|まで)[^\d]{0,5}(\d{3,5})\s*円|([1-9]\d{2,4})\s*円(?:以内|まで)/);
    const value = budget?.[1] || budget?.[2];
    if (value) answers.budget = Number(value);
  }

  if (/初めて|初訪問|初回/.test(normalized)) answers.firstVisit = true;
  else if (/前にも|来たこと|再訪|何度目|リピーター/.test(normalized)) answers.firstVisit = false;

  return answers;
}
