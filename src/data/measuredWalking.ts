import type { DbEdge } from './dbV4';

// 登録するのは現地で実測した移動のみ。未測定区間は空のままにしてください。
// 例（以下は記入例であり実データではありません）:
// {id:'M001',from:'S01',to:'PK01',mode:'徒歩',distance:測定m,time:測定分,
//  direction:'both',status:'現地実測',policy:'実測済',note:'計測日・計測者・ルートの特定情報'}
// 注意: 一方通行や階段などの制限がある場合 direction:'oneway' を利用。
export const measuredEdges: DbEdge[] = [];
