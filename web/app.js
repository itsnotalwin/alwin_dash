'use strict';
const $=id=>document.getElementById(id);
const domainNames={australia:'Australia',paige:'For Paige',life:'My life'};
const views={
 today:['YOUR DAY, WITH INTENTION','A little closer, every day.','Make room for what matters. Start with one next step.'],
 australia:['THE NEXT CHAPTER','Your road to Australia.','The plan, the open questions, and the next concrete step.'],
 paige:['MADE WITH CARE','A place for the things you make.','Finished pieces, works in progress, and the detail to return to.'],
 life:['ROOM FOR YOUR OWN LIFE','Keep the important things moving.','Your goals and the small actions that keep them in reach.'],
 brain:['YOUR SOURCE OF TRUTH','Connected to your Brain.','Read from your canonical notes. Changes go back to the source.']
};
let taskSerial=0;
const state={data:null,view:'today',loading:false,lastLoaded:0,pins:new Set(),search:'',showDone:false};
try{state.pins=new Set(JSON.parse(localStorage.getItem('alwin-focus-v1')||'[]'));}catch{}
const node=(tag,attrs={},...children)=>{
 const n=document.createElement(tag);
 for(const [k,v]of Object.entries(attrs)){if(v===null||v===undefined)continue;
  if(k==='class')n.className=v;else if(k==='on')for(const [event,fn]of Object.entries(v))n.addEventListener(event,fn);
  else if(k==='text')n.textContent=v;else if(k==='disabled')n.disabled=!!v;else n.setAttribute(k,String(v));}
 for(const child of children.flat(Infinity)){if(child!==null&&child!==undefined)n.append(child instanceof Node?child:document.createTextNode(String(child)));}
 return n;
};
const button=(label,fn,cls='text-button',attrs={})=>node('button',{type:'button',class:cls,on:{click:fn},...attrs},label);
const date=(value,opts={})=>{
 if(!value)return 'Not recorded';
 const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T12:00:00Z':value);
 return Number.isNaN(d.getTime())?'Not recorded':new Intl.DateTimeFormat('en-ZA',{day:'numeric',month:'short',year:'numeric',...opts}).format(d);
};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const tasks=()=>state.data?.notes.flatMap(n=>n.tasks)||[];
const noteById=id=>state.data?.notes.find(n=>n.id===id);
const taskKey=t=>t.id+':'+t.sha;
const isPast=value=>value&&value<today();
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5500);}
function showLogin(){
 state.data=null;state.lastLoaded=0;$('shell').hidden=true;$('login').hidden=false;
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 $('workspace').replaceChildren();$('source-content').textContent='';$('task-text').value='';$('task-source').replaceChildren();
}
async function api(path,options={}){
 let r;try{r=await fetch(path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers}});}catch{throw new Error('Could not reach the dashboard. Check your connection.');}
 let data;try{data=await r.json();}catch{throw new Error('The server returned an unreadable response.');}
 if(r.status===401&&path!=='/api/login')showLogin();
 if(!r.ok)throw Object.assign(new Error(data.error||'That action could not be completed.'),{status:r.status});
 return data;
}
function setConnection(text,status){$('connection').textContent=text;$('connection').dataset.state=status;}
function heading(title,detail){return node('div',{class:'section-head'},node('h2',{},title),detail?node('small',{},detail):null);}
function openSource(id){
 const n=noteById(id);if(!n)return;
 $('source-title').textContent=n.title;
 $('source-meta').textContent=domainNames[n.domain]+' · Source updated '+date(n.updated)+' · Read '+date(n.fetchedAt)+' · '+n.sha.slice(0,8);
 $('source-content').textContent=n.text;
 $('source-link').hidden=!n.sourceUrl;
 if(n.sourceUrl){try{const url=new URL(n.sourceUrl);if(url.protocol==='https:'&&url.hostname==='github.com')$('source-link').href=url.href;else $('source-link').hidden=true;}catch{$('source-link').hidden=true;}}
 $('source-dialog').showModal();
}
function starIcon(){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.5l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 3Z');svg.append(path);return svg;
}
function pin(t){
 const key=taskKey(t);state.pins.has(key)?state.pins.delete(key):state.pins.add(key);
 try{localStorage.setItem('alwin-focus-v1',JSON.stringify([...state.pins].slice(-30)));}catch{}
 render();
}
function sourceButton(n){return button(n.label,()=>openSource(n.id),'source-button',{'aria-label':'Read source: '+n.label});}
function taskRow(t){
 const n=noteById(t.sourceId),box=node('input',{type:'checkbox',id:'task-'+t.sourceId+'-'+t.line+'-'+(++taskSerial),'aria-label':'Mark task '+(t.done?'incomplete: ':'complete: ')+t.text,disabled:!state.data.writable});
 box.checked=t.done;
 box.addEventListener('change',async()=>{
  const desired=box.checked;box.checked=t.done;box.disabled=true;
  try{await api('/api/task',{method:'POST',body:JSON.stringify({sourceId:t.sourceId,sha:t.sha,line:t.line,done:desired})});toast('Task saved and verified in Brain.');await load(true);}
  catch(e){toast(e.message);if(e.status===409)await load(true);}
  finally{box.disabled=!state.data?.writable;}
 });
 const meta=node('div',{class:'task-meta'},node('span',{class:'tag '+t.domain},domainNames[t.domain]),sourceButton(n),
  t.due?node('span',{class:isPast(t.due)&&!t.done?'late':''},(isPast(t.due)&&!t.done?'Past due · ':'Due ')+date(t.due)):null);
 return node('div',{class:'task-row'+(t.done?' done':'')},box,node('div',{class:'task-copy'},node('label',{for:box.id},t.text),meta),
  button(starIcon(),()=>pin(t),'pin-button',{'aria-pressed':state.pins.has(taskKey(t)),'aria-label':(state.pins.has(taskKey(t))?'Remove from':'Add to')+' today’s focus'}));
}
function focusTasks(){
 const open=tasks().filter(t=>!t.done);
 const selected=open.filter(t=>state.pins.has(taskKey(t)));
 if(selected.length)return selected.slice(0,5);
 const ordered=[...open].sort((a,b)=>(isPast(b.due)?1:0)-(isPast(a.due)?1:0)||(b.priority==='high'?1:0)-(a.priority==='high'?1:0)||(a.due||'9999').localeCompare(b.due||'9999'));
 const picks=[];for(const d of ['australia','paige','life']){const next=ordered.find(t=>t.domain===d);if(next)picks.push(next);}
 for(const t of ordered)if(picks.length<3&&!picks.includes(t))picks.push(t);
 return picks;
}
function focusPanel(){
 const list=focusTasks();
 return node('section',{class:'focus-panel','aria-label':'Your focus today'},heading('Your focus today',list.length+' next step'+(list.length===1?'':'s')),
  list.length?list.map(taskRow):node('p',{class:'empty'},'No open checkboxes in these notes. Read a recorded next action below, or add a task to its source.'),
  node('p',{class:'section-sub'},state.pins.size?'Your starred tasks lead today.':'A starting point from each area. Star a task to choose your own focus.'));
}
function destination(){
 const move=state.data.notes.find(n=>n.id==='move'||n.domain==='australia');
 const target=move?.target;
 return node('aside',{class:'destination','aria-label':'The big picture'},
  node('h3',{},'Your Australia chapter'),node('h2',{},'One step at a time.'),
  node('div',{class:'route'},node('span',{},'Where you are'),node('span',{},'Where you’re going')),
  node('p',{class:'target'},target?'Recorded target · '+date(target):'Target dates come from your plan.',node('br'),node('strong',{},'Plans stay plans until confirmed.')));
}
function timeline(limit=4){
 const all=state.data.notes.filter(n=>n.domain==='australia').flatMap(n=>n.milestones);
 const preferred=state.data.notes.find(n=>n.id==='move')?.milestones;
 const list=(preferred?.length?preferred:all).slice(0,limit);
 return node('section',{class:'timeline-section'},heading('The road ahead','Recorded targets · review before acting'),
  node('p',{class:'section-sub'},'Dates reflect the source plan. They do not establish completion or visa eligibility.'),
  list.length?node('div',{class:'timeline'},list.map(m=>node('article',{class:'milestone'},
   node('h3',{},m.title),node('time',{datetime:m.date},date(m.date)),
   node('p',{class:'recorded-status'},'Recorded: '+(m.recordedStatus||'Unknown')+(isPast(m.date)?' · Past target; review':'')),
   sourceButton(noteById(m.sourceId))))):node('p',{class:'empty'},'No dated milestone table is recorded in the connected move notes.'));
}
function projects(){
 const notes=state.data.notes.filter(n=>n.domain==='paige');
 return node('section',{},heading('Made with care',notes.length+' source'+(notes.length===1?'':'s')),
  node('p',{class:'section-sub'},'Creative projects for Paige. Status as recorded in Brain.'),
  notes.length?notes.map((n,i)=>node('article',{class:'project-row'},
   node('div',{class:'project-copy'},node('h3',{},n.title),node('p',{},n.next[0]||'Open the source for the latest recorded details.'),
    node('div',{class:'task-meta'},node('span',{class:'status-label'},n.status),node('span',{},'Updated '+date(n.updated)))),
   button('›',()=>openSource(n.id),'open-project',{'aria-label':'Open '+n.title}))):node('p',{class:'empty'},'No project sources are connected yet.'));
}
function goals(){
 const notes=state.data.notes.filter(n=>n.domain==='life'),items=notes.flatMap(n=>n.goals.map(text=>({text,n})));
 return node('section',{},heading('Keep your own rhythm'),node('p',{class:'section-sub'},'Goals from your notes. No invented streaks or progress.'),
  items.length?items.map(({text,n},i)=>node('div',{class:'goal-row'},node('div',{},text,node('div',{class:'task-meta'},sourceButton(n)))))
  :node('p',{class:'empty'},'Your connected life notes have no “Life Goals” section yet. Add a concrete task to keep moving.'));
}
function actionList(domain=null,expanded=false){
 const wrap=node('details',{class:'sheet all-actions'});wrap.open=expanded;
 const eligible=tasks().filter(t=>!domain||t.domain===domain);
 wrap.append(node('summary',{},'All next actions · '+eligible.filter(t=>!t.done).length+' open checkboxes'));
 const input=node('input',{type:'search',class:'search',placeholder:'Find a task…','aria-label':'Find a task'});input.value=state.search;
 const check=node('input',{type:'checkbox'});check.checked=state.showDone;
 const rows=node('div',{class:'task-list'});
 const update=()=>{
  const list=eligible.filter(t=>(state.showDone||!t.done)&&t.text.toLowerCase().includes(state.search.toLowerCase()));
  rows.replaceChildren(...(list.length?list.map(taskRow):[node('p',{class:'empty'},'No matching tasks. Tasks come from Markdown checkboxes; other next actions stay visible in their source notes.')]));
 };
 input.addEventListener('input',()=>{state.search=input.value;update();});
 check.addEventListener('change',()=>{state.showDone=check.checked;update();});
 wrap.append(node('div',{class:'action-toolbar'},input,node('label',{class:'filter-label'},check,'Show completed')),rows);update();return wrap;
}
function brainStrip(){
 return node('section',{class:'brain-strip'},node('div',{},node('h3',{},'From your Brain'),node('p',{},'The source stays yours. The dashboard stays current.')),
  node('span',{class:'strip-detail'},state.data.notes.length+' notes · refreshes every 5 minutes while open'),
  button('View sources ↗',()=>{location.hash='brain';}));
}
function noteCards(domain){
 return node('div',{class:'note-stack'},state.data.notes.filter(n=>n.domain===domain).map(n=>node('article',{class:'sheet note-card'},
  node('div',{class:'task-meta'},node('span',{class:'tag '+domain},n.status),node('span',{},'Updated '+date(n.updated))),
  node('h3',{},n.title),
  n.next.length?n.next.slice(0,2).map(text=>node('p',{},text)):node('p',{},'No explicit next action was extracted. Read the source rather than assuming progress.'),
  button('Read the source ↗',()=>openSource(n.id)))));
}
function signOutControl(){
 return state.data.hostedAuth?node('a',{href:'/signout-with-chatgpt?returnTo=%2F',target:'_top',class:'outline'},'Sign out of this dashboard'):button('Sign out of this dashboard',logout,'outline');
}
function renderBrain(){
 const rows=state.data.notes.map(n=>node('div',{class:'source-row'},
  node('div',{class:'source-name'},n.label,node('small',{},domainNames[n.domain]+' · '+n.status)),
  node('div',{},date(n.updated),node('small',{},'Source updated')),
  node('code',{},n.sha.slice(0,8)),
  button('Read note ↗',()=>openSource(n.id))));
 return node('div',{},node('section',{class:'sheet focus-panel'},
  heading('A window into the source',state.data.demo?'Sample mode':'Canonical notes'),
  node('p',{class:'section-sub'},'Checkbox edits and new tasks use the source SHA, then verify the saved commit. Research, project statuses and goals are shown as recorded. Refreshing a note does not reverify its claims.'),
  node('div',{class:'source-grid'},rows)),
  node('div',{class:'notice'},node('strong',{},'How updates work'),'The server reads only the configured notes. It refreshes while this page is open; when you return, it reads again. It does not infer progress from emails, repositories, or time passing. Your other agents update the canonical notes, and those changes appear here.'),
  signOutControl());
}
function renderSetup(){
 return node('section',{class:'sheet setup'},node('h2',{},'Give your plans a place to land.'),
  node('p',{class:'muted'},'The dashboard is ready for a BRAIN connection. Your private notes are never bundled with the public source.'),
  node('ol',{},node('li',{},'Set BRAIN_REPO and a vault-scoped GITHUB_TOKEN in your server’s secret settings.'),
   node('li',{},'Use a token with Contents read/write only for the vault. Read-only tokens can browse but cannot save tasks.'),
   node('li',{},'Restart the server and refresh. The configured canonical notes become the dashboard.')),
  node('p',{class:'muted'},'For a private sample preview, start the server with DASHBOARD_DEMO=1. Sample mode cannot write to GitHub.'));
}
function render(){
 if(!state.data)return;
 if(state.data.hostedAuth&&!$('hosted-logout')){
  $('logout').hidden=true;
  $('logout').after(node('a',{id:'hosted-logout',class:'logout',href:'/signout-with-chatgpt?returnTo=%2F',target:'_top','aria-label':'Sign out',title:'Sign out'},'Exit'));
 }
 const view=views[state.view]||views.today;
 $('view-title').textContent=view[1];$('view-description').textContent=view[2];
 document.querySelectorAll('[data-view]').forEach(a=>a.dataset.view===state.view?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
 document.title=(state.view==='today'?'Alwin — life in motion':view[1]+' — Alwin');
 $('add-task').disabled=!state.data.writable||!state.data.notes.length;
 const notices=[];
 if(state.data.demo)notices.push(node('div',{class:'notice'},node('strong',{},'Sample preview · no private data'),'These are synthetic examples. Connect BRAIN to see your actual plans. Saving is disabled in sample mode.'));
 if(state.data.errors?.length)notices.push(node('div',{class:'notice error'},node('strong',{},'Some notes could not be read'),state.data.errors.map(e=>e.label+': '+e.message).join(' ')));
 if(state.view==='australia')notices.push(node('div',{class:'notice'},'Your recorded migration strategy and research may be dated. Verify official requirements before applying or spending money.'));
 $('notices').replaceChildren(...notices);
 let content;
 if(state.data.setupRequired)content=renderSetup();
 else if(!state.data.notes.length)content=node('section',{class:'sheet setup'},node('h2',{},'Your sources need attention.'),node('p',{class:'muted'},'No notes could be read. Check the connection errors above and refresh.'));
 else if(state.view==='today')content=node('div',{},node('div',{class:'sheet today-sheet'},
   node('div',{class:'focus-layout'},focusPanel(),destination()),timeline(),
   node('div',{class:'duo'},projects(),goals()),brainStrip()),actionList());
 else if(state.view==='brain')content=renderBrain();
 else if(state.view==='australia')content=node('div',{},node('div',{class:'sheet domain-top'},timeline(12)),noteCards('australia'),actionList('australia',true));
 else if(state.view==='paige')content=node('div',{},noteCards('paige'),actionList('paige',true));
 else content=node('div',{},node('div',{class:'sheet focus-panel domain-top'},goals()),noteCards('life'),actionList('life',true));
 $('workspace').replaceChildren(content);$('workspace').setAttribute('aria-busy','false');
 $('last-read').textContent=state.data.fetchedAt?'Last read '+date(state.data.fetchedAt,{hour:'2-digit',minute:'2-digit',timeZone:'Africa/Johannesburg'})+' · SAST':'Connection not configured';
}
async function load(force=false){
 if(state.loading)return;state.loading=true;$('refresh').disabled=true;
 try{
  const data=await api('/api/brain'+(force?'?refresh=1':''));state.data=data;state.lastLoaded=Date.now();
  $('login').hidden=true;$('shell').hidden=false;
  setConnection(data.demo?'Sample data':data.setupRequired?'Setup needed':data.errors.length?'Needs attention':'Brain connected',data.demo||data.setupRequired||data.errors.length?'error':'ready');
  render();
 }catch(e){if(e.status!==401){setConnection('Refresh failed','error');if(state.data){$('notices').prepend(node('div',{class:'notice error'},'Refresh failed. Showing the last successful read. '+e.message));}
  else{$('login').hidden=false;$('login-error').textContent=e.message;}}}
 finally{state.loading=false;$('refresh').disabled=false;}
}
function openTask(){
 $('task-source').replaceChildren(...state.data.notes.map(n=>node('option',{value:n.id},domainNames[n.domain]+' / '+n.label)));
 const target=state.data.notes.find(n=>n.domain===state.view);if(target)$('task-source').value=target.id;
 $('task-text').value='';$('task-due').value='';$('task-error').textContent='';$('task-dialog').showModal();
}
async function logout(){try{await api('/api/logout',{method:'POST',body:'{}'});showLogin();$('password').value='';}catch(e){toast(e.message);}}
$('login-form').addEventListener('submit',async e=>{
 e.preventDefault();const submit=e.target.querySelector('button');submit.disabled=true;$('login-error').textContent='';
 try{await api('/api/login',{method:'POST',body:JSON.stringify({password:$('password').value})});$('password').value='';await load(true);}
 catch(error){$('login-error').textContent=error.message;}finally{submit.disabled=false;}
});
$('refresh').addEventListener('click',()=>load(true));$('logout').addEventListener('click',logout);$('add-task').addEventListener('click',openTask);
document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('task-form').addEventListener('submit',async e=>{
 e.preventDefault();const source=noteById($('task-source').value);if(!source)return;
 const submit=e.target.querySelector('button[type=submit]');submit.disabled=true;$('task-error').textContent='';
 try{await api('/api/capture',{method:'POST',body:JSON.stringify({sourceId:source.id,sha:source.sha,text:$('task-text').value,due:$('task-due').value})});
  $('task-dialog').close();toast('Task captured and verified in Brain.');await load(true);}
 catch(error){$('task-error').textContent=error.message;if(error.status===409)await load(true);}
 finally{submit.disabled=false;}
});
function changeView(){state.view=location.hash.slice(1)in views?location.hash.slice(1):'today';state.search='';render();}
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();$('main').focus();});
window.addEventListener('hashchange',changeView);changeView();
$('today-date').textContent=new Intl.DateTimeFormat('en-ZA',{weekday:'long',day:'numeric',month:'long',timeZone:'Africa/Johannesburg'}).format(new Date())+' / Johannesburg';
setInterval(()=>{if(!document.hidden&&state.data)load(true);},300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.data&&Date.now()-state.lastLoaded>60000)load(true);});
window.addEventListener('online',()=>{if(state.data)load(true);});
load();
