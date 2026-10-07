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
- Hikone AIによる自然文の条件理解と候補の並べ替え
- AI APIが使えない場合のローカル条件抽出フォールバック

## Hikone AI

Hikone AIは「何でも答える観光チャットボット」ではなく、**今の状況から次にできる彦根を決めるための入口**です。

処理は次の順番です。

1. ユーザーが「あと50分、駅に戻りたい。あまり歩きたくない」のように自然文で入力
2. サーバー側のAIが時間・帰着先・興味・歩行量・予算・初回/再訪を抽出
3. 既存の `src/lib/recommend.ts` が時間・予算・歩行量のハード条件で候補を絞り込み
4. AIは**絞り込み済み候補だけ**をユーザーの言葉に合う順へ並べ替え、理由を短く説明
5. 以降は既存の「いってらっしゃい → QR → おかえり」へ接続

AIには未登録の場所を推薦させず、営業時間・価格・イベント等の未確認情報を生成させない設計です。

### AI APIの設定

`api/hikone-ai.ts` はサーバー側でOpenAI Responses APIを呼びます。APIキーをフロントエンドへ置かないでください。

```bash
cp .env.example .env.local
```

最低限、サーバー側に次を設定します。

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-6-luna
```

フロントとAPIを同一オリジンで配信する場合、`VITE_HIKONE_AI_ENDPOINT` は不要です。GitHub Pagesのような静的ホスティングから別APIを呼ぶ場合は、API URLを設定します。

```text
VITE_HIKONE_AI_ENDPOINT=https://example.com/api/hikone-ai
```

API未設定・通信失敗時も、簡易的なローカル条件抽出 + 既存推薦エンジンへ自動的にフォールバックします。

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
- `src/lib/recommend.ts` — ハード条件を守る推薦ロジック
- `src/lib/hikoneAI.ts` — AI APIクライアント / ローカルフォールバック
- `src/HikoneAI.tsx` — 自然文相談UI
- `api/hikone-ai.ts` — APIキーを隠してAIを呼ぶサーバー側エンドポイント
- `src/lib/history.ts` — localStorage履歴
- `src/lib/analytics.ts` — analytics抽象化
- `src/QrScanner.tsx` — 現地QRチェックイン
- `src/App.tsx` — 画面フロー
