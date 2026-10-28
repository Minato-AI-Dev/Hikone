// Temporary maintenance runner: never installs package lifecycle scripts or reads credentials.
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const audit=()=>{const r=spawnSync('npm',['audit','--json'],{encoding:'utf8',maxBuffer:10*1024*1024});try{return JSON.parse(r.stdout);}catch{throw new Error('Could not read npm audit result');}};
const before=audit();
const repair=spawnSync('npm',['audit','fix','--package-lock-only','--ignore-scripts'],{encoding:'utf8',maxBuffer:10*1024*1024});
const after=audit();
console.log('HIKONE_DEPENDENCY_REPORT='+JSON.stringify({before,after,repairExit:repair.status,package:JSON.parse(readFileSync('package.json','utf8')),lock:JSON.parse(readFileSync('package-lock.json','utf8'))}));
