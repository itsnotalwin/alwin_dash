// Internal QA bridge: never deployed. It injects synthetic identity into the
// worker only on the managed preview server; production identity comes from Sites.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHostedDashboard} from './hosted.mjs';
import {fileURLToPath} from 'node:url';
export async function createHostedPreviewServer(){
const assets={};
for(const [path,file,type] of [['/','index.html','text/html; charset=utf-8'],['/app.js','app.js','text/javascript; charset=utf-8'],['/style.css','style.css','text/css; charset=utf-8'],['/favicon.svg','favicon.svg','image/svg+xml']])assets[path]={body:await readFile('web/'+file,'utf8'),type};
const worker=createHostedDashboard(assets);
return http.createServer(async(req,res)=>{
 try{
  const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
  headers.set('oai-authenticated-user-id','synthetic-preview');
  const body=[];for await(const chunk of req)body.push(chunk);
  const request=new Request('http://'+(req.headers.host||'localhost')+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(body)}:{})});
  const response=await worker.fetch(request,{DASHBOARD_DEMO:'1'});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500);res.end('Preview request failed');}
});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 (await createHostedPreviewServer()).listen(Number(process.env.PORT||4173),'0.0.0.0');
}

