# 次の彦根 — Hikone Tourism MVP

「今のあなたにできる彦根を選ぶ。一度きりで終わらず、次に来たときはその続きから。」を検証する、モバイルファーストのReact + TypeScript MVPです。

## MVPで実装していること
- 20〜30秒程度の段階式質問
- 残り時間 / 帰着先 / 興味 / 歩行量 / 予算での決定論的フィルタ・スコアリング
- 最大3件までの推薦
- 推薦理由と移動・体験・帰着・余裕時間の内訳
- 「いってらっしゃい → おかえり → おかえりなさい」フロー
- localStorageによる匿名履歴保存
- 前回の続き / 違う彦根 のランキング切り替え
- 簡易バリデーション質問とanalytics抽象化
- 「これまでに見た彦根」履歴画面

## 重要
観光体験データはMVP用サンプルです。個別店舗の営業時間・確定価格などは断定していません。実運用前に検証済みデータへ差し替えてください。

## 起動
```bash
npm install
npm run dev
```

## ビルド
```bash
npm run build
```

## 構成
- `src/data/experiences.ts` — 差し替えやすい体験データ
- `src/lib/recommend.ts` — 推薦ロジック
- `src/lib/history.ts` — localStorage履歴
- `src/lib/analytics.ts` — analytics抽象化
- `src/App.tsx` — 画面フロー
