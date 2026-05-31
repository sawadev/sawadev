# sawadev — Plan technique d'implémentation

> Plan de passage à l'implémentation (destiné à Claude Code).
> À lire **après** `SPEC.md` (décisions produit/archi) et `CLAUDE.md` (règles de travail).
> Dernière mise à jour : 31 mai 2026

---

## 0. Objet de ce document

`SPEC.md` fige le **quoi** et le **pourquoi**. Ce document décrit le **comment** : structure du dépôt, contrats d'API, modules backend, intégration du front existant, sécurité, images Docker, déploiement, mises à jour, tests et **jalons d'implémentation** avec critères d'acceptation.

L'objectif est qu'un agent (Claude Code) puisse implémenter le MVP de façon autonome, jalon par jalon, sans réinterpréter les décisions déjà prises.

État actuel du dépôt :
- `web/` — front React + Vite + TS **fonctionnel mais branché sur des données mockées** (`web/src/data.ts`). Navigation, thèmes, 3 layouts (mobile / tablette / desktop) déjà en place.
- `SPEC.md`, `README.md`, `LICENSE` (AGPL-3.0), `design/` (handoff Claude Design).
- **Aucun backend pour l'instant.**

---

## 1. Rappel des contraintes structurantes (issues de la SPEC)

- **Mono-utilisateur** : 1 instance = 1 développeur. Pas de multi-tenant, pas de RBAC.
- **Auto-hébergé pur** : aucune dépendance obligatoire à un SaaS tiers. Tout tourne sur le VPS.
- **TypeScript de bout en bout**, runtime **Bun**.
- **Tout conteneurisé (DooD)** : Caddy + orchestrateur en conteneurs ; workspaces = **conteneurs frères** créés via le socket Docker de l'hôte.
- **BYO agent + BYO clés** : on n'implémente **pas** d'IA maison ; on enveloppe des agents **CLI** (Claude Code, Cursor CLI, Codex CLI…) dans un terminal.
- **Mobile-first**, éditeur **léger** (CodeMirror 6, pas Monaco).
- **Simple d'abord** : minimal et robuste avant l'enrichissement.

---

## 2. Architecture cible du dépôt (monorepo Bun workspaces)

```
sawadev/
├── apps/
│   ├── web/                 # ← migration de l'actuel web/ (front React)
│   └── orchestrator/        # backend Bun : HTTP API + WebSocket
├── packages/
│   └── shared/              # types TS partagés (contrats API + protocoles WS)
├── images/
│   ├── orchestrator/        # Dockerfile de l'orchestrateur (multi-stage Bun)
│   └── workspace/           # Dockerfile image généraliste (Node/Python/Go + agents CLI)
├── deploy/
│   ├── docker-compose.yml   # caddy + orchestrateur
│   ├── docker-compose.dev.yml
│   ├── Caddyfile.tmpl        # template de config (wildcard + DNS-01)
│   └── install.sh           # curl | bash
├── docs/
├── CLAUDE.md                # règles de travail de l'agent
├── SPEC.md
├── PLAN.md
└── package.json             # racine : workspaces Bun, scripts globaux
```

**Action M0 :** déplacer `web/` → `apps/web/` et initialiser les workspaces Bun. Les chemins d'import internes au front ne changent pas (tout est relatif à `apps/web/src`).

**Topologie runtime** (rappel SPEC §5 ter) :

```
Navigateur ──HTTPS──▶ Caddy (conteneur) ──┬─▶ Orchestrateur (conteneur, /var/run/docker.sock)
                                          │      └─▶ crée/pilote les workspaces (conteneurs frères)
                                          └─▶ *.domaine.com ─▶ port du conteneur workspace (preview)
```

---

## 3. Stack & outillage

| Domaine | Choix | Notes |
|---|---|---|
| Langage | TypeScript strict | `strict: true`, pas de `any` implicite |
| Runtime/back | **Bun** | serveur HTTP natif `Bun.serve`, `bun:sqlite`, `bun test` |
| HTTP/routing back | `Bun.serve` + routeur léger (maison ou `hono`) | `hono` acceptable (léger, 0 dépendance lourde) |
| WebSocket | WS natif de `Bun.serve` | terminal, watch fichiers, flux agent |
| Pilotage Docker | `dockerode` | create/start/stop/remove, exec, logs, stats |
| Terminal | `docker exec` interactif **ou** `node-pty` dans le workspace ↔ **xterm.js** | cf. §6.3 |
| Reverse proxy | **Caddy** + **Caddy Admin API** (`:2019`) | routes dynamiques sans reload brutal |
| Certificats | DNS-01 wildcard (Cloudflare) ; repli HTTP-01 plus tard | plugin via `xcaddy` |
| DB | **SQLite** (`bun:sqlite`), fichier sur volume | mono-utilisateur → pas de Postgres |
| Hash mot de passe | **argon2id** | `@node-rs/argon2` (binaire rapide) ou `bun`-compatible |
| WebAuthn | `@simplewebauthn/server` + `@simplewebauthn/browser` | passkeys |
| Chiffrement clés API | AES-256-GCM, clé dérivée d'un secret d'instance | clés jamais en clair sur disque |
| Front | React + Vite + **CodeMirror 6** + **xterm.js** | déjà partiellement en place |
| Client data front | `@tanstack/react-query` (REST) + hooks WS maison | léger, cache simple |
| Lint/format | **Biome** (lint + format en un outil) | rapide, 0 config lourde |
| Tests | `bun test` (back) + `vitest` (front) | + tests d'intégration Docker |
| CI | GitHub Actions + `docker buildx` (multi-arch) | images sur **GHCR** |

> Toute nouvelle dépendance doit être justifiée (cf. règle « dépendances minimales » dans `CLAUDE.md`).

---

## 4. Modèle de données (SQLite)

Fichier unique sur un volume persistant (`/data/sawadev.db`). Migrations idempotentes appliquées au démarrage de l'orchestrateur (table `schema_migrations`).

```sql
-- Configuration d'instance (clé/valeur)
CREATE TABLE config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
); -- ex: domain, dns_provider, channel, instance_secret (chiffré au repos hors DB)

-- L'unique utilisateur (mono-user)
CREATE TABLE app_user (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT NOT NULL,           -- argon2id
  created_at    INTEGER NOT NULL
);

-- Passkeys WebAuthn
CREATE TABLE credentials (
  id              TEXT PRIMARY KEY,       -- credentialID (base64url)
  public_key      BLOB NOT NULL,
  counter         INTEGER NOT NULL,
  transports      TEXT,                   -- JSON
  label           TEXT,
  created_at      INTEGER NOT NULL,
  last_used_at    INTEGER
);

-- Sessions (cookie opaque -> session)
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,          -- token aléatoire 256 bits
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  user_agent  TEXT,
  ip          TEXT
);

-- Workspaces (projets)
CREATE TABLE workspaces (
  id            TEXT PRIMARY KEY,        -- slug ('storefront-api')
  name          TEXT NOT NULL,
  image         TEXT NOT NULL,           -- image utilisée
  container_id  TEXT,                    -- id docker courant
  volume        TEXT NOT NULL,           -- nom du volume / bind path
  lifecycle     TEXT NOT NULL DEFAULT 'always-on', -- 'always-on' | 'idle-stop'
  created_at    INTEGER NOT NULL,
  last_opened_at INTEGER
);

-- Ports exposés / routes preview par workspace
CREATE TABLE ports (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  port         INTEGER NOT NULL,
  subdomain    TEXT NOT NULL,            -- 'storefront-3000'
  PRIMARY KEY (workspace_id, port)
);

-- Clés API des agents (chiffrées)
CREATE TABLE api_keys (
  provider     TEXT PRIMARY KEY,         -- 'anthropic' | 'openai' | 'cursor' | ...
  ciphertext   BLOB NOT NULL,            -- AES-256-GCM
  iv           BLOB NOT NULL,
  created_at   INTEGER NOT NULL
);

-- Anti-bruteforce login
CREATE TABLE login_attempts (
  ip          TEXT PRIMARY KEY,
  fails       INTEGER NOT NULL DEFAULT 0,
  banned_until INTEGER
);
```

---

## 5. Contrats d'API

Tous les types vivent dans `packages/shared` et sont importés par le front et le back (source unique de vérité). Préfixe `/api`. **Toute** route (hors auth publique) exige une session valide (middleware).

### 5.1 REST (esquisse)

```
# Auth
GET    /api/auth/state                      -> { setupDone, authenticated }
POST   /api/auth/setup        { password }  -> crée l'utilisateur (1ère install)
POST   /api/auth/login        { password }  -> set-cookie session
POST   /api/auth/logout                     -> invalide la session
# WebAuthn
POST   /api/auth/passkey/register/options   -> challenge
POST   /api/auth/passkey/register/verify    -> enregistre la credential
POST   /api/auth/passkey/login/options      -> challenge
POST   /api/auth/passkey/login/verify       -> set-cookie session

# Workspaces
GET    /api/workspaces                      -> Workspace[]
POST   /api/workspaces        { name, image }
GET    /api/workspaces/:id                  -> Workspace (+ statut conteneur)
POST   /api/workspaces/:id/start
POST   /api/workspaces/:id/stop
DELETE /api/workspaces/:id

# Fichiers (dans le workspace :id)
GET    /api/workspaces/:id/files?path=/     -> TreeNode[]
GET    /api/workspaces/:id/file?path=...    -> { content }
PUT    /api/workspaces/:id/file?path=...    { content }
POST   /api/workspaces/:id/file/move        { from, to }
DELETE /api/workspaces/:id/file?path=...

# Ports / preview
GET    /api/workspaces/:id/ports            -> Port[]
POST   /api/workspaces/:id/ports            { port }  -> crée la route + sous-domaine
DELETE /api/workspaces/:id/ports/:port

# Clés API / réglages
GET    /api/settings/keys                   -> [{ provider, connected }]  (jamais la clé)
PUT    /api/settings/keys     { provider, key }
DELETE /api/settings/keys/:provider

# Système / MAJ
GET    /api/system/version                  -> { current, latest, channel }
POST   /api/system/update                   -> lance le conteneur updater
```

### 5.2 WebSocket

Un endpoint par usage, authentifié par cookie de session (vérifié au `upgrade`) :

- `GET /ws/terminal/:workspaceId` — flux PTY bidirectionnel.
  - client → serveur : `{ type:'input', data }`, `{ type:'resize', cols, rows }`
  - serveur → client : `{ type:'output', data }`, `{ type:'exit', code }`
- `GET /ws/agent/:workspaceId` — session d'agent CLI (variante du terminal, démarre l'agent choisi + contexte). Réutilise le même protocole que le terminal au MVP.
- `GET /ws/files/:workspaceId` — événements de changement de fichiers (watch) pour rafraîchir l'arbre (post-MVP, optionnel).

---

## 6. Modules backend (`apps/orchestrator`)

Organisation suggérée :

```
apps/orchestrator/src/
├── index.ts            # Bun.serve : routage HTTP + upgrade WS
├── config.ts           # lecture env + table config
├── db/                 # bun:sqlite, migrations, repositories
├── auth/               # password, webauthn, sessions, middleware, rate-limit
├── workspaces/         # dockerode : cycle de vie, volumes, labels
├── terminal/           # pty / docker exec ↔ ws
├── files/              # fs dans le conteneur (exec ou montage)
├── caddy/              # Caddy Admin API : routes dynamiques
├── agents/             # lancement des agents CLI + clés
├── updater/            # conteneur updater éphémère
└── ws/                 # helpers WebSocket (auth upgrade, heartbeat)
```

### 6.1 Auth (`auth/`)
- **Setup** (1ère install) : crée `app_user` avec hash argon2id du mot de passe admin.
- **Login mot de passe** : vérifie le hash ; en cas d'échec, incrémente `login_attempts` ; bannit l'IP après N échecs (fail2ban-like).
- **Passkeys** : `@simplewebauthn/server` pour register/login (challenge stocké en mémoire/session courte). `rpID` = domaine de l'instance.
- **Sessions** : token opaque (256 bits) → cookie `HttpOnly; Secure; SameSite=Lax`. Expiration glissante. Table `sessions`.
- **Middleware** : `requireSession` sur toutes les routes `/api/*` (hors `auth/*` publiques) et au `upgrade` WS. Rejet 401 sinon.

### 6.2 Workspaces (`workspaces/`)
- `dockerode` pour `create/start/stop/remove`, `inspect` (statut), `stats` (ressources).
- **Labels** sur chaque conteneur (`sawadev.workspace=<id>`, `sawadev.managed=true`) → permet de **retrouver/filtrer** les workspaces et de **ne jamais toucher** aux conteneurs hors-sawadev.
- **Volumes** : un volume Docker (ou bind mount `/data/workspaces/<id>`) monté sur `/workspace` → persiste à la recréation.
- **Réseau** : réseau Docker dédié `sawadev_net` ; l'orchestrateur et Caddy y sont attachés pour joindre les workspaces par nom de conteneur.
- **Cycle de vie** : `always-on` par défaut. `idle-stop` (post-MVP) via suivi d'activité.
- **Important (MAJ) :** les workspaces ne font **PAS** partie du `docker-compose` (créés à la volée) → une MAJ de l'app ne les interrompt jamais.

### 6.3 Terminal (`terminal/`)
- **Approche MVP** : `docker exec -it <container> <shell>` via l'API `dockerode.exec` (TTY activé), branché sur une WebSocket. Pas besoin de `node-pty` côté hôte puisque le PTY vit **dans le conteneur**.
- **Resize** : `exec.resize({ h, w })` sur message `resize`.
- **xterm.js** côté front (addon-fit pour le responsive mobile).
- L'**agent CLI** tourne dans ce terminal (ou un terminal dédié) → c'est le cœur de l'approche « agent CLI, éditeur enveloppe ».

### 6.4 Fichiers (`files/`)
- **MVP** : opérations via `docker exec` (ls/cat/écriture par flux) **ou**, si bind mount, accès direct au chemin hôte (`/data/workspaces/<id>`) — plus simple et plus rapide. **Privilégier le bind mount** au MVP.
- Garde-fous : normaliser les chemins, **interdire la sortie de la racine du workspace** (anti path-traversal).
- API : list (arbre paresseux par dossier), read, write, move, delete.

### 6.5 Caddy (`caddy/`)
- Caddy en conteneur avec **Admin API** activée (`localhost:2019`, non exposée publiquement).
- L'orchestrateur **POST/PATCH** la config JSON de Caddy pour :
  - router `app.domaine.com` → orchestrateur (UI + API + WS) ;
  - router chaque `projet-<port>.domaine.com` → `conteneur_workspace:port` (preview).
- **TLS** : wildcard `*.domaine.com` via **DNS-01 (Cloudflare)**. Build Caddy custom (`xcaddy` + plugin DNS) → image Caddy maison.
- **Dev local** : pas de DNS public → `*.localhost` + certificats internes Caddy (CA locale).

### 6.6 Agents IA (`agents/`)
- **Pas d'IA maison.** On lance l'agent **CLI** choisi dans un PTY de workspace, en injectant la **clé API** (déchiffrée) via variable d'environnement de l'exec (jamais écrite sur disque en clair).
- Le panneau « AI » du front est une **enveloppe** de cette session (au MVP, peut être le même flux que le terminal, stylé en chat). Le parsing « joli » (cartes outil, diffs) est un raffinement post-MVP.
- Gestion des clés : `api_keys` chiffrée AES-256-GCM ; l'UI n'affiche jamais la valeur, seulement l'état « connecté ».

### 6.7 Updater (`updater/`)
- Au clic « update » : l'orchestrateur lance un **conteneur updater jetable** (via le socket) qui exécute `docker compose pull && docker compose up -d` sur `caddy` + `orchestrateur`.
- **Health check** post-MAJ + **rollback** automatique (digest précédent) si l'orchestrateur ne répond pas.
- Versions épinglées par **digest**, tags **semver** (`v0.2.1`), canaux `stable`/`beta`. Vérif des MAJ via tags **GHCR** / manifeste des GitHub Releases.

---

## 7. Intégration du front existant (`apps/web`)

Le front est déjà construit avec des données mockées. Plan de branchement :

1. **Couche API** : `apps/web/src/api/` — client `fetch` typé (types importés de `packages/shared`) + hooks `react-query`.
2. **Remplacer `data.ts`** progressivement par des appels réels, écran par écran :
   - Login → `auth/*` (mot de passe + passkey via `@simplewebauthn/browser`).
   - Dashboard → `GET /api/workspaces`.
   - Settings → `GET/PUT /api/settings/keys`, version système.
   - IDE :
     - Fichiers → `files/*` + `<CodeMirror>` (remplace le `Code` statique).
     - Terminal → `xterm.js` sur `/ws/terminal/:id`.
     - AI → enveloppe `/ws/agent/:id`.
     - Preview → `ports/*`.
3. **Auth flow** : garde la route `/login` ; après succès, le cookie de session est posé. Un garde de route (`requireAuth`) redirige vers `/login` si `GET /api/auth/state` n'est pas authentifié. Le **bouton logout** appelle `POST /api/auth/logout`.
4. **Responsive** : conserver les 3 layouts (mobile/tablette/desktop) et les tokens `theme.css` existants. **Ne pas** alourdir l'éditeur.
5. **Servir le front** : en prod, l'orchestrateur sert le build statique de `apps/web` (ou Caddy le sert directement). En dev, Vite + proxy `/api` et `/ws` vers l'orchestrateur.

---

## 8. Sécurité (modèle de menace synthétique)

| Menace | Mitigation |
|---|---|
| Accès non authentifié (UI/API/WS) | `requireSession` partout, y compris à l'`upgrade` WS |
| Bruteforce login | argon2id + rate limit + ban IP (`login_attempts`) |
| Vol de session | cookie `HttpOnly/Secure/SameSite`, expiration, HTTPS only |
| Fuite de clés API | chiffrement AES-256-GCM au repos, injection par env d'exec, jamais loggées, jamais renvoyées au client |
| Path traversal (fichiers) | normalisation + confinement strict à la racine du workspace |
| Pouvoir du socket Docker | accepté en mono-user ; **durcissement futur** : `docker-socket-proxy` (liste blanche de commandes) |
| Conteneurs hors-sawadev | filtrage strict par **labels** ; ne jamais agir sur un conteneur non labellisé |
| Interruption des projets pendant une MAJ | workspaces **hors** compose ; MAJ ne recrée que caddy+orchestrateur |

Règles : **aucun secret dans le dépôt** ; secrets via env / volume ; logs sans données sensibles.

---

## 9. Images Docker

- **`images/orchestrator`** : multi-stage Bun (build → image runtime mince). Contient l'orchestrateur + le build du front. Monte `/var/run/docker.sock` et `/data`.
- **`images/workspace`** : image **généraliste multi-arch** (`linux/amd64` + `linux/arm64`) : Node, Python, Go, Git, build-essential + **Claude Code, Cursor CLI, Codex CLI préinstallés**. Point de montage `/workspace`.
- **Caddy** : image custom (`xcaddy` + plugin DNS Cloudflare).
- Build & push via `docker buildx` (multi-arch) en CI vers **GHCR**.

---

## 10. Déploiement & dev local

**Prod (VPS Linux)** — `deploy/install.sh` (`curl | bash`) :
1. Installe Docker + plugin compose si absent.
2. Récupère `docker-compose.yml` + images (orchestrateur, Caddy custom).
3. Demande : domaine, token DNS Cloudflare, mot de passe admin.
4. Génère `Caddyfile`/config (wildcard + DNS-01), `docker compose up -d`, pull l'image workspace.
5. Affiche l'URL → login + enregistrement passkey.

**Dev local (macOS, Docker Desktop)** :
- `docker-compose.dev.yml` : orchestrateur en mode watch (`bun --watch`), Vite en parallèle, Caddy en `*.localhost` (CA interne) ou bypass.
- Pas de DNS-01 → certificats internes Caddy ou HTTP simple en local.
- Images workspace multi-arch indispensables (Apple Silicon en dev, x86 en prod).

---

## 11. Tests & CI

- **Back** : `bun test` — unitaires (auth, chiffrement, chemins fichiers, génération config Caddy) + **intégration** (création/suppression d'un workspace réel via Docker, exec terminal) exécutés dans un job avec Docker disponible.
- **Front** : `vitest` + tests de rendu des composants critiques ; conserver le typecheck (`tsc --noEmit`) et le lint (Biome).
- **CI GitHub Actions** : lint + typecheck + tests → build images `buildx` multi-arch → push GHCR sur tag semver.
- **Smoke test** post-build : `docker compose up` éphémère + ping `/api/system/version`.

---

## 12. Jalons d'implémentation (avec critères d'acceptation)

> Chaque jalon doit être **mergeable, testé et démontrable** seul. Mapping avec la roadmap SPEC indiqué.

### M0 — Fondations monorepo *(préalable)*
- Migrer `web/` → `apps/web/` ; init **Bun workspaces** ; `packages/shared` ; Biome ; scripts racine (`dev`, `build`, `test`, `lint`, `typecheck`).
- Squelette `apps/orchestrator` avec `Bun.serve` + `/api/system/version`.
- **Accepté si** : `bun install` à la racine OK ; `bun run typecheck` + `bun run lint` verts ; front et orchestrateur démarrent en dev.

### M1 — Auth & session *(SPEC MVP #2)*
- Setup mot de passe (argon2id), login/logout, sessions cookie, rate limit/ban.
- Passkeys WebAuthn (register + login) bout-en-bout avec le front existant.
- **Accepté si** : 1ère install crée l'admin ; login mot de passe **et** passkey fonctionnent ; routes `/api/*` rejettent sans session ; logout invalide la session.

### M2 — Workspaces & persistance *(SPEC MVP #3)*
- CRUD workspaces via `dockerode` ; volume persistant ; labels ; réseau dédié ; statut/ressources.
- Dashboard front branché sur l'API réelle.
- **Accepté si** : créer/démarrer/arrêter/supprimer un workspace depuis l'UI ; le contenu d'un volume survit à une recréation ; aucun conteneur non labellisé n'est touché.

### M3 — Fichiers + éditeur *(SPEC MVP #4)*
- API fichiers (confinée) ; arbre paresseux ; **CodeMirror 6** (ouverture/édition/sauvegarde).
- **Accepté si** : naviguer l'arbre, ouvrir, éditer, sauvegarder un fichier d'un workspace depuis mobile et desktop.

### M4 — Terminal web *(SPEC MVP #5)*
- WS terminal (`docker exec` TTY) ↔ **xterm.js** + resize/fit ; c'est là que tournent les agents.
- **Accepté si** : terminal interactif fonctionnel (commandes, couleurs, redimensionnement) dans un workspace, depuis le navigateur.

### M5 — Routage / preview *(SPEC MVP #6)*
- Caddy Admin API : route dynamique `projet-<port>.domaine.com` → conteneur ; gestion des ports côté UI.
- **Accepté si** : lancer une app sur un port dans un workspace → y accéder via son sous-domaine HTTPS.

> **Fin du MVP v0.1 « coder depuis mon téléphone ».**

### M6 — Confort *(SPEC v0.2)*
- Enveloppe **chat** d'un agent CLI (au-delà du terminal brut) ; gestion des **clés API** chiffrées ; multi-workspaces démarrage/arrêt ; **MAJ one-click** (updater + health-check + rollback) + notification.

### Plus tard *(SPEC « Plus tard »)*
- `devcontainer.json` ; repli HTTP-01 + multi-provider DNS ; idle-stop ; `docker-socket-proxy` ; auto-update programmée.

---

## 13. Risques & décisions à confirmer

- **Fichiers : bind mount vs exec.** Recommandation : **bind mount** au MVP (simplicité/perf). À confirmer.  on choisi bind mount
- **Routeur HTTP : maison vs `hono`.** Recommandation : `hono` (léger). À confirmer si on veut 0 dépendance. ok hono
- **Service du front : par l'orchestrateur ou par Caddy.** Recommandation : orchestrateur au MVP (un seul process à servir), Caddy plus tard si besoin de cache statique.
- **Agent CLI au MVP :** réutiliser le flux terminal stylé en chat, ou parser dès le départ ? Recommandation : flux terminal d'abord, parsing « cartes » ensuite (M6).
- **`rpID` WebAuthn** dépend du domaine final → bien le rendre configurable (prod vs `localhost`).

---

## 14. Première action concrète pour Claude Code

Commencer par **M0** :
1. Lire `SPEC.md` + `CLAUDE.md`.
2. Mettre en place les Bun workspaces et déplacer `web/` → `apps/web/` (sans casser le front).
3. Créer `apps/orchestrator` minimal (`Bun.serve`, `/api/system/version`) et `packages/shared`.
4. Câbler les scripts racine + Biome + CI minimale.
5. Ouvrir une PR « M0 : fondations monorepo » avec critères d'acceptation cochés.
```
