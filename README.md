# sawadev

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

- 🌐 **Code from anywhere** — a browser is all you need
- 🤖 **Bring your own AI agent** — autonomous, project-scoped, your keys
- 📦 **Per-project Docker workspaces** — isolated, persistent, reproducible
- ✏️ **Lightweight web editor** — file tree, code editing, and a live terminal
- 🔀 **Built-in routing** — preview your apps on auto subdomains
- 🔒 **Secure by default** — password + passkeys, HTTPS, no public ports beyond the proxy
- ⚡ **One-command install** — `curl | bash` on a fresh VPS

## Status

Early design stage. See [`SPEC.md`](./SPEC.md) for the full specification and roadmap.

## License

[AGPL-3.0](./LICENSE)
