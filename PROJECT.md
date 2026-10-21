# Alwin dashboard

## Purpose
Daily priorities first, with Australia plans, creative projects for Paige and life goals, derived from the existing private BRAIN vault.

## Architecture
Two hosting adapters share brain.mjs and the monochrome web client. server.mjs is a Node server with password sessions; hosted.mjs is a dependency-free Worker protected by owner-private Sites dispatch. build-hosted.mjs embeds web assets into generated dist/server/index.js. hosted-preview.mjs serves synthetic data only for managed browser QA. package-site.mjs builds a clean, commit-stamped release archive for GitHub Actions. See web/CONTEXT.md and HOSTING.md.

## Run / test / deploy
Node: copy .env.example to an untracked .env, set the password and origin, then npm start. Managed QA: sites-preview start this checkout. npm test; npm run check; npm run build; python3 check-build.py --root . . Publish the exact pushed source/Worker archive through Sites. Runtime secrets are separate from source. deploy.yml prepares versioned deployment artifacts after successful main checks; authenticated Sites publication remains separate.

## Current state
21 October: an owner-private preview is already published. The user-selected reference UI is implemented: gray masthead, embedded Lobster display, organic edge, black workspace, rounded pale surfaces and fixed bottom phone navigation. CI run 39597875937 passed all 14 parser, Node HTTP and hosted-adapter tests, syntax and build checks. Hosted checks covered font loading/CSP, all five phone views, source inspection, skip links and overflow. Genuine captures and scoped finish-review evidence are recorded in web/DESIGN.md. Runtime remains DASHBOARD_DEMO=1 and BRAIN_READ_ONLY=1, without a vault token; live synchronization has not been verified.

## Decisions and constraints
The user approved monochrome, then requested replacing the UI with the supplied visual reference. Root DESIGN.md records the implemented tokens. BRAIN remains canonical. Public GitHub source and screenshots contain synthetic data only. Hosted audience must remain owner-private. Sample mode and read-only access are deliberate runtime controls, never evidence of a live connection.

## Next action
For unattended publishing, connect a supported CI publisher when available; the current workflow prepares release artifacts only. Configure the vault-scoped runtime secret, disable sample mode, verify a real read in read-only mode, and only then verify an explicitly chosen reversible task edit. Capture the real final state in the canonical BRAIN handoff.
