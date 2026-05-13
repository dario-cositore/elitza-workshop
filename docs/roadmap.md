# Roadmap

This document tracks the planned evolution of Elitza Workshop — from the current static site to a fully integrated agent hub.

---

## Current state — v2.0.0

A static web app with:
- OpenClaw install flow (5 steps, terminal command at the end)
- Hermes Agent install flow (zero terminal, direct file write)
- OpenClaw 6-step guided setup with Doctor diagnostics
- Hermes single-step guided setup
- Embedded Gumroad store link
- Advanced tools (repair / remove OpenClaw agents)

---

## Phase 2 — Cloudflare Worker backend

All items in this phase require a Cloudflare Worker + R2 bucket deployment alongside the static site.

### 2.1 Own store catalog

Currently the store link goes to an external Gumroad page. With a Worker:

- Worker serves a `GET /catalog` endpoint returning agent listings as JSON
- Frontend renders the catalog inline — users never leave the page
- Each listing includes name, description, price, platform compatibility, preview image
- Cloudflare R2 stores the catalog JSON and agent package zips

**Benefit:** Full control over the browsing experience. No Gumroad embed limitations.

### 2.2 License-gated zip delivery

Currently: user buys on Gumroad → downloads zip → comes back → uploads zip.
With a Worker:

- User enters their Gumroad license key in the installer
- Worker calls Gumroad API to validate the license
- Worker streams the correct agent zip directly to the installer from R2
- Installer receives the zip in memory and installs immediately

**Benefit:** Eliminates the download-then-upload step entirely. Zero file management.

### 2.3 Post-purchase auto-install

With Gumroad webhooks:

- User clicks "Buy" in the embedded checkout
- Gumroad fires a `sale` webhook to the Worker
- Worker stores the purchase and associates it with a session token
- Installer polls `GET /check-purchase?session=<token>` every 2 seconds
- When purchase confirms, installer fetches the zip and auto-proceeds to install

**User experience:** Click buy → complete payment → installer automatically continues. No manual steps.

### 2.4 One-click install links

- Worker issues short install URLs: `elitza.life/install/<agent-slug>?license=<key>`
- User clicks from their Gumroad receipt email
- Installer opens pre-loaded, validates the license, fetches the zip, and is ready to install in one click

### 2.5 Version management

- Worker tracks current version of each agent package
- Installer checks if the user's installed version is outdated
- Simple "Update available" notice with one-click update flow

---

## Phase 3 — LemonSqueezy migration

The store is migrating from Gumroad to `shop.dariocositore.com` (LemonSqueezy). When that goes live:

- Replace Gumroad API calls in the Worker with LemonSqueezy API
- Update store link and embedded checkout
- Existing license-gating logic adapts to LemonSqueezy's license validation endpoint

---

## Phase 4 — Desktop app

A native desktop app (likely Tauri, using the existing HTML/CSS/JS frontend) would enable:

- Silent platform installation — detect if OpenClaw or Hermes is installed, install it in the background if not
- Run `openclaw agents add` silently — no terminal command at the end for OpenClaw
- System tray integration
- Auto-update of agent profiles

Development is currently paused pending funding for multi-OS code signing certificates.

---

## Platform support

Planned additional platforms beyond OpenClaw and Hermes:

| Platform | Status | Notes |
|---|---|---|
| OpenClaw | Supported | Full 5-step flow + setup guide |
| Hermes Agent | Supported | Zero-terminal flow |
| Others | Under research | Will evaluate as the ecosystem grows |

To request support for a specific platform, open a feature request issue.

---

## Out of scope

The following are intentionally not planned:

- **Cloud storage of agent files** — Elitza Workshop is local-only by design
- **User accounts / login** — no authentication layer in the installer
- **Automatic agent execution** — the installer sets up agent profiles; it does not run them
