# 徒歩APIの判断（2026-10-13）

- 公開React画面はGitHub Pagesの/Hikone/。VercelはAPI専用。
- IDだけを送信し、サーバーが彦根DBの地名を決定する。GPSは外部ナビ用。
- S01表門券売所、D01彦根駅、P01キャッスルロードは2026-10-13に部分一致なしの正式名称から取得したPlace IDを指定。他は地名指定。全地点provisionalで、駅出口・街路端点の現地照合は未完了。
- Googleキー/saltとMarketplace RedisはVercel Production/Previewへ設定済み。共有ストアはhikone-rate-limit、アプリ日次上限routes300区間・AI50回（UTC）。Pagesの徒歩endpoint変数も設定済み。
- 課金前にRedis RESTの原子的な共有制限を予約。設定/ストア/Vercelの信頼IPが欠ける場合は停止。
- API失敗時は実測のみを使用。実測EDGEは現在空。仮値は明示的ローカルデモのみ、本番Pagesでデモ公開を禁止。
- 歩行係数・状況係数はwalkingModel.ts。体験と余裕5分を歩行時間と分離。
- 追加歩行と体験込み総追加時間は別物。maxWalkMinは合計歩行時間を制限する。
- 本番設定・Google実経路・実ストアLua・スマートフォン現地受入れはアカウント設定後に検証する。モックテストで完了扱いしない。
