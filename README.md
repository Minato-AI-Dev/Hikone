# 次の彦根 — Hikone Tourism MVP

「今のあなたにできる彦根を選ぶ。一度きりで終わらず、次に来たときはその続きから。」を検証する、モバイルファーストのReact + TypeScript MVPです。

## MVPで実装していること
- 20〜30秒程度の段階式質問
- 残り時間 / 帰着先 / 興味 / 歩行量 / 予算での決定論的フィルタ・スコアリング
- 最大3件までの推薦
- 推薦理由と移動・体験・帰着・余裕時間の内訳
- 「いってらっしゃい → 現地QRチェックイン → おかえり」フロー
- 現地QRコードのカメラ読み取りと、カメラが使えない場合の確認コード入力
- localStorageによる匿名履歴保存
- 前回の続き / 違う彦根 のランキング切り替え
- 簡易バリデーション質問とanalytics抽象化
- 「これまでに見た彦根」履歴画面

## 現地QRコードの作り方
各地点に置くQRコードには、体験データの `id` を使って次の形式を入れます。

```text
hikone://checkin/<experienceId>
```

例：足軽屋敷を歩く

```text
hikone://checkin/ashigaru-walk
```

アプリは以下の3形式を受け付けます。

```text
ashigaru-walk
hikone://checkin/ashigaru-walk
https://example.com/?checkin=ashigaru-walk
```

実証用の掲示物では、QRコードの下に `experienceId` も文字で併記しておくと、カメラ権限が使えない端末でも手入力で確認できます。

現在の `experienceId` は `src/data/experiences.ts` の各 `id` を使用してください。別地点のQRを読み取った場合は訪問完了になりません。

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
- `src/QrScanner.tsx` — 現地QRチェックイン
- `src/App.tsx` — 画面フロー
