# Cosmo Game Hub — client

The Astro site of Cosmo Game Hub. The project description, features and credits are in the [root README](../../README.md).

## Commands

Run them from the repository root:

| Command | Action |
| :-- | :-- |
| `npm install` | Installs the dependencies of every workspace |
| `npm run dev --workspace client` | Starts the dev server at http://localhost:4321/cosmo-game-hub/ |
| `npm run build --workspace client` | Builds the static site into `apps/client/dist/` |
| `npm run preview --workspace client` | Serves the built site locally |

## Folders

- `src/pages/` — routes: home, games collection, chess, leaderboard, about.
- `src/components/` — UI and game components; React islands for the games.
- `src/hooks/`, `src/utils/` — game logic, the engine bridge, the shared `withBase` link helper.
- `public/engines/chess/` — the Stockfish engine (GPL-3.0) with its license and source link.
