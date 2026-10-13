type Pair={from:string;to:string};
function cors(res:any){res.setHeader('Access-Control-Allow-Origin',process.env.HIKONE_ALLOWED_ORIGIN||'*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');}
export default async function handler(req:any,res:any){
 cors(res);if(req.method==='OPTIONS')return res.status(204).end();if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const key=process.env.GOOGLE_MAPS_API_KEY;
 if(!key)return res.status(503).json({error:'Walking routing not configured'});
 const {pairs,names}=req.body||{};
 if(!Array.isArray(pairs)||pairs.length>40||!names||typeof names!=='object')return res.status(400).json({error:'Invalid batch'});
 const clean=(v:unknown)=>typeof v==='string'&&v.length<=20&&/^[A-Z0-9]+$/.test(v);
 const validNames=Object.entries(names).every(([id,name])=>clean(id)&&typeof name==='string'&&name.length<160&&name.includes('彦根'));
 if(!validNames||!pairs.every((p:Pair)=>clean(p?.from)&&clean(p?.to)&&typeof names[p.from]==='string'&&typeof names[p.to]==='string'))return res.status(400).json({error:'Invalid places'});
 const legs:Record<string,{seconds:number;meters:number}>={};
 // Limit parallel external calls and skip failed routes without fabricating values.
 let index=0;
 const worker=async()=>{while(index<pairs.length){
   const p=pairs[index++] as Pair;
   try{
    const response=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{
      method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.duration,routes.distanceMeters'},
      body:JSON.stringify({origin:{address:names[p.from]},destination:{address:names[p.to]},travelMode:'WALK',languageCode:'ja-JP',units:'METRIC'})
    });
    if(!response.ok)continue;
    const data=await response.json();
    const r=data?.routes?.[0];
    const seconds=Number(String(r?.duration||'').replace(/s$/,''));
    if(Number.isFinite(seconds)&&seconds>0&&Number.isFinite(r?.distanceMeters))legs[p.from+'>'+p.to]={seconds,meters:r.distanceMeters};
   }catch{/* Unavailable routes are omitted. */}
 }};
 await Promise.all(Array.from({length:Math.min(4,pairs.length)},()=>worker()));
 res.setHeader('Cache-Control','private, no-store');
 return res.status(200).json({legs});
}
