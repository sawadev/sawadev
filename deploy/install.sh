#!/usr/bin/env bash
# sawadev — installeur (curl -fsSL https://sawadev.io/install | bash)
# Sur une machine Linux vierge : installe Docker au besoin, récupère la stack
# et la démarre. Mono-utilisateur, auto-hébergé.
set -euo pipefail

REPO_RAW="${SAWADEV_REPO_RAW:-https://raw.githubusercontent.com/sawadev/sawadev/main}"
DIR="${SAWADEV_DIR:-/opt/sawadev}"

log()  { printf '\033[1;35m▸\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = "0" ] || err "Lance l'installeur en root (ou via sudo)."
case "$(uname -s)" in Linux) ;; *) err "sawadev s'installe sur Linux uniquement." ;; esac

# 1) Docker + plugin compose
if ! command -v docker >/dev/null 2>&1; then
  log "Installation de Docker…"
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || err "Le plugin 'docker compose' est requis."

# 2) Récupération de la stack
log "Récupération de la stack dans $DIR…"
mkdir -p "$DIR"
for f in docker-compose.yml Caddyfile; do
  curl -fsSL "$REPO_RAW/deploy/$f" -o "$DIR/$f"
done

# 3) Configuration (idempotent : ne réécrit pas un .env existant)
if [ ! -f "$DIR/.env" ]; then
  log "Configuration de l'instance"
  read -rp "  Domaine (ex. example.com) : " DOMAIN
  read -rp "  Token API Cloudflare (DNS-01) : " CF_TOKEN
  SECRET="$(openssl rand -base64 32)"
  cat > "$DIR/.env" <<EOF
DOMAIN=$DOMAIN
CLOUDFLARE_API_TOKEN=$CF_TOKEN
SAWADEV_SECRET=$SECRET
REGISTRY=ghcr.io/sawadev
TAG=latest
CHANNEL=stable
EOF
  chmod 600 "$DIR/.env"
else
  log ".env existant conservé."
fi

# 4) Démarrage
cd "$DIR"
log "Téléchargement des images et démarrage…"
docker compose pull
docker compose up -d
# Pré-télécharge l'image workspace généraliste.
WS_IMG="$(grep -E '^REGISTRY=' .env | cut -d= -f2)/workspace:$(grep -E '^TAG=' .env | cut -d= -f2)"
docker pull "$WS_IMG" || true

DOMAIN="$(grep -E '^DOMAIN=' .env | cut -d= -f2)"
log "sawadev est lancé ! Ouvre : https://app.$DOMAIN"
log "Première visite → crée ton mot de passe admin puis enregistre une passkey."
