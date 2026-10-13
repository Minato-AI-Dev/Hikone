# 徒歩経路APIの公開・検証手順

## 構成と公開順序

公開画面はGitHub Pages、APIはVercel Functions、徒歩経路はGoogle Routes APIのCompute Routesを利用する。`vercel.json`はAPI用の最小静的出力を作り、React画面をVercelへ移さない。

この変更はPR #19のブランチを基にした依存変更。先に#19の内容を取り込むこと。mainへマージする前に、以下のクラウド設定とPreviewでの実経路検証を完了する。単体テストの成功は本番接続の成功を意味しない。

## 1. Google Cloud

1. 既存のプロジェクトを選ぶ。新しいプロジェクトを重複作成しない。
2. 請求先アカウントとの紐付けを確認し、APIとサービス → ライブラリ → Routes APIを有効化する。
3. APIとサービス → 認証情報で専用キー `Hikone-Routes-Server` を作る。API制限を「Routes API」のみにする。
4. サーバーから呼ぶため、ウェブサイトのHTTPリファラー制限は使わない。Vercelの通常構成が固定IPを持つと仮定しない。
5. IP制限が必要ならVercelのStatic IPsまたはSecure Computeが利用可能かアカウントで確認する。公式情報ではStatic IPsはPro/Enterprise向け、Secure ComputeはEnterprise向け。費用・リージョン・実際の出口IPを確認してからGoogleキーに設定する。使えない場合、アプリケーション制限が不足することを運営者が認識し、API制限・共有制限・Googleクォータ・キー監視/ローテーションで補う。
6. Routes API → クォータとシステム上限でCompute Routesの許容呼出し数を実証人数に合わせて低く設定する。利用可能なクォータ単位はコンソールで確認する。
7. お支払い → 予算とアラートで予算、50/80/100%等の通知先を設定する。予算通知は自動的な課金停止ではない。

キーをソース、GitHub Actions、`VITE_`環境変数へ入れない。漏えい時は即時無効化し再発行する。

公式資料: [セキュリティ](https://developers.google.com/maps/api-security-best-practices)、[課金・クォータ](https://developers.google.com/maps/documentation/routes/usage-and-billing)、[Vercel Static IPs](https://vercel.com/docs/networking/static-ips)。

## 2. 共有レート制限ストア

Upstash Redisを1個用意し、REST URLと書込可能トークンを取得する。アプリはHTTP経由でLua EVALを使い、IPと全体の予算を原子的に予約する。既存の互換ストアがあれば再利用する。読み取り専用トークンは利用できない。

サーバー設定:

```env
UPSTASH_REDIS_REST_URL=https://<実際のRedisエンドポイント>
UPSTASH_REDIS_REST_TOKEN=<サーバー用秘密トークン>
HIKONE_RATE_LIMIT_SALT=<ランダムな32文字以上の秘密文字列>
```

同じ本番の呼出しを受けるデプロイは同じストアとsaltを使う。Previewのテストは別ストアが望ましい。IPはVercelの信頼できる`x-vercel-forwarded-for`から取得し、HMAC化して保存する。キーは約2分で失効し、経路・位置・入力文を保存しない。

Vercel Marketplaceから接続したUpstashは`KV_REST_API_URL`と書込可能な`KV_REST_API_TOKEN`を自動設定するため、その組を利用できる。カスタムの`UPSTASH_REDIS_REST_*`が片方でも設定されている場合はカスタム組のみを使用し、異なるURLとトークンを混ぜない。`KV_REST_API_READ_ONLY_TOKEN`は書込制限に使用しない。

現在の固定上限:

| API | 同一IP / 分 | 全体 / 分 | 全体 / 日（UTC） |
|---|---:|---:|---:|
| routes | 6検索 | 120区間 | 300区間 |
| ai | 4呼出し | 30呼出し | 50呼出し |

実証用の低い日次上限で、分あたりの制限が長期間の費用上限にならない問題を防ぐ。日次カウンタは共有で約2日後に失効する。上限変更時には実証人数とGoogleの現行価格を確認し、コードレビューを経て変更する。無料枠以内・無課金を保証するものではない。

検索ごとに実行前に予約し、失敗時も払い戻さない。窓の境界では短時間に2倍まで許可される場合がある。NAT/共有回線の利用者はIP枠を共有する。CORSは認証ではなく偽装可能なので、この共有制限とGoogleクォータが必要。トークン・salt・信頼できるIPがない場合やストア障害時には503となり、Google/OpenAIを呼ばない。ストアの負荷やVercelへの大量アクセス自体は追加のFirewall/Bot対策で制限する。

REST契約は[Upstash公式資料](https://upstash.com/docs/redis/features/restapi)、IPヘッダーは[Vercel公式資料](https://vercel.com/docs/headers/request-headers)を参照。テストはREST応答をモックしており、実ストアでのLua動作・複数インスタンス制限は公開前に別途確認する。

## 3. Vercel

1. 同じGitHubリポジトリをImportする。Framework PresetはOther、ルートはリポジトリ直下。`vercel.json`のBuild Command/Output Directoryを使用する。
2. Productionと、検証に使用するPreviewに以下を設定する。

```env
GOOGLE_MAPS_API_KEY=<Google Cloudで作成した秘密キー>
HIKONE_ALLOWED_ORIGIN=https://minato-ai-dev.github.io
UPSTASH_REDIS_REST_URL=<共有ストアURL>
UPSTASH_REDIS_REST_TOKEN=<秘密トークン>
HIKONE_RATE_LIMIT_SALT=<32文字以上>
```

3. 自由入力のクラウドAIを使う場合のみ`OPENAI_API_KEY`と`OPENAI_MODEL`も設定する。AIを使わなくてもローカルで希望を解釈して徒歩APIによる推薦は動く。
4. デプロイ後、Functionsに`/api/walking-routes`と`/api/hikone-ai`が含まれることを確認する。実際のdeployment URLを記録する。30秒の関数上限は契約プランで確認する。
5. Preview保護が外部呼出しを止める場合は、検証用のアクセス方法を設定する。本番APIをPagesから呼び出せるようにする。保護回避トークンをフロントエンドに埋め込まない。
6. 環境変数を変更したら再デプロイする。Vercelの利用状況、エラー率、支出管理の設定を確認する。

Originはパスを含めず、実際のPagesドメインと一致させる。カスタムドメインがある場合はそのoriginへ変更する。

## 4. API単独の確認

以下のURLを実際のデプロイURLへ置き換える。Windowsでは`curl.exe`を使用する。認証情報を渡さず、本番でも同じorigin/制限が適用される。

```sh
curl -i -X OPTIONS 'https://<実際のVercelドメイン>/api/walking-routes' -H 'Origin: https://minato-ai-dev.github.io' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: Content-Type'
curl -i -X POST 'https://<実際のVercelドメイン>/api/walking-routes' -H 'Origin: https://minato-ai-dev.github.io' -H 'Content-Type: application/json' --data '{"pairs":[{"from":"S01","to":"D01"}]}'
```

OPTIONSは204と正しいAllow-Origin、POSTは200と正のseconds/metersを返すこと。これは有料の実経路計算なので少数の手動検証だけ行う。

- 異なるOrigin → 403、Allow-Originなし。
- GET → 許可originでは405、Allowヘッダーあり。
- 未知IDやnames辞書 → 400、Google呼出しなし。
- キー未設定 → 503。
- 制限ストア未設定・障害 → 503、課金プロバイダー呼出しなし。
- IP/全体上限超過 → 429、Retry-After 60。
- Google全失敗 → 502。一部成功 → partialと成功区間のみ。

大量の有料テストで制限を確認しない。テスト用環境/モックとストアのカウンタを用いて同時呼出しを検証する。

## 5. GitHub Pages

1. Repository Settings → Pagesで公開先とカスタムドメインを確認する。想定URLは`https://minato-ai-dev.github.io/Hikone/`だが、実際の公開状態を確認する。
2. Settings → Secrets and variables → Actions → Variablesで`VITE_WALKING_ROUTE_ENDPOINT`を設定する。

```env
VITE_WALKING_ROUTE_ENDPOINT=https://<実際のVercelドメイン>/api/walking-routes
```

3. クラウドAIを使う場合は`VITE_HIKONE_AI_ENDPOINT=https://<同じドメイン>/api/hikone-ai`も設定する。これは公開URLであり秘密ではない。
4. 本番用の`VITE_ROUTING_DEMO`は設定しない。Pagesの公開ビルドは徒歩URLが空・HTTP・相対URL・不正なパスの場合やデモ有効時に停止する。
5. 承認済み変更をmainへマージした後にPages workflowを実行する。欠落設定で現在の公開物を上書きしないため、先にVercelを確認する。
6. モバイルのNetworkでPOST先がVercelであることを確認する。JSに実際の公開URLが含まれ、`GOOGLE_MAPS_API_KEY`等の秘密値が含まれないことを確認する。

## 6. ローカル・CI

Node 22を使用する。

```sh
npm ci
npm test
npm run typecheck:api
npm run build
npm run build:backend
```

`build`は一般のオフライン検証用。Pagesへ公開するときは`VITE_WALKING_ROUTE_ENDPOINT`をセットし`npm run build:pages`を使用する。テストはGoogle/OpenAI/Redisをモックし有料APIを呼ばない。Lint設定はないためTypeScriptとテスト、diffチェックを使用する。

`npm run dev`はVite画面のみでFunctionsを動かさない。APIのローカル実行にはVercel開発環境等が必要。Vercelが付けるIPヘッダーがない環境は保護が停止する。テスト目的でコード内の保護を無効化しない。

デモはローカルで`VITE_ROUTING_DEMO=true`を明示した場合のみ仮値を使用し、すべての画面で現地未検証と表示する。本番公開には使わない。

## 7. 実機受入れ

| ケース | 入力 | 確認 |
|---|---|---|
| A | 城→駅、35分、写真、普通/通常 | 両区間・直行・体験・余裕が揃う候補のみ。Google Maps表示と推定ラベル |
| B | A＋休憩/雨 | 歩行時間が増え、時間外候補が減る。体験・余裕を歩行補正しない |
| C | 京橋口駐車場→同じ駐車場、30分 | 直行は0、駅を挿入しない。両区間が揃わなければ空 |
| D | 徒歩API通信を遮断 | クラッシュせず、仮値候補を出さず、説明を表示 |
| E | PreviewからGoogleキーを外す | API503、秘密値非表示、画面に取得失敗の説明 |
| F | 許可外Origin、制限ストア障害 | 403/503、Googleを呼ばない |
| G | 自由入力「雨で休憩しながら、徒歩15分まで、残り45分」 | 結果の条件表示がslow/rain/15/45と一致し、徒歩上限を守る |
| H | 検索中に戻る・新しい検索 | 古い結果で画面や最新条件を上書きしない |
| I | 推薦→ここに寄る→行ってきた→評価 | 履歴・再推薦・同意制ログ・CSVを維持 |

地点の入口と実際の徒歩ルートを現地で照合する。GPSは外部ナビ用で、APIリクエスト・調査ログに座標が含まれないことを確認する。

## 計算・費用・制約

- 1検索は最大8候補、最大17区間、4並列。重複区間・同一地点の計算は省略する。徒歩Google呼出しは4秒、バッチは約18秒、保護ストアは2秒、ブラウザは25秒で中断する。自動再試行しない。
- API基本秒数 × 歩行係数 × 状況係数を分へ切り上げる。係数は普通1、ゆっくり1.2、休憩1.45、通常1、雨1.15、暑さ1.25。体験時間＋余裕5分は別に加える。個別の歩行能力を保証するモデルではない。
- 追加歩行時間＝往復の歩行合計−直行。総追加時間は体験と余裕も含む。残り時間と徒歩合計上限を守る。
- 候補8個の上限は費用保護のため。他の成立候補を見落とす可能性があり、全地点の最適解は保証しない。
- 全地点の入口・座標は未検証。現在の地名指定はprovisional。成功しても現地の入口が正しいとは断言しない。座標/Place IDは検証してから登録する。
- 実測区間は現在空。API失敗時は実測のみの完結経路があれば使い、なければ時間成立候補なし。APIの欠損を仮値で埋めない。
- 自由入力は歩行ペース・雨/暑さ・徒歩上限を解釈するが、自然言語には曖昧さがある。表示された条件を確認し修正する。年齢から体力を推定しない。
- 営業時間、入場待ち、危険な天候の自動停止、ライブ天気、GPS起点の時間計算は未対応。
- Compute Routesはクエリ単位、Matrixはorigin×destinationの要素単位で課金される。歩行モードは対応しているが、8候補の全組合せでは不要な要素も計算する。今回は17本の必要区間だけを呼ぶ実装を維持。Matrix移行は価格表・必要要素・待ち時間の実測後に判断する。固定の金額見積もりはせず、[公式課金資料](https://developers.google.com/maps/documentation/routes/usage-and-billing)と[Matrix契約](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRouteMatrix)を確認する。
- API経路応答を永続キャッシュしない。検索内の重複排除のみ。結果の表示にGoogle Maps帰属を付け、公開terms/privacyページを用意する。[Googleのポリシー](https://developers.google.com/maps/documentation/routes/policies)に従う。
- 警告だけでは現地検証を代替しない。クラウド設定、実ストアの制限、実経路、CORS、スマートフォンの受入れが終わるまで本番準備完了とはしない。
