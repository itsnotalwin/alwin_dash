import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNote,toggleTask,appendTask,validateSources} from './brain.mjs';
const source={id:'test',domain:'australia',label:'Test plan',path:'plan.md'};
test('extracts numbered and bullet tasks, skips code, preserves recorded table status',()=>{
 const text='---\ntitle: Plan\nupdated: 2026-10-20\n---\n# Plan\n1. [ ] First 📅 2027-01-01\n- [X] Done\n\x60\x60\x60\n- [ ] Not a task\n\x60\x60\x60\n| Move | 2027-09-22 | Planned |\n';
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
