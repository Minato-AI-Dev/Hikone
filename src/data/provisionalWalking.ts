import type { DbEdge,DbAction } from './dbV4';

// Working hypotheses for the interactive prototype, not measured walking routes.
// Values are deliberately rounded; public-space observation only (no premises entry).
// Validate each pair with walking directions and on-site measurement before field use.
// Official route context: https://www.biwako-visitors.jp/course/areas/5/
// Hikone Tourism Association: https://www.hikoneshi.com/guide-service
// Walking duration includes an additional prototype safety margin in recommendation logic.
type Estimate={id:string;castle:number;station:number;action:string;stay:number};
export const estimates:Estimate[]=[
 {id:'P65',castle:4,station:15,action:'いろは松の松並木を眺める',stay:5},
 {id:'P66',castle:6,station:19,action:'京橋と城下町の景色を撮る',stay:5},
 {id:'P76',castle:8,station:21,action:'公園周辺の緑を眺める',stay:5},
 {id:'P64',castle:12,station:23,action:'黒門橋付近からお堀を眺める',stay:5},
 {id:'P43',castle:16,station:2,action:'駅前のひこにゃんマンホールを探す',stay:5},
 {id:'P45',castle:23,station:20,action:'花しょうぶ通りの街並みを歩く',stay:8},
 {id:'P69',castle:17,station:26,action:'足軽屋敷の街並みを眺める',stay:5},
 {id:'P71',castle:23,station:22,action:'橋から芹川の景色を撮る',stay:5},
 {id:'P72',castle:29,station:27,action:'七曲がりの旧街道を歩く',stay:8},
 {id:'P73',castle:28,station:26,action:'仏壇店が並ぶ街並みを眺める',stay:5},
 {id:'P74',castle:23,station:21,action:'安全な歩道から芹川を眺める',stay:5},
 {id:'P20',castle:11,station:13,action:'スミス記念堂の外観を眺める',stay:5},
 {id:'P24',castle:22,station:19,action:'近代建築の外観を眺める',stay:5},
 {id:'P25',castle:25,station:22,action:'旧郵便局舎の外観を眺める',stay:5},
 {id:'P26',castle:26,station:23,action:'レトロな理髪館の外観を眺める',stay:5},
 {id:'P42',castle:18,station:22,action:'城北の橋付近から写真を撮る',stay:5},
];
export const provisionalEdges:DbEdge[]=estimates.flatMap(p=>[
 {id:'H-'+p.id+'-C',from:'S01',to:p.id,mode:'徒歩',distance:null,time:p.castle,direction:'both',status:'机上概算',policy:'概算Demo',note:'地図実測ではない机上の概算。現地調査必須'},
 {id:'H-'+p.id+'-S',from:p.id,to:'D01',mode:'徒歩',distance:null,time:p.station,direction:'both',status:'机上概算',policy:'概算Demo',note:'地図実測ではない机上の概算。現地調査必須'}
]);
export const provisionalActions:DbAction[]=estimates.map(p=>({
 id:'H-A-'+p.id,nodeId:p.id,type:p.action,minStay:p.stay,timeStatus:'概算Demo',
 publicCondition:'屋外の公開地点からのみ。天候・安全・通行条件は現地確認',
 note:'滞在'+p.stay+'分は実測値ではないMVP仮説'
}));
export const provisionalNodeIds=new Set(estimates.map(x=>x.id));
