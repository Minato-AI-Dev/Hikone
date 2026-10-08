import { Hook } from '../types';

export const hooks: Hook[] = [
  { id:'H001', placeId:'P003', interests:['街歩き','買い物'], headline:'帰り道に、城下町のにぎわいをひとつ足す。', body:'目的地を変えず、通りの表情を短時間で拾う寄り道です。', hookType:'discovery', verificationStatus:'sample', active:true },
  { id:'H002', placeId:'P004', interests:['食','買い物'], headline:'帰る前に、彦根らしい一品をひとつ選ぶ。', body:'今のルートに、小さな食・買い物体験を入れます。', hookType:'taste', verificationStatus:'sample', active:true },
  { id:'H003', placeId:'P005', interests:['歴史','街歩き','写真'], headline:'城の外で、暮らしていた人の彦根を見る。', body:'城下町の生活側へ視点をずらす寄り道です。', hookType:'story', verificationStatus:'sample', active:true },
  { id:'H004', placeId:'P006', interests:['街歩き','地元らしさ','写真'], headline:'観光地っぽくない彦根を、少しだけ通って帰る。', body:'生活に近い町の表情を探します。', hookType:'local-life', verificationStatus:'sample', active:true },
  { id:'H005', placeId:'P007', interests:['ひこにゃん・キャラクター'], headline:'ひこにゃんから、彦根のキャラクター文化へ広げる。', body:'キャラクターへの興味を入口に、城だけではない彦根へつなぐ候補です。', hookType:'discovery', verificationStatus:'sample', active:true },
  { id:'H006', placeId:'P007', interests:['写真','街歩き','地元らしさ'], headline:'城前とは違う町並みを一枚だけ探す。', body:'写真をきっかけに、少し外側の彦根へ歩くフックです。', hookType:'visual', verificationStatus:'sample', active:true },
  { id:'H007', placeId:'P008', interests:['工芸','街歩き','写真'], headline:'城下町の先にある、ものづくりの気配を見る。', body:'通りや仕事場の気配を発見する体験にします。', hookType:'craft', verificationStatus:'sample', active:true },
  { id:'H008', placeId:'P003', interests:['写真'], headline:'観光写真とは違う一枚を探す。', body:'建物や通りの細部を自分で見つける短い写真体験です。', hookType:'visual', verificationStatus:'sample', active:true },
  { id:'H009', placeId:'P004', interests:['食'], headline:'駅へ向かう前に、ひと口だけ彦根を足す。', body:'長い食事ではなく、残り時間に入る小さな食体験です。', hookType:'taste', verificationStatus:'sample', active:true },
];

export const hooksForPlace=(placeId:string)=>hooks.filter(h=>h.placeId===placeId&&h.active);
