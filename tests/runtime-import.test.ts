import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, it } from 'vitest';
it('compiled API modules can load in the Node server runtime',()=>{
  const dir=mkdtempSync(join(tmpdir(),'hikone-runtime-'));
  try {
    const build=spawnSync(process.execPath,[join(process.cwd(),'node_modules','typescript','bin','tsc'),'-p','tsconfig.api.json','--noEmit','false','--outDir',dir],{encoding:'utf8'});
    expect(build.status,build.stderr+build.stdout).toBe(0);
    writeFileSync(join(dir,'package.json'),'{"type":"module"}');
    const moduleUrl=pathToFileURL(join(dir,'api','walking-routes.js')).href;
    const aiUrl=pathToFileURL(join(dir,'api','hikone-ai.js')).href;
    const result=spawnSync(process.execPath,['--input-type=module','-e',`await import(${JSON.stringify(moduleUrl)}); await import(${JSON.stringify(aiUrl)});`],{encoding:'utf8'});
    expect(result.status,result.stderr).toBe(0);
  } finally {rmSync(dir,{recursive:true,force:true});}
},20000);
