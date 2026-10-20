// Pure Markdown projections; note bodies never become executable instructions.
export const DEFAULT_SOURCES = [
  {id:'move',domain:'australia',label:'Move overview',path:'30_Areas/AUSTRALIA/Overview.md'},
  {id:'sponsorship',domain:'australia',label:'Sponsorship plan',path:'30_Areas/AUSTRALIA/Employer-Sponsorship-Plan.md'},
  {id:'fund',domain:'australia',label:'Move fund',path:'30_Areas/AUSTRALIA/Financial-Plan.md'},
  {id:'collection',domain:'paige',label:'The collection',path:'20_Projects/Paige-Digital-Museum.md'},
  {id:'game',domain:'paige',label:'The game',path:'20_Projects/INNATE-Paige-Game.md'},
  {id:'life',domain:'life',label:'Life goals',path:'60_MOCs/ALWIN MOC.md'},
  {id:'career',domain:'life',label:'Career search',path:'30_Areas/ALWIN/Career-Search.md'}
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
  const result=[]; let current={heading:'Note',lines:[]}; let fence=false;
  for(const line of text.replace(/\r\n/g,'\n').split('\n')) {
    if(/^\s*\x60{3}/.test(line)){fence=!fence;continue;}
    if(fence)continue;
    const h=line.match(/^#{1,6}\s+(.+)/);
    if(h){if(current.lines.length)result.push(current);current={heading:clean(h[1]),lines:[]};}
    else current.lines.push(line);
  }
  if(current.lines.length)result.push(current);
  return result;
}
export function parseNote(source,text,sha,fetchedAt=new Date().toISOString()) {
  const lines=text.replace(/\r\n/g,'\n').split('\n'); const tasks=[]; let fence=false;
  lines.forEach((line,index)=>{
    if(/^\s*\x60{3}/.test(line)){fence=!fence;return;} if(fence)return;
    const m=line.match(/^(\s*(?:(?:\d+[.)]|[-*+])\s+)?\[)([ xX])(\]\s+)(.*)$/);
    if(!m)return;
    const date=m[4].match(/(?:📅|due:)\s*(\d{4}-\d{2}-\d{2})/i)?.[1]||null;
    tasks.push({id:source.id+':'+index,sourceId:source.id,domain:source.domain,line:index,sha,
      text:clean(m[4]),done:m[2].toLowerCase()==='x',due:date,
      priority:/\b(?:first|urgent|blocker)\b/i.test(m[4])?'high':'normal'});
  });
  const groups=sections(text);
  const goals=groups.filter(s=>/^life goals$/i.test(s.heading)).flatMap(s=>s.lines)
    .filter(l=>/^\s*[-*]\s+/.test(l)).map(l=>clean(l.replace(/^\s*[-*]\s+/,'')));
  const next=groups.filter(s=>/^(?:next(?:\s|:|$)|immediate next|blockers|migration incomplete|deployment verification|current.use warning|verification overlay)/i.test(s.heading))
    .flatMap(s=>s.lines).map(clean).filter(l=>l&&!l.startsWith('|')&&!l.startsWith('---')).slice(0,6);
  if(!next.length) {
    const m=lines.find(l=>/^\*\*(?:Next|Next action|Next action if requested|Migration incomplete)(?:[^*]*)\*\*/i.test(l));
    if(m)next.push(clean(m));
  }
  const milestones=lines.filter(l=>/^\|/.test(l)&&/\d{4}-\d{2}-\d{2}/.test(l)).map(l=>{
    const cells=l.split('|').slice(1,-1).map(clean);
    return {title:cells[0],date:cells.find(c=>/^\d{4}-\d{2}-\d{2}$/.test(c)),
      recordedStatus:cells.at(-1),sourceId:source.id};
  }).filter(m=>m.date);
  return {...source,title:field(text,'title')||source.label,status:field(text,'status')||'unclassified',
    updated:field(text,'updated'),sha,fetchedAt,tasks,goals,next,milestones,
    target:text.match(/(?:by|Target:|Target date:)\s*(?:[^\n]*?\b)?(20\d{2}-\d{2}-\d{2})/i)?.[1]||null,text};
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
  if(!Array.isArray(sources)||sources.length<1||sources.length>20)throw new Error('Configure 1–20 source notes');
  const ids=new Set(),paths=new Set();
  for(const s of sources) {
    if(!s||typeof s.id!=='string'||!/^[a-z0-9-]{1,40}$/.test(s.id)||ids.has(s.id)||!['australia','paige','life'].includes(s.domain)||
      typeof s.label!=='string'||!s.label.trim()||s.label.length>100||typeof s.path!=='string'||!s.path.endsWith('.md')||
      s.path.startsWith('/')||s.path.includes('\\')||s.path.split('/').some(p=>!p||p==='.'||p==='..')||paths.has(s.path))
      throw new Error('Invalid or duplicate source configuration');
    ids.add(s.id);paths.add(s.path);
  }
  return sources;
}
