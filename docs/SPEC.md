# sawadev — Spécifications

> Document de travail vivant. On l'enrichit au fil des décisions.
> Dernière mise à jour : 31 mai 2026

---

## 1. Vision

**sawadev** est un logiciel auto-hébergé qui s'installe sur un VPS Linux et le transforme en **poste de développement distant complet**, accessible depuis n'importe quel appareil disposant d'un navigateur (téléphone, tablette, n'importe quel ordinateur) — sans rien installer en local.

**Promesse clé :** « Ta machine de dev vit dans le cloud, ton appareil n'est qu'un écran. »

**Angle différenciant :**
- **Self-hosted simple** sur un seul VPS (pas un cluster type Kubernetes comme Coder/Gitpod).
- **L'IA comme façon principale de coder**, pas comme simple autocomplétion.
- **Mobile-friendly** : développer réellement depuis un téléphone ou une tablette.

**Principes directeurs :**
- **Open source — licence AGPL-3.0** (copyleft fort : toute version modifiée et hébergée doit publier son code ; protège contre une reprise SaaS fermée).
- **Auto-hébergé pur** : le moins de dépendances possible à des services tiers (pas de Cloudflare, pas de SaaS obligatoire). Tout doit pouvoir tourner sur le seul VPS de l'utilisateur.
- **Simple d'abord** : on commence minimal et robuste, on enrichit ensuite.

---

## 2. Problème & objectif

**Problème résolu :** aujourd'hui, développer impose une stack lourde installée localement et un « vrai » ordinateur. On ne peut pas coder confortablement depuis un téléphone, une tablette, ou un poste qu'on ne maîtrise pas.

**Objectif :** disposer d'une machine de dev distante qui héberge et exécute tout, accessible partout avec une simple connexion internet, où l'IA permet de coder par prompt plutôt qu'en tapant tout à la main.

**Utilisateur cible :** développeur expérimenté (utilisateur unique par instance), qui veut développer ses applications de partout.

---

## 3. Décisions d'architecture

| # | Sujet | Décision |
|---|---|---|
| A | **Utilisateurs** | Mono-utilisateur : 1 instance = 1 développeur. |
| B | **Isolation** | **Docker** : l'orchestrateur, le reverse proxy et l'auth tournent en conteneurs ; **chaque workspace est un *groupe* de conteneurs** (1 conteneur « dev » + n « tools ») isolé par un **réseau Docker dédié** (cf. §3 ter). |
| C | **IA** | Agent **autonome** avec droits sur le projet (type Cursor). **BYO agent + BYO clés** : l'utilisateur vient avec son agent CLI préféré (Claude Code, Cursor CLI, Codex CLI, aider, opencode…) et ses propres clés API. |
| D | **Éditeur** | **Maison, le plus léger possible.** Joue le rôle d'enveloppe autour de l'agent CLI (cf. §5). |
| E | **Sécurité / exposition** | **Auto-hébergé pur** : reverse proxy local (**Caddy**, HTTPS auto via Let's Encrypt) + **auth maison forte = mot de passe (argon2) + passkeys/WebAuthn**. Pas de Tunnel ni de proxy tiers ; l'app et le proxy tournent sur le VPS. |
| F | **Installation** | `curl \| bash` sur une **machine vierge** → installe Docker puis `docker compose up`. Tout est conteneurisé. |
| I | **Déploiement (dockerception)** | **Tout-conteneurisé en mode DooD** (Docker-out-of-Docker) : Caddy + orchestrateur tournent en conteneurs via `docker compose` ; l'orchestrateur pilote le **démon Docker de l'hôte** (montage de `/var/run/docker.sock`) et crée les workspaces comme **conteneurs frères** (pas de DinD privilégié). |
| G | **Routage / preview** | **Sous-domaine par défaut** (wildcard) ; **chemin/port en repli**. Convention de nommage : **défaut raisonnable `projet-port.domaine.com`, configurable** par l'utilisateur. |
| H | **Nom de domaine / DNS** | Domaine chez **IONOS**, **zone DNS déléguée à Cloudflare DNS** (DNS uniquement — pas de Tunnel/proxy). Permet le **certificat wildcard `*.domaine.com` via DNS-01** (API Cloudflare, plugin Caddy mature). |

---

## 3 bis. Modèle des workspaces Docker

- **Image de base (MVP) :** une **image généraliste « tout-en-un »** (batteries included : Node, Python, Go, Git, etc.). _Plus tard_ : support des **`devcontainer.json`** pour un environnement personnalisé par projet.
- **Agents IA (modèle hybride) :** **Claude Code, Cursor CLI et Codex CLI préinstallés par défaut** dans l'image ; l'utilisateur peut en **ajouter d'autres** librement. L'utilisateur fournit ses propres clés API (BYO clés).
- **Persistance :** chaque workspace a un **volume** (volume Docker ou bind mount sur le disque du VPS) qui survit à la recréation du conteneur. La sauvegarde = sauvegarder ce dossier.
- **Cycle de vie :** **configurable par projet**. **Par défaut : tous les workspaces restent actifs en permanence.** (Option d'arrêt auto après inactivité possible par projet.)

---

## 3 ter. Modèle multi-conteneurs & tools

Un workspace n'est **pas un seul conteneur** mais un **groupe** : un projet réel peut avoir plusieurs applis et une (ou plusieurs) base(s) de données.

**Composition d'un workspace :**
- **1 conteneur « dev » (l'ancre)** : le code (`/workspace`), le terminal, l'agent CLI. C'est lui qu'on ouvre dans l'éditeur.
- **0..n conteneurs « tool »** : services **à état** (Postgres, MySQL, Mongo, Redis…). **Une BDD = un tool = un conteneur dédié** rattaché au workspace.
- **0..n conteneurs « app »** *(optionnel)* : seulement si l'utilisateur veut isoler une appli dans son propre conteneur.

**Apps vs tools (décision) :** par défaut, **les applis tournent comme des process dans le conteneur dev** (ex. `bun run dev` sur `:3000` et `:3001`). On ne crée des conteneurs séparés que pour les **tools à état** (les BDD surtout) ou une app qu'on veut explicitement containeriser.

**Réseau dédié par workspace (mécanisme d'isolation clé) :** chaque workspace a un **bridge network** `sawadev-ws-<id>`. Tous ses conteneurs y sont attachés et se joignent **par leur nom DNS** (comme docker-compose : l'app lit `db:5432`). Bénéfices : pas de collision de noms entre workspaces, isolation inter-workspaces par défaut, et **pas besoin de port hôte pour le HTTP** (Caddy est attaché au réseau et route directement vers `sawadev-<id>-dev:<port>`).

**Ports hôte (décision) :** par défaut **aucun port publié sur l'hôte** (tout le HTTP passe par Caddy via le réseau). Un port hôte n'est ouvert **que sur demande explicite** (« exposer en TCP », ex. brancher un client BDD externe), via un **pool dynamique global** alloué à la demande et enregistré en base.

**Création des tools (décision — sécurité) :** **pas de socket Docker dans le conteneur dev.** Les tools sont créés par l'**orchestrateur** depuis un **catalogue managé** (postgres, redis, mysql…), ce qui garantit labels, réseau et volume corrects. _Plus tard, en opt-in par workspace :_ accès Docker brut pour les power-users (durci par `docker-socket-proxy`).

**Câblage des connexions :** à l'ajout d'un tool, l'orchestrateur génère les identifiants, crée le volume, attache au réseau, écrit les infos de connexion dans **`/workspace/.sawadev/tools.env`** et les **affiche dans l'UI** (hôte, port, user/pass). Pas d'injection d'env à chaud → le conteneur dev n'est pas recréé.

**Tagging & nommage (organisation) :** on tague **tout** (base de l'organisation et de la sécurité — on n'agit jamais sur un conteneur non tagué) :

| Élément | Convention |
|---|---|
| Réseau | `sawadev-ws-<id>` |
| Conteneur dev | `sawadev-<id>-dev` |
| Conteneur tool | `sawadev-<id>-<tool>` (ex. `sawadev-shop-postgres`) |
| Volume tool | `sawadev-ws-<id>-<tool>-data` |
| Labels (sur tout) | `sawadev.managed=true`, `sawadev.workspace=<id>`, `sawadev.role=dev\|tool\|app`, `sawadev.tool=<type>` |

**Cycle de vie :** start / stop / delete s'appliquent au **groupe entier** (filtre sur le label `sawadev.workspace=<id>`). La suppression d'un workspace retire ses conteneurs et son réseau ; les **volumes** (données des BDD) ne sont supprimés que **sur confirmation**.

**Exemple — workspace `shop` (2 apps + Postgres + Redis) :**
```
réseau: sawadev-ws-shop
├── sawadev-shop-dev        role=dev   (code, agent ; api:3000 + admin:3001 en process)
├── sawadev-shop-postgres   role=tool  tool=postgres  vol=sawadev-ws-shop-postgres-data
└── sawadev-shop-redis      role=tool  tool=redis     vol=sawadev-ws-shop-redis-data

Caddy : shop-3000.domaine.com → sawadev-shop-dev:3000
        shop-3001.domaine.com → sawadev-shop-dev:3001
DNS interne : l'app joint  db:5432  et  redis:6379
```

---

## 3 quater. Authentification & durcissement

**Méthode retenue : mot de passe + passkeys.**

- **Mot de passe fort** défini à l'installation, haché en **argon2**.
- **Passkeys / WebAuthn** (Touch ID / Face ID / clé physique) — méthode principale, idéale sur mobile/tablette ; le mot de passe sert de secours.
- **Sessions** via cookie sécurisé (`HttpOnly`, `Secure`, `SameSite`). Tout en **HTTPS**.

**Durcissement de la surface d'attaque :**
- **Rate limiting** sur le login (anti-bruteforce) + bannissement d'IP après X échecs (type fail2ban).
- **Aucun accès** au terminal, à l'explorateur de fichiers ou aux WebSockets **sans session valide** : l'orchestrateur vérifie l'auth avant toute ouverture de connexion.

---

## 4. Piliers fonctionnels

1. **Éditeur de code en ligne** maison, léger, orienté mobile et prompt.
2. **Terminal / client SSH dans le navigateur**, en live.
3. **Explorateur de fichiers** web.
4. **Reverse proxy / routage intégré** : lancer une app sur un port, lui associer un domaine local et y accéder sans friction (preview), depuis n'importe quel appareil.
5. **Outils préinstallés** accessibles « par défaut » et exposés proprement à l'utilisateur (httpd, gestion `/etc/hosts`, etc.).
6. **IA au centre** : l'agent autonome est le mode principal de développement.

---

## 5. Approche « Agent CLI au cœur, éditeur enveloppe »

Les agents IA autonomes grand public sont aujourd'hui des **outils en ligne de commande** (Claude Code, Cursor CLI, Codex CLI, aider, opencode…). Ils tournent dans un terminal, lisent/écrivent les fichiers et lancent des commandes eux-mêmes.

→ Conséquence : **pas besoin de réimplémenter une IA maison.** sawadev est un **orchestrateur** (terminaux, fichiers, routage, sessions, auth). L'éditeur maison a juste besoin de :

1. Un **arbre de fichiers** + vue/édition de code.
2. Un **terminal** intégré (là où l'agent CLI s'exécute).
3. Une **UI de chat** qui enveloppe élégamment l'agent CLI choisi.

Cette approche garde l'éditeur réellement léger et mobile-friendly, et respecte le principe « BYO agent ».

---

## 5 bis. Stack technique

**Principe : TypeScript de bout en bout** (front + back), pour un seul langage, des types partagés, et tirer parti de la maîtrise existante de l'utilisateur.

| Couche | Choix | Rôle |
|---|---|---|
| **Langage** | TypeScript (partout) | front + back + types partagés |
| **Runtime / packaging** | **Bun** (`bun build --compile` → exécutable autonome) | exécution + install propre `curl \| bash` |
| **Orchestrateur (back)** | TypeScript — API HTTP + WebSocket | pilotage Docker, sessions, auth, routage |
| **Pilotage Docker** | `dockerode` | créer/démarrer/arrêter les workspaces |
| **Terminal** | `node-pty` + `ws` côté serveur ↔ **xterm.js** côté front | terminal & SSH live dans le navigateur |
| **Reverse proxy** | **Caddy** (process séparé, piloté par l'orchestrateur) | HTTPS auto (DNS-01 wildcard) + routage sous-domaines |
| **Front (éditeur léger)** | **React** | UI éditeur / chat / fichiers |
| **Éditeur de code** | **CodeMirror 6** (plutôt que Monaco : plus léger, mobile-friendly) | édition de code |

Notes :
- **Bun** retenu pour la vitesse. Comme l'orchestrateur tourne dans **son propre conteneur** (cf. §5 ter), le packaging « binaire autonome » devient **optionnel** : le runtime est embarqué dans l'image.
- **CodeMirror 6** retenu pour l'objectif mobile/tablette (Monaco est trop lourd sur petits écrans).

---

## 5 ter. Architecture cible & déploiement

**Tout est conteneurisé (mode DooD — Docker-out-of-Docker).** Caddy et l'orchestrateur tournent en conteneurs via `docker compose`. L'orchestrateur pilote le démon Docker de l'hôte (socket monté) et crée les workspaces comme **conteneurs frères**.

```
                    Internet (téléphone, tablette, PC)
                                 │  HTTPS (*.tondomaine.com)
                                 ▼
                    ┌─────────────────────────┐
                    │   Caddy (conteneur)      │  HTTPS auto via DNS-01 (Cloudflare)
                    │   reverse proxy          │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┴──────────────────┐
              ▼                                     ▼
   ┌────────────────────────┐          ┌─────────────────────────┐
   │ Orchestrateur (conteneur)│         │  Sous-domaines projets   │
   │  - Auth (pwd + passkey)  │         │  projet-3000.domaine.com │
   │  - API HTTP / WebSocket  │─────────▶│  → port du conteneur     │
   │  - Sert le front (React) │         └─────────────────────────┘
   │  - Pilote Docker via      │
   │    /var/run/docker.sock   │
   └─────────┬────────────────┘
             │ crée / gère (conteneurs frères)
             ▼
   ┌──────────────────────────────────────────────┐
   │            Conteneurs workspaces               │
   │  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
   │  │ Projet A    │  │ Projet B    │  │ Projet C │ │
   │  │ code + pty  │  │ code + pty  │  │   ...    │ │
   │  │ agents IA   │  │ agents IA   │  │          │ │
   │  │ volume      │  │ volume      │  │          │ │
   │  └────────────┘  └────────────┘  └──────────┘ │
   └──────────────────────────────────────────────┘

   Front (React) : arbre fichiers · CodeMirror 6 · terminal xterm.js · chat agent
```

**Stack `docker compose` :**
```
docker compose up -d
 ├── caddy           (conteneur, expose 80/443)
 ├── orchestrateur   (conteneur, monte /var/run/docker.sock)
 └── [workspaces]    ← créés dynamiquement par l'orchestrateur (conteneurs frères)
```

**Flux d'installation `curl | bash` (machine vierge) :**
1. Vérifie / installe **Docker** (+ plugin compose).
2. Récupère le `docker-compose.yml` et les images (orchestrateur, Caddy avec plugin DNS).
3. Demande : domaine, token DNS Cloudflare, mot de passe admin.
4. Configure Caddy (wildcard + DNS-01), lance `docker compose up -d`, **pull l'image workspace généraliste**.
5. Affiche l'URL → connexion et enregistrement du passkey.

**Mises à jour :** `docker compose pull && docker compose up -d`.

**Sécurité du socket Docker :** monter `/var/run/docker.sock` donne à l'orchestrateur un pouvoir équivalent à root sur l'hôte. Acceptable en mono-utilisateur (l'orchestrateur = l'utilisateur), à condition de bien le protéger par l'auth. _Durcissement futur possible :_ proxy de socket Docker (type `docker-socket-proxy`) limitant les commandes autorisées.

---

---

## 5 quater. Portabilité / multi-OS

- **Client :** universel — un simple **navigateur** (Mac, Windows, Linux, iOS, Android), rien à installer.
- **Serveur — production :** **VPS Linux** (cible unique et officielle).
- **Serveur — dev local :** **mode dev macOS** supporté (Docker Desktop) pour développer sawadev avant déploiement.
- **Windows :** non ciblé (ni prod, ni dev).
- **Images workspaces multi-arch** (`linux/amd64` + `linux/arm64`) : indispensable pour que les images marchent à la fois sur Mac Apple Silicon (dev) et sur VPS x86 (prod).
- **Mode dev local** distinct de la prod : pas de domaine public ni DNS-01 → certificats auto-signés ou `*.localhost`. À prévoir comme configuration séparée.

---

## 5 quinquies. Mises à jour

**MVP : one-click depuis l'UI + notification** quand une nouvelle version est disponible. (Auto-update programmée prévue _plus tard_.)

**Mécanisme — conteneur « updater » éphémère :**
- Un conteneur ne peut pas se recréer lui-même proprement. L'orchestrateur ne se met donc **pas** à jour directement : au clic, il **lance un conteneur updater jetable** (via le socket Docker) qui exécute `docker compose pull && docker compose up -d`. L'updater étant un processus séparé, il survit au redémarrage de l'orchestrateur.
- **Les workspaces ne font PAS partie du `docker compose`** (conteneurs frères créés à la volée) → une mise à jour de l'app ne recrée que `caddy` + `orchestrateur` et **n'interrompt jamais les projets de l'utilisateur**.

**Sécurité :**
- **Health check après MAJ + rollback automatique** vers l'image précédente si le nouvel orchestrateur ne répond pas. Versions épinglées par **digest** pour un rollback fiable.
- **Migrations** de données appliquées au démarrage du nouvel orchestrateur.
- **Canaux** : `stable` (défaut) / `beta`, **tags semver** (`v0.2.1`) plutôt que `latest`.

**Distribution :** images sur **GHCR (GitHub Container Registry)** — gratuit, déjà sur GitHub, **aucune dépendance tierce ajoutée**. Vérification de MAJ = tags GHCR ou manifeste dans les GitHub Releases.

**CLI complémentaire :** `sawadev update`, `sawadev rollback`, `sawadev version`.

> **Watchtower** écarté volontairement (dépendance en plus, moins de contrôle sur health-check/rollback et sur la préservation des workspaces). Mécanisme construit nativement.

---

## 6. Positionnement (produits comparables)

Coder, Gitpod, GitHub Codespaces, code-server / openvscode-server, Eclipse Che, DevPod.

**Différenciation sawadev :** simplicité mono-VPS + IA mise au centre + expérience mobile réelle.

---

## 7. Notes techniques complémentaires

- **Certificats HTTPS :** **DNS-01 wildcard via Cloudflare DNS** (instance perso). Le **produit open source** doit supporter **plusieurs fournisseurs DNS** (Caddy en gère des dizaines via plugins) **+ un repli HTTP-01 par sous-domaine** pour les utilisateurs sans API DNS. Le build inclut le(s) plugin(s) DNS via `xcaddy`.

---

## 8. Périmètre & roadmap

### MVP (v0.1) — « coder depuis mon téléphone »
1. Install `curl | bash` (Docker + compose + Caddy + orchestrateur).
2. Auth **mot de passe + 1 passkey**.
3. Création d'un **workspace** (image généraliste) + **persistance volume**.
4. **Éditeur web** : arbre de fichiers + édition CodeMirror 6.
5. **Terminal web** (xterm.js) dans le workspace → c'est là que tournent les agents IA.
6. **Routage sous-domaine** pour prévisualiser une app.

### v0.2 — confort
- **UI de chat** enveloppant un agent CLI.
- Gestion des **clés API**.
- **Multi-workspaces**, démarrage / arrêt manuel.
- **Mises à jour one-click + notification** (conteneur updater, health-check + rollback).

### Plus tard
- Support **`devcontainer.json`**.
- **Repli HTTP-01** + **multi-provider DNS**.
- **Arrêt auto après inactivité** (par projet).
- **Proxy de socket Docker** (durcissement).
- **Auto-update programmée** (canal `stable`).

---

## 9. Prochaines étapes

1. Démarrer la **phase de conception détaillée / implémentation** du MVP (hors périmètre de ce document de specs).
