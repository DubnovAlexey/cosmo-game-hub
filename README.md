# Cosmo Game Hub

[English](#english) · [Русский](#russian) · [עברית](#hebrew)

<a name="english"></a>

## English

A web platform for classic logic games. The first game, chess against the Stockfish engine, is fully playable. More games are planned and appear in the collection as "Coming soon".

**Live demo:** https://dubnovalexey.github.io/cosmo-game-hub/

### Try it in a minute

Open **Games → Chess**, start a game and make a legal move to see the engine reply, clocks and move history. Try the PGN download after playing; other game cards marked **Coming soon** are previews.

### Features

- Chess against the computer: play as White or Black, engine strength from 1 to 10.
- Time controls: 3 and 5 minutes (blitz), 10 minutes (rapid), 30 minutes (classical).
- Move history, captured pieces, a pawn promotion dialog and move sounds.
- A game-over screen for victory, defeat and draw.
- The finished game can be downloaded as a PGN file, the standard format of chess notation.
- The engine runs in a Web Worker, so the board stays responsive while the computer thinks.
- A games collection and a leaderboard page. The leaderboard shows demo data until player accounts exist.

### Tech stack

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · chess.js · react-chessboard · Stockfish in a Web Worker · npm workspaces · GitHub Actions · GitHub Pages

### Project structure

```text
apps/client/                    the Astro site; games are React islands
  src/components/games/chess/   board, timers, move history, dialogs
  src/hooks/useChessLogic.ts    game state on top of chess.js
  src/utils/engine/             Stockfish in a Web Worker (UCI protocol)
  public/engines/chess/         the engine file, its license and source link
.github/workflows/deploy.yml    build and publish to GitHub Pages on every push to main
```

### Engineering focus

- Connecting a chess engine through a Web Worker and the UCI text protocol.
- Keeping game state in React hooks on top of chess.js: moves, check, mate, promotion, timers.
- Rendering a heavy component only in the browser (`client:only`) so the engine never runs during the build.
- Deploying an Astro site from a monorepo to GitHub Pages under the `/cosmo-game-hub/` base path.

### Run locally

Node.js 22.12 or newer is required.

```sh
npm install
npm run dev --workspace client
```

Then open http://localhost:4321/cosmo-game-hub/. The site uses the same base path as on GitHub Pages.

To build the static site: `npm run build --workspace client` (the result goes to `apps/client/dist/`).

### Roadmap

Planned work is separate from the playable chess demo.

- **Visual:** improve small-screen controls, keyboard focus and the engine-thinking indicator; keep unfinished game cards clearly marked.
- **Engineering:** pin the test/typecheck toolchain, add engine search timeout/recovery and run the existing Worker regression tests in CI.
- **Functionality:** add tic-tac-toe as the next complete game through a shared settings/start/end shell; accounts and a real leaderboard can follow later.

### Credits and licenses

- Chess engine: [Stockfish](https://stockfishchess.org/), compiled to JavaScript by the stockfish.js project (version 10.0.2), GPL-3.0. The license text and the link to the complete source code are in [`apps/client/public/engines/chess`](apps/client/public/engines/chess/README.md).
- Libraries: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).

### Engine regression checks

Run `npm test` from the repository root after `npm install`. The tests use the existing build toolchain and a Worker mock to check readiness, overlapping UCI requests and promise cleanup; they do not launch an external engine. React also rejects cancelled or outdated FEN responses. `npm run build --workspace client` validates the static output.

---

<a name="russian"></a>

## Русский

Веб-платформа классических логических игр. Первая игра — шахматы против движка Stockfish — полностью готова. Остальные игры в разработке и показаны в коллекции с пометкой «Скоро».

**Демо:** https://dubnovalexey.github.io/cosmo-game-hub/

### Короткий сценарий просмотра

Откройте **Games → Chess**, начните партию и сделайте допустимый ход: появятся ответ движка, часы и история ходов. Попробуйте выгрузку PGN после игры. Карточки **Coming soon** показывают будущие игры.

### Возможности

- Шахматы против компьютера: игра белыми или чёрными, сила движка от 1 до 10.
- Контроль времени: 3 и 5 минут (блиц), 10 минут (рапид), 30 минут (классика).
- История ходов, взятые фигуры, окно превращения пешки и звуки ходов.
- Экран конца партии: победа, поражение, ничья.
- Сыгранную партию можно скачать файлом PGN — это стандартный формат записи шахматных партий.
- Движок работает в Web Worker, поэтому доска не замирает, пока компьютер думает.
- Коллекция игр и таблица лидеров. Пока нет аккаунтов игроков, таблица показывает демо-данные.

### Технологии

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · chess.js · react-chessboard · Stockfish в Web Worker · npm workspaces · GitHub Actions · GitHub Pages

### Устройство проекта

```text
apps/client/                    сайт на Astro; игры — React-острова
  src/components/games/chess/   доска, часы, история ходов, окна
  src/hooks/useChessLogic.ts    состояние партии поверх chess.js
  src/utils/engine/             Stockfish в Web Worker (протокол UCI)
  public/engines/chess/         файл движка, его лицензия и ссылка на исходники
.github/workflows/deploy.yml    сборка и публикация на GitHub Pages при каждом push в main
```

### Инженерные решения

- Подключение шахматного движка через Web Worker и текстовый протокол UCI.
- Состояние партии в React-хуках поверх chess.js: ходы, шах, мат, превращение пешки, часы.
- Отрисовку тяжёлого компонента только в браузере (`client:only`), чтобы движок не запускался при сборке.
- Публикацию Astro-сайта из монорепозитория на GitHub Pages с базовым путём `/cosmo-game-hub/`.

### Запуск на своём компьютере

Нужен Node.js 22.12 или новее.

```sh
npm install
npm run dev --workspace client
```

Затем откройте http://localhost:4321/cosmo-game-hub/. Сайт использует тот же базовый путь, что и на GitHub Pages.

Сборка статического сайта: `npm run build --workspace client` (результат — в `apps/client/dist/`).

### Планы

Планируемые работы отделены от уже доступного шахматного демо.

- **Визуал:** доработать управление на маленьком экране, клавиатурный фокус и индикатор размышления движка; сохранить явные пометки будущих игр.
- **Инженерия:** закрепить инструменты тестирования и typecheck, добавить timeout/recovery поиска движка и запуск существующих Worker-регрессий в CI.
- **Функции:** следующими закончить крестики-нолики с общей оболочкой настроек, старта и результата; аккаунты и настоящая таблица лидеров — более поздний этап.

### Авторы и лицензии

- Шахматный движок: [Stockfish](https://stockfishchess.org/), собранный в JavaScript проектом stockfish.js (версия 10.0.2), лицензия GPL-3.0. Текст лицензии и ссылка на полный исходный код — в папке [`apps/client/public/engines/chess`](apps/client/public/engines/chess/README.md).
- Библиотеки: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).

### Проверки движка

`npm test` из корня проверяет готовность Worker, очередность UCI-запросов и освобождение ожиданий при закрытии. Поздние ответы после изменения позиции или размонтирования не применяются. Для сборки: `npm run build --workspace client`.

---

<a name="hebrew"></a>

<div dir="rtl">

## עברית

פלטפורמת אינטרנט למשחקי היגיון קלאסיים. המשחק הראשון, שחמט נגד המנוע Stockfish, מוכן לגמרי. משחקים נוספים נמצאים בפיתוח ומוצגים באוסף עם הסימון "Coming soon".

**הדגמה חיה:** https://dubnovalexey.github.io/cosmo-game-hub/

### הדגמה קצרה

פתחו **Games → Chess**, התחילו משחק ובצעו מסע חוקי כדי לראות את תשובת המנוע, השעונים והיסטוריית המסעים. נסו הורדת PGN אחרי המשחק; כרטיסי **Coming soon** מציגים משחקים עתידיים.

### יכולות

- שחמט נגד המחשב: משחק בלבן או בשחור, עוצמת מנוע מ-1 עד 10.
- בקרת זמן: 3 ו-5 דקות (בליץ), 10 דקות (רפיד), 30 דקות (קלאסי).
- היסטוריית מסעים, כלים שנאכלו, חלון הכתרת רגלי וצלילי מסעים.
- מסך סיום משחק: ניצחון, הפסד או תיקו.
- אפשר להוריד את המשחק כקובץ PGN, הפורמט המקובל לרישום משחקי שחמט.
- המנוע רץ ב-Web Worker, ולכן הלוח לא נתקע בזמן שהמחשב חושב.
- אוסף משחקים וטבלת מובילים. עד שיהיו חשבונות שחקנים, הטבלה מציגה נתוני הדגמה.

### טכנולוגיות

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · chess.js · react-chessboard · Stockfish in a Web Worker · npm workspaces · GitHub Actions · GitHub Pages

### מבנה הפרויקט

```text
apps/client/                    the Astro site; games are React islands
  src/components/games/chess/   board, timers, move history, dialogs
  src/hooks/useChessLogic.ts    game state on top of chess.js
  src/utils/engine/             Stockfish in a Web Worker (UCI protocol)
  public/engines/chess/         the engine file, its license and source link
.github/workflows/deploy.yml    build and publish to GitHub Pages on every push to main
```

### היבטים הנדסיים

- חיבור מנוע שחמט דרך Web Worker ופרוטוקול הטקסט UCI.
- ניהול מצב המשחק ב-React hooks מעל chess.js: מסעים, שח, מט, הכתרה ושעונים.
- הצגת רכיב כבד רק בדפדפן (`client:only`), כדי שהמנוע לא ירוץ בזמן הבנייה.
- פרסום אתר Astro ממונוריפו ל-GitHub Pages תחת נתיב הבסיס `/cosmo-game-hub/`.

### הרצה מקומית

נדרש Node.js בגרסה 22.12 ומעלה.

```sh
npm install
npm run dev --workspace client
```

לאחר מכן פתחו את http://localhost:4321/cosmo-game-hub/. האתר משתמש באותו נתיב בסיס כמו ב-GitHub Pages.

בניית האתר הסטטי: `npm run build --workspace client` (התוצאה נשמרת ב-`apps/client/dist/`).

### תוכניות

התוכניות מופרדות מהדגמת השחמט שכבר פועלת.

- **עיצוב:** לשפר פקדים במסך קטן, מיקוד מקלדת וחיווי חשיבת המנוע; לשמור סימון ברור למשחקים עתידיים.
- **הנדסה:** לקבע את כלי הבדיקות ו-typecheck, להוסיף timeout/recovery לחיפוש המנוע ולהריץ ב-CI את בדיקות ה-Worker הקיימות.
- **פונקציונליות:** להשלים איקס עיגול כמשחק הבא עם מעטפת משותפת להגדרות, התחלה וסיום; חשבונות וטבלת מובילים אמיתית יכולים לבוא בהמשך.

### קרדיטים ורישיונות

- מנוע השחמט: [Stockfish](https://stockfishchess.org/), שהודר ל-JavaScript על ידי הפרויקט stockfish.js (גרסה 10.0.2), ברישיון GPL-3.0. טקסט הרישיון והקישור לקוד המקור המלא נמצאים בתיקייה [`apps/client/public/engines/chess`](apps/client/public/engines/chess/README.md).
- ספריות: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).

### בדיקות מנוע

`npm test` מתיקיית השורש בודק מוכנות Worker, סדר בקשות UCI וניקוי הבטחות בעזרת Worker מדומה. הבדיקות אינן מריצות Stockfish אמיתי. לבניית האתר השתמשו ב-`npm run build --workspace client`.

</div>
