import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createDashboard} from './server.mjs';
const password='test-only-password-at-least-16';
async function start(env={},githubFetch) {
 const server=createDashboard({DASHBOARD_PASSWORD:password,APP_ORIGIN:'http://localhost:3000',...env},githubFetch);
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port;
 const request=(path,options={})=>fetch(base+path,{...options,headers:{Origin:'http://localhost:3000','Content-Type':'application/json',...options.headers}});
 const login=await request('/api/login',{method:'POST',body:JSON.stringify({password})});
 assert.equal(login.status,200);
 return {server,request,cookie:login.headers.get('set-cookie').split(';')[0]};
}
test('authentication, CSRF, sample read-only and static scope',async t=>{
 const {server,request,cookie}=await start({DASHBOARD_DEMO:'1'});t.after(()=>server.close());
 assert.equal((await request('/api/brain')).status,401);
 const data=await request('/api/brain',{headers:{Cookie:cookie}});
 assert.equal(data.status,200);const snapshot=await data.json();
 assert.equal(snapshot.demo,true);assert.equal(snapshot.writable,false);assert.ok(snapshot.notes.length);
 assert.match(data.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.equal((await request('/api/capture',{method:'POST',headers:{Cookie:cookie},body:'{}'})).status,403);
 assert.equal((await request('/api/logout',{method:'POST',headers:{Cookie:cookie,Origin:'https://other.example'},body:'{}'})).status,403);
 assert.equal((await request('/server.mjs')).status,404);assert.equal((await request('/.env')).status,404);
 assert.equal((await request('/api/logout',{method:'POST',headers:{Cookie:cookie},body:'{}'})).status,200);
 assert.equal((await request('/api/brain',{headers:{Cookie:cookie}})).status,401);
});
test('rejects old SHA without a write; verifies exact committed contents after saving',async t=>{
 let content='# Plan\n- [ ] Preserve this exact task\n',sha='original-sha',writes=0;
 const mock=async(url,options={})=>{
  if(options.method==='PUT'){
   const input=JSON.parse(options.body);assert.equal(input.sha,sha);writes++;content=Buffer.from(input.content,'base64').toString('utf8');sha='new-sha';
   return Response.json({commit:{sha:'commit-sha'},content:{sha}});
  }
  return Response.json({encoding:'base64',content:Buffer.from(content).toString('base64'),sha,size:content.length,html_url:'https://github.com/example/vault/blob/main/plan.md'});
 };
 const {server,request,cookie}=await start({BRAIN_REPO:'example/vault',GITHUB_TOKEN:'test-only',BRAIN_SOURCES:JSON.stringify([{id:'plan',domain:'life',label:'Plan',path:'plan.md'}])},mock);t.after(()=>server.close());
 const headers={Cookie:cookie};
 let response=await request('/api/task',{method:'POST',headers,body:JSON.stringify({sourceId:'plan',sha:'old',line:1,done:true})});
 assert.equal(response.status,409);assert.equal(writes,0);
 response=await request('/api/task',{method:'POST',headers,body:JSON.stringify({sourceId:'plan',sha,line:1,done:true})});
 assert.equal(response.status,200);assert.equal((await response.json()).commit,'commit-sha');assert.equal(writes,1);assert.equal(content,'# Plan\n- [x] Preserve this exact task\n');
});
test('fails closed without adequate dashboard password',async t=>{
 const server=createDashboard({DASHBOARD_PASSWORD:'',APP_ORIGIN:'http://localhost:3000'});
 server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
 assert.equal((await fetch('http://127.0.0.1:'+server.address().port+'/')).status,503);
});
