# Alwin dashboard

## Purpose
Daily priorities first, with Australia plans, creative projects for Paige, and personal goals, derived from the existing BRAIN vault.

## Architecture
Node.js 22.10+ HTTP server and native fetch; no runtime packages. server.mjs owns authentication, a bounded source cache, source reads and SHA-checked writes. brain.mjs owns plain Markdown projections. web/CONTEXT.md owns the client. Data remains in the vault; sessions and read cache are transient.

## Run / test / deploy
Copy .env.example to .env and set a strong DASHBOARD_PASSWORD, APP_ORIGIN, BRAIN_REPO and a narrowly scoped GITHUB_TOKEN. npm start. npm run check and npm test. An HTTPS Node host is required; GitHub Pages cannot run this server. README.md has full setup and demo instructions.

## Current state
Source authored 20 October 2026 through GitHub because the local execution environment was unavailable. Pure-parser behavioral checks and JavaScript syntax evaluation passed in the orchestration runtime. Node HTTP integration tests and browser checks are included; their remote results must be inspected before treating them as passed. Screenshots are pending until CI captures the real app. No live hosting or BRAIN runtime connection has been configured.

## Decisions and constraints
Today leads; user delegated stack choice and selected image-first design. Concept uses synthetic examples. Public source must never contain live vault data. See PRODUCT.md, DESIGN.md, web/DESIGN.md and AGENTS.md.

## Next action
Inspect the feature PR checks and generated screenshots. Configure private HTTPS hosting and runtime secrets, then test a live note read and a deliberate reversible task edit. Keep the vault handoff accurate.
