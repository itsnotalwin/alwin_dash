import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNote,toggleTask,appendTask,validateSources,DEFAULT_SOURCES} from './brain.mjs';
const source={id:'test',domain:'australia',label:'Test plan',path:'plan.md'};
test('extracts numbered and bullet tasks, skips code, preserves recorded table status',()=>{
 const text='---\ntitle: Plan\nupdated: 2026-10-20\n---\n# Plan\n1. [ ] First 📅 2027-01-01\n- [X] Done\n\x60\x60\x60\n- [ ] Not a task\n\x60\x60\x60\n| Milestone | Date | Status |\n|---|---|---|\n| Move | 2027-09-22 | Planned |\n';
 const n=parseNote(source,text,'old-sha');
 assert.equal(n.tasks.length,2);assert.equal(n.tasks[0].due,'2027-01-01');assert.equal(n.tasks[1].done,true);
 assert.equal(n.milestones[0].recordedStatus,'Planned');assert.equal(n.updated,'2026-10-20');
 assert.equal(toggleTask(text,n.tasks[0].line,true),text.replace('1. [ ]','1. [x]'));
});
test('preserves CRLF, surrounding text, and rejects stale line pointers',()=>{
 assert.equal(toggleTask('# H\r\n- [ ] Test\r\nTail\r\n',1,true),'# H\r\n- [x] Test\r\nTail\r\n');
 assert.throws(()=>toggleTask('Not a task',0,true));assert.throws(()=>toggleTask('- [ ] Test',0,'true'));
});
test('capture cannot inject lines and validates real dates',()=>{
 const text='# Original\n\nUnique knowledge.\n';
 assert.ok(appendTask(text,'A small step','2027-02-28').startsWith(text));
 assert.throws(()=>appendTask(text,'first\n- second'));assert.throws(()=>appendTask(text,'x','2027-02-31'));assert.throws(()=>appendTask(text,''));
});
test('only unique scoped source paths are accepted',()=>{
 assert.deepEqual(validateSources([source]),[source]);
 for(const path of ['../secret.md','/secret.md','x/../y.md','x\\y.md'])assert.throws(()=>validateSources([{...source,path}]));
 assert.throws(()=>validateSources([source,source]));
});
test('unknowns stay unknown and inline project next action is retained',()=>{
 const n=parseNote(source,'# Project\n**Next:** Verify the real deployment.\n','sha');
 assert.equal(n.updated,null);assert.equal(n.status,'unclassified');assert.equal(n.target,null);assert.equal(n.next[0],'Next: Verify the real deployment.');
});

test('canonical target wins over old prose and arbitrary dated tables are not milestones',()=>{
 const n=parseNote(source,'# Plan\nHistoric target by 2027-01-01\nTarget date: 2027-08-31\n## Hours\n| Date | In | Out |\n|---|---|---|\n| 2026-10-08 | 08:00 | 16:00 |\n## Milestones\n| Date | Milestone | Status |\n|---|---|---|\n| 2027-08-31 | Arrival | Desired |\n## Superseded schedule\n| Milestone | Date | Status |\n|---|---|---|\n| Old arrival | 2027-01-01 | Planned |','sha');
 assert.equal(n.target,'2027-08-31');assert.deepEqual(n.milestones,[{title:'Arrival',date:'2027-08-31',recordedStatus:'Desired',sourceId:'test'}]);
});
test('reference checklists and historical sections cannot silently become current priorities',()=>{
 const n=parseNote({...source,reference:true},'# Research\n## Historical plan\n### Phase one\n- [ ] Old action\n## Current preparation\n- [ ] Check the current requirements\n','sha');
 assert.equal(n.tasks.length,1);assert.equal(n.tasks[0].reference,true);assert.equal(n.tasks[0].section,'Current preparation');
 assert.equal(toggleTask(n.text,n.tasks[0].line,true).includes('- [x] Check the current requirements'),true);
 assert.equal(validateSources(DEFAULT_SOURCES).length,22);
 assert.throws(()=>validateSources([{...source,reference:'false'}]));
});
test('recorded decisions and cautions retain full context without becoming tasks',()=>{
 const n=parseNote(source,'# Plan\n## Current arrival plan\nTentative, not a booking.\n\n| Measure | Record |\n|---|---|\n| Hosting | Unconfirmed |\n## Verification overlay\nCheck the current official source.\n## Superseded gift ideas\nOld idea.','sha');
 assert.equal(n.tasks.length,0);assert.equal(n.highlights.length,1);assert.match(n.highlights[0].text,/Unconfirmed/);assert.equal(n.cautions.length,1);
});

test('reference timelines remain available in the note but never become active milestones',()=>{
 const text='# Research\n## Timeline\n| Milestone | Date | Status |\n|---|---|---|\n| Historic research target | 2027-09-01 | Planned |';
 const note=parseNote({...source,reference:true},text,'sha');
 assert.deepEqual(note.milestones,[]);assert.equal(note.text,text);
});
