import test from 'node:test';
import assert from 'node:assert/strict';
import {createHostedDashboard} from './hosted.mjs';
const origin='https://private.example';
const sources=[{id:'plan',domain:'life',label:'Plan',path:'plan.md'}];
const env={BRAIN_REPO:'example/vault',GITHUB_TOKEN:'test-only-secret',BRAIN_SOURCES:JSON.stringify(sources)};
function request(path,options={}){return new Request(origin+path,{...options,headers:{'oai-authenticated-user-id':'owner',Origin:origin,'Content-Type':'application/json',...options.headers}});}
test('hosted APIs require trusted platform identity and never disclose the token',async()=>{
 const worker=createHostedDashboard({});
 const response=await worker.fetch(new Request(origin+'/api/brain'),env);
 assert.equal(response.status,401);assert.ok(!(await response.text()).includes(env.GITHUB_TOKEN));
});
test('hosted sample mode is labelled, needs no GitHub call and cannot write',async()=>{
 let calls=0;const worker=createHostedDashboard({},async()=>{calls++;throw new Error('Must not call GitHub');});
 const response=await worker.fetch(request('/api/brain'),{DASHBOARD_DEMO:'1'});const data=await response.json();
 assert.equal(data.demo,true);assert.equal(data.hostedAuth,true);assert.equal(data.writable,false);assert.equal(calls,0);
 assert.equal((await worker.fetch(request('/api/capture',{method:'POST',body:'{}'}),{DASHBOARD_DEMO:'1'})).status,403);
});
test('hosted write CSRF and read-only mode fail before provider access',async()=>{
 let calls=0;const worker=createHostedDashboard({},async()=>{calls++;throw new Error('Must not call GitHub');});
 assert.equal((await worker.fetch(request('/api/task',{method:'POST',headers:{Origin:'https://other.example'},body:'{}'}),env)).status,403);
 assert.equal((await worker.fetch(request('/api/task',{method:'POST',body:'{}'}),{...env,BRAIN_READ_ONLY:'1'})).status,403);assert.equal(calls,0);
});
test('hosted setup stays empty until private connection is configured',async()=>{
 const data=await (await createHostedDashboard({}).fetch(request('/api/brain'))).json();
 assert.equal(data.setupRequired,true);assert.equal(data.writable,false);assert.deepEqual(data.notes,[]);
});
test('hosted stale SHA cannot write; Unicode content is verified at its exact commit',async()=>{
 let text='# Plan\n- [ ] Café — keep this 🌱\n',sha='first',writes=0,verifiedAt='';
 const provider=async(url,options={})=>{
  if(options.method==='PUT'){const input=JSON.parse(options.body);assert.equal(input.sha,sha);writes++;text=Buffer.from(input.content,'base64').toString('utf8');sha='second';return Response.json({content:{sha},commit:{sha:'saved-commit'}});}
  if(new URL(url).searchParams.get('ref')==='saved-commit')verifiedAt='saved-commit';
  return Response.json({sha,encoding:'base64',content:Buffer.from(text).toString('base64'),size:Buffer.byteLength(text)});
 };
 const worker=createHostedDashboard({},provider);
 let response=await worker.fetch(request('/api/task',{method:'POST',body:JSON.stringify({sourceId:'plan',sha:'stale',line:1,done:true})}),env);
 assert.equal(response.status,409);assert.equal(writes,0);
 response=await worker.fetch(request('/api/task',{method:'POST',body:JSON.stringify({sourceId:'plan',sha:'first',line:1,done:true})}),env);
 assert.equal(response.status,200);assert.equal((await response.json()).commit,'saved-commit');assert.equal(writes,1);assert.equal(verifiedAt,'saved-commit');assert.equal(text,'# Plan\n- [x] Café — keep this 🌱\n');
});
test('hosted raw files are not exposed and sign-out uses the platform path',async()=>{
 const worker=createHostedDashboard({'/':{body:'<h1>Test</h1>',type:'text/html'}});
 assert.equal((await worker.fetch(request('/server.mjs'))).status,404);
 assert.equal((await worker.fetch(request('/.env'))).status,404);
 const data=await (await worker.fetch(request('/api/logout',{method:'POST',body:'{}'}))).json();assert.equal(data.signOutUrl,'/signout-with-chatgpt?returnTo=%2F');
});
