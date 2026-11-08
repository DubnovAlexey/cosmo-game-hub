# Chess · Шахматы · שחמט · Ajedrez · Échecs

[English](#english) · [Русский](#russian) · [עברית](#hebrew) · [Español](#spanish) · [Français](#french)

<a name="english"></a>

## English

Chess against the Stockfish engine. Play White or Black, engine strength 1–10, clocks for blitz, rapid and classical games, move history, captured pieces, promotion, sounds and PGN download.

### Rules in short

Standard FIDE chess, with legality checked by [chess.js](https://github.com/jhlywa/chess.js):
- check, checkmate and stalemate;
- castling, en passant and promotion;
- draws by repetition, the fifty-move rule and insufficient material.

A player whose clock reaches zero loses.

### How it works

| Folder | What lives there |
|---|---|
| `components/` | `ChessGame` (the island) and the board, clocks, history, captured pieces and dialogs |
| `hooks/` | `useChessLogic`: game state on chess.js. `useChessTimer`: clocks. `useEngine`: the engine bridge |
| `engine/` | `EngineManager`: Stockfish in a Web Worker over the UCI text protocol, with overlapping requests resolved safely. Every search stops at the level's depth or at 0.56–2 s, whichever comes first, so a slow phone never freezes (load test of 08.11.2026). `fenParser`: FEN to a board matrix |
| `assets/` | piece images, the space background and move sounds, with small loaders (`chessPieces.ts`, `chessSounds.ts`) |
| `tests/` | the engine manager with a Worker mock, and the clocks |
| `public/games/chess/` | the Stockfish worker script (it needs a fixed URL), its GPL-3.0 licence and source link, and the cover |

The page `src/pages/games/chess.astro` only places `ChessGame` (`client:only`), so Stockfish never runs during the build. The bridge to Stockfish is explained in the [project Bible](../../../../../COSMO_GAME_HUB_BIBLE.md#english), "Bridges between parts".

### TODO

- Save after every move (PGN and clocks) through `@shared/utils/storageEngine` and continue where the player stopped.
- Online play against a partner, in real time and by correspondence with pauses (see the [project Bible](../../../../../COSMO_GAME_HUB_BIBLE.md#english), "Online play").
- Five languages: Russian, Hebrew, English, Spanish and French.

---

<a name="russian"></a>

## Русский

Шахматы против движка Stockfish. Можно играть белыми или чёрными, сила движка от 1 до 10. Есть часы для блица, рапида и классики, история ходов, взятые фигуры, превращение пешки, звуки и выгрузка PGN.

### Правила коротко

Обычные шахматы по правилам FIDE, допустимость ходов проверяет [chess.js](https://github.com/jhlywa/chess.js):
- шах, мат и пат;
- рокировка, взятие на проходе и превращение пешки;
- ничья по повторению, по правилу пятидесяти ходов и при недостатке материала.

Кто просрочил время, тот проиграл.

### Как устроено

| Папка | Что там лежит |
|---|---|
| `components/` | `ChessGame` (остров), доска, часы, история, взятые фигуры, окна |
| `hooks/` | `useChessLogic`: состояние партии на chess.js. `useChessTimer`: часы. `useEngine`: мост к движку |
| `engine/` | `EngineManager`: Stockfish в Web Worker по текстовому протоколу UCI, с безопасной обработкой наложенных запросов. Каждый поиск кончается на глубине уровня или через 0,56–2 с — что наступит раньше, поэтому медленный телефон не зависает (нагрузочная проверка 08.11.2026). `fenParser`: FEN → матрица доски |
| `assets/` | картинки фигур, космический фон и звуки ходов, с маленькими загрузчиками (`chessPieces.ts`, `chessSounds.ts`) |
| `tests/` | менеджер движка с макетом Worker и часы |
| `public/games/chess/` | скрипт воркера Stockfish (ему нужен постоянный адрес), лицензия GPL-3.0 и ссылка на исходники, обложка |

Страница `src/pages/games/chess.astro` только ставит `ChessGame` на место (`client:only`), поэтому Stockfish не запускается при сборке. Как устроен мост к Stockfish, объясняет [Библия проекта](../../../../../COSMO_GAME_HUB_BIBLE.md#russian), раздел «Мосты между частями».

### TODO

- Сохранять после каждого хода (PGN и часы) через `@shared/utils/storageEngine` и продолжать с того места, где игрок остановился.
- Игра с партнёром по сети, в реальном времени и по переписке с паузами (см. [Библию проекта](../../../../../COSMO_GAME_HUB_BIBLE.md#russian), «Игра по сети»).
- Пять языков: русский, иврит, английский, испанский и французский.

---

<a name="hebrew"></a>

<div dir="rtl">

## עברית

שחמט נגד המנוע Stockfish. אפשר לשחק בלבן או בשחור, ועוצמת המנוע היא מ-1 עד 10. יש שעונים לבליץ, לרפיד ולמשחק קלאסי, היסטוריית מסעים, כלים שנאכלו, הכתרת רגלי, צלילים והורדת PGN.

### החוקים בקצרה

שחמט רגיל לפי חוקי FIDE, והחוקיות נבדקת בעזרת [chess.js](https://github.com/jhlywa/chess.js):
- שח, מט ופט;
- הצרחה, הכאה דרך הילוכו והכתרה;
- תיקו בחזרה על מצב, לפי כלל חמישים המסעים ובחוסר חומר.

שחקן שהזמן שלו נגמר מפסיד.

### איך זה בנוי

| תיקייה | מה יש בה |
|---|---|
| רכיבים (`components`) | האי `ChessGame`, הלוח, השעונים, ההיסטוריה, הכלים שנאכלו והחלונות |
| מצב (`hooks`) | מצב המשחק מעל chess.js ‏(`useChessLogic`), השעונים (`useChessTimer`) והגשר למנוע (`useEngine`) |
| מנוע (`engine`) | המנהל `EngineManager` מריץ את Stockfish ב-Web Worker דרך פרוטוקול הטקסט UCI ומטפל בבטחה בבקשות חופפות. כל חיפוש נעצר בעומק של הרמה או אחרי 0.56–2 שניות, המוקדם מביניהם, ולכן טלפון איטי לא נתקע (בדיקת העומס מ-08.11.2026); הממיר `fenParser` הופך FEN למטריצת לוח |
| מדיה (`assets`) | תמונות הכלים, רקע החלל וצלילי המסעים, עם טוענים קטנים (`chessPieces.ts`, `chessSounds.ts`) |
| בדיקות (`tests`) | מנהל המנוע עם Worker מדומה, והשעונים |
| כתובת קבועה (`public/games/chess`) | הסקריפט של ה-worker של Stockfish, רישיון GPL-3.0 והקישור לקוד המקור, ותמונת השער |

הדף של השחמט רק ממקם את `ChessGame` עם `client:only`, ולכן Stockfish לא רץ בזמן הבנייה. הגשר ל-Stockfish מוסבר [במדריך הטכני של הפרויקט](../../../../../COSMO_GAME_HUB_BIBLE.md#hebrew), בפרק "גשרים בין החלקים".

### לעשות

- לשמור אחרי כל מסע (PGN ושעונים) דרך `@shared/utils/storageEngine` ולהמשיך מהמקום שבו השחקן עצר.
- משחק מול שותף ברשת, בזמן אמת ובהתכתבות עם הפסקות (ראו [המדריך הטכני](../../../../../COSMO_GAME_HUB_BIBLE.md#hebrew), "משחק ברשת").
- חמש שפות: רוסית, עברית, אנגלית, ספרדית וצרפתית.

</div>

---

<a name="spanish"></a>

## Español

Ajedrez contra el motor Stockfish. Juega con blancas o con negras, con una fuerza del motor de 1 a 10, relojes para blitz, rápidas y clásicas, historial de jugadas, piezas capturadas, coronación, sonidos y descarga en PGN.

### Reglas en breve

Ajedrez estándar de la FIDE; la legalidad de las jugadas la comprueba [chess.js](https://github.com/jhlywa/chess.js):
- jaque, jaque mate y ahogado;
- enroque, captura al paso y coronación;
- tablas por repetición, por la regla de los cincuenta movimientos y por material insuficiente.

Pierde el jugador cuyo reloj llega a cero.

### Cómo funciona

| Carpeta | Qué contiene |
|---|---|
| `components/` | `ChessGame` (la isla) y el tablero, los relojes, el historial, las piezas capturadas y los diálogos |
| `hooks/` | `useChessLogic`: el estado de la partida sobre chess.js. `useChessTimer`: los relojes. `useEngine`: el puente al motor |
| `engine/` | `EngineManager`: Stockfish en un Web Worker mediante el protocolo de texto UCI, con las peticiones superpuestas resueltas de forma segura. Cada búsqueda termina en la profundidad del nivel o a los 0,56–2 s, lo que llegue antes, así que un móvil lento nunca se congela (prueba de carga del 08.11.2026). `fenParser`: de FEN a una matriz del tablero |
| `assets/` | imágenes de las piezas, el fondo espacial y los sonidos de las jugadas, con pequeños cargadores (`chessPieces.ts`, `chessSounds.ts`) |
| `tests/` | el gestor del motor con un Worker simulado, y los relojes |
| `public/games/chess/` | el script del worker de Stockfish (necesita una URL fija), su licencia GPL-3.0 y el enlace al código fuente, y la portada |

La página `src/pages/games/chess.astro` solo coloca `ChessGame` (`client:only`), así que Stockfish nunca se ejecuta durante la compilación. El puente con Stockfish se explica en la [Biblia del proyecto](../../../../../COSMO_GAME_HUB_BIBLE.md#spanish), «Puentes entre las partes».

### Pendiente

- Guardar después de cada jugada (PGN y relojes) con `@shared/utils/storageEngine` y continuar donde lo dejó el jugador.
- Jugar en línea contra otra persona, en tiempo real y por correspondencia con pausas (véase la [Biblia del proyecto](../../../../../COSMO_GAME_HUB_BIBLE.md#spanish), «Juego en línea»).
- Cinco idiomas: ruso, hebreo, inglés, español y francés.

---

<a name="french"></a>

## Français

Les échecs contre le moteur Stockfish. Jouez les Blancs ou les Noirs, avec une force du moteur de 1 à 10, des pendules pour le blitz, le rapide et le classique, l'historique des coups, les pièces prises, la promotion, des sons et le téléchargement PGN.

### Les règles en bref

Échecs standard de la FIDE ; la légalité des coups est vérifiée par [chess.js](https://github.com/jhlywa/chess.js) :
- échec, échec et mat et pat ;
- roque, prise en passant et promotion ;
- nulle par répétition, par la règle des cinquante coups et par matériel insuffisant.

Le joueur dont la pendule tombe à zéro perd.

### Comment c'est construit

| Dossier | Ce qu'il contient |
|---|---|
| `components/` | `ChessGame` (l'îlot) et l'échiquier, les pendules, l'historique, les pièces prises et les fenêtres |
| `hooks/` | `useChessLogic` : l'état de la partie au-dessus de chess.js. `useChessTimer` : les pendules. `useEngine` : le pont vers le moteur |
| `engine/` | `EngineManager` : Stockfish dans un Web Worker via le protocole texte UCI, avec un traitement sûr des requêtes qui se chevauchent. Chaque recherche s'arrête à la profondeur du niveau ou au bout de 0,56 à 2 s, au premier des deux, si bien qu'un téléphone lent ne se fige jamais (test de charge du 08.11.2026). `fenParser` : de la FEN à une matrice de l'échiquier |
| `assets/` | les images des pièces, le fond spatial et les sons des coups, avec de petits chargeurs (`chessPieces.ts`, `chessSounds.ts`) |
| `tests/` | le gestionnaire du moteur avec un Worker simulé, et les pendules |
| `public/games/chess/` | le script du worker Stockfish (il lui faut une URL fixe), sa licence GPL-3.0 et le lien vers le code source, ainsi que la couverture |

La page `src/pages/games/chess.astro` ne fait que placer `ChessGame` (`client:only`), donc Stockfish ne tourne jamais pendant la construction. Le pont vers Stockfish est expliqué dans la [Bible du projet](../../../../../COSMO_GAME_HUB_BIBLE.md#french), « Ponts entre les parties ».

### À faire

- Sauvegarder après chaque coup (PGN et pendules) via `@shared/utils/storageEngine` et reprendre là où le joueur s'est arrêté.
- Jouer en ligne contre un partenaire, en temps réel et par correspondance avec des pauses (voir la [Bible du projet](../../../../../COSMO_GAME_HUB_BIBLE.md#french), « Jeu en ligne »).
- Cinq langues : russe, hébreu, anglais, espagnol et français.
