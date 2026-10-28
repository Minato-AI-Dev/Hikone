// Runs only against an explicitly identified, empty test namespace.
// Never print request headers, credentials, response bodies or protected URLs.
import {pathToFileURL} from 'node:url';
export async function verifyAnalyticsPreview(env=process.env,request=fetch) {
 const required=['HIKONE_ANALYTICS_TEST_BASE_URL','HIKONE_ANALYTICS_TEST_RUN','HIKONE_ANALYTICS_ADMIN_TOKEN','HIKONE_ALLOWED_ORIGIN'];
 if(required.some(k=>!env[k]))throw new Error('Required verification environment variables are missing');
 const base=new URL(env.HIKONE_ANALYTICS_TEST_BASE_URL);
 if(base.protocol!=='https:'||base.origin!==env.HIKONE_ANALYTICS_TEST_BASE_URL||!base.hostname.endsWith('.vercel.app'))throw new Error('Expected a Vercel HTTPS origin');
 const run=env.HIKONE_ANALYTICS_TEST_RUN;
 if(!/^test-[a-z0-9-]{8,64}$/.test(run))throw new Error('Invalid test run');
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'});
 const now=new Date(),day=fmt.format(now);
 // Avoid date rollover during this short test.
 const japanSecond=Math.floor(now.getTime()/1000+9*3600)%86400;
 if(japanSecond<60||japanSecond>86340)throw new Error('Retry away from Japan midnight');
 const bypass=env.VERCEL_AUTOMATION_BYPASS_SECRET;
 async function call(path,method='GET',body,authenticated=true){
  const headers={...(bypass?{'x-vercel-protection-bypass':bypass}:{}),...(authenticated?{Authorization:'Bearer '+env.HIKONE_ANALYTICS_ADMIN_TOKEN}:{})};
  if(body){headers['Content-Type']='application/json';headers.Origin=env.HIKONE_ALLOWED_ORIGIN;}
  const r=await request(base.origin+path,{method,headers,body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error('Verification request failed: HTTP '+r.status);
  return r.json();
 }
 const path='/api/analytics-report?day='+encodeURIComponent(day);
 function assertReport(r){if(r.testRun!==run||r.day!==day||!r.counts||typeof r.counts!=='object')throw new Error('Refusing to write: server did not confirm the isolated test namespace');}
 const before=await call(path);assertReport(before);
 if(!Object.values(before.counts).every(n=>n===0))throw new Error('Use a new, empty test run; existing data will not be deleted');
 const events=['recommendation_viewed','recommendation_selected','experience_completed'];
 let passed=false;
 try {
  for(const event of events){
   if(fmt.format(new Date())!==day)throw new Error('Japan date changed during verification');
   await call('/api/analytics-collect','POST',{event},false);
  }
  const after=await call(path);assertReport(after);
  if(Object.keys(before.counts).length!==18||!Object.entries(after.counts).every(([event,n])=>n===(events.includes(event)?1:0)))throw new Error('Daily test counts did not match the three posted events');
  passed=true;
 }finally{
  const cleanup=await call(path,'DELETE');
  if(cleanup.testRun!==run)throw new Error('Test cleanup could not be confirmed');
  const afterCleanup=await call(path);assertReport(afterCleanup);
  if(!Object.values(afterCleanup.counts).every(n=>n===0))throw new Error('Test counts remain after cleanup');
 }
 return {collection:passed,dailyCounts:passed,cleanup:true,researchDataWritten:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 verifyAnalyticsPreview().then(result=>console.log(JSON.stringify(result))).catch(error=>{
  console.error(error instanceof Error?error.message:'Verification failed');process.exitCode=1;
 });
}
