export type ApiRequest = { method?:string; headers:Record<string,string|string[]|undefined>; body?:unknown };
export type ApiResponse = { setHeader(name:string,value:string):unknown; status(code:number):ApiResponse; json(body:unknown):unknown; end():unknown };
export function header(req:ApiRequest,name:string):string { const v=req.headers[name];return typeof v==='string'?v:''; }
export function isRecord(v:unknown):v is Record<string,unknown> { return typeof v==='object'&&v!==null&&!Array.isArray(v); }
export function prepareJson(req:ApiRequest,res:ApiResponse):boolean {
  res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');res.setHeader('X-Content-Type-Options','nosniff');
  const allowed=process.env.HIKONE_ALLOWED_ORIGIN;
  if(!allowed || !/^https?:\/\/[^/]+$/.test(allowed)) {res.status(503).json({error:'API not configured'});return false;}
  if(header(req,'origin')!==allowed) {res.status(403).json({error:'Origin not allowed'});return false;}
  res.setHeader('Access-Control-Allow-Origin',allowed);res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  if(req.method==='OPTIONS') {res.status(204).end();return false;}
  if(req.method!=='POST') {res.setHeader('Allow','POST, OPTIONS');res.status(405).json({error:'Method not allowed'});return false;}
  if(header(req,'content-type').split(';')[0].trim().toLowerCase()!=='application/json') {res.status(415).json({error:'JSON required'});return false;}
  try {
    const size=Buffer.byteLength(JSON.stringify(req.body) ?? ''), declared=Number(header(req,'content-length')||0);
    if(size>16384 || !Number.isFinite(declared) || declared>16384) {res.status(413).json({error:'Request too large'});return false;}
  } catch {res.status(400).json({error:'Invalid JSON'});return false;}
  return true;
}
