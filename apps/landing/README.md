# @sawadev/landing

Landing page marketing de **sawadev** — page de présentation orientée GitHub, issue du handoff Claude Design (`sawadev landing.html`).

App **autonome** (Vite + React + TS), indépendante de `apps/web` : son propre thème, ses propres composants. Réutilise le design system sawadev (accent violet, thème clair/sombre mémorisé, typographies Hanken Grotesk + JetBrains Mono).

## Contenu
- **Hero** : « Your dev machine lives in the cloud » + maquette produit (éditeur + terminal live + panneau IA) + commande d'install.
- **Any device** : la même station de dev sur téléphone / tablette / desktop.
- **Features** : agents IA, terminal, éditeur, workspaces Docker, previews, passkeys.
- **Self-host** : installation en 3 étapes.
- **CTA** « Star it. Clone it. Run it. » + footer.

Chaque lien/bouton pointe vers le dépôt GitHub (nouvel onglet). L'URL est centralisée dans **une seule constante** `GH` en haut de `src/landing.tsx`.

## Commandes
```bash
bun run --filter @sawadev/landing dev     # http://localhost:5175
bun run --filter @sawadev/landing build   # -> apps/landing/dist (statique)
```

Le build est un site statique : déployable tel quel, ou servi par Caddy / l'orchestrateur.
