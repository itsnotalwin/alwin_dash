// Synthetic fixtures only. Never replace these with private vault content.
import {parseNote} from './brain.mjs';
export function demoNotes() {
 const entries=[
  [{id:'move',domain:'australia',label:'Move overview',path:'demo/move.md'},'---\ntitle: The next chapter\nstatus: planning\nupdated: 2026-10-20\n---\n# Move overview\n## Immediate next steps\n- [ ] Choose the next move milestone\n- [ ] Review the document checklist\n- [ ] Set a realistic monthly saving goal\n\n## Milestones\n| Milestone | Target | Status |\n|---|---|---|\n| Research | 2026-11-30 | Planned |\n| Prepare | 2027-03-31 | Planned |\n| Apply | 2027-06-30 | Needs review |\n| Move | 2027-09-30 | Aspirational |\n'],
  [{id:'collection',domain:'paige',label:'The collection',path:'demo/collection.md'},'---\ntitle: The collection\nstatus: active\nupdated: 2026-10-20\n---\n# The collection\n**Next:** Finish one detail in the collection.\n- [ ] Review the keepsake links\n- [x] Gather the first pieces\n'],
  [{id:'game',domain:'paige',label:'A little world',path:'demo/world.md'},'---\ntitle: A little world\nstatus: in-progress\nupdated: 2026-10-18\n---\n# A little world\n**Next:** Playtest the opening on a phone.\n- [ ] Test the opening scene\n'],
  [{id:'life',domain:'life',label:'Life goals',path:'demo/life.md'},'---\ntitle: My life\nstatus: active\nupdated: 2026-10-20\n---\n# My life\n## Life goals\n- Photography: make time for a weekly shoot\n- Career: keep the next application moving\n- Finances: review the monthly plan\n## Next actions\n- [ ] Make space for a weekly shoot\n- [ ] Review this week’s priorities\n']
 ];
 return entries.map(([s,t])=>parseNote(s,t,'demo-revision'));
}
