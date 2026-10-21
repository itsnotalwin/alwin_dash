# Alwin dashboard

## Purpose
Daily priorities first, with Australia plans, creative projects for Paige and life goals, derived from the existing private BRAIN vault.

## Architecture
Two hosting adapters share brain.mjs and the monochrome web client. server.mjs is a Node server with password sessions; hosted.mjs is a dependency-free Worker protected by owner-private Sites dispatch. build-hosted.mjs embeds web assets into generated dist/server/index.js. hosted-preview.mjs serves synthetic data only for managed browser QA. See web/CONTEXT.md and HOSTING.md.

## Run / test / deploy
Node: copy .env.example to an untracked .env, set the password and origin, then npm start. Managed QA: sites-preview start this checkout. npm test; npm run check; npm run build; python3 check-build.py --root . . Publish the exact pushed source/Worker archive through Sites. Runtime secrets are separate from source.

## Current state
21 October: terminal execution recovered; all 14 parser, Node HTTP and hosted-adapter tests pass locally. Syntax, ESM build import and portable folder checks pass. Actual managed-browser checks exercised all five views, Refresh and source inspection, with no desktop overflow. SCREENSHOT-HOSTED.jpg captures the real synthetic hosted edition at 1363×936. CI captures desktop/mobile views from that same hosted adapter.

## Decisions and constraints
The user approved the clean monochrome design and said to continue. BRAIN remains canonical. Public GitHub source and screenshots contain synthetic data only. Hosted audience must remain owner-private. Sample mode and read-only access are deliberate runtime controls, never evidence of a live connection.

## Next action
Publish the private hosted preview and verify the deployment. Then configure the vault-scoped runtime secret, disable sample mode, verify a real read in read-only mode, and only then verify an explicitly chosen reversible task edit. Capture the real final state in the canonical BRAIN handoff.
