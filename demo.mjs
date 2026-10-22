// Synthetic fixtures only. Never replace these with private vault content.
import {parseNote,DEFAULT_SOURCES} from './brain.mjs';
export function demoNotes() {
 const samples={
  move:`# The next chapter
Target date: 2027-08-31
## Goal
Make a considered move, with time to prepare the documents, work and arrival plan. This is an illustrative plan for testing the dashboard.
## Immediate next steps
- [ ] First: choose the next move milestone
- [ ] Review the document checklist
- [ ] Set a realistic monthly saving goal
## Milestones
| Milestone | Target date | Status |
|---|---|---|
| Review the plan | 2026-11-30 | Planned |
| Prepare the documents | 2027-03-31 | Needs review |
| Desired arrival | 2027-08-31 | Aspirational |
`,
  collection:`# The collection
## Current priority
Finish one small, thoughtful keepsake before beginning the next. Keep the collection personal and make room for the pieces still to come.
## Next actions
- [ ] Review the keepsake links
- [x] Gather the first pieces
## Gift ideas — proposals
| Idea | First small version |
|---|---|
| A letter cabinet | Three original notes for different days |
| A memory puzzle | One room and one small reveal |
`,
  game:`# A little world
**Next when resumed:** Playtest the opening on a phone.
- [ ] Test the opening scene
`,
  life:`# My life
## Life goals
- Photography: make time for a weekly shoot
- Career: keep the next application moving
- Health: find a routine that fits the working week
- Finances: review the monthly plan
## Next actions
- [ ] Make space for a weekly shoot
- [ ] Review this week’s priorities
`,
  fund:`# Move fund
## Current funding record
Review the budget when the next income arrives. Intended contributions stay separate from money actually saved.
| Measure | Record | Evidence |
|---|---|---|
| Move budget | Not yet agreed | Synthetic example |
| Monthly contribution | To review | Synthetic example |
## Next actions
- [ ] Review expenses at the next budget check
`,
  housing:`# Housing & arrival
## Current arrival plan
Confirm where you will stay, for how long, and what it will cost. Keep a fallback until the arrangement is agreed.
## Key decisions needed
- [ ] Confirm the arrival accommodation
`,
  career:`# Career search
## Current priorities
Review the latest opportunities and prepare an accurate application. A draft is not evidence that an application was sent.
## Next actions
- [ ] Check the latest application draft
`,
  hours:`# Work hours
## Current record
Actual clock-in and clock-out records are separate from planned shifts. Missing times remain unresolved.
`,
  visa:`# Visa research
## Current planning pointer
Dated research needs current official verification before decisions or spending.
## Documents to prepare
- [ ] Reference-only document checklist example
`
 };
 return DEFAULT_SOURCES.map(s=>{
  const body=samples[s.id]||'# '+s.label+'\n## Current context\nThis synthetic reference represents the connected '+s.label.toLowerCase()+' note. Open the real dashboard to read your private record.\n';
  const title=s.id==='game'?'A little world':s.id==='collection'?'The collection':s.label;
  return parseNote({...s,path:'demo/'+s.id+'.md'},'---\ntitle: '+title+'\nstatus: '+(s.id==='game'?'in-progress':'active')+'\nupdated: 2026-10-20\n---\n'+body,'demo-revision');
 });
}
