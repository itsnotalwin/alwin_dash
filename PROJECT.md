# Alwin dashboard

## Purpose
Daily priorities first, with Australia plans, creative projects for Paige and life goals, derived from the existing private BRAIN vault.

## Architecture
Two hosting adapters share brain.mjs and the monochrome web client. server.mjs is a Node server with password sessions; hosted.mjs is a dependency-free Worker protected by owner-private Sites dispatch, including a bounded /api/brain/status route for service-based connection verification. build-hosted.mjs embeds web assets into generated dist/server/index.js. hosted-preview.mjs serves synthetic data only for managed browser QA. package-site.mjs builds a clean, commit-stamped release archive for GitHub Actions. pages.yml publishes only web/entry.html as a GitHub Pages redirect to the owner-private Site. See web/CONTEXT.md and HOSTING.md.

## Run / test / deploy
Node: copy .env.example to an untracked .env, set the password and origin, then npm start. Managed QA: sites-preview start this checkout. npm test; npm run check; npm run build; python3 check-build.py --root . . Publish the exact pushed source/Worker archive through Sites. Runtime secrets are separate from source. deploy.yml prepares versioned deployment artifacts after successful main checks; authenticated Sites publication remains separate.

## Current state
21 October: an owner-private preview is already published. The user-selected reference UI is implemented: gray masthead, embedded Lobster display, organic edge, black workspace, rounded pale surfaces and fixed bottom phone navigation. CI run 39604677947 passed all 16 parser, Node HTTP and hosted-adapter tests, syntax, build and synthetic browser checks. Hosted checks covered font loading/CSP, all five phone views, source inspection, skip links and overflow. Genuine captures and scoped finish-review evidence are recorded in web/DESIGN.md. The owner-private runtime now uses DASHBOARD_DEMO=0 and BRAIN_READ_ONLY=1, with its vault credential stored as a secret. The deployed status route verified all seven live source reads; anonymous access was denied and full note APIs still require visitor identity. No live write or real visitor sign-in return is claimed.

## Decisions and constraints
The user approved monochrome, then requested replacing the UI with the supplied visual reference. Root DESIGN.md records the implemented tokens. BRAIN remains canonical. Public GitHub source and screenshots contain synthetic data only. Hosted audience must remain owner-private. Sample mode and read-only access are deliberate runtime controls, never evidence of a live connection.

## Next action
For unattended publishing, connect a supported CI publisher when available; the current workflow prepares release artifacts only. Review the live view as the owner. Before enabling edits, deliberately provide vault Contents write permission, change BRAIN_READ_ONLY to 0, and verify one selected reversible task edit. Capture the real final state in the canonical BRAIN handoff.
