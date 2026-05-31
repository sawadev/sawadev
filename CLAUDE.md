# CLAUDE.md — Règles de travail pour sawadev

> Lis ce fichier **en entier** avant toute modification. Il fixe les règles non négociables.
> Sources de vérité produit/technique : **`docs/SPEC.md`** (décisions) et **`docs/PLAN.md`** (plan d'implémentation, jalons).

---

## Le projet en une phrase

**sawadev** : logiciel **auto-hébergé** qui transforme un VPS Linux en **poste de dev distant complet**, utilisable depuis un navigateur (mobile/tablette/PC), avec **l'IA (agents CLI) au centre**. Mono-utilisateur, open source **AGPL-3.0**.

---

## Communication

- **Réponds en français.**
- Sois concis et concret. Explique les décisions non triviales, pas l'évident.

---

## Règles d'or (non négociables)

1. **Lis `docs/SPEC.md` et `docs/PLAN.md` avant de coder.** Ne ré-invente pas une décision déjà prise. Si tu veux dévier, **demande d'abord**.
2. **Respecte les jalons de `PLAN.md`** (M0 → M6). Un jalon = une PR **mergeable, testée, démontrable**. Ne mélange pas plusieurs jalons.
3. **Dépendances minimales.** Aucune dépendance à un **SaaS tiers obligatoire** (principe auto-hébergé). Toute nouvelle dépendance npm doit être **justifiée** (poids, maintenance, alternative native Bun). En cas de doute, demande.
4. **TypeScript strict partout.** Pas de `any` implicite, pas de `@ts-ignore` sans commentaire justifiant.
5. **Aucun secret dans le dépôt.** Jamais de clé/API/mot de passe en clair, ni dans les logs. Secrets via env / volume.
6. **Ne casse jamais les workspaces de l'utilisateur.** Les conteneurs workspaces vivent **hors** du `docker compose` ; une MAJ ne recrée que `caddy` + `orchestrateur`.
7. **N'agis que sur les conteneurs labellisés `sawadev.managed=true`.** Ne touche jamais à un conteneur Docker non géré par sawadev.
8. **Simple d'abord.** Minimal et robuste avant l'enrichissement. Pas de sur-ingénierie (pas de Kubernetes, pas de microservices, pas de framework lourd).
9. **Mono-utilisateur.** Pas de multi-tenant, pas de RBAC, pas de gestion d'organisations.
10. **Pas de télémétrie**, pas de tracking, pas d'appel réseau non sollicité.

---

## Architecture (rappel — détails dans `PLAN.md`)

Monorepo **Bun workspaces** :

```
apps/web            # front React + Vite (mobile-first)
apps/orchestrator   # back Bun : HTTP API + WebSocket, Docker, auth, Caddy
packages/shared     # types TS partagés (contrats API + protocoles WS)
images/             # Dockerfiles (orchestrator, workspace généraliste, Caddy custom)
deploy/             # docker-compose, Caddyfile, install.sh
```

Runtime : **tout conteneurisé (DooD)**. L'orchestrateur pilote le démon Docker de l'hôte (`/var/run/docker.sock`) et crée les **workspaces comme conteneurs frères**. Caddy = reverse proxy HTTPS (DNS-01 wildcard).

> État actuel : seul `apps/web` (ex-`web/`) existe et tourne sur des **données mockées** (`data.ts`). Le backend est à construire (commence par **M0** dans `PLAN.md`).

---

## Stack imposée

- **Runtime back :** Bun (`Bun.serve`, `bun:sqlite`, `bun test`).
- **DB :** SQLite (mono-user) — pas de Postgres.
- **Docker :** `dockerode`. **Terminal :** `docker exec` TTY ↔ **xterm.js**.
- **Reverse proxy :** Caddy (Admin API pour routes dynamiques).
- **Auth :** mot de passe **argon2id** + **passkeys/WebAuthn** (`@simplewebauthn`).
- **Front :** React + Vite + **CodeMirror 6** (PAS Monaco) + xterm.js.
- **Lint/format :** Biome. **Types partagés :** `packages/shared`.

---

## Conventions de code

- **ESM**, `async/await`, pas de callbacks imbriqués.
- Nommage : `camelCase` (variables/fonctions), `PascalCase` (types/composants), `kebab-case` (fichiers non-composants).
- **Gestion d'erreurs explicite** : pas de `catch` silencieux ; remonter des erreurs typées.
- **Validation des entrées** côté serveur (corps de requête, params, chemins de fichiers).
- **Types partagés** : les contrats API/WS vivent dans `packages/shared` et sont importés des deux côtés — **une seule source de vérité**.
- Pas de commentaires qui paraphrasent le code ; commente l'**intention**/les contraintes.
- Front : garder l'éditeur **léger** et **mobile-first** ; réutiliser les tokens de `apps/web/src/theme.css` et les 3 layouts (mobile/tablette/desktop) déjà en place.

---

## Sécurité (à appliquer systématiquement)

- **Toute** route `/api/*` (hors auth publique) et **tout** `upgrade` WebSocket exigent une **session valide**.
- Mots de passe en **argon2id** ; sessions en cookie `HttpOnly; Secure; SameSite`.
- **Rate limit + ban IP** sur le login.
- **Clés API chiffrées** au repos (AES-256-GCM) ; injectées aux agents par variable d'environnement ; **jamais** renvoyées au client ni loggées.
- **Confinement des accès fichiers** à la racine du workspace (anti path-traversal).
- Caddy **Admin API** non exposée publiquement.

---

## Commandes (après M0 — Bun workspaces)

```bash
bun install              # à la racine (workspaces)
bun run dev              # front + orchestrateur en dev
bun run typecheck        # tsc --noEmit (tous les workspaces)
bun run lint             # Biome
bun run test             # bun test (back) + vitest (front)
bun run build            # build front + orchestrateur
```

> Avant de proposer une PR : `typecheck`, `lint` et `test` doivent être **verts**. Utilise la commande `/qa` (cf. `.claude/commands/qa.md`).

---

## Git / PR

- **Commits conventionnels** : `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- **Petites PR** par jalon ; titre clair ; description avec les **critères d'acceptation** cochés (cf. `PLAN.md` §12).
- **Ne commit jamais** sans demande explicite de l'utilisateur (sauf instruction contraire).
- Ne modifie jamais la config git, ne force-push pas, ne commit pas de secrets.

---

## À NE PAS faire

- Réintroduire **Monaco**, un framework front lourd, ou un state manager massif.
- Ajouter Kubernetes, un orchestrateur multi-nœuds, ou du multi-tenant.
- Rendre un service tiers (Cloudflare Tunnel, SaaS d'auth, etc.) **obligatoire**.
- Réimplémenter une IA maison : on **enveloppe des agents CLI** (BYO agent + BYO clés).
- Lancer/arrêter/supprimer des conteneurs Docker **non labellisés** sawadev.
- Stocker des secrets en clair ou les écrire dans les logs.
```
