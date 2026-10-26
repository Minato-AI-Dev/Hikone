# 店舗営業情報 API（初期実装）

`POST /api/shop-hours` に `{"shopIds":["SHOP001","SHOP002"]}` を送ると、登録店舗に関するGoogle Placesの**取得時点**の公開営業情報を返します。

- サーバー環境変数 `GOOGLE_MAPS_API_KEY` と `HIKONE_SHOP_PLACE_IDS_JSON` が必要です。
- `HIKONE_SHOP_PLACE_IDS_JSON` は、検証済みPlace IDのJSONオブジェクトです。例: `{"SHOP001":"<照合済みPlace ID>"}`。未照合のIDを推測して登録しないでください。
- 共有レート制限ストアと `HIKONE_RATE_LIMIT_SALT` がない場合、有料APIへのアクセスを停止します。
- `scheduled_open` / `scheduled_closed` は**取得時点**のGoogle掲載情報であり、未来の到着時刻の営業保証ではありません。未確認やAPI失敗は `unknown` にします。
- 公式サイトでの臨時休業はまだ自動取得できません。情報源に矛盾がある場合の突合、想定到着時刻の判定、店舗推薦への接続は次の段階です。
- Place ID未登録でもエラーにせず `unknown` を返します。
- 利用時にはPlaces APIの利用規約、帰属表示とキャッシュに関する要件を確認・遵守してください。現在の実装は結果を保存しません。
- 外部からは許可Origin、POST、JSON、登録済みSHOP IDのみ受付けます。
