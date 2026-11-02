// The same checks gate CI, Pages and Vercel. Unit tests receive no deployment secrets.
import {spawnSync} from 'node:child_process';
const clean={PATH:process.env.PATH,HOME:process.env.HOME,CI:'true',VERCEL_ENV:'test'};
for(const args of [['audit','--audit-level=moderate'],['test'],['run','typecheck:api']]){
 const r=spawnSync('npm',args,{stdio:'inherit',env:clean});
 if(r.status!==0)process.exit(r.status??1);
}
