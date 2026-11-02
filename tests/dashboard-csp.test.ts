import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import dashboard from '../api/analytics-dashboard';
it('allows only the exact dashboard script by CSP hash',()=>{
 let html='';const headers:Record<string,string>={};
 const res={setHeader(k:string,v:string){headers[k]=v;},status(){return res;},json(){},end(body?:string){html=body||'';}};
 dashboard({method:'GET',headers:{}},res);
 const script=html.match(/<script>([\s\S]*?)<\/script>/)![1];
 const expected=createHash('sha256').update(script).digest('base64');
 expect(headers['Content-Security-Policy']).toContain("script-src 'sha256-"+expected+"'");
 expect(headers['Content-Security-Policy']).not.toContain("script-src 'unsafe-inline'");
});
