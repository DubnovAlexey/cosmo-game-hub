# Cosmo Game Hub

**English** · [עברית](README.he.md) · [Русский](README.ru.md)

A web platform for classic logic games. The first game, chess against the Stockfish engine, is fully playable. More games are planned and appear in the collection as "Coming soon".

**Live demo:** https://dubnovalexey.github.io/cosmo-game-hub/

## Features

- Chess against the computer: play as White or Black, engine strength from 1 to 10.
- Time controls: 3 and 5 minutes (blitz), 10 minutes (rapid), 30 minutes (classical).
- Move history, captured pieces, a pawn promotion dialog and move sounds.
- A game-over screen for victory, defeat and draw.
- The finished game can be downloaded as a PGN file, the standard format of chess notation.
- The engine runs in a Web Worker, so the board stays responsive while the computer thinks.
- A games collection and a leaderboard page. The leaderboard shows demo data until player accounts exist.

## Tech stack

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · chess.js · react-chessboard · Stockfish in a Web Worker · npm workspaces · GitHub Actions · GitHub Pages

## Project structure

```text
apps/client/                    the Astro site; games are React islands
  src/components/games/chess/   board, timers, move history, dialogs
  src/hooks/useChessLogic.ts    game state on top of chess.js
  src/utils/engine/             Stockfish in a Web Worker (UCI protocol)
  public/engines/chess/         the engine file, its license and source link
.github/workflows/deploy.yml    build and publish to GitHub Pages on every push to main
```

## What I practised

- Connecting a chess engine through a Web Worker and the UCI text protocol.
- Keeping game state in React hooks on top of chess.js: moves, check, mate, promotion, timers.
- Rendering a heavy component only in the browser (`client:only`) so the engine never runs during the build.
- Deploying an Astro site from a monorepo to GitHub Pages under the `/cosmo-game-hub/` base path.

## Run locally

Node.js 22.12 or newer is required.

```sh
npm install
npm run dev --workspace client
```

Then open http://localhost:4321/cosmo-game-hub/. The site uses the same base path as on GitHub Pages.

To build the static site: `npm run build --workspace client` (the result goes to `apps/client/dist/`).

## Roadmap

- A shared game shell: settings, timers, move history and the game-over screen for every game.
- New games one by one: tic-tac-toe, Cosmo Snake and checkers first, then the bigger card and board games.
- Player accounts and a real leaderboard.
- Unit tests and a check on every pull request.

## Credits and licenses

- Chess engine: [Stockfish](https://stockfishchess.org/), compiled to JavaScript by the stockfish.js project (version 10.0.2), GPL-3.0. The license text and the link to the complete source code are in [`apps/client/public/engines/chess`](apps/client/public/engines/chess/README.md).
- Libraries: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).

## Engine regression checks

Run `npm test` from the repository root after `npm install`. The tests use the existing build toolchain and a Worker mock to check readiness, overlapping UCI requests and promise cleanup; they do not launch an external engine. React also rejects cancelled or outdated FEN responses. `npm run build --workspace client` validates the static output.
