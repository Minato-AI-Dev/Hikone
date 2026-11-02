# 店舗営業状況API（PR #29）

## 実装
POST /api/shop-hours, body \`{"shopIds":["SHOP001","SHOP002","SHOP003"]}\`.
- 3件まで・既知ショップIDのみ。任意の店名・URL・GPSは受け取らない。
- サーバーは \`HIKONE_SHOP_PLACE_IDS_JSON\` の**確認済み**Place IDで Google Places (New) Details を取得。
- API応答のID・店舗名と彦根市住所の照合ができない場合は \`unknown\`。営業状態と currentOpeningHours.openNow が揃わない場合も unknown。
- \`scheduled_open\` / \`scheduled_closed\` は取得時点の掲載状態だけを示す。将来の到着時刻ではない。
- 個別店舗の入口・体験所要時間が未検証であるため、自動ルート推薦へ追加しない。未検証の店舗依存ACTIONは推薦から除外する。
- ボタン操作時にだけ取得する。Google Maps帰属・取得日時・公開情報のURLを示す。
- サーバー保護は既存Redisの共有レート制限を再利用。ショップ枠は1 IP/分6、全体/分60、UTC日250件。情報が取得できない場合はエラーかunknownで停止。
- 課金・Google APIルールの確認が必要。Places API (New)で営業時間フィールドを利用できるようサーバーのAPIキー制限を整える。

## 本番公開までの運用チェック
1. SHOP001–003のPlace IDを店舗の公式案内、住所、名称と照合して登録。
2. Vercel（Preview/Production）の \`HIKONE_SHOP_PLACE_IDS_JSON\` 設定を行う。秘密鍵はコミットしない。
3. Google Cloudで現在のRoutes API専用キーの制限を確認し、Places API (New)も許可する場合は請求・クォータを確認。リファラー制限を加えない。
4. GitHub Actions Variablesに \`VITE_SHOP_HOURS_ENDPOINT\` を設定。
5. Previewの実APIで open / closed / unknown とアクセス拒否を確認し、スマホで閲覧と変更テストをする。
6. 公式SNS等の臨時休業情報は自動確認できないので、公開文章には断定を入れない。

未設定でも表示は「営業未確認」のままであり、Googleへは課金リクエストを出さない。
