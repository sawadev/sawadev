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

# Outils système + Python.
RUN apt-get update && apt-get install -y --no-install-recommends \
      git curl ca-certificates build-essential pkg-config \
      python3 python3-pip python3-venv \
      ripgrep less openssh-client \
    && rm -rf /var/lib/apt/lists/*

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

# Les sessions terminal/agent ouvrent un shell de login (bash -l), qui
# réinitialise le PATH via /etc/profile. On y réinjecte Go et ~/.local/bin
# pour que toute la toolchain soit disponible dans le terminal.
RUN printf 'export PATH="/usr/local/go/bin:/root/.local/bin:$PATH"\n' \
      > /etc/profile.d/sawadev-path.sh

WORKDIR /workspace
CMD ["bash"]
