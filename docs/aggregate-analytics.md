# 任意同意による匿名イベント件数集計

## 仕組み
- 利用者が「実証調査に協力する」をONにしている間だけ、許可済みのイベント名を `POST /api/analytics-collect` に送信します。
- サーバーは日本時間で日別の**件数**をUpstash/Vercel KVに加算します。個別のイベント時刻、行き先ID、自由入力、GPS、ユーザーIDは保存しません。
- 同意OFF後、新たなイベントは送信せず、端末内の調査CSVログは削除します。すでに加算した匿名件数は個人と紐付けないため個別削除できません。
- インフラ事業者の通信ログは別途存在する場合があります。またレート制限用のIPハッシュは短時間保持されます。
- 開発者の管理用API `GET /api/analytics-report?day=YYYY-MM-DD` は秘密のBearerトークン必須です。JSONで各イベントの当日件数を返します。

## 必須設定
- Vercelサーバー環境: `HIKONE_ALLOWED_ORIGIN`, `HIKONE_RATE_LIMIT_SALT`, `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`（または `KV_REST_API_URL` / `KV_REST_API_TOKEN`）
- Vercelサーバー環境: `HIKONE_ANALYTICS_ADMIN_TOKEN` = ランダムな32文字以上の秘密文字列
- GitHub Pagesビルド環境: `VITE_ANALYTICS_COLLECT_ENDPOINT=https://<APIドメイン>/api/analytics-collect`
- URLと秘密値をコードや公開リポジトリに保存しない。環境設定を変更したら再デプロイする。

## 管理者向け取得例
```bash
curl -H "Authorization: Bearer $HIKONE_ANALYTICS_ADMIN_TOKEN" \
  "https://YOUR-API.example/api/analytics-report?day=2026-10-27"
```

## 解釈上の制約
- 日別イベント**件数**は人数ではありません。同一人物の複数利用が含まれます。
- `experience_completed` は利用者の自己申告で、GPSで確認された訪問ではありません。
- イベント間の個人別ファネルは計算できません。日別の表示数・選択数・完了数の比率はあくまでイベント比です。
- ネットワーク障害時の再送・確実な到達保証はありません。
- 公開エンドポイントへの不正なイベント投稿を完全には防げません。レート制限を入れていますが、この数値だけで厳密な因果効果を主張しないでください。
- エンドポイント未設定時は端末内のログのみ利用可能です。
- テスト環境で同意ON/OFF、非同意時の無送信、件数集計、集計APIの認証、インフラログ方針を確認してから本番公開してください。

## 開発者専用ダッシュボード
- `https://<Vercel APIドメイン>/api/analytics-dashboard` にアクセスするとグラフ画面が表示されます。
- トークン欄に `HIKONE_ANALYTICS_ADMIN_TOKEN` の値を入力し、基準日を指定して「直近7日間を読み込む」を押します。
- 表示は7日間の合計、推薦表示・選択・自己申告完了の棒グラフ、日別一覧、CSV出力です。
- HTML画面は認証不要で閲覧できますが、データ取得はBearer認証が必要です。
- トークンをURL、ローカルストレージ、Cookieには保存しません。ページのメモリに限り保持します。
- レポートAPIを同じVercelドメインで呼び出す設計のため、GitHub Pages側のAPIキーやCORS変更は不要です。
- セキュリティヘッダーを設定し、画面には集計値のみに限定した静的コンテンツを使用します。
- 日別件数の閲覧APIを7回呼ぶため、RedisのGETを最大126件実行します。アクセスは管理者用途に限定してください。

## 本番データを汚さない実接続テスト
- Previewに限り `HIKONE_ANALYTICS_TEST_RUN=test-<一意な実行ID>` を設定します（小文字英数字・ハイフン、`test-` の後は8〜64文字）。
- Previewの集計は必ずこの設定が必要です。未設定・不正値では503になり、本番キーにフォールバックしません。
- Productionにはこの変数を設定しません。誤設定した場合も503となり、テスト用の削除操作は許可されません。
- Previewには本番とは別の管理トークンを設定してください。本番の秘密値をコピー・上書きしないでください。
- 保存先は `hikone:aggregate:test:v1:<実行ID>:<日本時間の日付>:<イベント名>` です。本番の `hikone:aggregate:v1:` と分離します。
- 集計イベントのテストキーは加算の際に24時間のTTLを設定します。テスト用レート制限キーも本番と分離され、既存の短期TTLで自動削除されます。
- Previewの同じダッシュボードには「テスト専用」を表示します。レポートJSONにも `testRun` が含まれます。
- `scripts/verify-analytics-preview.mjs` を実行すると、テスト環境確認→有効イベント3件送信→日別取得→テスト件数の削除→ゼロ件確認を行います。
- スクリプトの入力は環境変数 `HIKONE_ANALYTICS_TEST_BASE_URL`、`HIKONE_ANALYTICS_TEST_RUN`、`HIKONE_ANALYTICS_ADMIN_TOKEN`、`HIKONE_ALLOWED_ORIGIN` です。保護されたPreviewでは別途 `VERCEL_AUTOMATION_BYPASS_SECRET` が必要です。トークンをURLやログに出力しません。
- 削除は認証付き `DELETE /api/analytics-report?day=YYYY-MM-DD` で、そのPreviewに設定された実行ID・指定日の許可済み18イベントキーだけを対象にします。キー名・名前空間はリクエストから指定できません。Productionでは405です。
- スクリプトは成功・失敗のどちらでも削除を試みます。失敗した場合は報告し、24時間のTTLも最終的な回収手段になります。別の利用者と同じ実行IDを共有せず、並列実行しないでください。
