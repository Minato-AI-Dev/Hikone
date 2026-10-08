export type DbNode = {
  id:string; name:string; type:string; category:string; layer:string; status:string;
  modes:string; publicStatus:string; cluster:string; note:string|null;
};
export type DbEdge = {
  id:string; from:string; to:string; mode:string; distance:number|null; time:number|null;
  direction:string; status:string; policy:string; note:string|null;
};
export type DbAction = {
  id:string; nodeId:string; type:string; minStay:number|null; timeStatus:string;
  publicCondition:string; note:string|null;
};

export const DB_V4_META = {
  version:'V4',
  nodeCount:55,
  edgeCount:20,
  provisionalUsableEdgeCount:11,
  knownMinimumActionCount:12,
  rule:'位置・EDGE時間・最低ACTION時間・公開/安全条件が揃った地点だけを実運用推薦に使う',
};

export const tagNames:Record<string,string> = {
  T_HISTORY:'歴史',T_CASTLE:'城',T_WALK:'街歩き',T_FOOD:'食',T_SHOP:'買物',T_REST:'休憩',
  T_LAKE:'琵琶湖',T_SCENERY:'景色',T_PHOTO:'写真',T_MODERN:'近代史',T_ARCH:'近代建築',
  T_RELIGION:'宗教',T_EDU:'教育',T_FINANCE:'金融',T_POST:'郵便通信',T_SCIENCE:'科学気象',
  T_RAIL:'鉄道',T_INFRA:'土木',T_HIKONYAN:'ひこにゃん',T_HIK_DIRECT:'ひこにゃん直接関連',
  T_CHAR_HISTORY:'ご当地キャラ史',T_HIK_ORIGIN:'ひこにゃん起源・モチーフ',T_MANHOLE:'マンホール',
  T_CHARACTER_FOOD:'キャラクター飲食',T_STREETSCAPE:'街並み',T_NATURE:'自然',
  T_RIVER:'川・河川景観',T_TEMPLE:'寺院',T_TRADITION:'伝統産業',T_GARDEN:'庭園'
};

export const interestOptions = [
  'T_HIKONYAN','T_PHOTO','T_WALK','T_FOOD','T_SHOP','T_HISTORY','T_MODERN','T_ARCH',
  'T_LAKE','T_SCENERY','T_STREETSCAPE','T_NATURE','T_RIVER','T_GARDEN'
];

export const nodes:DbNode[] = [
{id:"S01",name:"彦根城 表門券売所付近",type:"start",category:"城・史跡",layer:"L1",status:"ACTIVE",modes:"徒歩/自転車/車",publicStatus:"公開",cluster:"CASTLE",note:"既存DB起点"},
{id:"D01",name:"JR彦根駅 西口",type:"terminal",category:"交通",layer:"L1",status:"ACTIVE",modes:"徒歩/自転車/車",publicStatus:"公開",cluster:"STATION",note:"既存DB終点"},
{id:"P01",name:"夢京橋キャッスルロード北端（京橋南詰）",type:"poi",category:"街路・商業",layer:"L1/L2",status:"ACTIVE",modes:"徒歩/自転車",publicStatus:"公開",cluster:"CASTLE_TOWN",note:"主要訪問地点。固定ルートではなく地点として扱う"},
{id:"P02",name:"四番町スクエア代表点",type:"poi",category:"商業街区",layer:"L1/L2",status:"ACTIVE",modes:"徒歩/自転車",publicStatus:"公開",cluster:"CASTLE_TOWN",note:"代表地点"},
{id:"P10",name:"松原湖岸",type:"poi",category:"湖岸・景観",layer:"L1/L2",status:"CONDITIONAL",modes:"車/自転車/徒歩は原則抑制",publicStatus:"要現地確認",cluster:"LAKE_MATSUBARA",note:"琵琶湖明示時はL1。徒歩デフォルト推薦は抑制"},
{id:"P11",name:"彦根港",type:"poi",category:"港・交通",layer:"L1/L2",status:"RESEARCH",modes:"車/自転車/徒歩は要制約確認",publicStatus:"要確認",cluster:"LAKE_MATSUBARA",note:"具体終点・駐車/自転車導線は要確認"},
{id:"P20",name:"スミス記念堂",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"要確認",cluster:"MODERN_CORE",note:"1931年。キリスト教・西洋文化の受容"},
{id:"P21",name:"滋賀大学経済学部講堂（旧彦根高等商業学校講堂）",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"要確認",cluster:"MODERN_UNIV",note:"1924年。高等教育の近代化"},
{id:"P22",name:"滋賀大学陵水会館",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"要確認",cluster:"MODERN_UNIV",note:"1938年。彦根高商・ヴォーリズ建築"},
{id:"P23",name:"中央町（回遊中継エリア）",type:"area",category:"市街地",layer:"L2",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"公開",cluster:"MODERN_CORE",note:"単独目的地というより中継エリア"},
{id:"P24",name:"滋賀中央信用金庫銀座支店（旧明治銀行彦根支店）",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"外観中心・要確認",cluster:"MODERN_HANASHOBU",note:"1918年。金融・商業の近代化"},
{id:"P25",name:"高崎家住宅主屋（旧川原町郵便局舎／逓信舎）",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"外観中心・要確認",cluster:"MODERN_HANASHOBU",note:"1934年。郵便・通信の近代化"},
{id:"P26",name:"宇水理髪館店舗",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"外観中心・要確認",cluster:"MODERN_HANASHOBU",note:"1936年。昭和初期の都市生活・商業"},
{id:"P27",name:"秋口家住宅洋館",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"BACKLOG",modes:"徒歩/自転車",publicStatus:"要確認",cluster:"MODERN_OTHER",note:"1916年。洋風建築・近代医療"},
{id:"P28",name:"彦根地方気象台",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"BACKLOG",modes:"徒歩/自転車/車",publicStatus:"要確認",cluster:"MODERN_OTHER",note:"1932年。科学・気象観測の近代化"},
{id:"P29",name:"近江鉄道鳥居本駅舎",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"BACKLOG",modes:"鉄道/自転車/車",publicStatus:"公開条件要確認",cluster:"MODERN_REMOTE",note:"1931年。徒歩MVP外"},
{id:"P30",name:"旧日夏村役場産業組合合同庁舎",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"BACKLOG",modes:"自転車/車",publicStatus:"要確認",cluster:"MODERN_REMOTE",note:"1934頃。地方行政・産業組合"},
{id:"P31",name:"仏生山トンネル",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"BACKLOG",modes:"自転車/車",publicStatus:"要安全確認",cluster:"MODERN_REMOTE",note:"鉄道近代化。安全・アクセス条件を要確認"},
{id:"P32",name:"佐和山隧道",type:"poi",category:"近代化遺産",layer:"L2/明示時L1",status:"BACKLOG",modes:"自転車/車",publicStatus:"要安全確認",cluster:"MODERN_REMOTE",note:"道路・交通インフラ。安全・アクセス条件を要確認"},
{id:"P40",name:"ひこにゃんミュジアム",type:"poi",category:"ひこにゃん展示・ショップ",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"営業時間・常設内容要確認",cluster:"CASTLE_TOWN",note:"ひこにゃん展示・ショップ。四番町スクエア所在としてユーザー調査"},
{id:"P41",name:"彦根城博物館",type:"poi",category:"博物館",layer:"L2/テーマ明示時L1",status:"ACTIVE",modes:"徒歩",publicStatus:"公開（開館時間あり・仮運用）",cluster:"CASTLE",note:"公式サイトで所在地・開館時間を確認。ACTION時間は仮設定"},
{id:"P42",name:"城北百間橋のHIKONEフォトスポット",type:"poi",category:"フォトスポット",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"屋外・設置状況要確認",cluster:"CASTLE_NORTH",note:"ひこにゃんと彦根城を背景に撮影できる候補"},
{id:"P43",name:"彦根駅西口のひこにゃんマンホール",type:"poi",category:"マンホール",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"屋外・位置要確認",cluster:"STATION",note:"JR彦根駅西口周辺のデザインマンホール"},
{id:"P44",name:"寺子屋 力石",type:"poi",category:"キャラクター文化拠点",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"営業・展示内容要確認",cluster:"HANASHOBU",note:"しまさこにゃん誕生のきっかけとなった場所。現在の展示内容は未確認"},
{id:"P45",name:"花しょうぶ通り",type:"area",category:"商店街・歴史景観",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"屋外公開",cluster:"HANASHOBU",note:"ご当地キャラ史と町家・商店景観の両面を持つエリア"},
{id:"P46",name:"清凉寺",type:"poi",category:"寺院・井伊家",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"拝観条件要確認",cluster:"SAWAYAMA",note:"招き猫伝説に登場する井伊直孝につながる井伊家墓所。伝説そのものの舞台ではない"},
{id:"P47",name:"ひこにゃん彦福堂",type:"poi",category:"ひこにゃん祈念スポット",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"営業・常設状況要確認",cluster:"HONMACHI",note:"222体の招き猫が並ぶとのユーザー調査。2026年開設"},
{id:"P48",name:"ひこね街の駅 戦国丸",type:"poi",category:"キャラクター文化・物販",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"営業状況要確認",cluster:"HANASHOBU",note:"いしだみつにゃん・しまさこにゃんの商品や歴史に関係する拠点"},
{id:"P49",name:"KANENOMARU",type:"poi",category:"ひこにゃん物販",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"営業状況要確認",cluster:"MOTOMACHI",note:"旧・彦根城内『鐘の丸売店』後継店。オリジナルひこにゃんグッズ等とのユーザー調査"},
{id:"P50",name:"ミュジアムキッチン",type:"poi",category:"キャラクター飲食",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"営業・メニュー要確認",cluster:"CASTLE_TOWN",note:"ひこにゃん・わるにゃんこ将軍型ベビーカステラ"},
{id:"P51",name:"政所園 夢京橋店",type:"poi",category:"キャラクター飲食",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"営業・メニュー要確認",cluster:"CASTLE_TOWN",note:"コラボメニュー『ひこにゃんミルク』"},
{id:"P52",name:"teraitei",type:"poi",category:"キャラクター飲食",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"営業・メニュー要確認",cluster:"HONMACHI",note:"ひこにゃんランチ、ひこにゃん巻、ひこラテ"},
{id:"P53",name:"M's cafe",type:"poi",category:"キャラクター飲食",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"営業・メニュー要確認",cluster:"HONMACHI",note:"ひこにゃんのミックスベリーヨーグルト"},
{id:"P54",name:"COZY TOWN café",type:"poi",category:"キャラクター飲食",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"営業・メニュー要確認",cluster:"STATION",note:"ひこにゃんワッフル等"},
{id:"P55",name:"55-60 World Bakery HIKONE",type:"poi",category:"キャラクター飲食",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"営業・メニュー要確認",cluster:"STATION",note:"ひこにゃんのウインナーコーヒー等"},
{id:"P56",name:"みやおえん",type:"poi",category:"キャラクター飲食",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"営業・メニュー要確認",cluster:"KYOMACHI",note:"ひこにゃんの抹茶ソフト"},
{id:"P57",name:"プロシードアリーナHIKONE前 ひこにゃんマンホール",type:"poi",category:"マンホール",layer:"L2/テーマ明示時L1",status:"BACKLOG",modes:"自転車/車",publicStatus:"屋外・位置要確認",cluster:"SOUTH_HIKONE",note:"国スポ・障スポ記念のひこにゃんマンホール"},
{id:"P58",name:"金亀町 ひこにゃんフォトスポット候補",type:"poi",category:"フォトスポット",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"設備要現地確認",cluster:"CASTLE",note:"個別の撮影設備・常設性は要現地確認"},
{id:"P60",name:"彦根城天守",type:"poi",category:"城郭・撮影",layer:"L1/L2",status:"RESEARCH",modes:"徒歩",publicStatus:"開場時間・入場条件要確認",cluster:"CASTLE",note:"天守・石垣・城郭の撮影候補"},
{id:"P61",name:"彦根城天秤櫓",type:"poi",category:"城郭・撮影",layer:"L1/L2",status:"RESEARCH",modes:"徒歩",publicStatus:"開場条件要確認",cluster:"CASTLE",note:"石垣・橋・櫓の撮影候補"},
{id:"P62",name:"彦根城西の丸",type:"poi",category:"城郭・撮影",layer:"L1/L2",status:"RESEARCH",modes:"徒歩",publicStatus:"開場条件要確認",cluster:"CASTLE",note:"石垣・櫓・木々の撮影候補"},
{id:"P63",name:"玄宮園",type:"poi",category:"庭園・撮影",layer:"L1/L2",status:"RESEARCH",modes:"徒歩",publicStatus:"開園・入園条件要確認",cluster:"CASTLE",note:"池・庭園・彦根城天守の撮影候補"},
{id:"P64",name:"黒門橋周辺",type:"poi",category:"橋・城郭景観",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"屋外・安全位置要確認",cluster:"CASTLE",note:"内堀・石垣・橋の撮影候補"},
{id:"P65",name:"いろは松",type:"poi",category:"松並木・歴史景観",layer:"L1/L2",status:"RESEARCH",modes:"徒歩",publicStatus:"屋外公開",cluster:"CASTLE",note:"松並木・歴史的景観"},
{id:"P66",name:"京橋",type:"poi",category:"橋・城下町景観",layer:"L1/L2",status:"RESEARCH",modes:"徒歩",publicStatus:"屋外公開",cluster:"CASTLE_TOWN",note:"外堀・石垣・橋。城下町への導入地点"},
{id:"P67",name:"宗安寺",type:"poi",category:"寺院・撮影",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"拝観・撮影条件要確認",cluster:"CASTLE_TOWN",note:"山門・寺院建築の撮影候補"},
{id:"P68",name:"善利組足軽組屋敷地区",type:"area",category:"歴史街並み・撮影",layer:"L2/テーマ明示時L1",status:"ACTIVE",modes:"徒歩",publicStatus:"屋外公開（生活道路・私有地配慮・仮運用）",cluster:"SERIBASHI",note:"彦根市公式で彦根城徒歩15分・彦根駅徒歩25分を確認。ACTION時間は仮設定"},
{id:"P69",name:"辻番所跡周辺",type:"area",category:"歴史街並み・撮影",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"生活道路・私有地配慮",cluster:"SERIBASHI",note:"足軽屋敷の街並み・路地"},
{id:"P70",name:"芹川けやき並木",type:"area",category:"自然・河川景観",layer:"L2/テーマ明示時L1",status:"ACTIVE",modes:"徒歩/自転車",publicStatus:"屋外公開（季節/天候影響・仮運用）",cluster:"SERIKAWA",note:"滋賀県公式モデルコースで彦根城徒歩10分・彦根駅方面徒歩15分を確認。ACTION時間は仮設定"},
{id:"P71",name:"池洲橋",type:"poi",category:"橋・河川景観",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"歩道・撮影安全位置要確認",cluster:"SERIKAWA",note:"芹川・遠景の彦根城。写真MVP優先A"},
{id:"P72",name:"七曲がり",type:"area",category:"旧街道・街並み",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"屋外公開",cluster:"NANAMAGARI",note:"曲がった旧街道と伝統的町家。写真MVP優先B"},
{id:"P73",name:"彦根仏壇街",type:"area",category:"伝統産業・街並み",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"店舗内見学は別確認",cluster:"NANAMAGARI",note:"仏壇店・職人の町並み"},
{id:"P74",name:"芹川沿いの橋・河川敷",type:"area",category:"河川景観",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車",publicStatus:"河川敷安全・天候要確認",cluster:"SERIKAWA",note:"水面・橋・川辺の風景"},
{id:"P75",name:"松原の松並木",type:"area",category:"湖畔・松並木",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩/自転車/車",publicStatus:"屋外・代表点要確認",cluster:"LAKE_MATSUBARA",note:"湖畔の松・歴史的景観"},
{id:"P76",name:"金亀公園周辺",type:"area",category:"緑地・自然",layer:"L2/テーマ明示時L1",status:"RESEARCH",modes:"徒歩",publicStatus:"屋外公開",cluster:"CASTLE",note:"緑地・城周辺の自然"}
];

export const nodeTags:Record<string,string[]> = {"S01":["T_HISTORY","T_CASTLE","T_HIKONYAN","T_HIK_ORIGIN"],"P01":["T_WALK","T_FOOD","T_SHOP","T_HIKONYAN","T_HIK_DIRECT","T_PHOTO","T_STREETSCAPE"],"P02":["T_WALK","T_FOOD","T_SHOP","T_REST","T_HIKONYAN","T_HIK_DIRECT","T_PHOTO","T_STREETSCAPE"],"P10":["T_LAKE","T_SCENERY","T_PHOTO","T_NATURE"],"P11":["T_LAKE","T_SCENERY","T_PHOTO"],"P20":["T_MODERN","T_ARCH","T_HISTORY","T_RELIGION","T_PHOTO"],"P21":["T_MODERN","T_ARCH","T_EDU"],"P22":["T_MODERN","T_ARCH","T_EDU"],"P23":["T_WALK","T_MODERN"],"P24":["T_MODERN","T_ARCH","T_FINANCE","T_PHOTO"],"P25":["T_MODERN","T_ARCH","T_POST"],"P26":["T_MODERN","T_ARCH"],"P27":["T_MODERN","T_ARCH"],"P28":["T_MODERN","T_SCIENCE"],"P29":["T_MODERN","T_RAIL","T_ARCH"],"P30":["T_MODERN","T_ARCH"],"P31":["T_MODERN","T_RAIL","T_INFRA"],"P32":["T_MODERN","T_INFRA"],"P40":["T_HIKONYAN","T_HIK_DIRECT","T_SHOP"],"P41":["T_HIKONYAN","T_HIK_ORIGIN","T_HISTORY"],"P42":["T_HIKONYAN","T_HIK_DIRECT","T_PHOTO"],"P43":["T_HIKONYAN","T_HIK_DIRECT","T_MANHOLE","T_PHOTO"],"P44":["T_CHAR_HISTORY","T_HISTORY"],"P45":["T_CHAR_HISTORY","T_WALK","T_PHOTO","T_STREETSCAPE"],"P46":["T_HIK_ORIGIN","T_HISTORY","T_TEMPLE"],"P47":["T_HIKONYAN","T_HIK_DIRECT","T_PHOTO","T_SHOP"],"P48":["T_CHAR_HISTORY","T_SHOP","T_HISTORY"],"P49":["T_HIKONYAN","T_HIK_DIRECT","T_SHOP"],"P50":["T_HIKONYAN","T_HIK_DIRECT","T_FOOD","T_CHARACTER_FOOD"],"P51":["T_HIKONYAN","T_HIK_DIRECT","T_FOOD","T_CHARACTER_FOOD"],"P52":["T_HIKONYAN","T_HIK_DIRECT","T_FOOD","T_CHARACTER_FOOD"],"P53":["T_HIKONYAN","T_HIK_DIRECT","T_FOOD","T_CHARACTER_FOOD"],"P54":["T_HIKONYAN","T_HIK_DIRECT","T_FOOD","T_CHARACTER_FOOD"],"P55":["T_HIKONYAN","T_HIK_DIRECT","T_FOOD","T_CHARACTER_FOOD"],"P56":["T_HIKONYAN","T_HIK_DIRECT","T_FOOD","T_CHARACTER_FOOD"],"P57":["T_HIKONYAN","T_HIK_DIRECT","T_MANHOLE","T_PHOTO"],"P58":["T_HIKONYAN","T_HIK_DIRECT","T_PHOTO"],"P60":["T_PHOTO","T_CASTLE","T_HISTORY"],"P61":["T_PHOTO","T_CASTLE","T_ARCH"],"P62":["T_PHOTO","T_CASTLE","T_NATURE"],"P63":["T_PHOTO","T_GARDEN","T_SCENERY"],"P64":["T_PHOTO","T_SCENERY","T_CASTLE"],"P65":["T_PHOTO","T_SCENERY","T_NATURE"],"P66":["T_PHOTO","T_SCENERY","T_WALK"],"P67":["T_PHOTO","T_TEMPLE","T_ARCH","T_HISTORY"],"P68":["T_PHOTO","T_STREETSCAPE","T_HISTORY","T_WALK"],"P69":["T_PHOTO","T_STREETSCAPE","T_HISTORY"],"P70":["T_PHOTO","T_NATURE","T_RIVER","T_SCENERY","T_WALK"],"P71":["T_PHOTO","T_RIVER","T_SCENERY"],"P72":["T_PHOTO","T_STREETSCAPE","T_WALK","T_HISTORY"],"P73":["T_PHOTO","T_TRADITION","T_STREETSCAPE"],"P74":["T_PHOTO","T_RIVER","T_SCENERY"],"P75":["T_PHOTO","T_NATURE","T_LAKE","T_SCENERY"],"P76":["T_PHOTO","T_NATURE","T_WALK"]};

export const edges:DbEdge[] = [
{id:"E001",from:"S01",to:"D01",mode:"徒歩",distance:1100,time:16,direction:"both",status:"要実測",policy:"暫定可",note:"直行基準。既存可変枠モデルは15分"},
{id:"E002",from:"S01",to:"P01",mode:"徒歩",distance:450,time:6,direction:"both",status:"要実測",policy:"暫定可",note:null},
{id:"E003",from:"P01",to:"D01",mode:"徒歩",distance:1300,time:18,direction:"both",status:"要実測",policy:"暫定可",note:null},
{id:"E004",from:"S01",to:"P02",mode:"徒歩",distance:900,time:13,direction:"both",status:"要実測",policy:"暫定可",note:null},
{id:"E005",from:"P02",to:"D01",mode:"徒歩",distance:1500,time:21,direction:"both",status:"要実測",policy:"暫定可",note:null},
{id:"E006",from:"P01",to:"P02",mode:"徒歩",distance:350,time:5,direction:"both",status:"要実測",policy:"暫定可",note:null},
{id:"E101",from:"S01",to:"P10",mode:"徒歩",distance:null,time:25,direction:"both",status:"要地図確認",policy:"デフォルト除外",note:"議論上の目安。DB確定値には使わない"},
{id:"E102",from:"S01",to:"P10",mode:"自転車",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:"湖岸推薦の優先計測"},
{id:"E103",from:"S01",to:"P10",mode:"車",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:"駐車後徒歩を含める"},
{id:"E201",from:"S01",to:"P20",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:"近代化遺産候補の接続"},
{id:"E202",from:"P20",to:"P21",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:null},
{id:"E203",from:"P21",to:"P22",mode:"徒歩",distance:null,time:null,direction:"both",status:"要確認",policy:"未取得",note:"大学構内の実際の見学導線"},
{id:"E204",from:"P22",to:"P23",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:null},
{id:"E205",from:"P23",to:"P24",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:null},
{id:"E206",from:"P24",to:"P25",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:"花しょうぶ通り方面"},
{id:"E207",from:"P25",to:"P26",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:"花しょうぶ通り方面"},
{id:"E208",from:"P20",to:"D01",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:"部分組合せ生成のために必要"},
{id:"E209",from:"P24",to:"D01",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:"部分組合せ生成のために必要"},
{id:"E210",from:"P26",to:"D01",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:"南側から駅帰着の可否判定に必要"},
{id:"E211",from:"P10",to:"D01",mode:"徒歩",distance:null,time:null,direction:"both",status:"要計測",policy:"未取得",note:"湖岸から駅へ抜けるケース用。徒歩デフォルト推薦は別ルールで抑制"},
{id:"E301",from:"S01",to:"P41",mode:"徒歩",distance:100,time:1,direction:"both",status:"検索確認",policy:"仮運用",note:"滋賀県公式モデルコース: 彦根城→彦根城博物館 0.1km/徒歩1分"},
{id:"E302",from:"S01",to:"P68",mode:"徒歩",distance:1000,time:15,direction:"both",status:"検索確認",policy:"仮運用",note:"彦根市公式: 善利組足軽組屋敷は彦根城より徒歩15分(1.0km)"},
{id:"E303",from:"P68",to:"D01",mode:"徒歩",distance:1800,time:25,direction:"both",status:"検索確認",policy:"仮運用",note:"彦根市公式: 善利組足軽組屋敷は彦根駅より徒歩25分(1.8km)"},
{id:"E304",from:"S01",to:"P70",mode:"徒歩",distance:null,time:10,direction:"both",status:"検索確認",policy:"仮運用",note:"滋賀県公式モデルコース: 芹川けやき並木は彦根城より徒歩10分"},
{id:"E305",from:"P70",to:"D01",mode:"徒歩",distance:1500,time:15,direction:"both",status:"検索確認",policy:"仮運用",note:"滋賀県公式モデルコース: 芹川けやき並木→JR彦根駅 1.5km/徒歩15分"}
];

export const actions:DbAction[] = [
{id:"A01",nodeId:"P01",type:"入口通過・街並み確認",minStay:0,timeStatus:"KNOWN",publicCondition:"公開",note:"移動自体で成立。店舗利用や全区間散策は含まない"},
{id:"A02",nodeId:"P01",type:"土産店1軒を見る",minStay:8,timeStatus:"仮設定",publicCondition:"店舗依存",note:"検索では店舗の存在を確認。滞在8分はMVP仮値"},
{id:"A03",nodeId:"P01",type:"軽い食べ歩き",minStay:10,timeStatus:"仮設定",publicCondition:"店舗依存",note:"購入+短時間飲食として10分のMVP仮値"},
{id:"A04",nodeId:"P01",type:"飲食",minStay:null,timeStatus:"要実測",publicCondition:"店舗依存",note:"注文・提供・飲食時間が店舗や混雑で変動"},
{id:"A05",nodeId:"P02",type:"代表地点通過・景観確認",minStay:0,timeStatus:"KNOWN",publicCondition:"公開",note:"広場内散策等は含まない"},
{id:"A06",nodeId:"P02",type:"店舗1軒を見る",minStay:8,timeStatus:"仮設定",publicCondition:"店舗依存",note:"短時間立寄りとして8分のMVP仮値"},
{id:"A07",nodeId:"P02",type:"飲食",minStay:null,timeStatus:"要実測",publicCondition:"店舗依存",note:"注文・提供・飲食時間が不明"},
{id:"A08",nodeId:"P02",type:"写真・休憩",minStay:5,timeStatus:"仮設定",publicCondition:"公開",note:"短時間成立のMVP仮値5分"},
{id:"B10",nodeId:"P10",type:"湖岸を見る・写真",minStay:null,timeStatus:"要実測",publicCondition:"代表地点要確認",note:"終点代表点と最低滞在を確定する"},
{id:"B20",nodeId:"P20",type:"外観確認・解説を見る",minStay:null,timeStatus:"要実測",publicCondition:"要確認",note:"公開条件と最低成立時間を確認"},
{id:"B21",nodeId:"P21",type:"外観/見学",minStay:null,timeStatus:"要実測",publicCondition:"要確認",note:"構内動線・公開条件を確認"},
{id:"B22",nodeId:"P22",type:"外観/見学",minStay:null,timeStatus:"要実測",publicCondition:"要確認",note:"構内動線・公開条件を確認"},
{id:"B24",nodeId:"P24",type:"外観確認",minStay:null,timeStatus:"要実測",publicCondition:"要確認",note:"最低成立時間を確認"},
{id:"B25",nodeId:"P25",type:"外観確認",minStay:null,timeStatus:"要実測",publicCondition:"要確認",note:"最低成立時間を確認"},
{id:"B26",nodeId:"P26",type:"外観確認",minStay:null,timeStatus:"要実測",publicCondition:"要確認",note:"最低成立時間を確認"},
{id:"H040",nodeId:"P40",type:"展示を見る・ショップを見る",minStay:null,timeStatus:"要実測",publicCondition:"営業時間要確認",note:"展示/買物を分けて実測してもよい"},
{id:"H041",nodeId:"P41",type:"井伊家・赤備え文脈を見る",minStay:15,timeStatus:"仮設定",publicCondition:"開館時間内・入館条件確認",note:"公式開館情報確認済み。15分は短時間鑑賞のMVP仮値"},
{id:"H042",nodeId:"P42",type:"ひこにゃん/HIKONEフォト撮影",minStay:null,timeStatus:"要実測",publicCondition:"設置状況要確認",note:null},
{id:"H043",nodeId:"P43",type:"マンホール撮影",minStay:null,timeStatus:"要実測",publicCondition:"屋外・位置確認",note:null},
{id:"H044",nodeId:"P44",type:"ご当地キャラ史を見る",minStay:null,timeStatus:"要実測",publicCondition:"営業/展示要確認",note:null},
{id:"H045",nodeId:"P45",type:"街並み・キャラ史を歩いて見る",minStay:null,timeStatus:"要実測",publicCondition:"屋外公開",note:"通り全体ではなく短区間行動を実測"},
{id:"H046",nodeId:"P46",type:"井伊家墓所・寺院文脈を見る",minStay:null,timeStatus:"要実測",publicCondition:"拝観条件要確認",note:null},
{id:"H047",nodeId:"P47",type:"招き猫群を見る・写真",minStay:null,timeStatus:"要実測",publicCondition:"営業/常設要確認",note:null},
{id:"H048",nodeId:"P48",type:"キャラクター商品・歴史を見る",minStay:null,timeStatus:"要実測",publicCondition:"営業状況要確認",note:null},
{id:"H049",nodeId:"P49",type:"ひこにゃんグッズを見る/購入",minStay:null,timeStatus:"要実測",publicCondition:"営業状況要確認",note:null},
{id:"H050",nodeId:"P50",type:"キャラクター飲食を購入",minStay:null,timeStatus:"要実測",publicCondition:"営業/メニュー要確認",note:"待ち時間を分離"},
{id:"H051",nodeId:"P51",type:"ひこにゃんコラボ飲食",minStay:null,timeStatus:"要実測",publicCondition:"営業/メニュー要確認",note:null},
{id:"H052",nodeId:"P52",type:"ひこにゃんコラボ飲食",minStay:null,timeStatus:"要実測",publicCondition:"営業/メニュー要確認",note:null},
{id:"H053",nodeId:"P53",type:"ひこにゃんコラボ飲食",minStay:null,timeStatus:"要実測",publicCondition:"営業/メニュー要確認",note:null},
{id:"H054",nodeId:"P54",type:"ひこにゃんコラボ飲食",minStay:null,timeStatus:"要実測",publicCondition:"営業/メニュー要確認",note:null},
{id:"H055",nodeId:"P55",type:"ひこにゃんコラボ飲食",minStay:null,timeStatus:"要実測",publicCondition:"営業/メニュー要確認",note:null},
{id:"H056",nodeId:"P56",type:"ひこにゃんコラボ飲食",minStay:null,timeStatus:"要実測",publicCondition:"営業/メニュー要確認",note:null},
{id:"H057",nodeId:"P57",type:"マンホール撮影",minStay:null,timeStatus:"要実測",publicCondition:"屋外・位置確認",note:null},
{id:"H058",nodeId:"P58",type:"ひこにゃんフォト撮影",minStay:null,timeStatus:"要実測",publicCondition:"設備要現地確認",note:null},
{id:"PH060",nodeId:"P60",type:"天守を撮影",minStay:null,timeStatus:"要実測",publicCondition:"開場条件要確認",note:null},
{id:"PH061",nodeId:"P61",type:"天秤櫓・橋・石垣を撮影",minStay:null,timeStatus:"要実測",publicCondition:"開場条件要確認",note:null},
{id:"PH062",nodeId:"P62",type:"西の丸を撮影",minStay:null,timeStatus:"要実測",publicCondition:"開場条件要確認",note:null},
{id:"PH063",nodeId:"P63",type:"庭園と天守を撮影",minStay:null,timeStatus:"要実測",publicCondition:"開園条件要確認",note:null},
{id:"PH064",nodeId:"P64",type:"内堀・石垣・橋を撮影",minStay:null,timeStatus:"要実測",publicCondition:"安全位置要確認",note:null},
{id:"PH065",nodeId:"P65",type:"松並木を撮影",minStay:null,timeStatus:"要実測",publicCondition:"屋外公開",note:null},
{id:"PH066",nodeId:"P66",type:"京橋・外堀を撮影",minStay:null,timeStatus:"要実測",publicCondition:"屋外公開",note:null},
{id:"PH067",nodeId:"P67",type:"山門・寺院建築を撮影",minStay:null,timeStatus:"要実測",publicCondition:"撮影/拝観条件要確認",note:null},
{id:"PH068",nodeId:"P68",type:"路地・板塀を撮影",minStay:5,timeStatus:"仮設定",publicCondition:"生活道路・私有地配慮",note:"屋外撮影5分のMVP仮値。住民・私有地への配慮必須"},
{id:"PH069",nodeId:"P69",type:"足軽屋敷の街並みを撮影",minStay:null,timeStatus:"要実測",publicCondition:"生活道路配慮",note:null},
{id:"PH070",nodeId:"P70",type:"けやき並木・川沿いを撮影",minStay:5,timeStatus:"仮設定",publicCondition:"屋外・天候/季節影響",note:"屋外撮影5分のMVP仮値"},
{id:"PH071",nodeId:"P71",type:"芹川と彦根城遠景を撮影",minStay:null,timeStatus:"要実測",publicCondition:"安全撮影位置要確認",note:null},
{id:"PH072",nodeId:"P72",type:"旧街道・町家を撮影",minStay:null,timeStatus:"要実測",publicCondition:"屋外公開",note:null},
{id:"PH073",nodeId:"P73",type:"仏壇街・職人町景観を撮影",minStay:null,timeStatus:"要実測",publicCondition:"店舗内は別確認",note:null},
{id:"PH074",nodeId:"P74",type:"川・橋・河川敷を撮影",minStay:null,timeStatus:"要実測",publicCondition:"河川安全/天候要確認",note:null},
{id:"PH075",nodeId:"P75",type:"湖畔の松並木を撮影",minStay:null,timeStatus:"要実測",publicCondition:"代表点要確認",note:null},
{id:"PH076",nodeId:"P76",type:"緑地・城周辺自然を撮影",minStay:null,timeStatus:"要実測",publicCondition:"屋外公開",note:null},
{id:"PH001",nodeId:"P01",type:"町家風街並みを撮影",minStay:5,timeStatus:"仮設定",publicCondition:"屋外公開",note:"短時間撮影5分のMVP仮値"},
{id:"PH002",nodeId:"P02",type:"レトロ街並みを撮影",minStay:5,timeStatus:"仮設定",publicCondition:"屋外公開",note:"短時間撮影5分のMVP仮値"},
{id:"PH011",nodeId:"P11",type:"港・船・湖を撮影",minStay:null,timeStatus:"要実測",publicCondition:"代表点/安全要確認",note:null}
];

export const photoPriority:Record<string,'A'|'B'> = {P45:'A',P24:'A',P68:'A',P70:'A',P71:'A',P72:'B',P20:'B',P66:'B'};

export const locationStatus:Record<string,string> = {
 P40:'要住所・入口点特定',P41:'要入口点特定',P42:'要現地点特定',P43:'要現地点特定',P44:'要住所・入口点特定',
 P45:'要代表点特定',P46:'要入口点特定',P47:'要住所・入口点特定',P48:'要住所・入口点特定',P49:'要住所・入口点特定',
 P50:'要住所・入口点特定',P51:'要住所・入口点特定',P52:'要住所・入口点特定',P53:'要住所・入口点特定',P54:'要住所・入口点特定',
 P55:'要住所・入口点特定',P56:'要住所・入口点特定',P57:'要現地点特定',P58:'要現地点特定',
 P60:'要撮影代表点特定',P61:'要撮影代表点特定',P62:'要撮影代表点特定',P63:'要撮影代表点特定',P64:'要撮影代表点特定',
 P65:'要撮影代表点特定',P66:'要撮影代表点特定',P67:'要入口/撮影点特定',P68:'要撮影点細分化',P69:'要撮影点細分化',
 P70:'要撮影点細分化',P71:'要撮影位置特定',P72:'要撮影点細分化',P73:'要撮影点細分化',P74:'要撮影点細分化',
 P75:'要代表点特定',P76:'要代表点特定'
};

export const nodeById=(id:string)=>nodes.find(n=>n.id===id);
export const actionsForNode=(id:string)=>actions.filter(a=>a.nodeId===id);
