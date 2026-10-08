# 次の彦根 — Hikone AI / Graph Recommendation DB V4

このブランチは `hikone_graph_recommendation_db_v4` の設計をアプリへ反映したDemoです。

## V4で変わったこと
- 固定ルートを正本にせず、NODE + EDGE のグラフで経路を組み立てます。
- 未取得EDGEは推測で補完しません。
- 最低ACTION時間が未実測のACTIONは、短時間成立判定に使いません。
- NODEが登録されていても、位置・EDGE・ACTION・公開/安全条件が不足していれば実運用推薦から除外します。
- ひこにゃん/写真など明示テーマはL1（利用者目的）として扱います。
- L2（発見）はL1を置き換えません。
- 調査中候補は「推薦」せず、不足データの理由を表示します。

## 現在のデータ充足
- NODE: 55
- EDGE: 20
- 暫定使用可能EDGE: 6
- 最低ACTION時間 KNOWN: 2
- 実運用候補NODE: P01 / P02（条件成立時）
- P40-P76等はテーマ候補として登録されていますが、現時点では多くがRESEARCH/BACKLOGです。

## Demo上の注意
EDGEの6本はV4上「暫定可」で、実測済みではありません。店舗営業・写真ACTION・各RESEARCH地点の移動時間などは、確認が済むまで実運用推薦に使いません。
