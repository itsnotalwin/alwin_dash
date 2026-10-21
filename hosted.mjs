import {DEFAULT_SOURCES,validateSources,parseNote,toggleTask,appendTask} from './brain.mjs';
import {demoNotes} from './demo.mjs';

// Runs behind the owner-private Sites access boundary. Identity headers are
// supplied by Sites dispatch; do not expose this Worker as an independent app.
export function createHostedDashboard(assets,githubFetch=fetch) {
 const headers={
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()','Strict-Transport-Security':'max-age=31536000'
 };
 const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
 const error=(message,status=400)=>Object.assign(new Error(message),{status});
 const decode=content=>new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
 const encode=text=>btoa(Array.from(new TextEncoder().encode(text),b=>String.fromCharCode(b)).join(''));
 let cache=null,cacheAt=0,cacheIdentity='';
 return {async fetch(request,env={}) {
  try {
   const url=new URL(request.url);
   const isApi=url.pathname.startsWith('/api/');
   // Owner-private Sites dispatch authenticates service callers before this Worker.
   // This bounded status route supports those callers without inventing a visitor.
   const connectionStatus=url.pathname==='/api/brain/status'&&request.method==='GET';
   if(isApi&&!connectionStatus&&!request.headers.get('oai-authenticated-user-id'))return json({error:'Sign in with ChatGPT to open this private dashboard.',signInUrl:'/signin-with-chatgpt?returnTo=%2F'},401);
   if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)return json({error:'Origin not allowed'},403);
   if(!isApi){
    const asset=assets[url.pathname];
    if(request.method!=='GET'||!asset)return json({error:'Not found'},404);
    return new Response(asset.body,{headers:{...headers,'Content-Type':asset.type}});
   }
   if(url.pathname==='/api/logout'&&request.method==='POST')return json({ok:true,hostedAuth:true,signOutUrl:'/signout-with-chatgpt?returnTo=%2F'});
   const repo=env.BRAIN_REPO||'',branch=env.BRAIN_BRANCH||'main',token=env.GITHUB_TOKEN||'';
   const demo=env.DASHBOARD_DEMO==='1';
   const writable=!demo&&!!repo&&!!token&&env.BRAIN_READ_ONLY!=='1';
   if(repo&&!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))throw error('The vault repository setting is invalid.',503);
   const sources=validateSources(env.BRAIN_SOURCES?JSON.parse(env.BRAIN_SOURCES):DEFAULT_SOURCES);
   const authHeaders={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'private-life-dashboard'};
   async function github(path,options={},ref=branch){
    const endpoint='https://api.github.com/repos/'+repo+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+(options.method?'':'?ref='+encodeURIComponent(ref));
    const response=await githubFetch(endpoint,{...options,headers:authHeaders,signal:AbortSignal.timeout(15000)});
    if(!response.ok){
     if(response.status===409||response.status===422)throw error('The note changed. Refresh before saving.',409);
     if(response.status===401||response.status===403)throw error('BRAIN access denied or rate limited. Check the runtime credential.',502);
     if(response.status===404)throw error('Source note not found on the configured branch.',404);
     throw error('BRAIN is temporarily unavailable. Try refreshing shortly.',502);
    }
    return response.json();
   }
   async function read(source){
    const file=await github(source.path);
    if(file.encoding!=='base64'||typeof file.content!=='string'||typeof file.sha!=='string')throw error('Unsupported source response.',502);
    if(file.size>300000)throw error('This source note exceeds the dashboard size limit.',413);
    return {...parseNote(source,decode(file.content),file.sha),sourceUrl:file.html_url};
   }
   if(connectionStatus){
    if(demo||!repo||!token)return json({connected:false,demo,writable:false,setupRequired:!repo||!token},503);
    const results=await Promise.allSettled(sources.map(read));
    const sourceStatus=results.map((r,i)=>r.status==='fulfilled'?{id:sources[i].id,ok:true,sha:r.value.sha}:{id:sources[i].id,ok:false,error:r.reason.message});
    const connected=sourceStatus.every(s=>s.ok);
    return json({connected,demo:false,writable,sourceCount:sourceStatus.filter(s=>s.ok).length,sources:sourceStatus,checkedAt:new Date().toISOString()},connected?200:502);
   }
   if(url.pathname==='/api/brain'&&request.method==='GET'){
    if(demo)return json({demo:true,hostedAuth:true,notes:demoNotes(),errors:[],writable:false,fetchedAt:new Date().toISOString()});
    if(!repo||!token)return json({demo:false,hostedAuth:true,notes:[],errors:[],writable:false,setupRequired:true});
    const identity=request.headers.get('oai-authenticated-user-id')+'\0'+repo+'\0'+branch+'\0'+token+'\0'+JSON.stringify(sources)+'\0'+writable;
    if(cache&&identity===cacheIdentity&&Date.now()-cacheAt<60000&&url.searchParams.get('refresh')!=='1')return json(cache);
    const results=await Promise.allSettled(sources.map(read));const notes=[],errors=[];
    results.forEach((r,i)=>r.status==='fulfilled'?notes.push(r.value):errors.push({sourceId:sources[i].id,label:sources[i].label,message:r.reason.message}));
    cache={demo:false,hostedAuth:true,notes,errors,writable,fetchedAt:new Date().toISOString()};cacheIdentity=identity;cacheAt=Date.now();
    return json(cache);
   }
   if(['/api/task','/api/capture'].includes(url.pathname)&&request.method==='POST'){
    if(!writable)return json({error:demo?'Sample mode cannot save tasks.':'Task updates are disabled until the BRAIN write connection is enabled.'},403);
    if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'JSON required'},415);
    const reader=request.body?.getReader();if(!reader)return json({error:'Request body required'},400);
    const chunks=[];let bytes=0;
    try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>8192){await reader.cancel();throw error('Request too large',413);}chunks.push(part.value);}}finally{reader.releaseLock();}
    const merged=new Uint8Array(bytes);let offset=0;for(const part of chunks){merged.set(part,offset);offset+=part.length;}
    let input;try{input=JSON.parse(new TextDecoder().decode(merged));}catch{throw error('Invalid JSON');}
    const source=sources.find(s=>s.id===input.sourceId);if(!source)return json({error:'Choose a configured source note.'},400);
    const current=await read(source);if(current.sha!==input.sha)return json({error:'The source changed. Refresh before trying again; nothing was overwritten.'},409);
    let text;try{text=url.pathname==='/api/task'?toggleTask(current.text,input.line,input.done):appendTask(current.text,input.text,input.due||'');}catch(e){return json({error:e.message},400);}
    if(text===current.text)return json({ok:true,unchanged:true});
    const written=await github(source.path,{method:'PUT',body:JSON.stringify({message:url.pathname==='/api/task'?'Update task from private dashboard':'Capture task from private dashboard',branch,sha:current.sha,content:encode(text)})});
    cache=null;
    if(!written.commit?.sha)throw error('Save was accepted but returned no commit. Refresh before retrying.',502);
    let verified;try{verified=await github(source.path,{},written.commit.sha);}catch{throw error('Save was accepted but could not be verified. Refresh before retrying.',502);}
    if(verified.sha!==written.content?.sha||decode(verified.content||'')!==text)throw error('Save was accepted but verification did not match. Refresh before retrying.',502);
    return json({ok:true,commit:written.commit.sha,sha:verified.sha});
   }
   return json({error:'Unknown action'},404);
  }catch(e){return json({error:e.status?e.message:'The dashboard could not complete this request. Please retry.'},e.status||500);}
 }};
}
