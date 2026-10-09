import { useMemo, useState } from 'react';
import { nodes, nodeTags, tagNames } from './data/dbV4';
import { visitorStory } from './data/visitorStories';
import { foodPlaces } from './data/foodPlaces';

type CatalogPlace = (typeof nodes)[number];
const interestFilters = [
  {label:'すべて',tag:''},
  {label:'ひこにゃん',tag:'T_HIKONYAN'},
  {label:'写真',tag:'T_PHOTO'},
  {label:'食・カフェ',tag:'T_FOOD'},
  {label:'街歩き',tag:'T_WALK'},
  {label:'歴史',tag:'T_HISTORY'},
  {label:'近代建築',tag:'T_MODERN'},
  {label:'琵琶湖',tag:'T_LAKE'},
  {label:'自然・景色',tag:'T_NATURE'},
];
const canonical=(place:CatalogPlace)=>place.name
 .replace('彦根城 表門券売所付近','彦根城')
 .replace('JR彦根駅 西口','彦根駅')
 .replace('夢京橋キャッスルロード北端（京橋南詰）','夢京橋キャッスルロード')
 .replace('四番町スクエア代表点','四番町スクエア');
const maps=(p:CatalogPlace)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(canonical(p)+' 滋賀県彦根市');
const isPubliclyAccessible=(p:CatalogPlace)=>p.publicStatus.includes('公開') || p.publicStatus.includes('屋外');
const cautious=(p:CatalogPlace)=>p.status!=='ACTIVE'||!isPubliclyAccessible(p) || /要確認|要現地|要安全|条件/.test(p.publicStatus);
const groupOrder=['CASTLE','CASTLE_TOWN','STATION','HANASHOBU','HONMACHI','MOTOMACHI','SERIBASHI','SERIKAWA','NANAMAGARI','LAKE_MATSUBARA'];

export default function DestinationCatalog({onBack}:{onBack:()=>void}){
 const [query,setQuery]=useState('');
 const [tag,setTag]=useState('');
 const [onlyEasy,setOnlyEasy]=useState(false);
 const [area,setArea]=useState('すべて');
 const list=useMemo(()=>{
   const text=query.trim().toLocaleLowerCase();
   return nodes.filter(p=>p.type==='poi'||p.type==='area')
     .filter(p=>!text || [p.name,p.category,p.cluster,p.note||'',...(nodeTags[p.id]||[]).map(t=>tagNames[t]||t)]
        .some(v=>v.toLocaleLowerCase().includes(text)))
     .filter(p=>!tag || (nodeTags[p.id]||[]).includes(tag))
     .filter(p=>!onlyEasy || (p.status==='ACTIVE'&&isPubliclyAccessible(p)))
     .sort((a,b)=>{
       const sa=a.status==='ACTIVE'?0:1,sb=b.status==='ACTIVE'?0:1;
       if(sa!==sb)return sa-sb;
       const ga=groupOrder.indexOf(a.cluster),gb=groupOrder.indexOf(b.cluster);
       return (ga<0?99:ga)-(gb<0?99:gb)||a.name.localeCompare(b.name,'ja');
     });
 },[query,tag,onlyEasy]);
 const foodFiltered=foodPlaces.filter(p=>(area==='すべて'||area===p.area)&&(!query.trim()||[p.name,p.category,p.area,p.story].some(v=>v.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())))&&(!tag||tag==='T_FOOD'||tag==='T_SHOP')&&!onlyEasy);
 return <section className="catalog-page">
   <p className="eyebrow">彦根の行き先を探す</p>
   <h2>次は、どんな彦根を見る？</h2>
   <p>寄り道の所要時間がまだ分からない場所も含め、登録された行き先を探せます。</p>
   <label className="catalog-search-label" htmlFor="destination-query">行き先・キーワード</label>
   <input id="destination-query" className="catalog-search" type="search" placeholder="例：仏壇、ひこにゃん、芹川、近代建築" value={query} onChange={e=>setQuery(e.target.value)}/>
   <div className="catalog-filters" aria-label="興味で絞り込む">
    {interestFilters.map(f=><button key={f.label} className={tag===f.tag?'catalog-filter active':'catalog-filter'} onClick={()=>setTag(f.tag)} aria-pressed={tag===f.tag}>{f.label}</button>)}
   </div>
   <div className="catalog-filters" aria-label="エリアで絞り込む">
    {['すべて','花しょうぶ通り','銀座商店街','彦根駅周辺'].map(v=><button key={v} className={area===v?'catalog-filter active':'catalog-filter'} onClick={()=>setArea(v)} aria-pressed={area===v}>{v}</button>)}
   </div>
   <label className="catalog-check"><input type="checkbox" checked={onlyEasy} onChange={e=>setOnlyEasy(e.target.checked)}/> 公開場所として登録済みの候補だけ見る</label>
   <p className="catalog-count">{area==='すべて'?'行き先 '+list.length+'件・食のお店 '+foodFiltered.length+'件':'食のお店 '+foodFiltered.length+'件'}</p>
   {foodFiltered.length>0&&<><h3>おいしい寄り道を探す</h3><p className="note">お店は公開情報から登録した候補です。来店前に営業日・メニューをご確認ください。</p>
   <div className="catalog-grid">{foodFiltered.map(p=><article className="catalog-item" key={p.id}>
    <div className="catalog-item-head"><h3>{p.name}</h3><span className="catalog-unverified">営業状況は要確認</span></div>
    <p className="catalog-category">{p.area} ・ {p.category}</p>
    <p className="catalog-desc">{p.story}</p>
    <a className="story-source" href={p.source} target="_blank" rel="noopener noreferrer">店舗・紹介情報を見る ↗</a>
    <a className="catalog-map-link" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.name+' '+p.address)} target="_blank" rel="noopener noreferrer">Google Mapsで場所を見る ↗</a>
   </article>)}</div></>}
   {area==='すべて'&&<><h3>観光スポットも探す</h3><div className="catalog-grid">{list.map(p=><article className="catalog-item" key={p.id}>
     <div className="catalog-item-head"><h3>{canonical(p)}</h3>{cautious(p)&&<span className="catalog-unverified">詳細確認中</span>}</div>
     <p className="catalog-category">{p.category}</p>
     <p className="catalog-desc">{visitorStory(p.id,p.category).text}</p>
     {visitorStory(p.id,p.category).source&&<a className="story-source" href={visitorStory(p.id,p.category).source} target="_blank" rel="noopener noreferrer">このお話の参考資料を見る ↗</a>}
     <div className="catalog-tags">{(nodeTags[p.id]||[]).slice(0,3).map(t=><span key={t}>{tagNames[t]||t}</span>)}</div>
     <a className="catalog-map-link" href={maps(p)} target="_blank" rel="noopener noreferrer">Google Mapsで場所を見る ↗</a>
   </article>)}</div></>}
   {!list.length&&!foodFiltered.length&&<p>該当する場所が見つかりません。検索語やカテゴリを変更してください。</p>}
   <p className="note">飲食店の滞在時間・待ち時間は未計測のため、現時点では時間付きの自動推薦には含めません。</p>
   <p className="note">この一覧は行き先を探すためのものです。地図は地名検索で開きます。正確な入口、営業・公開状況、寄り道の所要時間を保証するものではありません。</p>
   <button className="secondary" onClick={onBack}>ホームへ戻る</button>
 </section>;
}
