# Alwin — life in motion

A private daily workspace for Australia plans, creative projects for Paige, and personal goals. Today leads with a few source-backed actions; other views show recorded milestones, project next steps, goals and connection details.

## Start locally

Requires Node.js 22.10 or newer. There are no runtime dependencies.

1. Clone this repository and open its folder.
2. Copy `.env.example` to `.env`.
3. Set `DASHBOARD_PASSWORD` to a unique password of at least 16 characters.
4. Set `BRAIN_REPO` to your private vault in `owner/repository` form.
5. Set `GITHUB_TOKEN` to a fine-grained token limited to that vault, with Contents read/write.
6. Run `npm start` and open `http://localhost:3000`.

The server loads .env through Node’s native environment-file support. Never put real secrets in a tracked file, browser script, URL or screenshot.

For a synthetic preview set `DASHBOARD_DEMO=1` and the dashboard password; no GitHub token is needed. This mode labels every sample and disables writes.

## Deploy privately

Use a Node-capable host with HTTPS. Set `HOST=0.0.0.0`, your host’s `PORT`, and `APP_ORIGIN=https://your-dashboard-host`. Configure the password, vault repository and token through the host’s secret settings. Run `npm start`. Keep the app behind its sign-in screen; do not add a static mirror of private data. HTTPS sets Secure session cookies and HSTS.

This is not a GitHub Pages app. The hosted edition is published privately through Sites; its vault runtime credential is still pending. A ChatGPT connector grants this conversation access; it does not automatically supply an app with runtime credentials.

## How BRAIN stays authoritative

- Only explicit source notes are read; the defaults are in `brain.mjs`. Override with `BRAIN_SOURCES`, a JSON array of `{id, domain, label, path}`. Domains: `australia`, `paige`, `life`.
- No profile/contact note is read by default. No real note contents are committed here.
- Reads cache for 60 seconds; the page refreshes every five minutes while open, and on return after a minute away. The server refreshes on demand, not via an unattended background crawler.
- Completed checkboxes remain completed only as recorded in the note. Milestone dates and project statuses never become verified outcomes because time passed.
- Goal rows come from a “Life Goals” Markdown section. Tasks come from bullet/numbered checkboxes; non-checkbox next actions remain source excerpts.
- Each task change sends the original note SHA. Conflicts return 409 and preserve the remote note. Successful writes are reread at the exact returned commit before success is reported.
- New tasks append to the selected source under “Dashboard tasks.” Only add meaningful tasks; they are permanent vault edits.
- Focus stars store task identifiers in this browser, without note text. When a source revision changes, stars from that revision stop matching.
- This is a view and deliberate task editor, not an AI planner. Other agents maintain the canonical notes; the dashboard reflects their changes. No email is sent and no migration application is submitted.

## Checks and evidence

`npm run check` checks JavaScript syntax. `npm test` covers Markdown projections, exact task edits, multiline/date validation, scoped sources, authentication, origin protection, stale-SHA rejection, committed-content verification and sample mode.

The GitHub Actions workflow additionally installs the pinned Playwright test tool, captures the actual synthetic app at desktop/mobile sizes and exercises five views, login, source inspection and horizontal overflow. On same-repository feature PRs it commits only genuine screenshot evidence and the capture note. CI never uses the private vault token.

Local execution and GitHub Actions now verify all 14 tests. CI also captures genuine synthetic desktop/mobile screenshots. See PROJECT.md for current release evidence; the private hosted preview is published, with live BRAIN access still pending.

## Private Sites hosting

The repository now also builds a dependency-free hosted edition with ChatGPT sign-in and owner-only access. See [HOSTING.md](HOSTING.md) for the runtime configuration and security boundary. `npm run build` creates the standalone Worker; no runtime packages are needed.

The initial Site uses labelled sample data. A private published link is not proof of a live vault connection. Configure a vault-scoped `GITHUB_TOKEN` through protected hosting settings, then set `DASHBOARD_DEMO=0` while keeping `BRAIN_READ_ONLY=1` for the first read. No token is embedded in the source or preview. The standalone Node edition remains available.

## Deployment workflow

`.github/workflows/deploy.yml` prepares a tested, commit-stamped Site archive after successful main checks, with a manual main-branch option. It uploads the archive, checksum and metadata. Final publication remains an authenticated Sites operation; it does not automatically change the live Site. See [HOSTING.md](HOSTING.md) for the publishing boundary and next setup steps.
