# Cosmo Game Hub

[English](README.md) · **עברית** · [Русский](README.ru.md)

פלטפורמת אינטרנט למשחקי היגיון קלאסיים. המשחק הראשון, שחמט נגד המנוע Stockfish, מוכן לגמרי. משחקים נוספים נמצאים בפיתוח ומוצגים באוסף עם הסימון "Coming soon".

**הדגמה חיה:** https://dubnovalexey.github.io/cosmo-game-hub/

## יכולות

- שחמט נגד המחשב: משחק בלבן או בשחור, עוצמת מנוע מ-1 עד 10.
- בקרת זמן: 3 ו-5 דקות (בליץ), 10 דקות (רפיד), 30 דקות (קלאסי).
- היסטוריית מסעים, כלים שנאכלו, חלון הכתרת רגלי וצלילי מסעים.
- מסך סיום משחק: ניצחון, הפסד או תיקו.
- אפשר להוריד את המשחק כקובץ PGN, הפורמט המקובל לרישום משחקי שחמט.
- המנוע רץ ב-Web Worker, ולכן הלוח לא נתקע בזמן שהמחשב חושב.
- אוסף משחקים וטבלת מובילים. עד שיהיו חשבונות שחקנים, הטבלה מציגה נתוני הדגמה.

## טכנולוגיות

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · chess.js · react-chessboard · Stockfish in a Web Worker · npm workspaces · GitHub Actions · GitHub Pages

## מבנה הפרויקט

```text
apps/client/                    the Astro site; games are React islands
  src/components/games/chess/   board, timers, move history, dialogs
  src/hooks/useChessLogic.ts    game state on top of chess.js
  src/utils/engine/             Stockfish in a Web Worker (UCI protocol)
  public/engines/chess/         the engine file, its license and source link
.github/workflows/deploy.yml    build and publish to GitHub Pages on every push to main
```

## מה תרגלתי

- חיבור מנוע שחמט דרך Web Worker ופרוטוקול הטקסט UCI.
- ניהול מצב המשחק ב-React hooks מעל chess.js: מסעים, שח, מט, הכתרה ושעונים.
- הצגת רכיב כבד רק בדפדפן (`client:only`), כדי שהמנוע לא ירוץ בזמן הבנייה.
- פרסום אתר Astro ממונוריפו ל-GitHub Pages תחת נתיב הבסיס `/cosmo-game-hub/`.

## הרצה מקומית

נדרש Node.js בגרסה 22.12 ומעלה.

```sh
npm install
npm run dev --workspace client
```

לאחר מכן פתחו את http://localhost:4321/cosmo-game-hub/. האתר משתמש באותו נתיב בסיס כמו ב-GitHub Pages.

בניית האתר הסטטי: `npm run build --workspace client` (התוצאה נשמרת ב-`apps/client/dist/`).

## תוכניות

- מעטפת משותפת למשחקים: הגדרות, שעונים, היסטוריית מסעים ומסך סיום לכל משחק.
- משחקים חדשים אחד אחרי השני: קודם איקס עיגול, Cosmo Snake ודמקה, אחר כך משחקי הקלפים והלוח הגדולים.
- חשבונות שחקנים וטבלת מובילים אמיתית.
- בדיקות יחידה ובדיקה אוטומטית לכל pull request.

## קרדיטים ורישיונות

- מנוע השחמט: [Stockfish](https://stockfishchess.org/), שהודר ל-JavaScript על ידי הפרויקט stockfish.js (גרסה 10.0.2), ברישיון GPL-3.0. טקסט הרישיון והקישור לקוד המקור המלא נמצאים בתיקייה [`apps/client/public/engines/chess`](apps/client/public/engines/chess/README.md).
- ספריות: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).
