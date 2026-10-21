// Produce a single dependency-free Worker from the maintained sources.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const assets={};
for(const [path,file,type] of [['/','index.html','text/html; charset=utf-8'],['/app.js','app.js','text/javascript; charset=utf-8'],['/style.css','style.css','text/css; charset=utf-8'],['/favicon.svg','favicon.svg','image/svg+xml']])assets[path]={body:await readFile('web/'+file,'utf8'),type};
const modules=await Promise.all(['brain.mjs','demo.mjs','hosted.mjs'].map(file=>readFile(file,'utf8')));
const source=modules.map(text=>text.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n')+'\nconst dashboard=createHostedDashboard('+JSON.stringify(assets)+');\nexport default dashboard;\n';
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',source);await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json','utf8'));
const result=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));assert.equal(typeof result.default?.fetch,'function');
console.log('Built and validated the hosted Worker.');
