# Contributing to Elitza Workshop

Thanks for your interest. Here's what you need to know before opening a PR.

## Project philosophy

- **Zero dependencies** — the app ships as plain HTML + CSS + JS. No bundler, no framework, no build step. Keep it that way unless there is a very strong reason not to.
- **Minimal terminal friction** — every change should move toward fewer commands the end user has to run, not more.
- **Static-first** — the Cloudflare Worker backend is planned but not built yet. All current logic must work as a pure static site.

## Getting started

```bash
git clone https://github.com/dario-cositore/elitza-workshop
cd elitza-workshop
python -m http.server 4173
# open http://localhost:4173
```

No `npm install` needed. Open the folder, serve it, done.

## File structure

```
index.html      Main UI — all screens (steps 1–5, setup guides, advanced tools)
app.js          All application logic — platform detection, install flows, command generation
styles.css      All styles — no external CSS dependencies
assets/         Static assets (favicon)
docs/           Extended documentation for contributors and package authors
.github/        Issue templates, PR template, this file
```

## Code style

- Vanilla JS only. No TypeScript, no React, no build pipeline.
- Keep functions focused. The existing code has clear sections — maintain that pattern.
- Platform branching (`targetPlatform === 'hermes'`) should be additive. Don't break OpenClaw when adding Hermes logic and vice versa.
- All user-visible text should be clear enough for a non-technical user.

## Adding a new platform

If you want to add support for a third agent platform:

1. Add a constant for its profile file mapping (see `HERMES_PROFILE_MAP` as a reference)
2. Add a button on the welcome screen (`index.html` step 1)
3. Add a platform-specific workspace section in step 3
4. Add a platform-specific done section in step 5
5. Add an install function (see `installHermesAgent()` as a reference)
6. Add a setup guide article (see `data-step="hs1"` as a reference)
7. Update `setPlatform()` to handle the new platform ID
8. Update `docs/package-format.md` with the new file mapping

## Security rules — do not relax these

- `BLOCKED_EXTENSIONS` — never remove entries from this list
- `BLOCKED_PATH_PARTS` — never remove entries from this list
- `BLOCKED_SECRET_PATTERNS` — never remove entries from this list
- `validateManifest()` — the `allow_executables` and `allow_shell_scripts` checks must stay

## Submitting a PR

- Use the PR template
- Keep PRs focused — one concern per PR
- Test both platforms (OpenClaw and Hermes flows) if you touch shared code
- The File System Access API only works in Chromium browsers over HTTPS or localhost — note any browser-specific behaviour in your PR description
