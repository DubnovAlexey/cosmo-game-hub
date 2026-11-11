# Cosmo Game Hub

[English](#english) · [Русский](#russian) · [עברית](#hebrew) · [Español](#spanish) · [Français](#french)

<a name="english"></a>

## English

A web platform for classic logic games. Chess against the Stockfish engine, preferans (Sochi, Leningrad, Rostov and Classic rules, two to four at the table) and no-limit Texas hold'em poker (a sit-and-go of two to six) against bots with characters, and a sea battle (the notebook rules or the boxed ones) against a hero of the vampire lair are playable. More games are planned and appear in the collection as "Coming soon".

**Live demo:** https://dubnovalexey.github.io/cosmo-game-hub/

### Try it in a minute

- **Chess.** Open **Games → Chess**, start a game and make a legal move to see the engine reply, the clocks and the move history. Try the PGN download after playing.
- **Preferans.** Open **Games → Preferans**, choose the table options and play a pool against bots with characters. Reload the page in the middle of a deal: the game continues where you stopped.
- **Poker.** Open **Games → Poker**, choose how many regulars sit down, the chips and the blind speed, and play a sit-and-go. Play chips only.
- **Sea Battle.** Open **Games → Sea Battle**, choose the rules (the notebook «Classic» or the «Boxed game»), how well the opponent shoots and who fires first; set out the fleet or keep the random one, and shoot.
- **Coming soon.** The other game cards are previews.

### Features

- Chess against the computer: play as White or Black, engine strength from 1 to 10.
- Time controls: 3 and 5 minutes (blitz), 10 minutes (rapid), 30 minutes (classical).
- Move history, captured pieces, a pawn promotion dialog and move sounds.
- A game-over screen for victory, defeat and draw.
- The finished game can be downloaded as a PGN file, the standard format of chess notation.
- The engine runs in a Web Worker, so the board stays responsive while the computer thinks.
- Preferans: Sochi, Leningrad, Rostov and Classic rules, two to four at the table, every table option of the menu; 95 characters as opponents, and they never look at hidden cards.
- Poker: no-limit Texas hold'em, a sit-and-go of two to six with rising blinds and side pots; ten regulars of the lair with poker manners of their own; our own hand evaluator, checked on all 2 598 960 five-card hands.
- Sea Battle: battleship with two rule sets and two switches between them, a hero of the lair as the opponent, three fair levels of gunnery (the best one counts where a ship is likeliest to lie); the fleet is set out by finger and by mouse alike.
- Heroes of the lair: one company of 95 characters for all the games — your opponent at the chess board, at the preferans and the poker tables and on the night sea (four pirates came for the sea battle). Under the mouse a portrait grows two and a half times; a press opens the hero's card with the picture and the biography.
  - Table options: pool length, all-pass prices, half-whist, «здесь».
  - A score sheet with pool, mountain and whists.
  - The game is saved after every move.
- A games collection and a leaderboard page. The leaderboard shows demo data until player accounts exist.

### Tech stack

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · CSS Modules · chess.js · react-chessboard · Stockfish · Web Workers · Node test runner · npm workspaces · GitHub Actions · GitHub Pages

### Project structure

```text
apps/client/
  src/pages/                    routes; a game page only places its game
  src/shell/                    the site around the games: layout, header, footer, catalog
  src/shared/                   code used by two or more games: overlay, seeded random, saved games
  src/games/chess/              chess: components, hooks, engine bridge (Stockfish, UCI), assets, tests
  src/games/preferans/          preferans: table UI, hook, engine (four rule variants, two to four players, solver, bots), tests
  public/games/chess/           files with a fixed URL: the Stockfish worker, its GPL licence, the cover
COSMO_GAME_HUB_BIBLE.md         the project Bible, five languages in one file: why it is built this way
.github/workflows/deploy.yml    build and publish to GitHub Pages on every push to main
```

Each game folder has its own README with the rules: [chess](apps/client/src/games/chess/README.md), [preferans](apps/client/src/games/preferans/README.md).

### Architecture and languages in brief

- **One folder per game.**
  - Everything of a game lives in `src/games/<game>/`: components, hooks, engine, assets, tests and README.
  - Code shared by two or more games goes to `src/shared/`, and the site around the games is `src/shell/`.
- **Rules in TypeScript, thinking in a Web Worker.**
  - The same rules code runs the table, the bots, the tests and, later, the game server.
  - The preferans solver will move to Rust compiled to WebAssembly only if measurements call for it.
  - C++ appears only inside ready engines such as Stockfish.
- **Phone, tablet and computer alike.** Finger and mouse are equal and tested the same way. Pages without a game load no React. A game is saved after every move, with the «Save» button and when the page hides, and continues after a reload. The site speaks five languages (RU, EN, HE, ES, FR).

The project Bible has the full reasoning: the options compared, measurements, the bridges between parts and the engine internals. It is available in [Русский](COSMO_GAME_HUB_BIBLE.md#russian) · [English](COSMO_GAME_HUB_BIBLE.md#english) · [עברית](COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](COSMO_GAME_HUB_BIBLE.md#french).

### Engineering focus

- Connecting a chess engine through a Web Worker and the UCI text protocol.
- Keeping game state in React hooks on top of chess.js: moves, check, mate, promotion, timers.
- An exact double-dummy solver for preferans, using alpha-beta, a transposition table and equivalent cards.
- Preferans bots that sample only what their seat can know (Perfect-Information Monte Carlo).
- Rendering heavy components only in the browser (`client:only`), so the engines never run during the build.
- Deploying an Astro site from a monorepo to GitHub Pages under the `/cosmo-game-hub/` base path.

### Run locally

Node.js 22.12 or newer is required. The tests run TypeScript directly, so they need Node 23.6 or newer.

```sh
npm install
npm run dev --workspace client
```

Then open http://localhost:4321/cosmo-game-hub/. The site uses the same base path as on GitHub Pages.

To build the static site: `npm run build --workspace client` (the result goes to `apps/client/dist/`).

### Tests

`npm test` from the repository root runs 67 tests with Node's built-in runner:
- chess: the engine manager with a Worker mock (readiness, overlapping UCI requests, cleanup) and the clocks;
- preferans:
  - cards, bidding and scoring examples from the rulebook;
  - every path of a deal;
  - the solver against a plain minimax, and deal sampling;
  - table options, and bots playing whole deals;
- shared code and the site: the seeded random generator, saved games, navigation.

`npm run build --workspace client` validates the static output.

**Load tests.** `npm run load` (quick: `npm run load:quick`) plays hundreds of preferans deals and Stockfish moves and checks the site under thousands of requests. It reports how fast the engines answer and catches any hang. The browser parts need the built site on `astro preview --port 4324`. Results and method are in the [Bible](COSMO_GAME_HUB_BIBLE.md#english), sections 7 and 15.

### Roadmap

- **Preferans:**
  - the Leningrad and Rostov variants and house rules;
  - two and four players;
  - better-calibrated bot bidding;
  - online play.
- **Next games:** checkers, then the rest of the collection, each in its own folder.
- **Chess:**
  - save and resume;
  - small-screen controls, keyboard focus and an engine-thinking indicator;
  - a search timeout with recovery;
  - play a partner online, in real time and by correspondence.
- **Everywhere:**
  - five interface languages (Russian, Hebrew, English, Spanish, French);
  - TypeScript pinned in the dev dependencies, and tests in CI before publishing;
  - player accounts and a real leaderboard, together with the game server.

### Credits and licenses

- Chess engine: [Stockfish](https://stockfishchess.org/), compiled to JavaScript by the stockfish.js project (version 10.0.2), GPL-3.0. The license text and the link to the complete source code are in [`apps/client/public/games/chess`](apps/client/public/games/chess/README.md).
- Libraries: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).

---

<a name="russian"></a>

## Русский

Веб-платформа классических логических игр. Уже играются шахматы против движка Stockfish, безлимитный техасский холдем (турнир от двух до шести) и преферанс (Сочинка, Ленинградка, Ростовка и Классика, от двух до четырёх за столом) против ботов, а также морской бой (тетрадные или коробочные правила) против героя вампирского логова. Остальные игры в разработке и показаны в коллекции с пометкой «Coming soon».

**Демо:** https://dubnovalexey.github.io/cosmo-game-hub/

### Попробовать за минуту

- **Шахматы.** Откройте **Games → Chess**, начните партию и сделайте допустимый ход: появятся ответ движка, часы и история ходов. После игры попробуйте выгрузку PGN.
- **Покер.** Откройте **Games → Poker**, выберите, сколько завсегдатаев сядет за стол, фишки и скорость блайндов, и сыграйте турнир. Только игровые фишки.
- **Морской бой.** Откройте **Games → Sea Battle**, выберите правила (тетрадная «Классика» или «Международные»), как метко стреляет соперник и чей первый выстрел; расставьте флот или оставьте случайный и стреляйте.
- **Преферанс.** Откройте **Games → Preferans**, выберите настройки стола и сыграйте пулю против ботов с характерами. Перезагрузите страницу посреди раздачи — игра продолжится с того же места.
- **Coming soon.** Остальные карточки показывают будущие игры.

### Возможности

- Шахматы против компьютера: игра белыми или чёрными, сила движка от 1 до 10.
- Контроль времени: 3 и 5 минут (блиц), 10 минут (рапид), 30 минут (классика).
- История ходов, взятые фигуры, окно превращения пешки и звуки ходов.
- Экран конца партии: победа, поражение, ничья.
- Сыгранную партию можно скачать файлом PGN — это стандартный формат записи шахматных партий.
- Движок работает в Web Worker, поэтому доска не замирает, пока компьютер думает.
- Покер: безлимитный техасский холдем, турнир на выбывание от двух до шести с растущими блайндами и побочными банками; десять завсегдатаев логова со своими покерными манерами; своя оценка руки, проверенная на всех 2 598 960 пятикарточных руках.
- Морской бой: два набора правил и два переключателя между ними, соперник — герой логова, три честных уровня меткости (лучший считает, где кораблю лежать вероятнее всего); флот расставляется пальцем и мышью одинаково.
- Герои логова: одна компания из 95 персонажей на все игры — ваш соперник у шахматной доски, за столом преферанса и покера и на ночном море (ради морского боя приплыли четыре пирата). Под мышью портрет вырастает в два с половиной раза, нажатие раскрывает карточку героя с картинкой и биографией.
- Преферанс: Сочинка, Ленинградка, Ростовка и Классика, от двух до четырёх за столом, все опции меню; соперников — 95 героев, и никто из них никогда не подглядывает в чужие карты.
  - Настройки стола: длина пули, цены распасов, полвиста, «здесь».
  - Запись с пулей, горой и вистами.
  - Сохранение после каждого хода.
- Коллекция игр и таблица лидеров. Пока нет аккаунтов игроков, таблица показывает демо-данные.

### Технологии

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · CSS Modules · chess.js · react-chessboard · Stockfish · Web Workers · встроенный раннер тестов Node · npm workspaces · GitHub Actions · GitHub Pages

### Устройство проекта

```text
apps/client/
  src/pages/                    маршруты; страница игры только ставит игру на место
  src/shell/                    сайт вокруг игр: макет, шапка, подвал, каталог
  src/shared/                   код для двух и более игр: экран конца партии, случайные числа, сохранения
  src/games/chess/              шахматы: компоненты, хуки, мост к движку (Stockfish, UCI), картинки, звуки, тесты
  src/games/preferans/          преферанс: стол, хук, движок (Сочинка, решатель, боты), тесты
  public/games/chess/           файлы с постоянным адресом: воркер Stockfish, лицензия GPL, обложка
COSMO_GAME_HUB_BIBLE.md         Библия проекта, пять языков в одном файле: почему всё устроено именно так
.github/workflows/deploy.yml    сборка и публикация на GitHub Pages при каждом push в main
```

У каждой игры свой README с правилами: [шахматы](apps/client/src/games/chess/README.md), [преферанс](apps/client/src/games/preferans/README.md).

### Архитектура и языки коротко

- **Одна папка — одна игра.**
  - Всё, что относится к игре, лежит в `src/games/<игра>/`: компоненты, хуки, движок, картинки, тесты и README.
  - Код для двух и более игр лежит в `src/shared/`, сайт вокруг игр — в `src/shell/`.
- **Правила на TypeScript, расчёты в Web Worker.**
  - Один и тот же код правил работает в столе, у ботов, в тестах и позже на игровом сервере.
  - Решатель преферанса переедет на Rust, собранный в WebAssembly, только если этого потребуют замеры.
  - C++ используется только внутри готовых движков вроде Stockfish.
- **Телефон, планшет и компьютер на равных.** Палец и мышь равноценны и проверяются одинаково. Страницы без игры не грузят React. Партия сохраняется после каждого хода, по кнопке «Сохранить» и при сворачивании страницы и продолжается после перезагрузки. Сайт говорит на пяти языках (RU, EN, HE, ES, FR).

Все рассуждения собраны в Библии проекта: сравнение вариантов, замеры, мосты между частями и устройство движков. Она есть на пяти языках: [Русский](COSMO_GAME_HUB_BIBLE.md#russian) · [English](COSMO_GAME_HUB_BIBLE.md#english) · [עברית](COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](COSMO_GAME_HUB_BIBLE.md#french).

### Инженерные решения

- Подключение шахматного движка через Web Worker и текстовый протокол UCI.
- Состояние партии в React-хуках поверх chess.js: ходы, шах, мат, превращение пешки, часы.
- Точный решатель «в открытую» для преферанса: alpha-beta, таблица позиций, одинаковые карты.
- Боты преферанса, которые перебирают только то, что можно знать с их места (Perfect-Information Monte Carlo).
- Отрисовка тяжёлых компонентов только в браузере (`client:only`), чтобы движки не запускались при сборке.
- Публикация Astro-сайта из монорепозитория на GitHub Pages с базовым путём `/cosmo-game-hub/`.

### Запуск на своём компьютере

Нужен Node.js 22.12 или новее. Тесты запускают TypeScript напрямую, поэтому им нужен Node 23.6 или новее.

```sh
npm install
npm run dev --workspace client
```

Затем откройте http://localhost:4321/cosmo-game-hub/. Сайт использует тот же базовый путь, что и на GitHub Pages.

Сборка статического сайта: `npm run build --workspace client` (результат — в `apps/client/dist/`).

### Проверки

`npm test` из корня запускает 67 тестов встроенным раннером Node:
- шахматы: менеджер движка с макетом Worker (готовность, наложенные запросы UCI, очистка) и часы;
- преферанс:
  - карты, торговля и примеры записи из свода правил;
  - все пути раздачи;
  - решатель против простого полного перебора и выборка раскладов;
  - настройки стола и боты, которые играют целые раздачи;
- общий код и сайт: случайные числа по зерну, сохранения, навигация.

`npm run build --workspace client` проверяет статическую сборку.

**Нагрузочные проверки.** `npm run load` (быстро: `npm run load:quick`) играет сотни раздач преферанса и ходов Stockfish и проверяет сайт под тысячами запросов. Показывает, как быстро отвечают движки, и ловит любое зависание. Браузерным частям нужен собранный сайт на `astro preview --port 4324`. Итоги и способ — в [Библии](COSMO_GAME_HUB_BIBLE.md#russian), разделы 7 и 15.

### Планы

- **Преферанс:**
  - Ленинградка, Ростовская и договорные правила;
  - игра на двоих и на четверых;
  - более точная торговля ботов;
  - игра по сети.
- **Следующие игры:** шашки, затем остальная коллекция — каждая в своей папке.
- **Шахматы:**
  - сохранение и продолжение партии;
  - управление на маленьком экране, клавиатурный фокус и индикатор размышления движка;
  - ограничение времени поиска с восстановлением;
  - игра с партнёром по сети, в реальном времени и по переписке.
- **Везде:**
  - пять языков интерфейса (русский, иврит, английский, испанский, французский);
  - TypeScript в зависимостях разработки и тесты в CI перед публикацией;
  - аккаунты игроков и настоящая таблица лидеров — вместе с игровым сервером.

### Авторы и лицензии

- Шахматный движок: [Stockfish](https://stockfishchess.org/), собранный в JavaScript проектом stockfish.js (версия 10.0.2), лицензия GPL-3.0. Текст лицензии и ссылка на полный исходный код — в папке [`apps/client/public/games/chess`](apps/client/public/games/chess/README.md).
- Библиотеки: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).

---

<a name="hebrew"></a>

<div dir="rtl">

## עברית

פלטפורמת אינטרנט למשחקי היגיון קלאסיים. כבר אפשר לשחק שחמט נגד המנוע Stockfish, פוקר טקסס הולדם ללא הגבלה (טורניר לשניים עד שישה) ופרפרנס (חוקי סוצ׳י, לנינגרד, רוסטוב וקלאסיקה, שניים עד ארבעה ליד השולחן) נגד בוטים עם אופי, וגם צוללות (חוקי המחברת או חוקי הקופסה) נגד גיבור ממאורת הערפדים. משחקים נוספים נמצאים בפיתוח ומוצגים באוסף עם הסימון "Coming soon".

**הדגמה חיה:** https://dubnovalexey.github.io/cosmo-game-hub/

### נסו בדקה

- **שחמט.** פתחו את **Games → Chess**, התחילו משחק ובצעו מסע חוקי, ותראו את תשובת המנוע, את השעונים ואת היסטוריית המסעים. אחרי המשחק נסו את הורדת ה-PGN.
- **פוקר.** פתחו את **Games → Poker**, בחרו כמה קבועים יתיישבו, את האסימונים ואת מהירות הבליינדים, ושחקו טורניר. רק אסימוני משחק.
- **צוללות.** פתחו את **Games → Sea Battle**, בחרו את החוקים ("קלאסי" של המחברת או "משחק הקופסה"), עד כמה היריב קולע ומי יורה ראשון; הציבו את הצי או השאירו את האקראי, וירו.
- **פרפרנס.** פתחו את **Games → Preferans**, בחרו את הגדרות השולחן ושחקו פוליה נגד בוטים עם אופי. רעננו את הדף באמצע חלוקה: המשחק ממשיך מהמקום שבו עצרתם.
- **Coming soon.** שאר כרטיסי המשחקים הם תצוגה מקדימה.

### יכולות

- שחמט נגד המחשב: משחק בלבן או בשחור, עוצמת מנוע מ-1 עד 10.
- בקרת זמן: 3 ו-5 דקות (בליץ), 10 דקות (רפיד), 30 דקות (קלאסי).
- היסטוריית מסעים, כלים שנאכלו, חלון הכתרת רגלי וצלילי מסעים.
- מסך סיום משחק: ניצחון, הפסד או תיקו.
- אפשר להוריד את המשחק כקובץ PGN, הפורמט המקובל לרישום משחקי שחמט.
- המנוע רץ ב-Web Worker, ולכן הלוח לא נתקע בזמן שהמחשב חושב.
- פוקר: טקסס הולדם ללא הגבלה, טורניר הדחה לשניים עד שישה עם בליינדים עולים וקופות צד; עשרה קבועים של המאורה, לכל אחד סגנון פוקר משלו; הערכת יד משלנו, שנבדקה על כל 2 598 960 הידיים של חמישה קלפים.
- צוללות: שתי מערכות חוקים ושני מתגים ביניהן, גיבור מהמאורה כיריב, שלוש רמות קליעה הוגנות (הטובה ביותר מחשבת היכן הכי סביר שספינה שוכבת); הצי מוצב באצבע ובעכבר באותה מידה.
- גיבורי המאורה: חבורה אחת של 95 דמויות לכל המשחקים — היריב שלכם ליד לוח השחמט, בשולחן הפרפרנס, בשולחן הפוקר ובים הלילי (ארבעה פיראטים הגיעו בשביל הצוללות). מתחת לעכבר הדיוקן גדל פי שניים וחצי, ולחיצה פותחת את כרטיס הגיבור עם התמונה והביוגרפיה.
- פרפרנס: חוקי סוצ׳י, לנינגרד, רוסטוב וקלאסיקה, שניים עד ארבעה ליד השולחן, כל אפשרויות התפריט; 95 דמויות כיריבים, שלעולם אינן מציצות בקלפים נסתרים.
  - הגדרות שולחן: אורך הפולה, מחירי הראספסים, חצי ויסט, «здесь».
  - דף ניקוד עם פולה, הר וויסטים.
  - שמירה אחרי כל מהלך.
- אוסף משחקים וטבלת מובילים. עד שיהיו חשבונות שחקנים, הטבלה מציגה נתוני הדגמה.

### טכנולוגיות

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · CSS Modules · chess.js · react-chessboard · Stockfish · Web Workers · Node test runner · npm workspaces · GitHub Actions · GitHub Pages

### מבנה הפרויקט

<div dir="ltr">

```text
apps/client/
  src/pages/                    נתיבים; דף משחק רק ממקם את המשחק שלו
  src/shell/                    האתר שמסביב למשחקים: פריסה, כותרות, קטלוג
  src/shared/                   קוד של שני משחקים או יותר: מסך סיום, אקראיות לפי זרע, שמירות
  src/games/chess/              שחמט: רכיבים, מצב המשחק, גשר למנוע השחמט, מדיה, בדיקות
  src/games/preferans/          פרפרנס: שולחן, מצב המשחק, מנוע עם פותר ובוטים, בדיקות
  public/games/chess/           קבצים בכתובת קבועה: מנוע השחמט, הרישיון שלו, תמונת שער
COSMO_GAME_HUB_BIBLE.md         המדריך הטכני, חמש שפות בקובץ אחד: למה הפרויקט בנוי כך
.github/workflows/deploy.yml    בנייה ופרסום לאתר בכל דחיפה לענף הראשי
```

</div>

לכל תיקיית משחק יש README משלה עם החוקים: [שחמט](apps/client/src/games/chess/README.md), [פרפרנס](apps/client/src/games/preferans/README.md).

### ארכיטקטורה ושפות בקצרה

- **תיקייה אחת לכל משחק.**
  - כל מה ששייך למשחק נמצא בתיקייה שלו תחת `src/games`: רכיבים, hooks, מנוע, מדיה, בדיקות ו-README.
  - קוד ששני משחקים או יותר משתמשים בו עובר ל-`src/shared`, והאתר שמסביב למשחקים נמצא ב-`src/shell`.
- **חוקים ב-TypeScript, חישוב ב-Web Worker.**
  - אותו קוד חוקים מפעיל את השולחן, את הבוטים, את הבדיקות ובהמשך גם את שרת המשחק.
  - הפותר של הפרפרנס יעבור ל-Rust שמהודר ל-WebAssembly רק אם המדידות ידרשו זאת.
  - שפת ‎C++‎ מופיעה רק בתוך מנועים מוכנים כמו Stockfish.
- **טלפון, טאבלט ומחשב באותה מידה.** אצבע ועכבר שווים ונבדקים באותו אופן. דפים בלי משחק אינם טוענים React. כל משחק נשמר אחרי כל מהלך, בכפתור «לשמור» וכשהדף מוסתר, וממשיך אחרי רענון. האתר מדבר בחמש שפות (RU, EN, HE, ES, FR).

המדריך הטכני של הפרויקט (Bible) מכיל את הנימוקים המלאים: השוואת חלופות, מדידות, הגשרים בין החלקים והמבנה הפנימי של המנועים. הוא זמין בחמש שפות: [Русский](COSMO_GAME_HUB_BIBLE.md#russian) · [English](COSMO_GAME_HUB_BIBLE.md#english) · [עברית](COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](COSMO_GAME_HUB_BIBLE.md#french).

### היבטים הנדסיים

- חיבור מנוע שחמט דרך Web Worker ופרוטוקול הטקסט UCI.
- ניהול מצב המשחק ב-React hooks מעל chess.js: מסעים, שח, מט, הכתרה ושעונים.
- פותר מדויק "בקלפים פתוחים" (double-dummy) לפרפרנס, עם אלפא-בטא, טבלת מעברים וקלפים שקולים.
- בוטים של פרפרנס שדוגמים רק את מה שהמקום שלהם יכול לדעת (Perfect-Information Monte Carlo).
- הצגת רכיבים כבדים רק בדפדפן (`client:only`), כדי שהמנועים לא ירוצו בזמן הבנייה.
- פרסום אתר Astro ממונוריפו ל-GitHub Pages תחת נתיב הבסיס `/cosmo-game-hub/`.

### הרצה מקומית

נדרש Node.js בגרסה 22.12 ומעלה. הבדיקות מריצות TypeScript ישירות, ולכן הן דורשות Node בגרסה 23.6 ומעלה.

<div dir="ltr">

```sh
npm install
npm run dev --workspace client
```

</div>

לאחר מכן פתחו את http://localhost:4321/cosmo-game-hub/. האתר משתמש באותו נתיב בסיס כמו ב-GitHub Pages.

בניית האתר הסטטי: `npm run build --workspace client`. התוצאה נשמרת בתיקייה `apps/client/dist`.

### בדיקות

הפקודה `npm test` מתיקיית השורש מריצה 67 בדיקות עם מריץ הבדיקות המובנה של Node:
- שחמט: מנהל המנוע עם Worker מדומה (מוכנות, בקשות UCI חופפות, ניקוי) והשעונים;
- פרפרנס:
  - קלפים, הכרזות ודוגמאות ניקוד מתוך ספר החוקים;
  - כל המסלולים של חלוקה;
  - הפותר מול חיפוש מלא פשוט, ודגימת חלוקות;
  - הגדרות שולחן, ובוטים שמשחקים חלוקות שלמות;
- קוד משותף והאתר: מחולל האקראיות לפי זרע, משחקים שמורים וניווט.

הפקודה `npm run build --workspace client` מוודאת את תוצאת הבנייה הסטטית.

**בדיקות עומס.** הפקודה `npm run load` (מהיר: `npm run load:quick`) משחקת מאות חלוקות פרפרנס ומסעי Stockfish ובודקת את האתר תחת אלפי בקשות. היא מראה כמה מהר המנועים עונים ותופסת כל תקיעה. החלקים בדפדפן צריכים את האתר הבנוי על `astro preview --port 4324`. התוצאות והשיטה [במדריך הטכני](COSMO_GAME_HUB_BIBLE.md#hebrew), פרקים 7 ו-15.

### תוכניות

- **פרפרנס:**
  - גרסאות לנינגרד ורוסטוב וחוקי בית;
  - משחק בשניים ובארבעה;
  - הכרזות מכוילות יותר לבוטים;
  - משחק ברשת.
- **המשחקים הבאים:** דמקה, אחר כך שאר האוסף, כל אחד בתיקייה משלו.
- **שחמט:**
  - שמירה והמשך;
  - פקדים למסך קטן, מיקוד מקלדת וחיווי חשיבת המנוע;
  - מגבלת זמן לחיפוש עם התאוששות;
  - משחק מול שותף ברשת, בזמן אמת ובהתכתבות.
- **בכל הפרויקט:**
  - חמש שפות ממשק (רוסית, עברית, אנגלית, ספרדית, צרפתית);
  - TypeScript בתלויות הפיתוח, ובדיקות ב-CI לפני פרסום;
  - חשבונות שחקנים וטבלת מובילים אמיתית, יחד עם שרת המשחק.

### קרדיטים ורישיונות

- מנוע השחמט: [Stockfish](https://stockfishchess.org/), שהודר ל-JavaScript על ידי הפרויקט stockfish.js (גרסה 10.0.2), ברישיון GPL-3.0. טקסט הרישיון והקישור לקוד המקור המלא נמצאים בתיקייה [`apps/client/public/games/chess`](apps/client/public/games/chess/README.md).
- ספריות: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).

</div>

---

<a name="spanish"></a>

## Español

Una plataforma web de juegos de lógica clásicos. Ya se puede jugar al ajedrez contra el motor Stockfish, al póker Texas hold'em sin límite (un torneo de dos a seis) y al preferans (reglas de Sochi, Leningrado, Rostov y Clásica, de dos a cuatro en la mesa) contra bots con carácter, y a la batalla naval (reglas de cuaderno o de caja) contra un héroe de la guarida de vampiros. Hay más juegos previstos; en la colección aparecen como "Coming soon".

**Demo en vivo:** https://dubnovalexey.github.io/cosmo-game-hub/

### Pruébalo en un minuto

- **Ajedrez.** Abre **Games → Chess**, empieza una partida y haz una jugada legal: verás la respuesta del motor, los relojes y el historial de jugadas. Después de jugar, prueba la descarga en PGN.
- **Póker.** Abre **Games → Poker**, elige cuántos habituales se sientan, las fichas y la velocidad de las ciegas, y juega un torneo. Solo fichas de juego.
- **Batalla naval.** Abre **Games → Sea Battle**, elige las reglas (la «Clásica» de cuaderno o el «Juego de caja»), lo bien que dispara el rival y quién dispara primero; coloca la flota o quédate con la del azar, y dispara.
- **Preferans.** Abre **Games → Preferans**, elige las opciones de la mesa y juega una pulya contra bots con carácter. Recarga la página en mitad de una mano: la partida continúa donde la dejaste.
- **Coming soon.** Las demás tarjetas son avances de juegos futuros.

### Funciones

- Ajedrez contra el ordenador: juega con blancas o con negras, con una fuerza del motor de 1 a 10.
- Control de tiempo: 3 y 5 minutos (blitz), 10 minutos (rápidas), 30 minutos (clásicas).
- Historial de jugadas, piezas capturadas, diálogo de coronación y sonidos de las jugadas.
- Pantalla de fin de partida: victoria, derrota o tablas.
- La partida terminada se puede descargar como archivo PGN, el formato estándar de notación de ajedrez.
- El motor funciona en un Web Worker, así que el tablero sigue respondiendo mientras el ordenador piensa.
- Póker: Texas hold'em sin límite, torneo de eliminación de dos a seis con ciegas que suben y botes secundarios; diez habituales de la guarida con su propio estilo de póker; un evaluador de manos propio, comprobado con las 2 598 960 manos de cinco cartas.
- Batalla naval: dos reglamentos y dos interruptores entre ellos, un héroe de la guarida como rival, tres niveles de puntería limpios (el mejor calcula dónde es más probable que haya un barco); la flota se coloca igual con el dedo que con el ratón.
- Héroes de la guarida: una sola compañía de 95 personajes para todos los juegos: tu rival junto al tablero de ajedrez, en la mesa de preferans, en la de póker y en el mar nocturno (cuatro piratas llegaron para la batalla naval). Bajo el ratón el retrato crece dos veces y media; una pulsación abre la ficha del héroe con la imagen y la biografía.
- Preferans: reglas de Sochi, Leningrado, Rostov y Clásica, de dos a cuatro en la mesa, todas las opciones del menú; 95 personajes como rivales, que nunca miran las cartas ocultas.
  - Opciones de mesa: longitud del pool, precios de las manos sin contrato («raspasy»), medio whist, «здесь».
  - Una hoja de puntuación con pool, montaña y whists.
  - La partida se guarda después de cada jugada.
- Una colección de juegos y una página de clasificación. La clasificación muestra datos de demostración hasta que existan cuentas de jugadores.

### Tecnologías

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · CSS Modules · chess.js · react-chessboard · Stockfish · Web Workers · ejecutor de pruebas de Node · npm workspaces · GitHub Actions · GitHub Pages

### Estructura del proyecto

```text
apps/client/
  src/pages/                    rutas; la página de un juego solo coloca su juego
  src/shell/                    el sitio alrededor de los juegos: plantilla, cabecera, pie, catálogo
  src/shared/                   código de dos o más juegos: pantalla final, azar con semilla, partidas guardadas
  src/games/chess/              ajedrez: componentes, hooks, puente al motor (Stockfish, UCI), recursos, pruebas
  src/games/preferans/          preferans: mesa, hook, motor (reglas de Sochi, solver, bots), pruebas
  public/games/chess/           archivos con URL fija: el worker de Stockfish, su licencia GPL, la portada
COSMO_GAME_HUB_BIBLE.md         la Biblia del proyecto, cinco idiomas en un archivo: por qué está hecho así
.github/workflows/deploy.yml    compilación y publicación en GitHub Pages con cada push a main
```

Cada carpeta de juego tiene su propio README con las reglas: [ajedrez](apps/client/src/games/chess/README.md), [preferans](apps/client/src/games/preferans/README.md).

### Arquitectura y lenguajes en breve

- **Una carpeta por juego.**
  - Todo lo de un juego vive en `src/games/<juego>/`: componentes, hooks, motor, recursos, pruebas y README.
  - El código que comparten dos o más juegos va a `src/shared/`, y el sitio alrededor de los juegos es `src/shell/`.
- **Reglas en TypeScript, cálculo en un Web Worker.**
  - El mismo código de reglas mueve la mesa, los bots, las pruebas y, más adelante, el servidor de juego.
  - El solver del preferans pasará a Rust compilado a WebAssembly solo si las mediciones lo piden.
  - C++ aparece solo dentro de motores ya hechos, como Stockfish.
- **Móvil, tableta y ordenador por igual.** El dedo y el ratón valen lo mismo y se prueban igual. Las páginas sin juego no cargan React. Cada partida se guarda tras cada jugada, con el botón «Guardar» y al ocultarse la página, y continúa tras recargar. El sitio habla cinco idiomas (RU, EN, HE, ES, FR).

La Biblia del proyecto recoge el razonamiento completo: las opciones comparadas, las mediciones, los puentes entre las partes y el interior de los motores. Está disponible en [Русский](COSMO_GAME_HUB_BIBLE.md#russian) · [English](COSMO_GAME_HUB_BIBLE.md#english) · [עברית](COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](COSMO_GAME_HUB_BIBLE.md#french).

### Aspectos de ingeniería

- Conexión de un motor de ajedrez mediante un Web Worker y el protocolo de texto UCI.
- Estado de la partida en hooks de React sobre chess.js: jugadas, jaque, mate, coronación, relojes.
- Un solver exacto «a cartas vistas» (double-dummy) para el preferans, con alfa-beta, tabla de transposición y cartas equivalentes.
- Bots de preferans que muestrean solo lo que su asiento puede saber (Perfect-Information Monte Carlo).
- Componentes pesados que se renderizan solo en el navegador (`client:only`), para que los motores nunca se ejecuten durante la compilación.
- Publicación de un sitio Astro desde un monorepositorio en GitHub Pages bajo la ruta base `/cosmo-game-hub/`.

### Ejecutar en local

Se necesita Node.js 22.12 o superior. Las pruebas ejecutan TypeScript directamente, así que necesitan Node 23.6 o superior.

```sh
npm install
npm run dev --workspace client
```

Luego abre http://localhost:4321/cosmo-game-hub/. El sitio usa la misma ruta base que en GitHub Pages.

Para compilar el sitio estático: `npm run build --workspace client` (el resultado va a `apps/client/dist/`).

### Pruebas

`npm test` desde la raíz del repositorio ejecuta 67 pruebas con el ejecutor integrado de Node:
- ajedrez: el gestor del motor con un Worker simulado (disponibilidad, peticiones UCI superpuestas, limpieza) y los relojes;
- preferans:
  - cartas, subasta y ejemplos de puntuación del reglamento;
  - todos los caminos de una mano;
  - el solver frente a un minimax simple, y el muestreo de repartos;
  - las opciones de mesa, y bots que juegan manos completas;
- código compartido y sitio: el generador aleatorio con semilla, las partidas guardadas y la navegación.

`npm run build --workspace client` valida el resultado estático.

**Pruebas de carga.** `npm run load` (rápido: `npm run load:quick`) juega cientos de repartos de preferans y jugadas de Stockfish y prueba el sitio bajo miles de peticiones. Muestra lo rápido que responden los motores y detecta cualquier bloqueo. Las partes de navegador necesitan el sitio compilado en `astro preview --port 4324`. Los resultados y el método están en la [Biblia](COSMO_GAME_HUB_BIBLE.md#spanish), secciones 7 y 15.

### Planes

- **Preferans:**
  - las variantes de Leningrado y Rostov y las reglas de la casa;
  - partidas de dos y de cuatro jugadores;
  - una subasta de los bots mejor calibrada;
  - juego en línea.
- **Próximos juegos:** las damas, después el resto de la colección, cada uno en su propia carpeta.
- **Ajedrez:**
  - guardar y continuar;
  - controles para pantallas pequeñas, foco de teclado e indicador de que el motor está pensando;
  - un límite de tiempo de búsqueda con recuperación;
  - jugar contra otra persona en línea, en tiempo real y por correspondencia.
- **En todo el proyecto:**
  - cinco idiomas de interfaz (ruso, hebreo, inglés, español, francés);
  - TypeScript fijado en las dependencias de desarrollo y pruebas en CI antes de publicar;
  - cuentas de jugador y una clasificación real, junto con el servidor de juego.

### Créditos y licencias

- Motor de ajedrez: [Stockfish](https://stockfishchess.org/), compilado a JavaScript por el proyecto stockfish.js (versión 10.0.2), GPL-3.0. El texto de la licencia y el enlace al código fuente completo están en [`apps/client/public/games/chess`](apps/client/public/games/chess/README.md).
- Bibliotecas: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).

---

<a name="french"></a>

## Français

Une plateforme web de jeux de logique classiques. On peut déjà jouer aux échecs contre le moteur Stockfish, au poker Texas hold'em sans limite (un tournoi de deux à six) et à la préférence (preferans : règles de Sotchi, Leningrad, Rostov et Classique, de deux à quatre à table) contre des bots pleins de caractère, et à la bataille navale (règles du cahier ou de la boîte) contre un héros du repaire de vampires. D'autres jeux sont prévus ; ils apparaissent dans la collection avec la mention « Coming soon ».

**Démo en ligne :** https://dubnovalexey.github.io/cosmo-game-hub/

### Essayer en une minute

- **Échecs.** Ouvrez **Games → Chess**, commencez une partie et jouez un coup légal : vous verrez la réponse du moteur, les pendules et l'historique des coups. Après la partie, essayez le téléchargement PGN.
- **Poker.** Ouvrez **Games → Poker**, choisissez combien d'habitués s'assoient, les jetons et la vitesse des blindes, et jouez un tournoi. Jetons de jeu seulement.
- **Bataille navale.** Ouvrez **Games → Sea Battle**, choisissez les règles (« Classique » du cahier ou « Jeu de boîte »), l'adresse de l'adversaire et qui tire le premier ; disposez la flotte ou gardez celle du hasard, et tirez.
- **Préférence.** Ouvrez **Games → Preferans**, choisissez les options de la table et jouez une poule contre des bots pleins de caractère. Rechargez la page au milieu d'une donne : la partie reprend là où vous l'avez laissée.
- **Coming soon.** Les autres cartes de jeux sont des aperçus.

### Fonctionnalités

- Échecs contre l'ordinateur : jouez les Blancs ou les Noirs, avec une force du moteur de 1 à 10.
- Cadences : 3 et 5 minutes (blitz), 10 minutes (rapide), 30 minutes (classique).
- Historique des coups, pièces prises, fenêtre de promotion et sons des coups.
- Écran de fin de partie : victoire, défaite ou nulle.
- La partie terminée peut être téléchargée au format PGN, la notation standard des échecs.
- Le moteur tourne dans un Web Worker : l'échiquier reste réactif pendant que l'ordinateur réfléchit.
- Poker : Texas hold'em sans limite, tournoi à élimination de deux à six avec des blindes qui montent et des pots annexes ; dix habitués du repaire, chacun avec sa manière ; notre propre évaluateur de mains, vérifié sur les 2 598 960 mains de cinq cartes.
- Bataille navale : deux règlements et deux interrupteurs entre eux, un héros du repaire pour adversaire, trois niveaux de tir honnêtes (le meilleur calcule où un navire a le plus de chances de se trouver) ; la flotte se dispose au doigt comme à la souris.
- Héros du repaire : une seule compagnie de 95 personnages pour tous les jeux — votre adversaire devant l'échiquier, à la table de préférence, à celle de poker et sur la mer nocturne (quatre pirates sont venus pour la bataille navale). Sous la souris le portrait grandit deux fois et demie ; un appui ouvre la fiche du héros avec l'image et la biographie.
- Préférence : règles de Sotchi, Leningrad, Rostov et Classique, de deux à quatre à table, toutes les options du menu ; 95 personnages comme adversaires, qui ne regardent jamais les cartes cachées.
  - Options de table : longueur de la poule, prix des donnes sans contrat (« raspasy »), demi-whist, « здесь ».
  - Une feuille de marque avec poule, montagne et whists.
  - La partie est sauvegardée après chaque coup.
- Une collection de jeux et une page de classement. Le classement affiche des données de démonstration tant qu'il n'existe pas de comptes joueurs.

### Technologies

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · CSS Modules · chess.js · react-chessboard · Stockfish · Web Workers · exécuteur de tests de Node · npm workspaces · GitHub Actions · GitHub Pages

### Structure du projet

```text
apps/client/
  src/pages/                    routes ; la page d'un jeu ne fait que placer son jeu
  src/shell/                    le site autour des jeux : mise en page, en-tête, pied de page, catalogue
  src/shared/                   code de deux jeux ou plus : écran de fin, hasard à graine, parties sauvegardées
  src/games/chess/              échecs : composants, hooks, pont vers le moteur (Stockfish, UCI), médias, tests
  src/games/preferans/          préférence : table, hook, moteur (règles de Sotchi, solveur, bots), tests
  public/games/chess/           fichiers à URL fixe : le worker Stockfish, sa licence GPL, la couverture
COSMO_GAME_HUB_BIBLE.md         la Bible du projet, cinq langues dans un fichier : pourquoi il est construit ainsi
.github/workflows/deploy.yml    construction et publication sur GitHub Pages à chaque push sur main
```

Chaque dossier de jeu a son propre README avec les règles : [échecs](apps/client/src/games/chess/README.md), [préférence](apps/client/src/games/preferans/README.md).

### Architecture et langages en bref

- **Un dossier par jeu.**
  - Tout ce qui concerne un jeu vit dans `src/games/<jeu>/` : composants, hooks, moteur, médias, tests et README.
  - Le code partagé par deux jeux ou plus va dans `src/shared/`, et le site autour des jeux, c'est `src/shell/`.
- **Règles en TypeScript, calcul dans un Web Worker.**
  - Le même code de règles fait tourner la table, les bots, les tests et, plus tard, le serveur de jeu.
  - Le solveur de la préférence passera à Rust compilé en WebAssembly seulement si les mesures l'exigent.
  - Le C++ n'apparaît que dans des moteurs tout faits comme Stockfish.
- **Téléphone, tablette et ordinateur à égalité.** Le doigt et la souris se valent et sont testés de la même façon. Les pages sans jeu ne chargent pas React. Chaque partie est enregistrée après chaque coup, avec le bouton « Enregistrer » et quand la page se masque, et reprend après un rechargement. Le site parle cinq langues (RU, EN, HE, ES, FR).

La Bible du projet contient le raisonnement complet : les options comparées, les mesures, les ponts entre les parties et le fonctionnement interne des moteurs. Elle existe en [Русский](COSMO_GAME_HUB_BIBLE.md#russian) · [English](COSMO_GAME_HUB_BIBLE.md#english) · [עברית](COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](COSMO_GAME_HUB_BIBLE.md#french).

### Points d'ingénierie

- Connexion d'un moteur d'échecs via un Web Worker et le protocole texte UCI.
- État de la partie dans des hooks React au-dessus de chess.js : coups, échec, mat, promotion, pendules.
- Un solveur exact « à cartes ouvertes » (double-dummy) pour la préférence, avec alpha-bêta, table de transposition et cartes équivalentes.
- Des bots de préférence qui n'échantillonnent que ce que leur place peut savoir (Perfect-Information Monte Carlo).
- Des composants lourds rendus uniquement dans le navigateur (`client:only`), pour que les moteurs ne tournent jamais pendant la construction.
- Déploiement d'un site Astro depuis un monorepo sur GitHub Pages sous le chemin de base `/cosmo-game-hub/`.

### Lancer en local

Node.js 22.12 ou plus récent est nécessaire. Les tests exécutent TypeScript directement, il leur faut donc Node 23.6 ou plus récent.

```sh
npm install
npm run dev --workspace client
```

Ouvrez ensuite http://localhost:4321/cosmo-game-hub/. Le site utilise le même chemin de base que sur GitHub Pages.

Pour construire le site statique : `npm run build --workspace client` (le résultat va dans `apps/client/dist/`).

### Tests

`npm test` depuis la racine du dépôt lance 67 tests avec l'exécuteur intégré de Node :
- échecs : le gestionnaire du moteur avec un Worker simulé (disponibilité, requêtes UCI qui se chevauchent, nettoyage) et les pendules ;
- préférence :
  - cartes, enchères et exemples de marque tirés du règlement ;
  - tous les chemins d'une donne ;
  - le solveur face à un minimax simple, et l'échantillonnage des donnes ;
  - les options de table, et des bots qui jouent des donnes entières ;
- code partagé et site : le générateur aléatoire à graine, les parties sauvegardées et la navigation.

`npm run build --workspace client` valide le résultat statique.

**Tests de charge.** `npm run load` (rapide : `npm run load:quick`) joue des centaines de donnes de préférence et de coups de Stockfish et teste le site sous des milliers de requêtes. Il montre la vitesse de réponse des moteurs et repère tout blocage. Les parties dans le navigateur ont besoin du site construit sur `astro preview --port 4324`. Les résultats et la méthode sont dans la [Bible](COSMO_GAME_HUB_BIBLE.md#french), sections 7 et 15.

### Feuille de route

- **Préférence :**
  - les variantes de Leningrad et de Rostov et les règles maison ;
  - les parties à deux et à quatre joueurs ;
  - des enchères des bots mieux calibrées ;
  - le jeu en ligne.
- **Prochains jeux :** les dames, puis le reste de la collection, chacun dans son propre dossier.
- **Échecs :**
  - sauvegarder et reprendre ;
  - commandes pour petits écrans, focus clavier et indicateur de réflexion du moteur ;
  - une limite de temps de recherche avec reprise ;
  - jouer contre un partenaire en ligne, en temps réel et par correspondance.
- **Partout :**
  - cinq langues d'interface (russe, hébreu, anglais, espagnol, français) ;
  - TypeScript fixé dans les dépendances de développement et tests en CI avant publication ;
  - des comptes joueurs et un vrai classement, avec le serveur de jeu.

### Crédits et licences

- Moteur d'échecs : [Stockfish](https://stockfishchess.org/), compilé en JavaScript par le projet stockfish.js (version 10.0.2), sous licence GPL-3.0. Le texte de la licence et le lien vers le code source complet se trouvent dans [`apps/client/public/games/chess`](apps/client/public/games/chess/README.md).
- Bibliothèques : [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).
