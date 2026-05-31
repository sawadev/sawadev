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

-- Workspaces (projets) — un workspace est un GROUPE de conteneurs (cf. SPEC §3 ter)
CREATE TABLE workspaces (
  id            TEXT PRIMARY KEY,        -- slug ('shop')
  name          TEXT NOT NULL,
  image         TEXT NOT NULL,           -- image du conteneur dev
  dev_container_id TEXT,                 -- id docker du conteneur 'dev' courant
  network       TEXT NOT NULL,           -- réseau dédié 'sawadev-ws-<id>'
  volume        TEXT NOT NULL,           -- volume/bind du code (/workspace)
  lifecycle     TEXT NOT NULL DEFAULT 'always-on', -- 'always-on' | 'idle-stop'
  created_at    INTEGER NOT NULL,
  last_opened_at INTEGER
);

-- Tools du workspace (BDD, redis…) — chacun = 1 conteneur dédié role=tool
CREATE TABLE tools (
  id           TEXT PRIMARY KEY,         -- 'shop:postgres'
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,            -- 'postgres' | 'mysql' | 'mongo' | 'redis' | ...
  container_id TEXT,                     -- id docker courant
  hostname     TEXT NOT NULL,            -- nom joignable sur le réseau ('db', 'redis')
  volume       TEXT NOT NULL,            -- 'sawadev-ws-<id>-<tool>-data'
  secrets_iv   BLOB,                     -- identifiants générés, chiffrés AES-256-GCM
  secrets_ct   BLOB,
  created_at   INTEGER NOT NULL
);

-- Ports HÔTE exposés à la demande (pool dynamique global). Le HTTP passe par
-- Caddy via le réseau et n'a PAS besoin d'entrée ici ; on n'enregistre que les
-- ports réellement publiés sur l'hôte (ex. TCP brut vers une BDD).
CREATE TABLE host_ports (
  host_port    INTEGER PRIMARY KEY,      -- alloué dans le pool (ex. 18000+)
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target       TEXT NOT NULL,            -- 'sawadev-<id>-postgres:5432'
  proto        TEXT NOT NULL DEFAULT 'tcp',
  created_at   INTEGER NOT NULL
);

-- Routes preview HTTP (sous-domaine -> conteneur:port, via Caddy/réseau)
CREATE TABLE previews (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  port         INTEGER NOT NULL,         -- port applicatif dans le conteneur dev
  subdomain    TEXT NOT NULL,            -- 'shop-3000'
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

# Tools (services managés du workspace : BDD, redis…)
GET    /api/catalog/tools                   -> ToolType[]  (catalogue dispo)
GET    /api/workspaces/:id/tools            -> Tool[]
POST   /api/workspaces/:id/tools            { type }  -> crée le conteneur tool (réseau+volume), renvoie infos de connexion
POST   /api/workspaces/:id/tools/:tool/start
POST   /api/workspaces/:id/tools/:tool/stop
DELETE /api/workspaces/:id/tools/:tool      { removeVolume? }

# Preview HTTP (sous-domaine -> conteneur:port, via Caddy/réseau, sans port hôte)
GET    /api/workspaces/:id/previews         -> Preview[]
POST   /api/workspaces/:id/previews         { port }  -> crée la route + sous-domaine
DELETE /api/workspaces/:id/previews/:port

# Exposition TCP sur l'hôte à la demande (pool dynamique) — ex. client BDD externe
POST   /api/workspaces/:id/expose           { target }  -> alloue un host_port
DELETE /api/workspaces/:id/expose/:hostPort

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
├── workspaces/         # dockerode : groupe de conteneurs, réseau, volumes, labels, cycle de vie
├── tools/              # catalogue + cycle de vie des conteneurs tool (BDD, redis…)
├── ports/              # pool de ports hôte (allocation/libération à la demande)
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
Un workspace est un **groupe de conteneurs** (cf. SPEC §3 ter), pas un conteneur unique.
- **Réseau dédié** : à la création, crée le bridge `sawadev-ws-<id>` et y attache le conteneur dev (+ tools + Caddy). Les conteneurs se joignent **par nom DNS** ; pas de collision entre workspaces, isolation par défaut.
- **Conteneur dev** : `sawadev-<id>-dev`, volume `/workspace` persistant (bind `/data/workspaces/<id>` au MVP), c'est l'ancre (terminal + agent). Les **apps** de l'utilisateur tournent comme **process dans le conteneur dev** (ports `:3000`, `:3001`…).
- **Labels sur TOUT** : `sawadev.managed=true`, `sawadev.workspace=<id>`, `sawadev.role=dev|tool|app`, `sawadev.tool=<type>` → filtrage fiable ; **ne jamais toucher** un conteneur non labellisé.
- **Cycle de vie groupé** : `start/stop/remove` agissent sur **tous** les conteneurs du label `workspace=<id>`. `inspect`/`stats` pour statut/ressources. `always-on` par défaut, `idle-stop` post-MVP.
- **Suppression** : retire conteneurs + réseau ; **volumes supprimés sur confirmation** (données des BDD).
- **Important (MAJ) :** les conteneurs d'un workspace ne font **PAS** partie du `docker-compose` (créés à la volée) → une MAJ de l'app ne les interrompt jamais.

### 6.2bis Tools (`tools/`) — services managés (BDD, redis…)
- **Catalogue** de types (`postgres`, `mysql`, `mongo`, `redis`…) avec image, port standard, volume, génération d'identifiants.
- **Création par l'orchestrateur uniquement** (pas de socket Docker dans le conteneur dev) : crée `sawadev-<id>-<tool>`, l'attache au réseau du workspace avec le hostname standard (`db`, `redis`…), crée le volume `sawadev-ws-<id>-<tool>-data`, labels `role=tool`.
- **Câblage** : écrit les infos de connexion dans `/workspace/.sawadev/tools.env` (lisible par les apps) et les expose dans l'UI. Identifiants chiffrés en base (`tools.secrets_*`). Pas de recréation du conteneur dev.
- Start/stop/delete par tool ; delete propose la suppression du volume.

### 6.2ter Ports hôte (`ports/`)
- **Par défaut : aucun port publié sur l'hôte.** Le HTTP passe par Caddy via le réseau (cf. §6.5).
- Sur demande explicite (« exposer en TCP », ex. client BDD externe), alloue un **port libre dans un pool dynamique** (à partir de 18000), enregistre dans `host_ports`, recrée/route le mapping vers `conteneur:portInterne`. Libération sur retrait.

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
- **Caddy est attaché au réseau de chaque workspace** (`sawadev-ws-<id>`) → il joint les conteneurs **par nom**, sans port hôte.
- L'orchestrateur **POST/PATCH** la config JSON de Caddy pour :
  - router `app.domaine.com` → orchestrateur (UI + API + WS) ;
  - router chaque `<id>-<port>.domaine.com` → `sawadev-<id>-dev:<port>` (preview HTTP), via le réseau du workspace.
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

### M2 — Workspaces (groupe) & persistance *(SPEC MVP #3)*
- CRUD workspaces via `dockerode` selon le **modèle de groupe** : à la création, **réseau dédié** `sawadev-ws-<id>` + conteneur dev `sawadev-<id>-dev` + volume `/workspace`.
- **Labels** complets (`managed`, `workspace`, `role=dev`) ; cycle de vie **groupé** (filtre par label).
- Dashboard front branché sur l'API réelle.
- **Accepté si** : créer/démarrer/arrêter/supprimer un workspace depuis l'UI ; le réseau est créé/détruit avec le workspace ; le volume survit à une recréation ; aucun conteneur non labellisé n'est touché.

### M3 — Fichiers + éditeur *(SPEC MVP #4)*
- API fichiers (confinée) ; arbre paresseux ; **CodeMirror 6** (ouverture/édition/sauvegarde).
- **Accepté si** : naviguer l'arbre, ouvrir, éditer, sauvegarder un fichier d'un workspace depuis mobile et desktop.

### M4 — Terminal web *(SPEC MVP #5)*
- WS terminal (`docker exec` TTY) ↔ **xterm.js** + resize/fit ; c'est là que tournent les agents.
- **Accepté si** : terminal interactif fonctionnel (commandes, couleurs, redimensionnement) dans un workspace, depuis le navigateur.

### M5 — Routage / preview *(SPEC MVP #6)*
- Caddy attaché au réseau du workspace ; route dynamique `<id>-<port>.domaine.com` → `sawadev-<id>-dev:<port>` **sans port hôte** ; gestion des previews côté UI.
- **Accepté si** : lancer une app sur un port dans un workspace → y accéder via son sous-domaine HTTPS, sans publication de port sur l'hôte.

> **Fin du MVP v0.1 « coder depuis mon téléphone ».**

### M6 — Tools & services managés *(SPEC v0.2)*
- **Catalogue** de tools (postgres, mysql, mongo, redis…) ; ajout d'un tool = conteneur dédié `role=tool` sur le réseau du workspace + volume + identifiants générés.
- Câblage `/workspace/.sawadev/tools.env` + affichage UI ; start/stop/delete par tool (suppression de volume sur confirmation).
- **Exposition TCP** sur l'hôte à la demande (pool dynamique).
- **Accepté si** : ajouter un Postgres à un workspace, le joindre par `db:5432` depuis le conteneur dev, et persister ses données après recréation du conteneur dev.

### M7 — Confort *(SPEC v0.2)*
- Enveloppe **chat** d'un agent CLI (au-delà du terminal brut) ; gestion des **clés API** chiffrées ; multi-workspaces démarrage/arrêt ; **MAJ one-click** (updater + health-check + rollback) + notification.

### Plus tard *(SPEC « Plus tard »)*
- `devcontainer.json` (et services déclarés type compose) ; repli HTTP-01 + multi-provider DNS ; idle-stop ; **accès Docker brut opt-in par workspace** + `docker-socket-proxy` ; auto-update programmée.

---

## 13. Décisions & risques

**Décisions tranchées :**
- **Fichiers :** **bind mount** au MVP (simplicité/perf).
- **Routeur HTTP :** **`hono`** (léger).
- **Workspace = groupe de conteneurs** + **réseau dédié par workspace** (cf. SPEC §3 ter).
- **Apps = process dans le conteneur dev** ; conteneur séparé seulement sur demande.
- **Tools (BDD…) = conteneurs dédiés créés par l'orchestrateur** (catalogue managé, **pas** de socket Docker dans le workspace).
- **Ports hôte :** aucun par défaut (HTTP via Caddy/réseau) ; **pool dynamique** à la demande pour le TCP brut.

**Encore ouvert / à surveiller :**
- **Service du front :** orchestrateur au MVP (un seul process), Caddy plus tard si besoin de cache statique.
- **Agent CLI :** flux terminal stylé en chat d'abord ; parsing « cartes » (diffs, outils) ensuite (M7).
- **`rpID` WebAuthn** dépend du domaine final → configurable (prod vs `localhost`).
- **Accès Docker brut dans un workspace** : repoussé (opt-in + `docker-socket-proxy` « plus tard »).

---

## 14. Première action concrète pour Claude Code

Commencer par **M0** :
1. Lire `SPEC.md` + `CLAUDE.md`.
2. Mettre en place les Bun workspaces et déplacer `web/` → `apps/web/` (sans casser le front).
3. Créer `apps/orchestrator` minimal (`Bun.serve`, `/api/system/version`) et `packages/shared`.
4. Câbler les scripts racine + Biome + CI minimale.
5. Ouvrir une PR « M0 : fondations monorepo » avec critères d'acceptation cochés.
```
