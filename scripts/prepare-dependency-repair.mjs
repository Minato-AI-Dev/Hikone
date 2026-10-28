import {spawnSync} from 'node:child_process';
import {readFileSync,unlinkSync} from 'node:fs';
const run=args=>spawnSync('npm',args,{encoding:'utf8',maxBuffer:10*1024*1024});
const before=JSON.parse(run(['audit','--json']).stdout);
unlinkSync('package-lock.json');
const install=run(['install','--package-lock-only','--ignore-scripts']);
if(install.status!==0){console.error(install.stderr);process.exit(1);}
const after=JSON.parse(run(['audit','--json']).stdout);
console.log('HIKONE_DEPENDENCY_REPORT='+JSON.stringify({before,after,package:JSON.parse(readFileSync('package.json','utf8')),lock:JSON.parse(readFileSync('package-lock.json','utf8'))}));
