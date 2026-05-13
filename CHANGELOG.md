# Changelog

---

## [v2.0.0] — 2026-05-13 — Elitza Workshop

### Renamed
- Project renamed from **Elitza Agent Installer** to **Elitza Workshop** to reflect the expanding scope: multi-platform support, future store integration, and the broader Elitza ecosystem.

### Added
- **Hermes Agent support** — Full install flow for [Hermes Agent by Nous Research](https://hermes-agent.nousresearch.com/). Writes `SOUL.md`, `MEMORY.md`, `USER.md`, and `skills/` directly to the user's `~/.hermes/` folder via the browser File System Access API. Zero terminal commands required.
- **Platform selector on welcome screen** — Two primary install buttons: "Install for OpenClaw" and "Install for Hermes Agent". Each sets the platform before the user uploads their package.
- **Hermes Setup Guide** — Single-step setup article showing the `curl` install command for Hermes, with WSL note for Windows users and OpenRouter recommendation.
- **Platform-aware package validation** — Hermes installs only require `profile.manifest.json` + `profile/SOUL.md`. OpenClaw retains its full required-file checklist.
- **Platform-aware workspace step** — Hermes mode hides the path input (no command generation needed) and shows Hermes-specific folder instructions. OpenClaw mode unchanged.
- **Platform-aware done screen** — Hermes done screen shows a confirmation with `/reload-skills` instructions. OpenClaw done screen unchanged.
- **"Setup Hermes Agent First →" button** on welcome screen alongside the existing OpenClaw setup guide button.

### Changed
- Version bumped to `2.0.0`.
- Welcome screen badges updated to show "OpenClaw" and "Hermes Agent".
- "not installed yet?" divider replaces OpenClaw-specific hint on the welcome screen.

---

## [v1.3.0] — 2026-05-10

### Added

- **Gumroad store link on Welcome screen** — A "Browse Agent Profiles on Store →" link now appears on the home page for visitors who don't have a profile yet. Styled as a dashed secondary button with an "or" divider and a short hint ("Get your profile first, then come back here to install it.") to make the purchase path obvious for organic traffic.

---

## [v1.2.0] — 2026-05-10

### Changed

- **OpenClaw setup steps S2–S5 — UX overhaul ("Doctor" pattern)** — The confusing inline textarea (which looked like you should paste the command into it) is now hidden behind a collapsible "Something went wrong? Open Doctor →" toggle. The primary action on each step is now a clear "I ran it — Continue →" button. Users who have no problems never see a textarea. Users who hit an error can open the Doctor, paste their output, and get a specific diagnosis + fix.

- **Doctor toggle** — Clicking the toggle reveals a clearly labelled section with context ("Paste what appeared in your terminal — the Doctor will diagnose it"), a textarea, and a "Diagnose →" button. Clicking again collapses it with text changing to "Close Doctor ←".

### Added

- **Advanced Tools page** — Restored the Repair and Remove tools that were missing from the HTML. Accessible from a small "Advanced Tools (Repair / Remove agents) →" link at the bottom of the Welcome screen.
  - **Repair Agent Registration** — Enter an Agent ID, workspace path, and shell type to generate a re-registration command for agents that are installed but not showing up in OpenClaw.
  - **Remove / Uninstall Agent** — Generate the command to fully delete an agent from OpenClaw.
  - Both tools show the generated command in a copy-able panel that appears only after generating.

---


All notable changes to the Elitza Agent Installer are documented here.

---

## [v1.1.0] — 2026-05-10

### Fixed

- **Back-to-Home navigation broken from OpenClaw setup flow** — Clicking "← Home" from any setup step (S1–S5) now correctly returns to the Welcome screen. Root cause: `showStep()` had a guard (`step === currentStep`) that short-circuited when `currentStep` was already `1`, even if the active screen was a setup step. Fixed by replacing the equality check with a DOM-state check (`next.classList.contains('active')`).

- **Step counter stuck at "Step 1 / 5" during OpenClaw setup** — The header progress label now updates correctly as you move through the setup flow ("Setup 1 / 6", "Setup 2 / 6", etc.). This was a side-effect of the `showStep` guard bug above.

- **"Go to Profile Installer" button on setup completion screen** — Simplified `goToMainInstaller()` to use the fixed `showStep()` instead of a fragile double-setTimeout DOM manipulation. The button now reliably returns to the Welcome screen.

- **`http://127.0.0.1:18789/` in Step 5 (Dashboard) not clickable** — The URL in the intro paragraph is now a proper `<a>` link that opens in a new tab, matching the existing clickable link in the tips box below it.

### Already present (confirmed working in v1.1.0)

- OpenRouter recommendation with link on Step 4 (Onboard / API key step)
- "Built by dariocositore.com · LinkedIn" credit on the Welcome screen
- Back/forward navigation buttons on every step of both flows
- Verify output parser correctly detects `OpenClaw 2026.x.x (hash)` version format
- Detailed error handling with actionable hints per step (install, verify, onboard, dashboard)
- OS-aware commands (Windows PowerShell / macOS / Linux)
- Skip buttons on every setup step

---

## [v1.0.9] — 2026-05-07

### Added

- **Full OpenClaw Setup Guide flow** (Steps S1–S6) accessible from the Welcome screen via "Setup OpenClaw First →" button
- OS detection (Windows / macOS / Linux) with platform-specific install commands
- Paste-back terminal output validation with deep error analysis per step:
  - Step S2 — Install: detects npm errors, Node.js version issues, permission errors, network failures
  - Step S3 — Verify: detects PATH issues, missing binary, permission errors
  - Step S4 — Onboard: detects API key errors, daemon failures, cancellation
  - Step S5 — Dashboard: detects port conflicts, config errors, already-running state
- Skip buttons on every setup step
- OpenRouter recommendation with link on the API key step
- "Built by dariocositore.com · LinkedIn" attribution on the Welcome screen
- Back navigation buttons (`← Home`, `← Back`) on every step of both flows
- `http://127.0.0.1:18789/` as a clickable link in the Dashboard step tips box
- Step progress label updates in the header during setup flow ("Setup X / 6")
- Fallback error hints for generic error/warning patterns

### Fixed

- Console error `Cannot set properties of null (setting 'value')` — init() now safely handles missing optional elements
- Buttons not responding on first load — event binding order corrected
- `file://` security origin issue — all logic is self-contained with no cross-origin file reads

---

## [v1.0.8 and earlier]

- Initial profile installer flow (Steps 1–5): zip upload, workspace selection, review, install, done
- WebGL halftone shader background
- JSZip-based client-side extraction with security validation (blocked extensions, secret patterns, path traversal)
- Multi-shell command generation (PowerShell, CMD, bash/zsh, fish)
- Analog / Y2K visual style with paper-card UI, typewriter text, dymo labels
