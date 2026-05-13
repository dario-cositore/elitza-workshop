# Security Policy

## Scope

This document covers the security model of Elitza Workshop — the static web installer. It does **not** cover the security of agent profiles distributed through the Elitza store, the OpenClaw platform, or the Hermes Agent platform.

## What the installer does with your files

Elitza Workshop runs entirely in your browser. It:

- Reads the `.zip` file you select — locally, never uploaded anywhere
- Validates the zip contents against a strict blocklist before writing anything
- Writes extracted files only to the folder you explicitly select via your browser's folder picker
- Generates terminal commands as text — it does not execute them

Nothing leaves your machine. There is no telemetry, no analytics, no network requests during the install flow (except loading JSZip from a CDN on page load).

## Package security validation

Every zip package is validated before any file is written. The installer blocks:

**Executable file types:**
`.sh`, `.bash`, `.zsh`, `.fish`, `.ps1`, `.bat`, `.cmd`, `.exe`, `.dll`, `.dylib`, `.so`, `.app`, `.msi`, `.deb`, `.rpm`, `.pkg`

**Unsafe path patterns:**
`../`, `..\`, `/etc/`, `/usr/`, `/bin/`, `/root/`, `.ssh`, `id_rsa`, `authorized_keys`, `known_hosts`

**Secret-like content in files:**
`OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, `password=`, `secret=`, `api_key=`, `apikey=`

**Manifest flags:**
Packages that declare `allow_executables: true` or `allow_shell_scripts: true` in their manifest are refused unconditionally.

## Reporting a vulnerability

If you discover a security issue — especially anything that could allow a malicious `.zip` package to bypass the blocklist and write harmful files — please report it privately.

**Email:** `security@dariocositore.com` (or `support@dariocositore.com` if that address is not active)

Please include:
- A description of the vulnerability
- Steps to reproduce (including a minimal malicious zip if applicable)
- The potential impact

We will respond within 72 hours and aim to patch critical issues within 7 days.

**Please do not open a public GitHub issue for security vulnerabilities.**

## Known limitations

- The File System Access API is sandboxed by the browser — the installer can only write to the folder the user explicitly selects. It cannot access arbitrary filesystem locations.
- The installer does not verify the cryptographic integrity of packages (no checksums or signatures on the zip). Users should only install packages from trusted sources.
- The blocklist approach is defence-in-depth, not a guarantee. Do not install packages from untrusted sources.
