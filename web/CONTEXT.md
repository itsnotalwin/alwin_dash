# Dashboard client
Purpose: authenticated daily planner and three domain views, derived from allowlisted BRAIN notes.
Key files: index.html owns semantic layout and dialogs; app.js renders plain-text note projections and sends version-checked task changes; style.css owns the responsive visual system; favicon.svg is the app mark.
Connections: same-origin server API only. No GitHub credentials or private fixtures in this folder. Demo mode contains synthetic examples from ../demo.mjs.
Change & verify: npm run check; npm test. Exercise login, source inspection, task conflict, capture, filtering and keyboard dialogs. Capture / at 1440×1024 and 390×844 with synthetic demo data.
Evidence: CI captures genuine desktop/mobile screenshots using synthetic data. Regenerate them after palette changes and inspect before reporting completion. Current palette is monochrome, as requested on 20 October 2026.

Hosted authentication comes from owner-private Sites dispatch. app.js uses hostedAuth to render top-level sign-out anchors. The standalone Node edition keeps its password/session flow. Preserve the monochrome layout in both editions.
