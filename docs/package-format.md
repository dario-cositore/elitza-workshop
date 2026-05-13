# Elitza Package Format

This document is the authoritative reference for authors building Elitza agent packages compatible with Elitza Workshop.

---

## Overview

An Elitza package is a `.zip` archive that contains an agent profile, optional skills, and metadata. The Workshop installer validates, extracts, and writes the package contents to the appropriate platform folder without any server involvement.

---

## Zip structure

```
your-agent.zip
├── profile.manifest.json          # Required — package metadata
├── README.md                      # Required for OpenClaw; recommended for Hermes
│
├── profile/
│   ├── AGENTS.md                  # Required for OpenClaw
│   ├── SOUL.md                    # Required for BOTH platforms
│   ├── TOOLS.md                   # Required for OpenClaw
│   ├── BOOTSTRAP.md               # Required for OpenClaw
│   ├── MEMORY.md                  # Optional — pre-seeded persistent memory
│   ├── USER.md                    # Optional — user profile context
│   ├── IDENTITY.md                # Optional — extended identity layer
│   ├── ROUTINES.md                # Optional — scheduled / recurring behaviours
│   └── BOOT_SEQUENCE.md           # Optional — startup instructions
│
├── skills/                        # Optional — procedural skills
│   └── my-skill/
│       ├── skill.manifest.json
│       └── ...
│
├── kernel/                        # Optional — OpenClaw kernel layer
├── memory/                        # Optional — memory layer
├── knowledge/                     # Optional — knowledge base
├── tools/                         # Optional — tool definitions
├── guides/                        # Optional — getting started docs
├── examples/                      # Optional — usage examples
└── assets/                        # Optional — images, supporting files
```

---

## profile.manifest.json

This file must exist at the zip root (or inside one top-level folder). It is the first thing the installer reads and validates.

### Full schema

```json
{
  "schema": "elitza/package@1",
  "package_id": "your-agent-id",
  "package_name": "Your Agent Name",
  "package_version": "1.0.0",
  "author": "Your Name",
  "description": "A one-sentence description of what this agent does.",
  "platforms": ["openclaw", "hermes"],
  "skills": [
    "skill-name-one",
    "skill-name-two"
  ],
  "security": {
    "allow_executables": false,
    "allow_shell_scripts": false
  }
}
```

### Field reference

| Field | Required | Description |
|---|---|---|
| `schema` | Yes | Must contain the string `elitza` |
| `package_id` | Yes | Unique slug. Becomes the agent ID in OpenClaw. Use lowercase, hyphens only. |
| `package_name` | Yes | Human-readable name shown in the installer UI |
| `package_version` | No | Semver string. Shown in the installer UI. |
| `author` | No | Author name shown in the installer UI |
| `description` | No | Short description shown in the installer UI |
| `platforms` | No | Array declaring platform compatibility. Valid values: `"openclaw"`, `"hermes"`. If omitted, the installer accepts the package on any platform. |
| `skills` | No | Array of skill names. Used for the skill count display. If omitted, the installer counts `skills/*/skill.manifest.json` files instead. |
| `security.allow_executables` | No | Must be `false` or absent. If `true`, the installer **refuses the package**. |
| `security.allow_shell_scripts` | No | Must be `false` or absent. If `true`, the installer **refuses the package**. |

---

## Platform requirements

### OpenClaw

| File | Status |
|---|---|
| `profile.manifest.json` | Required |
| `README.md` | Required |
| `profile/AGENTS.md` | Required |
| `profile/SOUL.md` | Required |
| `profile/TOOLS.md` | Required |
| `profile/BOOTSTRAP.md` | Required |
| All other `profile/*` files | Optional |
| `skills/`, `kernel/`, `memory/`, `knowledge/`, `tools/`, `guides/`, `examples/`, `assets/` | Optional |

The installer writes to `<workspace>/.elitza/agents/<package_id>/workspace/` and generates an `openclaw agents add` registration command.

### Hermes Agent

| File | Status |
|---|---|
| `profile.manifest.json` | Required |
| `profile/SOUL.md` | Required |
| `profile/MEMORY.md` | Optional but strongly recommended |
| `profile/USER.md` | Optional |
| `skills/` | Optional |
| All other layers | Ignored |

The installer writes directly to the user's `~/.hermes/` folder. No terminal command needed.

---

## Blocked content

The installer will **refuse any package** that contains:

### Blocked file extensions

`.sh`, `.bash`, `.zsh`, `.fish`, `.ps1`, `.bat`, `.cmd`, `.exe`, `.dll`, `.dylib`, `.so`, `.app`, `.msi`, `.deb`, `.rpm`, `.pkg`

### Blocked path patterns

`../`, `..\`, `/etc/`, `/usr/`, `/bin/`, `/root/`, `.ssh`, `id_rsa`, `authorized_keys`, `known_hosts`

### Blocked secret patterns in file content

`OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, `password=`, `secret=`, `api_key=`, `apikey=`

---

## Zip packaging tips

- The zip can have one top-level folder (e.g. `my-agent/profile.manifest.json`) or no top-level folder (e.g. `profile.manifest.json` at root). Both are supported.
- Do not include multiple top-level folders — the installer will not know which one is the package root.
- Keep file sizes reasonable. The installer runs entirely in the browser with no size limit imposed by the server, but very large packages (>50 MB) will be slow to process.
- Test your package with both platforms before distributing it.

---

## Example minimal Hermes package

```
my-agent.zip
├── profile.manifest.json
└── profile/
    ├── SOUL.md
    └── MEMORY.md
```

```json
{
  "schema": "elitza/package@1",
  "package_id": "my-agent",
  "package_name": "My Agent",
  "package_version": "1.0.0",
  "author": "Your Name",
  "platforms": ["hermes"]
}
```

---

## Example full dual-platform package

```
my-agent.zip
├── profile.manifest.json
├── README.md
├── profile/
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── TOOLS.md
│   ├── BOOTSTRAP.md
│   ├── MEMORY.md
│   └── USER.md
└── skills/
    └── my-skill/
        └── skill.manifest.json
```

```json
{
  "schema": "elitza/package@1",
  "package_id": "my-agent",
  "package_name": "My Agent",
  "package_version": "1.0.0",
  "author": "Your Name",
  "platforms": ["openclaw", "hermes"],
  "skills": ["my-skill"]
}
```
