import {describe,expect,it} from 'vitest';
import dashboard from '../api/analytics-dashboard';
import type {ApiRequest,ApiResponse} from '../server/http';
function response(){
 let status=200,body='';
 const headers:Record<string,string>={};
 const res={
  setHeader(key:string,value:string){headers[key]=value;return res;},
  status(code:number){status=code;return res;},
  json(value:unknown){body=JSON.stringify(value);return res;},
  end(value?:string){body=value??'';return res;}
 } as ApiResponse&{end(value?:string):unknown};
 return {res,read:()=>({status,body,headers})};
}
describe('developer dashboard',()=>{
 it('serves a static dashboard without embedding the admin token',()=>{
  const r=response();
  dashboard({method:'GET',headers:{}} as ApiRequest,r.res);
  const output=r.read();
  expect(output.status).toBe(200);
  expect(output.headers['Content-Type']).toContain('text/html');
  expect(output.body).toContain('直近7日間');
  expect(output.body).toContain('/api/analytics-report?day=');
  expect(output.body).not.toContain('HIKONE_ANALYTICS_ADMIN_TOKEN');
 });
 it('does not accept non-GET methods',()=>{
  const r=response();dashboard({method:'POST',headers:{}} as ApiRequest,r.res);
  expect(r.read().status).toBe(405);
 });
});
