<div align="center">

# Elitza Workshop

**The unified installer and agent hub for OpenClaw and Hermes Agent.**

[![Version](https://img.shields.io/badge/version-2.0.0-000000?style=flat-square)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-proprietary-000000?style=flat-square)](LICENSE)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-supported-000000?style=flat-square)](https://clawhub.ai)
[![Hermes](https://img.shields.io/badge/Hermes%20Agent-supported-000000?style=flat-square)](https://hermes-agent.nousresearch.com)
[![Deploy on Cloudflare](https://img.shields.io/badge/deploy-Cloudflare%20Pages-000000?style=flat-square)](docs/deployment.md)
[![Static](https://img.shields.io/badge/zero%20backend-static%20site-000000?style=flat-square)](#running-locally)

Browse, buy, and install Elitza agent profiles with minimal terminal friction.
Everything runs locally in your browser — nothing is uploaded to any server.

[Live site](https://elitza.life) · [Agent Store](https://dariocositore.gumroad.com) · [Report a bug](.github/ISSUE_TEMPLATE/bug_report.md) · [Request a feature](.github/ISSUE_TEMPLATE/feature_request.md)

</div>

---

## What is Elitza Workshop?

Elitza Workshop is the front door to the Elitza agent ecosystem. It handles the full agent profile lifecycle in one place:

1. **Guides** users through installing OpenClaw or Hermes Agent on their machine
2. **Links** to the Elitza store where curated agent profiles can be purchased
3. **Installs** agent profile packages (`.zip`) directly into the right platform folder — no manual file management

It is a pure static web app. No server, no backend, no telemetry. The install logic runs entirely in the browser using the native [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API).

---

## Supported platforms

| Platform | Install method | Terminal required? | Setup guide |
|---|---|---|---|
| [OpenClaw](https://clawhub.ai) | Writes files to workspace, generates `openclaw agents add` command | One command at the end | 6-step guided flow with Doctor diagnostics |
| [Hermes Agent](https://hermes-agent.nousresearch.com) | Writes files directly to `~/.hermes/` | **None** | One-step curl install |

---

## Features

### Core installer
- **Platform selector** — choose OpenClaw or Hermes on the welcome screen before you begin
- **Drag & drop or click-to-upload** zip package, validated client-side before any file is written
- **Secure package validation** — blocks executables, path traversal, secret patterns, and manifest-declared executable tools
- **Platform-aware required files** — different validation rules per platform so packages can target one or both
- **Direct file write via browser API** — no copy-paste, no scripts, no intermediate folders for Hermes installs
- **Cross-platform command generation** — for OpenClaw, generates the registration command in PowerShell, CMD, bash/zsh, and Fish Shell

### Guided setup flows
- **OpenClaw Setup Guide** (6 steps) — OS detection, install command, verify, API key onboard, dashboard launch, completion
- **Doctor panel** on every OpenClaw setup step — paste terminal output to get a specific diagnosis and fix
- **Hermes Setup Guide** (1 step) — curl install command, WSL note for Windows users, OpenRouter recommendation

### Welcome screen
- **Embedded install video** — quick walkthrough right on the welcome screen
- **"New here?" store link** — direct link to the Elitza agent profile store
- **Collapsible standalone installer** — `.sh` / `.bat` / `.ps1` scripts hidden behind a toggle for power users who prefer the CLI

### Advanced tools
- **Repair** — re-register an OpenClaw agent that's installed but not showing up, without reinstalling
- **Remove** — generate the `openclaw agents delete` command for full uninstall

### Visual
- **WebGL halftone grain shader** background — GPU-accelerated analog aesthetic
- **Analog / Y2K design system** — paper-card UI, Dymo labels, typewriter text, torn-edge panels
- **Responsive** — works on any screen size

---

## How it works

```
Welcome screen
  ├── Install for OpenClaw →          Sets platform → step 2
  ├── Install for Hermes Agent →      Sets platform → step 2
  ├── Setup OpenClaw First →          6-step guided setup
  └── Setup Hermes Agent First →      1-step curl install guide

Step 2 — Upload Package
  └── Drag & drop or pick .zip
      Validates: manifest, required files, blocked extensions,
                 path traversal, secret patterns

Step 3 — Select Folder
  ├── OpenClaw: pick .openclaw/workspace + confirm absolute path
  └── Hermes:   pick ~/.hermes/ folder (path input hidden — no command needed)

Step 4 — Review & Install
  ├── OpenClaw: shows agent ID, install path, OS/shell selector, install button
  └── Hermes:   shows agent name, target folder, install button

Step 5 — Done
  ├── OpenClaw: registration command (copy to clipboard) + next steps
  └── Hermes:   "Profile written — no terminal needed" + /reload-skills note
```

---

## Agent package format

Packages are `.zip` files. The minimum viable package for each platform:

**Hermes only:**
```
agent.zip
├── profile.manifest.json
└── profile/SOUL.md
```

**OpenClaw only:**
```
agent.zip
├── profile.manifest.json
├── README.md
└── profile/
    ├── AGENTS.md
    ├── SOUL.md
    ├── TOOLS.md
    └── BOOTSTRAP.md
```

**Both platforms (recommended):**
```
agent.zip
├── profile.manifest.json
├── README.md
└── profile/
    ├── AGENTS.md       # OpenClaw
    ├── SOUL.md         # Both
    ├── TOOLS.md        # OpenClaw
    ├── BOOTSTRAP.md    # OpenClaw
    ├── MEMORY.md       # Both (optional)
    └── USER.md         # Both (optional)
```

### Manifest schema

```json
{
  "schema": "elitza/package@1",
  "package_id": "your-agent-id",
  "package_name": "Your Agent Name",
  "package_version": "1.0.0",
  "author": "Your Name",
  "description": "What this agent does.",
  "platforms": ["openclaw", "hermes"]
}
```

See **[docs/package-format.md](docs/package-format.md)** for the full specification including all optional layers, the complete field reference, and examples.

---

## File mapping per platform

### OpenClaw

Writes to `<workspace>/.elitza/agents/<agent-id>/workspace/`

| Package file | Destination |
|---|---|
| `profile/SOUL.md` | `SOUL.md` |
| `profile/AGENTS.md` | `AGENTS.md` |
| `profile/MEMORY.md` | `MEMORY.md` |
| `skills/*` | `skills/*` |
| *(all other layers)* | *(mirrored)* |

Then generates: `openclaw agents add <id> --workspace <path> --non-interactive`

### Hermes Agent

Writes directly to `~/.hermes/`

| Package file | Destination |
|---|---|
| `profile/SOUL.md` | `~/.hermes/SOUL.md` |
| `profile/MEMORY.md` | `~/.hermes/MEMORY.md` |
| `profile/USER.md` | `~/.hermes/USER.md` |
| `skills/*` | `~/.hermes/skills/*` |

No registration command needed. Restart Hermes or type `/reload-skills` in a session.

---

## Running locally

```bash
git clone https://github.com/dario-cositore/elitza-workshop
cd elitza-workshop
python -m http.server 4173
```

Then open **http://localhost:4173**

> **Note:** The File System Access API requires HTTPS or `localhost`. Opening `index.html` directly as a `file://` URL will not work.

No `npm install`, no bundler, no build step. It's plain HTML + CSS + JS.

---

## Deployment

See **[docs/deployment.md](docs/deployment.md)** for full instructions. Quick summary:

| Host | Steps |
|---|---|
| **Cloudflare Pages** | Connect GitHub repo → build command: none → output: `/` → deploy |
| **Netlify** | Connect GitHub repo → publish directory: `.` → deploy |
| **GitHub Pages** | Settings → Pages → source: `main` branch `/` root |
| **Self-hosted** | Serve the repo root as a static directory over HTTPS |

The `_headers` and `_redirects` files in the repo are pre-configured for Cloudflare Pages and Netlify.

### Browser compatibility

The File System Access API (used to write files to disk) requires:

| Browser | Support |
|---|---|
| Chrome / Chromium 86+ | Full |
| Edge 86+ | Full |
| Opera 72+ | Full |
| Safari 15.2+ | Partial |
| Firefox | Not supported (graceful fallback) |

---

## Roadmap

See **[docs/roadmap.md](docs/roadmap.md)** for the full plan. High-level summary:

| Phase | Feature | Status |
|---|---|---|
| 2.1 | Own store catalog served from Cloudflare R2 | Planned |
| 2.2 | License-gated zip delivery — no manual download/upload | Planned |
| 2.3 | Post-purchase auto-install via Gumroad webhook | Planned |
| 2.4 | One-click install links | Planned |
| 2.5 | Agent version management | Planned |
| 3 | LemonSqueezy store migration (`shop.dariocositore.com`) | In progress |
| 4 | Native desktop app (Tauri) — silent platform install, zero terminal | Paused |

---

## Security

The installer enforces the following before writing any file:

- **Blocks executable extensions:** `.sh`, `.bat`, `.exe`, `.ps1`, `.dll`, and more
- **Blocks path traversal:** `../`, `/etc/`, `/root/`, `.ssh`, etc.
- **Blocks secrets in content:** `OPENAI_API_KEY`, `password=`, `api_key=`, etc.
- **Rejects dangerous manifests:** packages declaring `allow_executables: true` are refused unconditionally
- **Scoped writes:** the browser API only writes inside the folder the user explicitly selects

See **[SECURITY.md](SECURITY.md)** for the full policy and how to report vulnerabilities.

For the full package format specification, see **[docs/package-format.md](docs/package-format.md)**.

---

## Contributing

See **[.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)** for the full guide.

- No build step — plain HTML + CSS + JS, served directly
- `python -m http.server 4173` is all you need locally
- Keep zero external runtime dependencies
- Test both OpenClaw and Hermes flows when touching shared code
- Open an issue before starting large changes

---

## Built by

**[Dario Cositore](https://dariocositore.com)** · [LinkedIn](https://www.linkedin.com/in/dario-cositore) · [X / Twitter](https://twitter.com/DarioCositore)

Part of the **Elitza** agent ecosystem.
