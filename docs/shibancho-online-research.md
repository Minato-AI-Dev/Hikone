# 四番町スクエア 3店舗：インターネット調査（2026-10-22）

方針：現地調査・実測なしで公開情報だけを収集。店舗の営業中・実在庫・入口座標・店内滞在時間を未検証のまま確定扱いしない。

## 収集済み
- **SHOP001 MOHERON STUDIO ひこにゃんショップ**：作者監修グッズ。公式SNS https://www.instagram.com/moheron_studio/ 。彦根の観光パンフレットにはひこにゃん絵本キャラクター商品等の紹介。店舗の当日在庫・個別価格は不明。
- **SHOP002 戦国桜**：旧真・戦国丸。2023年7月14日リニューアル。武将グッズ、武将印。オンラインショップ https://www.j-select-14.com/ には井伊直政の武将足袋靴下、彦根城ピンバッジ、戦将の符等が掲載。**EC価格・オンライン限定品を実店舗の商品価格・在庫と同一視しない。**
- **SHOP003 しかの商店**：大正14年創業、天然の琵琶湖湖魚を使った手作り佃煮、通信販売対応と公式商店街紹介に記載。公開情報だけでは魚種別の取扱・価格・決済手段は確定できない。

## 主な参照URL
- https://www.4bancho.com/members/moheron-studio
- https://www.4bancho.com/members/sengoku-zakura
- https://www.4bancho.com/members/shikano
- https://www.4bancho.com/guidemap
- https://www.j-select-14.com/?cbid=2400444&csid=0&mode=cate&sort=p
- https://www.hikoneshi.com/hikone-tourism-2025/img/PDF/hikone_2024.pdf

実体：`src/data/shopOnlineResearch.ts`。既存の`shoppingPlaces.ts`、`shopOperationalFacts.ts`からshopIdで紐付ける。URLから検証した公開記事と推測を混在させない。

## 引き続きネット上で取得を試みる項目
- 公開されている個別商品とオンライン価格（実店舗価格とは別管理）
- 店舗ごとの公式SNS投稿・臨時休業案内と最終更新日時（古い投稿は当日営業の証拠ではない）
- 商品画像の公式掲載元、転載/使用許諾状況
- 店舗入口を示す施設公式図面・Street View等の公開位置情報。ただし歩行者入口の実測済み座標として扱わない
- 公式サイトに掲載された支払方法、通販対応、バリアフリー案内
- 公共交通・駐車場・施設の共通トイレ等の補助情報（店舗サービスとの混同不可）

**ネットだけでは確定不能：** 実際に通れる入口、営業中かどうか、店内の必要時間、現在の在庫、個別店舗への徒歩所要時間の現地妥当性。これらを埋めなくても調査候補一覧への掲載は可能だが、時間付き個別店舗推薦への昇格はしない。
