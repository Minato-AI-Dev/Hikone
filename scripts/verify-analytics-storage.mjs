// Run explicitly in an isolated Preview build, never in production.
// Exercises the real handlers against Redis without exporting any secret values.
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomBytes} from 'node:crypto';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';
import assert from 'node:assert/strict';
const run=process.env.HIKONE_ANALYTICS_TEST_RUN;
if(process.env.VERCEL_ENV!=='preview'||!run||!/^test-[a-z0-9-]{8,64}$/.test(run))throw new Error('Only an explicitly isolated Preview can run storage verification');
const temp=await mkdtemp(join(tmpdir(),'hikone-test-'));
const originalToken=process.env.HIKONE_ANALYTICS_ADMIN_TOKEN;
process.env.HIKONE_ANALYTICS_ADMIN_TOKEN=randomBytes(32).toString('hex');
const files=['server/http','server/aggregateAnalytics','server/rateLimit','api/analytics-collect','api/analytics-report','api/analytics-dashboard'];
const res=()=>({code:200,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;},end(v){this.body=v;return this;}});
let collect,report,metricKey,redisCommand,AGGREGATE_EVENTS,day;
const touchedDays=new Set();
let cleanupRequired=false,checks=0;
const req=(method='GET',token=process.env.HIKONE_ANALYTICS_ADMIN_TOKEN)=>({method,headers:{authorization:'Bearer '+token},query:{day}});
const check=(condition,message)=>{assert.ok(condition,message);checks++;};
async function readReport(){const r=res();await report(req(),r);assert.equal(r.code,200);assert.equal(r.body.testRun,run);return r.body.counts;}
try{
 await writeFile(join(temp,'package.json'),'{"type":"module"}');
 for(const file of files){
  const source=await readFile(file+'.ts','utf8');
  const target=join(temp,file+'.js');await mkdir(dirname(target),{recursive:true});
  await writeFile(target,transpileModule(source,{compilerOptions:{module:ModuleKind.ESNext,target:ScriptTarget.ES2022}}).outputText);
 }
 collect=(await import(pathToFileURL(join(temp,'api/analytics-collect.js')).href)).default;
 report=(await import(pathToFileURL(join(temp,'api/analytics-report.js')).href)).default;
 ({metricKey,redisCommand,AGGREGATE_EVENTS}=await import(pathToFileURL(join(temp,'server/aggregateAnalytics.js')).href));
 const {dayInTokyo}=await import(pathToFileURL(join(temp,'server/aggregateAnalytics.js')).href);
 day=dayInTokyo(new Date());
 const japanSecond=Math.floor(Date.now()/1000+9*3600)%86400;
 if(japanSecond<60||japanSecond>86280)throw new Error('Retry away from Japan midnight');
 const before=await readReport();
 check(Object.keys(before).length===18&&Object.values(before).every(n=>n===0),'Test run must be new and empty');
 const researchKeys=AGGREGATE_EVENTS.map(event=>'hikone:aggregate:v1:'+day+':'+event);
 const beforeResearch=await redisCommand(['MGET',...researchKeys]);
 const submitted=['recommendation_viewed','recommendation_selected','experience_completed'];
 touchedDays.add(day);cleanupRequired=true;
 for(const event of submitted){
  const request={method:'POST',headers:{origin:process.env.HIKONE_ALLOWED_ORIGIN,'content-type':'application/json','x-vercel-forwarded-for':'192.0.2.1'},body:{event}};
  const r=res();await collect(request,r);check(r.code===200,'Collector must accept valid test event');
 }
 const counts=await readReport();
 check(Object.entries(counts).every(([event,n])=>n===(submitted.includes(event)?1:0)),'Redis daily counts must match the submitted events');
 for(const event of submitted){const ttl=await redisCommand(['TTL',metricKey(day,event)]);check(typeof ttl==='number'&&ttl>0&&ttl<=86400,'Test counter must expire within 24h');}
 const invalid=res();await report(req('DELETE','invalid-test-token'),invalid);check(invalid.code===401,'Cleanup requires authentication');
 const dashboard=(await import(pathToFileURL(join(temp,'api/analytics-dashboard.js')).href)).default;
 const html=res();dashboard({method:'GET',headers:{}},html);check(html.code===200&&html.body.includes('テスト専用'),'Dashboard must visibly identify the test run');
 // Exercise the dashboard script with handler-backed data, never a real admin token.
 const {JSDOM}=await import('jsdom');
 const script=html.body.match(/<script>([\s\S]*?)<\/script>/)[1];
 const dom=new JSDOM(html.body.replace(/<script>[\s\S]*?<\/script>/,''),{url:'https://test.example/api/analytics-dashboard',runScripts:'outside-only'});
 let blob,downloaded=false;
 dom.window.fetch=async(url,options)=>{
  const request={method:'GET',headers:{authorization:options.headers.Authorization},query:{day:new URL(url,'https://test.example').searchParams.get('day')}};
  const r=res();await report(request,r);return {status:r.code,ok:r.code===200,json:async()=>r.body};
 };
 dom.window.Blob=Blob;dom.window.URL.createObjectURL=value=>{blob=value;return 'blob:test';};dom.window.URL.revokeObjectURL=()=>{};
 dom.window.HTMLAnchorElement.prototype.click=function(){downloaded=true;};
 dom.window.eval(script);
 const document=dom.window.document;document.getElementById('token').value=process.env.HIKONE_ANALYTICS_ADMIN_TOKEN;
 document.getElementById('day').value=day;document.getElementById('load').click();
 const deadline=Date.now()+30000;
 while(document.getElementById('load').disabled&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));
 check(document.getElementById('status').textContent==='7日間の集計を表示しました。','Dashboard must load seven days from the real report handler');
 check(document.querySelectorAll('#table tbody tr').length===7,'Dashboard must display seven daily rows');
 check(document.querySelectorAll('#chart .bar').length===21,'Dashboard must render three bars for each of seven days');
 document.getElementById('download').click();
 check(downloaded&&blob,'Dashboard CSV download must produce a file');
 const csv=await blob.text();check(csv.split('\r\n').length===8&&csv.includes(day),'CSV must contain a header and seven daily rows');
 check(dom.window.localStorage.length===0&&dom.window.sessionStorage.length===0&&!dom.window.location.href.includes(process.env.HIKONE_ANALYTICS_ADMIN_TOKEN),'Token must not be stored or put in the URL');
 dom.window.close();
 const afterResearch=await redisCommand(['MGET',...researchKeys]);
 // Concurrent real visitors may increase research counts; this verifier never writes those keys.
 console.log(JSON.stringify({storage:'passed',handlerCollection:'passed',dashboardScript:'passed',checks,researchSnapshotUnchanged:JSON.stringify(beforeResearch)===JSON.stringify(afterResearch)}));
}catch{
 console.error('Isolated analytics verification failed; no credential values are logged.');
 process.exitCode=1;
}finally{
 if(cleanupRequired&&report){
  try{
   const {dayInTokyo}=await import(pathToFileURL(join(temp,'server/aggregateAnalytics.js')).href);
   touchedDays.add(dayInTokyo(new Date()));
   for(const testDay of touchedDays){
    day=testDay;const r=res();await report(req('DELETE'),r);assert.equal(r.code,200);assert.equal(r.body.testRun,run);
    const counts=await readReport();assert.ok(Object.values(counts).every(n=>n===0));
   }
   console.log(JSON.stringify({cleanup:'passed',remainingTestEventCounts:0}));
  }catch{console.error('Isolated test cleanup failed; event keys retain the 24h expiry.');process.exitCode=1;}
 }
 if(originalToken===undefined)delete process.env.HIKONE_ANALYTICS_ADMIN_TOKEN;else process.env.HIKONE_ANALYTICS_ADMIN_TOKEN=originalToken;
 await rm(temp,{recursive:true,force:true});
}
