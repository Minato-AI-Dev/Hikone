// Tourist-facing stories. Source-backed facts are kept distinct from observational prompts.
// Avoid printing internal DB annotations in visitor descriptions.
export type Story={text:string;source?:string};
export const stories:Record<string,Story>={
 P01:{text:'お城を出たら、江戸の町へ。白壁と黒格子の通りで、気になる一軒を探そう。',source:'https://www.city.hikone.lg.jp/kakuka/kanko_bunka/5/hikonefilmcomission/roke-syonsyokai/kaidoumachinami/22124.html'},
 P02:{text:'江戸の町から、大正ロマンへ。レトロな広場のガス灯を見つけてみよう。',source:'https://www.4bancho.com/'},
 P20:{text:'お寺に見えるのに、実は礼拝堂。隠れた十字架を探せるかな？',source:'https://www.city.hikone.lg.jp/kakuka/kanko_bunka/8/2_2/4641.html'},
 P41:{text:'ひこにゃんの赤い兜、そのルーツは？井伊家の歴史をちょっと探検。'},
 P45:{text:'一歩入ると、もうひとつの城下町。古い看板や町家を見つけよう。'},
 P65:{text:'「いろは」の47本から始まった松並木。名前の秘密を知ると景色が変わる。',source:'https://www.city.hikone.lg.jp/kakuka/toshi_seisaku/15/4/12/10241.html'},
 P66:{text:'この橋の向こうは商人の町。京橋を渡って、城下町の続きを歩こう。',source:'https://www.biwako-visitors.jp/spot/detail/913/'},
 P68:{text:'路地に入れば、足軽たちの城下町。昔の暮らしが見える板塀を探そう。',source:'https://www.city.hikone.lg.jp/kanko/event/28443.html'},
 P69:{text:'町角の小さな見張り場所。昔の城下町の「防犯カメラ」だった？',source:'https://www.city.hikone.lg.jp/kakuka/toshi_seisaku/15/4/3/4211.html'},
 P70:{text:'川沿いに続く大きな木々。木漏れ日のトンネルを歩いてみよう。',source:'https://www.city.hikone.lg.jp/kakuka/shimin_kankyo/5/2_2/9/serikawa/3727.html'},
 P71:{text:'橋の上に、小さな絶景。芹川と彦根の町を一緒に眺めよう。'},
 P72:{text:'どうして道が何度も曲がるの？七曲がりに隠れた城下町の工夫を探そう。',source:'https://www.city.hikone.lg.jp/kakuka/kanko_bunka/5/hikonefilmcomission/roke-syonsyokai/kaidoumachinami/22126.html'},
 P73:{text:'武具の職人が、仏壇づくりの名人に。七つの技が集まる町を歩こう。',source:'https://www.city.hikone.lg.jp/kakuka/sangyo/3/2_3/4104.html'},
 P74:{text:'橋をひとつ渡るたび、川の顔が変わる。お気に入りの眺めを探そう。'},
 P76:{text:'お城のすぐそばに、静かな緑の時間。少しだけ遠回りしてみよう。'},
 P64:{text:'橋の上から見る彦根城。お堀と石垣の、とっておきの角度を探そう。'},
 P42:{text:'お城とひこにゃんを一緒に撮りたい。お気に入りの構図を探そう。'},
 P43:{text:'ひこにゃんは足元にも！駅前で小さな宝探しをしよう。'},
 P10:{text:'お城の町から、湖の町へ。琵琶湖の広い空を見に行こう。'},
 P11:{text:'彦根は船の町でもある。港で、琵琶湖のもうひとつの顔に出会おう。'},
 P21:{text:'お城の町に、レトロな学び舎。昔の学生たちの景色をのぞいてみよう。'},
 P22:{text:'この洋館、何の建物だった？彦根の学生たちの歴史がここに。'},
 P24:{text:'銀行なのに、まるで洋館。街角に残る近代のデザインを探そう。'},
 P25:{text:'かつての郵便局が、今も街角に。昔の「手紙の町」を想像してみよう。'},
 P26:{text:'昭和の理髪店が、そのまま街の宝物に。入口のデザインに注目。'},
 P40:{text:'ひこにゃん好きなら寄りたい場所。どんな出会いが待っているかな？'},
 P44:{text:'彦根のキャラクター文化は奥が深い。花しょうぶ通りでその面影を探そう。'},
 P46:{text:'お城の外にも井伊家の物語。お寺から彦根の歴史をたどってみよう。'},
 P48:{text:'ひこにゃんだけじゃない！彦根生まれのキャラクターたちを探そう。'},
 P49:{text:'ここだけのひこにゃんグッズに出会えるかも。旅の相棒を探そう。'},
 P50:{text:'食べるのが惜しくなる？かわいいお菓子を探す寄り道。'},
 P51:{text:'お茶の香りとひこにゃん。町歩きの途中に、ちょっと甘い休憩を。'},
 P52:{text:'ひこにゃんが、ランチにも？気になる一皿を見つけよう。'},
 P53:{text:'ひこにゃんがカフェにも登場？かわいい一杯を探しに。'},
 P54:{text:'彦根駅へ戻る前に、ひこにゃんスイーツを探してみよう。'},
 P55:{text:'旅の最後に、パンとコーヒー。ひこにゃんメニューに出会えるかも。'},
 P56:{text:'歩き疲れたら、お茶の甘いごほうび。抹茶の香りでひと休み。'},
 P60:{text:'彦根城、実は見る角度で表情が変わる。お気に入りの一枚を。'},
 P61:{text:'石垣の積み方、左右で違う？天秤櫓の不思議を見つけよう。'},
 P62:{text:'天守だけが彦根城じゃない。西の丸で、城の奥行きを感じよう。'},
 P63:{text:'池の向こうに、彦根城。庭園とお城を一枚に収めてみよう。'},
 P67:{text:'立派な山門の向こうには、どんな歴史が？お寺の外観を眺めてみよう。'},
 P75:{text:'琵琶湖と松並木。この景色を見たら、彦根の印象が少し変わるかも。'}
};
export function visitorStory(id:string,category:string):Story{
 const s=stories[id];if(s)return s;
 if(/飲食|カフェ|菓子|物販/.test(category))return {text:'気になる一軒に、思いがけない彦根の味が待っているかも。'};
 if(/近代|建築/.test(category))return {text:'窓も屋根も、ちょっとレトロ。建物に隠れた時代のヒントを探そう。'};
 if(/橋|河川|景観/.test(category))return {text:'ほんの少し立ち止まるだけ。水辺で彦根の違う顔を見つけよう。'};
 if(/歴史|城郭|街並み|街路/.test(category))return {text:'この道の先に何がある？城下町の小さな秘密を探しに行こう。'};
 return {text:'少し寄り道するだけで、まだ知らない彦根に出会えるかも。'};
}
