// Pure Markdown projections; note bodies never become executable instructions.
// Deliberate coverage, not whole-vault discovery. Reference checklists never
// become today's priorities. All contents are fetched at runtime, never bundled.
export const DEFAULT_SOURCES = [
  {id:'move',domain:'australia',label:'Move overview',path:'30_Areas/AUSTRALIA/Overview.md'},
  {id:'sponsorship',domain:'australia',label:'Sponsorship plan',path:'30_Areas/AUSTRALIA/Employer-Sponsorship-Plan.md',reference:true},
  {id:'fund',domain:'australia',label:'Move fund',path:'30_Areas/AUSTRALIA/Financial-Plan.md'},
  {id:'housing',domain:'australia',label:'Housing & arrival',path:'30_Areas/AUSTRALIA/Housing.md'},
  {id:'visa',domain:'australia',label:'Visa research',path:'30_Areas/AUSTRALIA/Visa-Requirements.md',reference:true},
  {id:'au-jobs',domain:'australia',label:'Australian job market',path:'30_Areas/AUSTRALIA/Job-Market.md',reference:true},
  {id:'evidence',domain:'australia',label:'Employment evidence',path:'30_Areas/AUSTRALIA/Work-Experience-Dossier.md',reference:true},
  {id:'collection',domain:'paige',label:'Her Archive',path:'20_Projects/Paige-Digital-Museum.md'},
  {id:'game',domain:'paige',label:'INNATE',path:'20_Projects/INNATE-Paige-Game.md'},
  {id:'life',domain:'life',label:'Life goals',path:'60_MOCs/ALWIN MOC.md'},
  {id:'career',domain:'life',label:'Career search',path:'30_Areas/ALWIN/Career-Search.md'},
  {id:'hours',domain:'life',label:'Work hours',path:'30_Areas/ALWIN/Work Hours.md',reference:true},
  {id:'skills',domain:'life',label:'Skills & CV',path:'30_Areas/ALWIN/Profile/Skills-Experience.md',reference:true},
  {id:'business',domain:'life',label:'Shutterhaus overview',path:'30_Areas/SHUTTERHAUS/Business-Overview.md',reference:true},
  {id:'business-fund',domain:'life',label:'Business finances',path:'30_Areas/SHUTTERHAUS/Financial-Model.md',reference:true},
  {id:'services',domain:'life',label:'Services & pricing',path:'30_Areas/SHUTTERHAUS/Services-Pricing.md',reference:true},
  {id:'marketing',domain:'life',label:'Marketing & shoots',path:'30_Areas/SHUTTERHAUS/Marketing-Client-Acquisition.md',reference:true},
  {id:'brand',domain:'life',label:'Brand & website',path:'30_Areas/SHUTTERHAUS/Brand-Website.md',reference:true},
  {id:'business-site',domain:'life',label:'Shutterhaus releases',path:'20_Projects/SHUTTERHAUS-Site-Refresh.md',reference:true},
  {id:'projects',domain:'life',label:'Active project index',path:'20_Projects/INDEX.md',reference:true},
  {id:'builds',domain:'life',label:'Other builds',path:'20_Projects/OTHER-BUILDS.md',reference:true},
  {id:'doodleworld',domain:'life',label:'Doodleworld',path:'20_Projects/Doodleworld.md',reference:true}
];
export function clean(value='') {
  return value.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,path,label)=>label||path.split('/').pop())
    .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*_\x60~]/g,'').trim();
}
export function field(text,key) {
  const m=text.match(new RegExp('^'+key+':\\s*(.+)$','m'));
  return m ? m[1].trim().replace(/^["']|["']$/g,'') : null;
}
export function sections(text) {
  const result=[]; let current={heading:'Note',lines:[],line:0}; let fence=false; let index=-1; let historicalDepth=0;
  text=text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,m=>m.replace(/[^\r\n]/g,''));
  for(const line of text.replace(/\r\n/g,'\n').split('\n')) {
    index++;
    if(/^\s*\x60{3}/.test(line)){fence=!fence;continue;}
    if(fence)continue;
    const h=line.match(/^#{1,6}\s+(.+)/);
    if(h){if(current.lines.length)result.push(current);const depth=line.match(/^#+/)[0].length;if(historicalDepth&&depth<=historicalDepth)historicalDepth=0;if(/historical|superseded|previous|archive[d]?|old plan/i.test(h[1]))historicalDepth=depth;current={heading:clean(h[1]),lines:[],line:index,historical:!!historicalDepth};}
    else current.lines.push(line);
  }
  if(current.lines.length)result.push(current);
  return result;
}
export function parseNote(source,text,sha,fetchedAt=new Date().toISOString()) {
  const lines=text.replace(/\r\n/g,'\n').split('\n'); const tasks=[]; let fence=false;
  const groups=sections(text);
  lines.forEach((line,index)=>{
    if(/^\s*\x60{3}/.test(line)){fence=!fence;return;} if(fence)return;
    const m=line.match(/^(\s*(?:(?:\d+[.)]|[-*+])\s+)?\[)([ xX])(\]\s+)(.*)$/);
    if(!m)return;
    const group=[...groups].reverse().find(g=>g.line<index);if(group?.historical)return;
    const date=m[4].match(/(?:📅|due:)\s*(\d{4}-\d{2}-\d{2})/i)?.[1]||null;
    tasks.push({id:source.id+':'+index,sourceId:source.id,domain:source.domain,line:index,sha,
      text:clean(m[4]),reference:!!source.reference,section:group?.heading||null,done:m[2].toLowerCase()==='x',due:date,
      priority:/\b(?:first|urgent|blocker)\b/i.test(m[4])?'high':'normal'});
  });
  const goals=groups.filter(s=>/^life goals$/i.test(s.heading)).flatMap(s=>s.lines)
    .filter(l=>/^\s*[-*]\s+/.test(l)).map(l=>clean(l.replace(/^\s*[-*]\s+/,'')));
  const usable=groups.filter(s=>!s.historical);
  const actionGroups=usable.filter(s=>/^(?:next(?:\s|:|$)|immediate next|scope and next|action items|key decisions)/i.test(s.heading));
  const next=actionGroups.flatMap(s=>s.lines).map(clean).filter(l=>l&&!l.startsWith('|')&&!l.startsWith('---')).slice(0,6);
  if(!next.length) {
    const candidates=usable.flatMap(s=>s.lines).filter(l=>/^\*\*(?:Next|Next action|Next action if requested|Migration incomplete)(?:[^*]*)\*\*/i.test(l));
    if(candidates.length)next.push(clean(candidates.at(-1)));
  }
  const highlights=usable.filter(s=>/^(?:current |goal$|useful current|personal.context gaps|key decisions|verification flags|groq boundary|scope and next|gift ideas|source.backed moments|active portrait|channel update|practical scheduling|canonical cv)/i.test(s.heading))
    .slice(0,6).map(s=>({heading:s.heading,text:s.lines.join('\n').trim()})).filter(s=>s.text);
  const cautions=usable.filter(s=>/warning|verification overlay|reliability|data.quality|honest assessment/i.test(s.heading))
    .map(s=>({heading:s.heading,text:s.lines.join('\n').trim()})).filter(s=>s.text);
  const milestones=[];
  for(const group of source.reference?[]:usable){
    const rows=group.lines.filter(l=>/^\s*\|/.test(l)).map(l=>l.split('|').slice(1,-1).map(clean));
    const header=rows.find(r=>r.some(c=>/^(?:milestone|target date|target|date)$/i.test(c)));
    // A timesheet, research history or arbitrary dated table is not a roadmap.
    if(!header||!header.some(c=>/^milestone$/i.test(c)))continue;
    const titleCol=header.findIndex(c=>/^milestone$/i.test(c)),dateCol=header.findIndex(c=>/^(?:target date|target|date)$/i.test(c)),statusCol=header.findIndex(c=>/^status$/i.test(c));
    for(const cells of rows){const date=cells[dateCol];if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))continue;
      milestones.push({title:cells[titleCol],date,recordedStatus:statusCol<0?'Not recorded':cells[statusCol],sourceId:source.id});}
  }
  // Prefer the canonical explicit target over dates in earlier historical prose.
  const target=text.match(/^Target date:\s*(20\d{2}-\d{2}-\d{2})/im)?.[1]||null;
  return {...source,title:field(text,'title')||source.label,status:field(text,'status')||'unclassified',
    updated:field(text,'updated'),lastVerified:field(text,'last_verified'),reviewAfter:field(text,'review_after'),sha,fetchedAt,tasks,goals,next,milestones,highlights,cautions,target,text};
}
export function toggleTask(text,line,done) {
  if(!Number.isInteger(line)||line<0||typeof done!=='boolean')throw new Error('Invalid task change');
  const eol=text.includes('\r\n')?'\r\n':'\n'; const lines=text.split(eol);
  if(!/^(\s*(?:(?:\d+[.)]|[-*+])\s+)?\[)[ xX](\]\s+)/.test(lines[line]||''))throw new Error('Task changed; refresh before editing');
  lines[line]=lines[line].replace(/^(\s*(?:(?:\d+[.)]|[-*+])\s+)?\[)[ xX](\]\s+)/,(_,a,b)=>a+(done?'x':' ')+b);
  return lines.join(eol);
}
export function appendTask(text,value,due='') {
  if(typeof value!=='string'||!value.trim()||value.length>500||/[\r\n\u0000-\u001f]/.test(value))throw new Error('Enter one task, up to 500 characters');
  if(due&&(!/^\d{4}-\d{2}-\d{2}$/.test(due)||!Number.isFinite(Date.parse(due))||new Date(due).toISOString().slice(0,10)!==due))throw new Error('Invalid due date');
  const eol=text.includes('\r\n')?'\r\n':'\n';
  return text+(text.endsWith(eol)?eol:eol+eol)+(text.includes('## Dashboard tasks')?'':'## Dashboard tasks'+eol+eol)
    +'- [ ] '+value.trim()+(due?' 📅 '+due:'')+eol;
}
export function validateSources(sources) {
  if(!Array.isArray(sources)||sources.length<1||sources.length>32)throw new Error('Configure 1–32 source notes');
  const ids=new Set(),paths=new Set();
  for(const s of sources) {
    if(!s||(s.reference!==undefined&&typeof s.reference!=='boolean')||typeof s.id!=='string'||!/^[a-z0-9-]{1,40}$/.test(s.id)||ids.has(s.id)||!['australia','paige','life'].includes(s.domain)||
      typeof s.label!=='string'||!s.label.trim()||s.label.length>100||typeof s.path!=='string'||!s.path.endsWith('.md')||
      s.path.startsWith('/')||s.path.includes('\\')||s.path.split('/').some(p=>!p||p==='.'||p==='..')||paths.has(s.path))
      throw new Error('Invalid or duplicate source configuration');
    ids.add(s.id);paths.add(s.path);
  }
  return sources;
}
