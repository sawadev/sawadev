<div align="center">

# sawadev

### Your dev machine in the cloud — AI-first, self-hosted, accessible from any browser

Turn a single Linux VPS into a complete remote development environment.
Code from your phone, tablet, or any computer — nothing to install locally.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-early%20design-orange.svg)](./docs/SPEC.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/duboisqpro/sawadev/pulls)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Caddy](https://img.shields.io/badge/Caddy-1F88C0?logo=caddy&logoColor=white)](https://caddyserver.com/)

[Overview](#overview) · [Features](#features) · [How it works](#how-it-works) · [Tech stack](#tech-stack) · [Roadmap](#roadmap)

</div>

---

## Overview

**sawadev** turns a single Linux VPS into a complete remote development
environment you can access from any browser — your phone, a tablet, or any
computer — with nothing to install locally.

It's built around two ideas:

- **AI-first development.** Bring your favorite CLI agent (Claude Code, Cursor
  CLI, Codex CLI, and more) and your own API keys. The agent is the primary way
  you write code, not an afterthought.
- **Truly self-hosted.** No mandatory third-party services. Everything runs in
  Docker on your own server, behind your own domain, with automatic HTTPS.

## Features

| | |
|---|---|
| 🌐 **Code from anywhere** | A browser is all you need — phone, tablet, or laptop |
| 🤖 **Bring your own AI agent** | Autonomous, project-scoped, your own API keys |
| 📦 **Per-project Docker workspaces** | Isolated, persistent, reproducible |
| ✏️ **Lightweight web editor** | File tree, code editing, and a live terminal |
| 🔀 **Built-in routing** | Preview your apps on automatic subdomains |
| 🔒 **Secure by default** | Password + passkeys, HTTPS, minimal attack surface |
| ⚡ **One-command install** | `curl \| bash` on a fresh VPS |

## How it works

Everything is containerized. Caddy and the orchestrator run as containers via
`docker compose`; the orchestrator drives the host Docker daemon and spins up
each project as a sibling container.

```
                 Internet (phone, tablet, laptop)
                              │  HTTPS (*.yourdomain.com)
                              ▼
                   ┌────────────────────┐
                   │  Caddy (container)  │   automatic HTTPS (DNS-01 wildcard)
                   │   reverse proxy     │
                   └─────────┬──────────┘
                             │
              ┌──────────────┴───────────────┐
              ▼                               ▼
   ┌────────────────────────┐     ┌──────────────────────────┐
   │ Orchestrator (container)│     │  Project subdomains        │
   │  auth · API · WS        │────▶│  project-3000.yourdomain   │
   │  drives Docker socket   │     │  → container port          │
   └─────────┬──────────────┘     └──────────────────────────┘
             │ creates / manages (sibling containers)
             ▼
   ┌───────────────────────────────────────────────┐
   │   Project workspaces (code · pty · AI agents)   │
   └───────────────────────────────────────────────┘
```

## Tech stack

- **Language:** TypeScript (end-to-end)
- **Runtime / packaging:** Bun
- **Frontend:** React + CodeMirror 6 + xterm.js
- **Orchestrator:** TypeScript HTTP/WebSocket API, Docker via `dockerode`
- **Reverse proxy:** Caddy (automatic HTTPS)
- **Isolation:** one Docker container per project (Docker-out-of-Docker)

## Roadmap

**MVP (v0.1)** — *"code from my phone"*
- `curl | bash` installer · password + passkey auth
- Create a workspace (general-purpose image) with a persistent volume
- Web editor (file tree + CodeMirror) and live web terminal
- Subdomain routing for app previews

**v0.2** — *comfort*
- Chat UI wrapping a CLI agent · API key management
- Multiple workspaces · manual start/stop

**Later**
- `devcontainer.json` support · HTTP-01 fallback · multi-provider DNS
- Auto-stop on inactivity · Docker socket proxy hardening

> See [`docs/SPEC.md`](./docs/SPEC.md) for the full specification.

## Status

Early design stage — the specification is complete and implementation is next.

## License

Licensed under the [GNU AGPL-3.0](./LICENSE). Any modified, network-hosted
version must make its source available.
