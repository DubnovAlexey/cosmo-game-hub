# Chess engine: Stockfish (stockfish.js 10.0.2)

`stockfish.js` in this folder is the chess engine that plays against you in Cosmo Game Hub.

- **What it is:** [Stockfish](https://stockfishchess.org/), a free and open-source chess engine, in the multi-variant fork by Daniel Dugovic ([ddugovic/Stockfish](https://github.com/ddugovic/Stockfish)). It was compiled to JavaScript by Niklas Fiekas with Emscripten.
- **Version:** the npm package [`stockfish.js@10.0.2`](https://www.npmjs.com/package/stockfish.js/v/10.0.2), released on 15 August 2019.
- **Unmodified:** the file is a byte-for-byte copy of `stockfish.js` from that package.
  - SHA-256: `723fda70117bfa8d5053a7bc4ae50cdc96dc9e3fd41b57627e4dfa0a0025957a`
- **License:** GNU General Public License v3. The full text is in [`COPYING.txt`](COPYING.txt).
- **Source code:** the complete corresponding source of this build (engine sources, `build.sh`, Emscripten settings) is at commit [`e105072`](https://github.com/lichess-org/stockfish.js/tree/e105072e84cf8ee5dd5219e2c5be29c3b8bf8a5a) of [lichess-org/stockfish.js](https://github.com/lichess-org/stockfish.js). That repository was formerly `niklasf/stockfish.js`; the commit is the one npm records for version 10.0.2.

## How the site uses it

`src/utils/engine/EngineManager.ts` starts the file as a Web Worker. It talks to the engine through the UCI protocol, sending text commands with `postMessage`. The engine runs as a separate program next to the site; the rest of Cosmo Game Hub is not part of it.
