# Alwin dashboard

## Purpose
Daily priorities first, with Australia plans, creative projects for Paige, and personal goals, derived from the existing BRAIN vault.

## Architecture
Node.js 22.10+ HTTP server and native fetch; no runtime packages. server.mjs owns authentication, a bounded source cache, source reads and SHA-checked writes. brain.mjs owns plain Markdown projections. web/CONTEXT.md owns the client. Data remains in the vault; sessions and read cache are transient.

## Run / test / deploy
Copy .env.example to .env and set a strong DASHBOARD_PASSWORD, APP_ORIGIN, BRAIN_REPO and a narrowly scoped GITHUB_TOKEN. npm start. npm run check and npm test. An HTTPS Node host is required; GitHub Pages cannot run this server. README.md has full setup and demo instructions.

## Current state
Verified 20 October 2026: GitHub Actions run 39474503896 passed JavaScript syntax, all 8 Node parser/HTTP integration tests, and Chromium smoke checks for login, five views, source inspection and 390px overflow. Real synthetic-data desktop/mobile captures are committed under web/ and have been opened for inspection. Portable folder checks are being added to CI.
No production host or live BRAIN runtime connection is configured. A mock GitHub server verifies conflict handling and exact saved content; this is not a live-vault integration test.

## Decisions and constraints
Today leads; user delegated stack choice and selected image-first design. Concept uses synthetic examples. Public source must never contain live vault data. See PRODUCT.md, DESIGN.md, web/DESIGN.md and AGENTS.md.

## Next action
Independent review found one skip-link routing defect, fixed with a browser regression check. Inspect the final CI result. Configure private HTTPS hosting and runtime secrets, then test a live note read and a deliberate reversible task edit. Keep the vault handoff accurate.
