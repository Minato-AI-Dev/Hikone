import {useRef,useState} from 'react';
import {shoppingPlaces} from './data/shoppingPlaces';
import type {ShopHoursResult} from '../server/shopHours';

const label=(r?:ShopHoursResult)=>r?.status==='scheduled_open'?'取得時点では営業中':
 r?.status==='scheduled_closed'?'取得時点では営業時間外':'営業状況は未確認';

export default function ShopHoursPanel(){
 const [statuses,setStatuses]=useState<Record<string,ShopHoursResult>>({});
 const [checking,setChecking]=useState(false);
 const [notice,setNotice]=useState('店舗別の入口・滞在時間は未検証です。ここに表示する店舗は、時間付きの推薦候補ではありません。');
 const pending=useRef<AbortController|null>(null);
 const check=async()=>{
  if(checking)return;
  const endpoint=import.meta.env.VITE_SHOP_HOURS_ENDPOINT?.trim()||(import.meta.env.DEV?'/api/shop-hours':'');
  if(!endpoint){setNotice('営業情報の自動確認は現在設定されていません。各店舗の公式掲載情報をご確認ください。');return;}
  pending.current?.abort();
  const controller=new AbortController();pending.current=controller;setChecking(true);
  setStatuses({});setNotice('営業状況を確認しています…');
  try{
   const response=await fetch(endpoint,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({shopIds:shoppingPlaces.map(shop=>shop.id)}),signal:controller.signal
   });
   if(!response.ok)throw new Error('Status unavailable');
   const data:unknown=await response.json();
   if(!data||typeof data!=='object'||!('results' in data)||!Array.isArray(data.results))throw new Error('Invalid response');
   const result:Record<string,ShopHoursResult>={};
   for(const row of data.results){
    if(!row||typeof row!=='object'||!('shopId' in row)||typeof row.shopId!=='string'||!shoppingPlaces.some(shop=>shop.id===row.shopId))continue;
    if(!('status' in row)||!['scheduled_open','scheduled_closed','unknown'].includes(String(row.status)))continue;
    result[row.shopId]=row as ShopHoursResult;
   }
   if(!controller.signal.aborted){
    setStatuses(result);
    setNotice('Google Placesの取得時点の参考情報です。到着時の営業・臨時休業は保証しません。');
   }
  }catch{
   if(!controller.signal.aborted){setStatuses({});setNotice('営業状況を取得できませんでした。公式情報や店舗へご確認ください。');}
  }finally{if(!controller.signal.aborted)setChecking(false);}
 };
 return <div className="shop-hours-panel">
  <details>
   <summary>四番町スクエアのお店の営業時間を確認する（参考情報）</summary>
   <p className="note">営業中の表示があっても、そのお店までの徒歩時間やお買物の滞在時間は計算していません。</p>
   <button type="button" className="secondary" disabled={checking} onClick={check}>{checking?'確認中…':'最新の掲載営業状況を確認する'}</button>
   <p role="status" className="note">{notice}</p>
   <p className="maps-attribution" translate="no">Google Maps</p>
   <div className="catalog-grid">
    {shoppingPlaces.map(shop=>{
     const status=statuses[shop.id];
     const checked=status?.checkedAt?new Date(status.checkedAt):null;
     return <article className="catalog-item" key={shop.id}>
      <div className="catalog-item-head"><h3>{shop.name}</h3><span className="catalog-unverified">{label(status)}</span></div>
      <p className="catalog-desc">{shop.product}</p>
      <p>掲載営業時間：{shop.publishedHours}</p>
      <p className="note">定休日：{shop.publishedClosures}</p>
      {status&&<p className="note">{status.reason}{checked&&Number.isFinite(checked.getTime())?'（取得：'+checked.toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})+'）':''}</p>}
      <a className="story-source" href={shop.source} target="_blank" rel="noopener noreferrer">店舗の掲載情報を見る</a>
      <a className="catalog-map-link" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(shop.name+' '+shop.address)} target="_blank" rel="noopener noreferrer">Google Mapsで所在地を検索</a>
     </article>;
    })}
   </div>
  </details>
 </div>;
}
