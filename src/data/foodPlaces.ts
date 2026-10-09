// Publicly listed dining and food-shopping destinations. No inferred opening status or walking-time estimates.
export type FoodPlace={id:string;name:string;category:string;area:string;address:string;story:string;source:string;kind:'restaurant'|'sweets'|'shop';verified:'official'|'association'|'thirdparty'};
export const foodPlaces:FoodPlace[]=[
{id:'F001',name:'中国料理 招禄',category:'四川料理・中華',area:'花しょうぶ通り',address:'滋賀県彦根市河原2-2-6',story:'四川料理をベースにした、花しょうぶ通りの中華料理店。香りや辛さを楽しむ一皿で、城下町の散策においしい寄り道を。',source:'https://r.goope.jp/shoroku/about',kind:'restaurant',verified:'official'},
{id:'F002',name:'近江野菜・彩菜',category:'地元野菜・食品',area:'花しょうぶ通り',address:'滋賀県彦根市河原2-3-8',story:'彦根の旅に、近江の野菜との出会いを。食卓に持ち帰りたくなる地元食材を探してみよう。',source:'https://www.hikone-kiina.jp/member/hanashobu/',kind:'shop',verified:'association'},
{id:'F003',name:'みんなの食堂',category:'食堂',area:'花しょうぶ通り',address:'滋賀県彦根市河原1-2-7',story:'花しょうぶ通りで見つける、町の食堂。何が食べられるかは営業情報を確かめてからのお楽しみ。',source:'https://www.hikone-kiina.jp/member/hanashobu/',kind:'restaurant',verified:'association'},
{id:'F004',name:'Gelateria Azzurro',category:'ジェラート',area:'銀座商店街',address:'滋賀県彦根市銀座町4-27',story:'世界大会で優勝した職人が手がけるジェラート。近江米や彦根梨など、滋賀の食材がひんやり甘い一口に。今日の味は何だろう？',source:'https://www.youtube.com/watch?v=fM2M7wHWwCU',kind:'sweets',verified:'official'},
{id:'F005',name:'季節のお菓子とおやつ gatto',category:'焼き菓子・洋菓子',area:'銀座商店街',address:'滋賀県彦根市銀座町1-6',story:'明治時代の洋裁店が、甘い香りの菓子店に。発酵バターのスコーンや季節のタルト、おとうふシフォン。古い町家で今日のおやつを選ぶ楽しみ。',source:'https://gatto.in/',kind:'sweets',verified:'official'},
{id:'F006',name:'らーめん本気',category:'ラーメン・ちゃんぽん',area:'銀座商店街',address:'滋賀県彦根市銀座町1-6',story:'「本気」と書いて「マジ」。ラーメンやちゃんぽんで、銀座の町歩きに腹ごしらえを。',source:'https://webhikone.com/men-maji/',kind:'restaurant',verified:'thirdparty'},
{id:'F007',name:'旬菜UEKi（旬菜うえき）',category:'飲食店',area:'銀座商店街',address:'滋賀県彦根市銀座町5-2',story:'銀座商店街の飲食店。料理や利用条件の詳細は、お店の最新情報を確認してから訪れたい。',source:'https://www.hikone-kiina.jp/cp/',kind:'restaurant',verified:'association'},
{id:'F008',name:'近江ちゃんぽん亭 彦根駅前本店',category:'近江ちゃんぽん',area:'彦根駅周辺',address:'滋賀県彦根市旭町9-6',story:'1963年、彦根の小さな麺類食堂から始まった近江ちゃんぽん。黄金色の和風だしとたっぷり野菜。彦根生まれの熱々の一杯で旅を締めくくろう。',source:'https://chanpontei.com/about-us/',kind:'restaurant',verified:'official'},
{id:'F009',name:'小林製菓舗',category:'和菓子',area:'彦根駅周辺',address:'滋賀県彦根市佐和町6-5',story:'駅と城下町のあいだで、おやつやお土産を探すなら。町の和菓子屋に立ち寄って、彦根の甘い思い出をひとつ。',source:'https://www.hikone-kiina.jp/member/ekimae/',kind:'sweets',verified:'association'}
];
