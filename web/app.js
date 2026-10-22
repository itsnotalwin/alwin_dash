'use strict';
const $=id=>document.getElementById(id);
const domainNames={australia:'Australia',paige:'For Paige',life:'My life'};
const views={
 today:['YOUR DAY, WITH INTENTION','A little closer, every day.','Make room for what matters. Start with one next step.'],
 australia:['THE NEXT CHAPTER','Your road to Australia.','The plan, the open questions, and the next concrete step.'],
 paige:['MADE WITH CARE','A place for the things you make.','Finished pieces, works in progress, and the detail to return to.'],
 life:['ROOM FOR YOUR OWN LIFE','Keep the important things moving.','Your goals and the small actions that keep them in reach.'],
 brain:['YOUR SOURCE OF TRUTH','Connected to your Brain.','Your plans, projects and reference notes. Always traceable to the source.']
};
let taskSerial=0;
const state={data:null,view:'today',loading:false,lastLoaded:0,pins:new Set(),search:'',showDone:false,sourceSearch:'',sourceFilter:'all',pendingRender:false};
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
// Content identity survives unrelated edits to the source note.
const taskKey=t=>t.sourceId+':'+t.text;
const isPast=value=>value&&value<today();
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5500);}
function showLogin(){
 state.data=null;state.lastLoaded=0;$('shell').hidden=true;$('login').hidden=false;
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());
 $('workspace').replaceChildren();$('source-content').textContent='';$('source-raw').textContent='';$('task-text').value='';$('task-source').replaceChildren();
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
 $('source-content').replaceChildren(readableNote(n.text));
 $('source-raw').textContent=n.text;
 $('source-raw-wrap').open=false;
 $('source-link').hidden=!n.sourceUrl;
 if(n.sourceUrl){try{const url=new URL(n.sourceUrl);if(url.protocol==='https:'&&url.hostname==='github.com')$('source-link').href=url.href;else $('source-link').hidden=true;}catch{$('source-link').hidden=true;}}
 $('source-dialog').showModal();$('source-dialog').scrollTop=0;
 motion($('source-dialog'),[{opacity:.65,transform:'translateY(14px) scale(.985)'},{opacity:1,transform:'none'}],260);
}
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function motion(element,frames,duration=220){
 if(!element||reduceMotion.matches||!element.animate)return;
 element.getAnimations().forEach(a=>a.cancel());
 element.animate(frames,{duration,easing:'cubic-bezier(.16,1,.3,1)'});
}
function updateNav(){
 const active=document.querySelector('nav [aria-current="page"]'),marker=$('nav-marker');if(!active||!marker)return;
 const nav=active.parentElement,a=active.getBoundingClientRect(),b=nav.getBoundingClientRect();
 const from=marker.getBoundingClientRect();
 marker.style.width=a.width+'px';marker.style.height=a.height+'px';marker.style.transform='translate('+(a.left-b.left)+'px,'+(a.top-b.top)+'px)';
 if(from.width&&Math.abs(from.left-a.left)>1)motion(marker,[{transform:'translate('+(from.left-b.left)+'px,'+(from.top-b.top)+'px) scaleX('+(from.width/a.width)+')'},{transform:marker.style.transform}],280);
}
window.addEventListener('resize',updateNav);
document.fonts.ready.then(updateNav);
function taskRects(){return new Map([...document.querySelectorAll('.focus-panel [data-task]')].map(el=>[el.dataset.task,el.getBoundingClientRect()]));}
function animateTaskPositions(before){document.querySelectorAll('.focus-panel [data-task]').forEach(el=>{const old=before.get(el.dataset.task),now=el.getBoundingClientRect();if(old)motion(el,[{transform:'translateY('+(old.top-now.top)+'px)'},{transform:'none'}],300);else motion(el,[{opacity:.3,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],300);});}
function arrowIcon(){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M5 12h14m-6-6 6 6-6 6');svg.append(path);return svg;}
function plain(text=''){return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,p,l)=>l||p.split('/').pop()).replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*_`]/g,'').replace(/^\s*(?:[-+] |\d+[.)] )/gm,'').trim();}
function excerpt(text,max=210){const value=plain(text.split('\n').filter(l=>!/^\s*\|/.test(l)).join('\n')).replace(/\[ ?[xX]?\]\s*/g,'').replace(/\s+/g,' ');return value.length>max?value.slice(0,max).replace(/\s+\S*$/,'')+'…':value;}
function daysUntil(target){const days=Math.ceil((Date.parse(target+'T12:00:00Z')-Date.parse(today()+'T12:00:00Z'))/86400000);return days<0?'past target · review':days===0?'today':days+' days from today';}
function readableNote(text){
 const wrap=node('div',{class:'reading-content'}),lines=text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'').split(/\r?\n/);let table=null,list=null,code=null,fenced=false;
 for(const line of lines){
  if(/^\s*```/.test(line)){fenced=!fenced;if(fenced){code=node('pre');wrap.append(code);}continue;}
  if(fenced){code.append(document.createTextNode(line+'\n'));continue;}
  if(!line.trim()){list=null;table=null;continue;}
  if(/^\s*\|/.test(line)){
   const cells=line.split('|').slice(1,-1);if(cells.every(c=>/^\s*:?-+:?\s*$/.test(c)))continue;
   if(!table){table=node('table');wrap.append(node('div',{class:'table-scroll',tabindex:'0','aria-label':'Source table'},table));}
   const first=!table.children.length;table.append(node('tr',{},cells.map(c=>node(first?'th':'td',first?{scope:'col'}:{},plain(c)))));continue;
  }
  table=null;
  const h=line.match(/^(#{1,6})\s+(.+)/);if(h){list=null;wrap.append(node(h[1].length<=2?'h3':'h4',{},plain(h[2])));continue;}
  if(/^\s*[-*+] |^\s*\d+[.)] /.test(line)){if(!list){list=node('ul');wrap.append(list);}list.append(node('li',{},plain(line)));continue;}
  list=null;if(/^[-*_]{3,}$/.test(line.trim())){wrap.append(node('hr'));continue;}
  wrap.append(node('p',{},plain(line.replace(/^>\s*/,''))));
 }
 return wrap;
}
function attentionPanel(){
 const entries=['fund','housing','collection','career'].map(noteById).filter(Boolean).map(n=>({n,record:n.highlights?.[0]})).filter(x=>x.record).slice(0,3);
 if(!entries.length)return null;
 return node('section',{class:'attention-section'},heading('Worth your attention','Recorded context'),
  node('div',{class:'attention-list'},entries.map(({n,record})=>node('article',{class:'attention-row'},node('div',{},node('h3',{},n.label),node('p',{},excerpt(record.text,210))),button(arrowIcon(),()=>openSource(n.id),'open-project',{'aria-label':'Read context: '+n.label})))));
}
function noteCards(domain){
 const notes=state.data.notes.filter(n=>n.domain===domain);
 return node('section',{class:'sheet domain-notes'},heading('Plans & context',notes.length+' notes'),
  node('p',{class:'section-sub'},'Open a note for recorded decisions, next steps and reference material. Dates show when notes changed.'),
  notes.map(n=>{
   const details=node('details',{class:'note-detail','data-note':n.id});
   const summary=node('summary',{},node('span',{},node('strong',{},n.label),node('small',{},(n.reference?'Reference · ':n.status+' · ')+'Updated '+date(n.updated))),arrowIcon());
   const content=node('div',{class:'note-detail-body'});
   details.append(summary,content);
   details.addEventListener('toggle',()=>{if(!details.open||content.children.length)return;
    const items=n.highlights?.slice(0,2)||[];
    if(n.reference&&n.cautions?.length)content.append(node('p',{class:'reference-note'},excerpt(n.cautions[0].text,360)));
    if(items.length)items.forEach(r=>content.append(node('h3',{},r.heading),readableNote(r.text)));
    else if(n.next.length)content.append(node('h3',{},'Recorded next action'),...n.next.slice(0,2).map(t=>node('p',{},plain(t))));
    else content.append(node('p',{class:'muted'},'Read the full note for its current record and supporting detail. No next action has been inferred.'));
    if(n.cautions?.length)content.append(node('p',{class:'reference-note'},'This note also contains research cautions. Read them in the full source before acting.'));
    if(n.reference)content.append(node('p',{class:'reference-note'},'Reference checklists are excluded from Today’s focus. They may include historical or conditional steps.'));
    content.append(button('Read full source',()=>openSource(n.id),'outline'));motion(content,[{opacity:.3},{opacity:1}],180);
   });return details;
  }));
}
function starIcon(){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.5l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 3Z');svg.append(path);return svg;
}
function pin(t){
 const previous=taskRects();
 const key=taskKey(t);state.pins.has(key)?state.pins.delete(key):state.pins.add(key);
 try{localStorage.setItem('alwin-focus-v1',JSON.stringify([...state.pins].slice(-30)));}catch{}
 render();animateTaskPositions(previous);
 const chosen=state.pins.has(taskKey(t));toast(chosen?'Added to your focus.':'Removed from your focus.');
 document.querySelectorAll('.pin-button').forEach(b=>{if(b.dataset.key===taskKey(t)&&b.getClientRects().length){b.focus({preventScroll:true});if(chosen)motion(b.querySelector('svg'),[{transform:'rotate(-24deg) scale(.7)'},{transform:'rotate(8deg) scale(1.18)'},{transform:'none'}],320);}});
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
 return node('div',{class:'task-row'+(t.done?' done':''),'data-task':taskKey(t)},box,node('div',{class:'task-copy'},node('label',{for:box.id},t.text),meta),
  button(starIcon(),()=>pin(t),'pin-button',{'data-key':taskKey(t),'aria-pressed':state.pins.has(taskKey(t)),'aria-label':(state.pins.has(taskKey(t))?'Remove from':'Add to')+' today’s focus'}));
}
function focusTasks(){
 const open=tasks().filter(t=>!t.done&&!t.reference);
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
  node('p',{class:'section-sub'},list.some(t=>state.pins.has(taskKey(t)))?'Your starred tasks lead today.':'A starting point from each area. Star a task to choose your own focus.'));
}
function destination(){
 const move=state.data.notes.find(n=>n.id==='move'||n.domain==='australia');
 const target=move?.target;
 return node('aside',{class:'destination','aria-label':'The big picture'},
  node('h2',{},'Your Australia chapter'),node('p',{class:'destination-sub'},'One step at a time.'),
  node('div',{class:'route'},node('span',{},'Prepare'),node('span',{},'Your next chapter')),
  target?node('p',{class:'arrival-date'},date(target),node('span',{},'Desired arrival · '+daysUntil(target))):null,
  move?sourceButton(move):null,
  node('p',{class:'target'},target?'Your recorded preference, not a confirmed travel date.':'Target dates come from your plan.',node('br'),node('strong',{},'Plans stay plans until confirmed.')));
}
function timeline(limit=4){
 const all=state.data.notes.filter(n=>n.domain==='australia').flatMap(n=>n.milestones);
 const list=all.filter((m,i,a)=>a.findIndex(x=>x.title===m.title&&x.date===m.date)===i).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,limit);
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
   node('div',{class:'project-copy'},node('h3',{},n.title),node('p',{},excerpt(n.highlights?.[0]?.text||n.next[0]||'Open the source for the latest recorded details.',180)),
    node('div',{class:'task-meta'},node('span',{class:'status-label'},n.status),node('span',{},'Updated '+date(n.updated)))),
   button(arrowIcon(),()=>openSource(n.id),'open-project',{'aria-label':'Open '+n.title}))):node('p',{class:'empty'},'No project sources are connected yet.'));
}
function goals(){
 const notes=state.data.notes.filter(n=>n.domain==='life'),items=notes.flatMap(n=>n.goals.map(text=>({text,n})));
 return node('section',{},heading('Keep your own rhythm'),node('p',{class:'section-sub'},'Goals from your notes. No invented streaks or progress.'),
  items.length?items.map(({text,n},i)=>node('div',{class:'goal-row'},node('div',{},text,node('div',{class:'task-meta'},sourceButton(n)))))
  :node('p',{class:'empty'},'Your connected life notes have no “Life Goals” section yet. Add a concrete task to keep moving.'));
}
function actionList(domain=null,expanded=false){
 const wrap=node('details',{class:'sheet all-actions'});wrap.open=expanded;
 const eligible=tasks().filter(t=>(!domain||t.domain===domain)&&!t.reference);
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
function signOutControl(){
 return state.data.hostedAuth?node('a',{href:'/signout-with-chatgpt?returnTo=%2F',target:'_top',class:'outline'},'Sign out of this dashboard'):button('Sign out of this dashboard',logout,'outline');
}
function renderBrain(){
 const wrap=node('section',{class:'sheet source-library'},heading('Everything in view',state.data.notes.length+' connected notes'),
  node('p',{class:'section-sub'},'Search the connected notes, including their contents. Reference material stays separate from your daily tasks.'));
 const input=node('input',{type:'search',class:'search',placeholder:'Find a plan, project or detail…','aria-label':'Search connected notes'});input.value=state.sourceSearch;
 const filters=node('div',{class:'filter-chips','aria-label':'Filter sources'});
 const rows=node('div',{class:'source-results'}),count=node('p',{class:'result-count',role:'status'});
 const update=()=>{
  const query=state.sourceSearch.toLowerCase().trim();
  const list=state.data.notes.filter(n=>(state.sourceFilter==='all'||n.domain===state.sourceFilter)&&[n.label,n.title,n.text].join(' ').toLowerCase().includes(query));
  count.textContent=list.length+' of '+state.data.notes.length+' notes';
  rows.replaceChildren(...(list.length?list.map(n=>node('article',{class:'library-row'},
   node('div',{},node('h3',{},n.label),node('p',{},domainNames[n.domain]+' · '+(n.reference?'Reference':n.status)+' · Updated '+date(n.updated))),
   node('span',{class:'library-count'},n.tasks.filter(t=>!t.done).length+' checkboxes'),
   button('Read note',()=>openSource(n.id),'outline',{'aria-label':'Read note: '+n.label}))) : [node('p',{class:'empty'},'No notes match. Try another word or area.')]));
  filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.filter===state.sourceFilter));
 };
 for(const [key,label]of Object.entries({all:'All notes',...domainNames}))filters.append(button(label,()=>{state.sourceFilter=key;update();},'filter-chip',{'data-filter':key,'aria-pressed':state.sourceFilter===key}));
 input.addEventListener('input',()=>{state.sourceSearch=input.value;update();});
 wrap.append(node('div',{class:'library-tools'},input,filters),count,rows);update();
 return node('div',{},wrap,node('section',{class:'connection-guide'},heading('What stays up to date'),
  node('div',{class:'guide-grid'},
   node('div',{},node('h3',{},'Read on arrival'),node('p',{},'These selected notes load when you open the dashboard and refresh every five minutes while it stays open. New vault files need to be connected.')),
   node('div',{},node('h3',{},'Source dates stay visible'),node('p',{},'“Updated” is the note’s date, not a new fact check. Older research, proposals and unconfirmed plans stay labelled as recorded.')),
   node('div',{},node('h3',{},state.data.writable?'Edits are connected':'Read-only connection'),node('p',{},state.data.writable?'Task edits are version-checked and saved back to the source.':'Update your canonical vault notes to change plans. You can still star tasks here to choose your focus.')))),signOutControl());
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
 $('add-task').hidden=!state.data.writable;
 $('read-mode').hidden=!!state.data.writable;
 $('read-mode').textContent=state.data.demo?'Sample preview':'Read-only · star tasks to focus';
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
   attentionPanel(),node('div',{class:'duo'},projects(),goals()),brainStrip()),actionList());
 else if(state.view==='brain')content=renderBrain();
 else if(state.view==='australia')content=node('div',{},node('div',{class:'domain-top'},destination()),actionList('australia',true),node('div',{class:'domain-top'},timeline(12)),noteCards('australia'));
 else if(state.view==='paige')content=node('div',{},actionList('paige',true),noteCards('paige'));
 else content=node('div',{},node('div',{class:'sheet focus-panel domain-top'},goals()),actionList('life',true),noteCards('life'));
 const expanded=[...$('workspace').querySelectorAll('details[open][data-note]')].map(d=>d.dataset.note);
 $('workspace').replaceChildren(content);
 expanded.forEach(id=>{const d=[...$('workspace').querySelectorAll('[data-note]')].find(d=>d.dataset.note===id);if(d)d.open=true;});
 updateNav();$('workspace').setAttribute('aria-busy','false');
 $('last-read').textContent=state.data.fetchedAt?'Last read '+date(state.data.fetchedAt,{hour:'2-digit',minute:'2-digit',timeZone:'Africa/Johannesburg'})+' · SAST':'Connection not configured';
}
async function load(force=false){
 if(state.loading)return;state.loading=true;$('refresh').disabled=true;$('refresh').classList.add('is-refreshing');$('refresh').setAttribute('aria-label','Refreshing Brain');
 try{
  const data=await api('/api/brain'+(force?'?refresh=1':''));state.data=data;state.lastLoaded=Date.now();
  $('login').hidden=true;$('shell').hidden=false;
  setConnection(data.demo?'Sample data':data.setupRequired?'Setup needed':data.errors.length?'Needs attention':'Brain connected',data.demo||data.setupRequired||data.errors.length?'error':'ready');
  const active=document.activeElement;
  if(!document.querySelector('dialog[open]')&&!active?.matches('#workspace input,#workspace select'))render();else state.pendingRender=true;
  if(force)toast(data.errors.length?'Some sources need attention.':'Brain refreshed · '+data.notes.length+' notes read.');
 }catch(e){if(e.status!==401){setConnection('Refresh failed','error');if(state.data){$('notices').prepend(node('div',{class:'notice error'},'Refresh failed. Showing the last successful read. '+e.message));}
  else{$('login').hidden=false;$('login-error').textContent=e.message;}}}
 finally{state.loading=false;$('refresh').disabled=false;$('refresh').classList.remove('is-refreshing');$('refresh').setAttribute('aria-label','Refresh Brain');}
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
$('source-dialog').addEventListener('close',()=>{if(state.pendingRender){state.pendingRender=false;render();}});
$('workspace').addEventListener('focusout',()=>requestAnimationFrame(()=>{if(state.pendingRender&&!document.querySelector('dialog[open]')&&!document.activeElement?.matches('#workspace input,#workspace select')){state.pendingRender=false;render();}}));
$('task-form').addEventListener('submit',async e=>{
 e.preventDefault();const source=noteById($('task-source').value);if(!source)return;
 const submit=e.target.querySelector('button[type=submit]');submit.disabled=true;$('task-error').textContent='';
 try{await api('/api/capture',{method:'POST',body:JSON.stringify({sourceId:source.id,sha:source.sha,text:$('task-text').value,due:$('task-due').value})});
  $('task-dialog').close();toast('Task captured and verified in Brain.');await load(true);}
 catch(error){$('task-error').textContent=error.message;if(error.status===409)await load(true);}
 finally{submit.disabled=false;}
});
function changeView(){
 const previous=state.view;state.view=location.hash.slice(1)in views?location.hash.slice(1):'today';state.search='';render();
 if(previous!==state.view&&state.data){
  const direction=Object.keys(views).indexOf(state.view)>Object.keys(views).indexOf(previous)?1:-1;
  motion($('workspace').firstElementChild,[{opacity:.55,transform:'translateX('+direction*18+'px)'},{opacity:1,transform:'none'}],250);
  motion($('view-title'),[{opacity:.4},{opacity:1}],220);
  window.scrollTo({top:0,behavior:'instant'});
 }
}
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();$('main').focus();});
window.addEventListener('hashchange',changeView);changeView();
$('today-date').textContent=new Intl.DateTimeFormat('en-ZA',{weekday:'long',day:'numeric',month:'long',timeZone:'Africa/Johannesburg'}).format(new Date())+' / Johannesburg';
setInterval(()=>{if(!document.hidden&&state.data)load(true);},300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.data&&Date.now()-state.lastLoaded>60000)load(true);});
window.addEventListener('online',()=>{if(state.data)load(true);});
load();
