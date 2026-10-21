import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {DEFAULT_SOURCES,validateSources,parseNote,toggleTask,appendTask} from './brain.mjs';
import {demoNotes} from './demo.mjs';

export function createDashboard(env=process.env,githubFetch=fetch) {
 const port=Number(env.PORT||3000);
 const origin=new URL(env.APP_ORIGIN||'http://localhost:'+port).origin;
 const secure=origin.startsWith('https://');
 const demo=env.DASHBOARD_DEMO==='1';
 const readOnly=env.BRAIN_READ_ONLY==='1';
 const password=env.DASHBOARD_PASSWORD||'';
 const configured=password.length>=16;
 const salt=randomBytes(16),digest=scryptSync(password,salt,32);
 const sources=validateSources(env.BRAIN_SOURCES?JSON.parse(env.BRAIN_SOURCES):DEFAULT_SOURCES);
 const repo=env.BRAIN_REPO||'',branch=env.BRAIN_BRANCH||'main',token=env.GITHUB_TOKEN||'';
 if(repo&&!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))throw new Error('Invalid BRAIN_REPO');
 const sessions=new Map(), attempts=new Map();
 let cache=null,cacheAt=0,loading=null;
 const headers={
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
  'Cache-Control':'no-store','Permissions-Policy':'camera=(), microphone=(), geolocation=()'
 };
 if(secure)headers['Strict-Transport-Security']='max-age=31536000';
 const send=(res,status,value,extra={})=>{
  res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8',...extra});
  res.end(JSON.stringify(value));
 };
 const fail=(message,status=400)=>Object.assign(new Error(message),{status});
 async function body(req) {
  if(!req.headers['content-type']?.startsWith('application/json'))throw fail('JSON required',415);
  let value='';for await(const part of req){value+=part;if(Buffer.byteLength(value)>8192)throw fail('Request too large',413);}
  try{return JSON.parse(value);}catch{throw fail('Invalid JSON');}
 }
 function authenticate(req) {
  const key=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('dash_session='))?.slice(13);
  const expiry=sessions.get(key);
  if(!expiry||expiry<Date.now()){if(key)sessions.delete(key);return false;}
  return true;
 }
 function cookie(key,seconds){return 'dash_session='+key+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+seconds+(secure?'; Secure':'');}
 async function github(path,options={}) {
  const response=await githubFetch('https://api.github.com/repos/'+repo+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+(options.method?'':'?ref='+encodeURIComponent(branch)),{
   ...options,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
    'Content-Type':'application/json','User-Agent':'private-life-dashboard'},signal:AbortSignal.timeout(15000)
  });
  if(!response.ok){
   if(response.status===409||response.status===422)throw fail('The note changed. Refresh before saving.',409);
   if(response.status===401||response.status===403)throw fail('BRAIN access denied or rate limited. Check the server token permissions.',502);
   if(response.status===404)throw fail('Source note not found on the configured branch.',404);
   throw fail('BRAIN request failed. Try refreshing shortly.',502);
  }
  return response.json();
 }
 async function readNote(source) {
  const file=await github(source.path);
  if(file.encoding!=='base64'||typeof file.content!=='string'||typeof file.sha!=='string')throw fail('Unsupported source response',502);
  if(file.size>300000)throw fail('Source note is too large for this dashboard',413);
  return {...parseNote(source,Buffer.from(file.content,'base64').toString('utf8'),file.sha),sourceUrl:file.html_url};
 }
 async function snapshot(force=false) {
  if(!force&&cache&&Date.now()-cacheAt<60000)return cache;
  if(loading)return loading;
  loading=(async()=>{
   if(demo)return {demo:true,notes:demoNotes(),errors:[],fetchedAt:new Date().toISOString(),writable:false};
   if(!repo||!token)return {demo:false,notes:[],errors:[],setupRequired:true,
     message:'Add BRAIN_REPO and GITHUB_TOKEN to the server environment. No private data is in this repository.',writable:false};
   const results=await Promise.allSettled(sources.map(readNote));
   const notes=[],errors=[];
   results.forEach((r,i)=>r.status==='fulfilled'?notes.push(r.value):errors.push({sourceId:sources[i].id,label:sources[i].label,message:r.reason.message}));
   return {demo:false,notes,errors,fetchedAt:new Date().toISOString(),writable:!readOnly};
  })();
  try{const result=await loading;cache=result;cacheAt=Date.now();return result;}finally{loading=null;}
 }
 const staticFiles=new Map([['/',['index.html','text/html; charset=utf-8']],['/app.js',['app.js','text/javascript; charset=utf-8']],['/style.css',['style.css','text/css; charset=utf-8']],['/favicon.svg',['favicon.svg','image/svg+xml']]]);
 const server=http.createServer(async(req,res)=>{
  try {
   const url=new URL(req.url,origin);
   if(!configured)return send(res,503,{error:'Set DASHBOARD_PASSWORD to at least 16 characters in the server environment before starting.'});
   if(req.method!=='GET'&&req.headers.origin!==origin)return send(res,403,{error:'Origin not allowed'});
   if(url.pathname==='/api/login'&&req.method==='POST') {
    const ip=req.socket.remoteAddress||'local',now=Date.now();
    for(const [k,v]of attempts)if(v.until<now)attempts.delete(k);
    for(const [k,v]of sessions)if(v<now)sessions.delete(k);
    const limit=attempts.get(ip);
    if(limit&&limit.count>=8&&limit.until>now)return send(res,429,{error:'Too many attempts. Try again in 15 minutes.'});
    if(attempts.size>1000||sessions.size>=100)return send(res,429,{error:'Please try again later.'});
    const input=await body(req);
    const candidate=typeof input.password==='string'&&input.password.length<=1024?input.password:'';
    if(!timingSafeEqual(digest,scryptSync(candidate,salt,32))) {
     attempts.set(ip,{count:(limit?.count||0)+1,until:now+900000});
     return send(res,401,{error:'That password did not match.'});
    }
    attempts.delete(ip);const key=randomBytes(32).toString('hex');sessions.set(key,now+43200000);
    return send(res,200,{ok:true},{'Set-Cookie':cookie(key,43200)});
   }
   if(url.pathname.startsWith('/api/')) {
    if(!authenticate(req))return send(res,401,{error:'Sign in to open your private dashboard.'});
    if(url.pathname==='/api/logout'&&req.method==='POST') {
     const key=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('dash_session='))?.slice(13);
     sessions.delete(key);return send(res,200,{ok:true},{'Set-Cookie':cookie('',0)});
    }
    if(url.pathname==='/api/brain'&&req.method==='GET')return send(res,200,await snapshot(url.searchParams.get('refresh')==='1'));
    if(['/api/task','/api/capture'].includes(url.pathname)&&req.method==='POST') {
     if(readOnly)return send(res,403,{error:'BRAIN is connected in read-only mode.'});
     if(demo)return send(res,403,{error:'Sample mode is read-only. Connect BRAIN to save real tasks.'});
     if(!repo||!token)return send(res,503,{error:'Connect BRAIN before saving.'});
     const input=await body(req),source=sources.find(s=>s.id===input.sourceId);
     if(!source)return send(res,400,{error:'Choose a configured source note.'});
     const current=await readNote(source);
     if(input.sha!==current.sha)return send(res,409,{error:'The source changed. Refresh and try again; nothing was overwritten.'});
     let replacement;
     try{replacement=url.pathname==='/api/task'?toggleTask(current.text,input.line,input.done):appendTask(current.text,input.text,input.due||'');}
     catch(e){return send(res,400,{error:e.message});}
     if(replacement===current.text)return send(res,200,{ok:true,unchanged:true});
     const written=await github(source.path,{method:'PUT',body:JSON.stringify({
      message:url.pathname==='/api/task'?'Update task from private dashboard':'Capture task from private dashboard',
      content:Buffer.from(replacement).toString('base64'),sha:current.sha,branch
     })});
     // Re-read the exact committed state. Concurrent later changes cannot invalidate this verification.
     const commit=written.commit?.sha;
     if(!commit)throw fail('GitHub did not return a commit; refresh and inspect the source.',502);
     const verifyResponse=await githubFetch('https://api.github.com/repos/'+repo+'/contents/'+source.path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(commit),{
      headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','User-Agent':'private-life-dashboard'},signal:AbortSignal.timeout(15000)});
     cache=null;cacheAt=0;
     if(!verifyResponse.ok)throw fail('Save was accepted, but verification failed. Refresh before retrying.',502);
     const verified=await verifyResponse.json();
     if(verified.sha!==written.content?.sha||Buffer.from(verified.content||'','base64').toString('utf8')!==replacement)
      throw fail('Save was accepted, but contents could not be verified. Refresh before retrying.',502);
     return send(res,200,{ok:true,commit,sha:verified.sha});
    }
    return send(res,404,{error:'Unknown action'});
   }
   const asset=staticFiles.get(url.pathname);
   if(req.method!=='GET'||!asset)return send(res,404,{error:'Not found'});
   const data=await readFile(new URL('./web/'+asset[0],import.meta.url));
   res.writeHead(200,{...headers,'Content-Type':asset[1]});res.end(data);
  }catch(e){send(res,e.status||500,{error:e.status?e.message:'The dashboard could not complete that request. Please retry.'});}
 });
 server.requestTimeout=20000;server.headersTimeout=10000;
 return server;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const server=createDashboard();server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Dashboard server ready. Use the configured APP_ORIGIN.'));
}
