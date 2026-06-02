# syntax=docker/dockerfile:1

# Image workspace généraliste « batteries included » (multi-arch amd64/arm64).
# Toolchains : Node, Python, Go, Git, build-essential — + agents CLI préinstallés
# (Claude Code, OpenAI Codex, Cursor). BYO clés : injectées par l'orchestrateur
# au lancement de la session agent (variable d'env), jamais dans l'image.
#
# Le conteneur est maintenu vivant par l'orchestrateur (tail -f /dev/null) ;
# les sessions terminal/agent s'attachent via `docker exec`.

FROM node:20-bookworm

ARG TARGETARCH
ARG GO_VERSION=1.22.5

# Outils système + Python. tmux : sessions terminal/agent persistantes (rattachables).
RUN apt-get update && apt-get install -y --no-install-recommends \
      git curl ca-certificates build-essential pkg-config \
      python3 python3-pip python3-venv \
      ripgrep less openssh-client tmux \
    && rm -rf /var/lib/apt/lists/*

# tmux : rendu natif (aucun style forcé). On garde seulement le comportement.
RUN cat > /etc/tmux.conf <<'EOF'
set -g history-limit 50000
set -g mouse on
set -g escape-time 10
EOF

# Go (binaire officiel, selon l'architecture cible).
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz" \
      | tar -C /usr/local -xz
ENV PATH="/usr/local/go/bin:/root/.local/bin:${PATH}" \
    GOPATH="/root/go"

# Agents CLI. Claude Code + Codex via npm (fiables) ; Cursor via son script
# d'installation (best-effort — l'utilisateur peut toujours en ajouter d'autres).
RUN npm install -g @anthropic-ai/claude-code @openai/codex
RUN curl -fsSL https://cursor.com/install | bash || \
      echo "Cursor CLI non installé (optionnel) — installable plus tard."

# Serveur MCP sawadev (stdio) : donne aux agents les capacités managées de
# l'orchestrateur (Quick Actions, Services, Ports, Git). L'URL + le token du
# workspace sont injectés par l'orchestrateur en variables d'env au lancement.
COPY mcp/ /opt/sawadev-mcp/
RUN cd /opt/sawadev-mcp && npm install --omit=dev \
 && printf '#!/bin/sh\nexec node /opt/sawadev-mcp/index.mjs "$@"\n' > /usr/local/bin/sawadev-mcp \
 && chmod +x /usr/local/bin/sawadev-mcp

# Configs agents : serveur MCP « sawadev » disponible par défaut.
RUN mkdir -p /root/.cursor /root/.codex \
 && printf '{\n  "mcpServers": {\n    "sawadev": { "command": "sawadev-mcp" }\n  }\n}\n' > /root/.claude.json \
 && printf '{\n  "mcpServers": {\n    "sawadev": { "command": "sawadev-mcp" }\n  }\n}\n' > /root/.cursor/mcp.json \
 && printf '[mcp_servers.sawadev]\ncommand = "sawadev-mcp"\n' > /root/.codex/config.toml

# Les sessions terminal/agent ouvrent un shell de login (bash -l), qui
# réinitialise le PATH via /etc/profile. On y réinjecte Go et ~/.local/bin
# pour que toute la toolchain soit disponible dans le terminal.
RUN printf 'export PATH="/usr/local/go/bin:/root/.local/bin:$PATH"\n' \
      > /etc/profile.d/sawadev-path.sh

# Prompt court et stylisé pour les sessions terminal : chemin (bleu) + flèche (violet).
# Sourcé par bash interactif via /etc/bash.bashrc (rien d'autre ne définit PS1 dans l'image).
RUN cat >> /etc/bash.bashrc <<'EOF'

# sawadev — prompt
PS1='\[\e[38;5;110m\]\w\[\e[0m\] \[\e[38;5;141m\]❯\[\e[0m\] '
EOF

WORKDIR /workspace
CMD ["bash"]
