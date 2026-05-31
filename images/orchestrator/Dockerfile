# Image de l'orchestrateur sawadev — multi-stage Bun.
# Build : installe les workspaces + build le front. Runtime : Bun mince qui
# exécute l'orchestrateur et sert le build statique du front (WEB_DIST).
# Contexte de build attendu : racine du dépôt.

# ── build ──────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS build
WORKDIR /app

# Manifests de TOUS les workspaces (le lockfile gelé exige le set complet).
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/orchestrator/package.json apps/orchestrator/
COPY apps/landing/package.json apps/landing/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

# Sources + build du front.
COPY . .
RUN bun run --filter 'sawadev-web' build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8787 \
    WEB_DIST=/app/apps/web/dist \
    DB_PATH=/data/sawadev.db \
    WORKSPACES_DIR=/data/workspaces

# Code + dépendances + build front (depuis l'étage build).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/orchestrator ./apps/orchestrator
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/package.json ./package.json

EXPOSE 8787
# /data (volume) et /var/run/docker.sock (socket hôte) sont montés par compose.
CMD ["bun", "apps/orchestrator/src/index.ts"]
