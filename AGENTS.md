# AGENTS.md — portable project building rule

This is a self-contained policy copied from ALWIN's shared-agent vault. Keep it in **each source project's root** so ChatGPT, Codex, Claude, Hermes and other agents follow the same documentation standard even without vault access.

**Before building:** Read this file, `PROJECT.md`, and the nearest `CONTEXT.md`. For any UI/CSS/visual work, also read `DESIGN.md` and view its `SCREENSHOT.png`. Only open additional source files when needed.

**Every human-maintained project subfolder:** Must have its own short, readable `CONTEXT.md`, created when the folder is created. Explain purpose, key files, dependencies/interfaces, and how to make and test changes. Applies to CSS, assets, src, components, API, tests, scripts and nested folders. Root uses `PROJECT.md` instead of duplicated root context.

**Every visual source folder (styles/CSS/UI/components/pages/themes and any rendered markup):** Must additionally contain `DESIGN.md` (visual goals, tokens, responsive behavior, states, accessibility) and a real, current rendered `SCREENSHOT.png` in that same folder. Record route/component, viewport and capture date in the design note. Add mobile capture where useful. Never fake a screenshot or pass a generated mockup off as implemented UI. If capture is unavailable, mark the work incomplete.

**After modifying:** Update only the affected local notes, recapture real visual changes, run project checks/tests plus the read-only `check-build.py --root <project>` if available, and report missing evidence. Write concise, nonduplicated notes. No secrets or sensitive client data in screenshots.

Generated/vendor/cache folders (`node_modules`, `dist`, `build`, `.git`, `.venv`, `.next`, etc.) are excluded. Existing authored folders are brought into compliance on substantive edits or by planned migration.

Use version-aware Git changes; preserve other agents' work. Project-specific instructions may be appended below; do not silently weaken these rules.

## Dashboard-specific constraints
This repository is public; do not commit live vault notes, credentials, private screenshots, or relationship/financial details. Production data enters through the authenticated server only. Read PRODUCT.md and DESIGN.md. Preserve the explicit source allowlist and optimistic concurrency. A source fetch date never means the source claims were independently verified. BRAIN owns durable knowledge; no second permanent project database.
