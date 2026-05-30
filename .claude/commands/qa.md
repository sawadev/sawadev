---
description: Vérifie la qualité avant une PR (typecheck + lint + tests)
allowed-tools: Bash(bun run:*), Bash(bun test:*)
---

Lance la suite de vérification et corrige ce qui peut l'être simplement.

1. `bun run typecheck` — types stricts, zéro erreur.
2. `bun run lint` — Biome, zéro avertissement bloquant.
3. `bun run test` — tests verts (back `bun test` + front `vitest`).

Pour chaque échec : explique la cause en une ligne, propose/applique un correctif minimal, puis relance.

À la fin, donne un résumé : ✅/❌ par étape et la liste des fichiers modifiés. Ne propose pas de commit (l'utilisateur décide).
