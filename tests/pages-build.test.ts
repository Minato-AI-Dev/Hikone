import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';
const check=(endpoint:string,demo='false')=>spawnSync(process.execPath,['scripts/check-pages-env.mjs'],{env:{...process.env,VITE_WALKING_ROUTE_ENDPOINT:endpoint,VITE_ROUTING_DEMO:demo},encoding:'utf8'});
it.each(['','/api/walking-routes','http://example.com/api/walking-routes','https://localhost/api/walking-routes','https://example.com/other'])('rejects invalid Pages endpoint %s',value=>{expect(check(value).status).toBe(1)});
it('accepts HTTPS backend and rejects demo publishing',()=>{expect(check('https://api.example/api/walking-routes').status).toBe(0);expect(check('https://api.example/api/walking-routes','true').status).toBe(1)});
