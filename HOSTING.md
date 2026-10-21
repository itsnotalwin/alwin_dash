# Private hosted edition

The hosted edition runs as a dependency-free Worker behind owner-private Sites access. Visitors sign in with ChatGPT; the application does not add a second password. Private identity headers come from Sites dispatch. Keep this Site owner-private: the hosted API is a shared dashboard for its sole owner, not a multi-user product. Do not deploy hosted.mjs directly to a public Worker or widen the Site audience without reviewing authorization.

`hosted.mjs` owns the request adapter and safe GitHub access. It shares the maintained Markdown parser and fixtures with the Node server. `build-hosted.mjs` embeds the maintained web assets into the generated `dist/server/index.js`; edit web/ files, never generated output. `.openai/hosting.json` owns the Site identity. `hosted-preview.mjs` is an internal synthetic-only QA bridge; it is not shipped as a server entrypoint.

## Runtime configuration

Configure through the Site's protected environment settings, then redeploy:

- `BRAIN_REPO`: the private vault in owner/repository form.
- `BRAIN_BRANCH`: main.
- `GITHUB_TOKEN`: secret fine-grained credential, limited to the vault's Contents. Do not enter it in chat or commit it.
- `DASHBOARD_DEMO`: 1 shows labelled synthetic examples and disables every write; set 0 for the live connection.
- `BRAIN_READ_ONLY`: 1 reads without allowing task changes. Keep this enabled for the first live read. Set 0 only when deliberately enabling task edits with a suitable credential.
- `BRAIN_SOURCES`: optional JSON allowlist; defaults match the canonical notes.

The initial deployment uses sample mode with no vault credential. It is a private published preview, not live BRAIN synchronization. Once configured, source updates appear on refresh, every five minutes while open and on return after a minute away. There is no unattended crawler or second permanent knowledge store. A restart can clear transient cache; the vault retains all real tasks.

## Verification

Run npm test, npm run check, npm run build and python3 check-build.py --root . . The hosted build is imported as actual ESM during packaging. hosted.test.mjs covers identity, sample/read-only restrictions, origin checks, stale SHA, Unicode preservation, exact-commit verification, raw-file denial and platform sign-out. CI browser checks run against the synthetic hosted bridge; real vault read/write and hosted sign-in return need separate verification once configured.
