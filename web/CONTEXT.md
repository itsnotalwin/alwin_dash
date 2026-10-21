# Dashboard client

Purpose: authenticated daily planner with Today, Australia, For Paige, My life and Brain views, derived from allowlisted BRAIN notes. `index.html` owns semantic layout, organic divider and native dialogs; `app.js` renders plain-text projections, local task stars and version-checked task changes; `style.css` owns the reference-based monochrome system. `OFL-Lobster.txt` licenses the locally embedded display font. Root `../DESIGN.md` is the token authority.

Connections use the same-origin server API only. Never bundle GitHub credentials, real notes, personal details or private fixtures here. Demo examples come from `../demo.mjs`. Hosted authentication comes from owner-private Sites dispatch; `app.js` renders platform sign-out anchors. Standalone Node hosting keeps its password/session flow.

Change & verify: `npm run check`; `npm test`; `npm run build`. Exercise all five views, Refresh, source inspection, filtering, task conflicts and keyboard dialogs. Capture authenticated `/` at 1440×1024 and 390×844 with synthetic data, then inspect actual captures. `DESIGN.md` records the current evidence and image dimensions. Check font loading/CSP, skip-to-content focus and phone overflow when changing this layout.

Current reference adaptation uses a gray masthead, black workspace, rounded pale surfaces, organic SVG edge, horizontal desktop pills and fixed bottom phone navigation below 760px. Functional text stays at least 11px, source text stays plain, and the loading indicator stays static. Preserve monochrome and reduced-motion support in both adapters.

The existing Site remains owner-private. This UI is prepared for publication; the current runtime uses `DASHBOARD_DEMO=1` and `BRAIN_READ_ONLY=1`, with no vault token. Sample mode cannot write and is not evidence of live synchronization.
