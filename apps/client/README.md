# Cosmo Game Hub — client

[English](#english) · [Русский](#russian) · [עברית](#hebrew) · [Español](#spanish) · [Français](#french)

<a name="english"></a>

## English

The Astro site of Cosmo Game Hub. The project description, features and credits are in the [root README](../../README.md).

### Commands

Run them from the repository root:

| Command | Action |
| :-- | :-- |
| `npm install` | Installs the dependencies of every workspace |
| `npm run dev --workspace client` | Starts the dev server at http://localhost:4321/cosmo-game-hub/ |
| `npm run build --workspace client` | Builds the static site into `apps/client/dist/` |
| `npm run preview --workspace client` | Serves the built site locally |
| `npm test` | Runs every test in `apps/client/src/**/tests` with Node's built-in test runner |

### Folders

- `src/pages/` — routes: home, games collection, one page per game, leaderboard, about. A game page only places its game.
- `src/shell/` — the site around the games: layout, header, footer, game cards, catalog data, the `withBase` link helper.
- `src/shared/` — code used by two or more games: the game-over overlay, the seeded random generator, saved games.
- `src/games/<game>/` — everything of one game: `components/`, `hooks/`, `engine/`, `assets/`, `tests/`, `README.md`.
- `public/games/chess/` — the Stockfish engine (GPL-3.0) with its license and source link, and the chess cover.

The tree is explained in the project Bible: measurements, import rules and the choice of languages. It is available in [Русский](../../COSMO_GAME_HUB_BIBLE.md#russian) · [English](../../COSMO_GAME_HUB_BIBLE.md#english) · [עברית](../../COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](../../COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](../../COSMO_GAME_HUB_BIBLE.md#french).

---

<a name="russian"></a>

## Русский

Сайт Cosmo Game Hub на Astro. Описание проекта, возможности и авторы — в [корневом README](../../README.md).

### Команды

Запускать из корня репозитория:

| Команда | Что делает |
| :-- | :-- |
| `npm install` | Ставит зависимости всех workspaces |
| `npm run dev --workspace client` | Запускает сервер разработки: http://localhost:4321/cosmo-game-hub/ |
| `npm run build --workspace client` | Собирает статический сайт в `apps/client/dist/` |
| `npm run preview --workspace client` | Показывает собранный сайт локально |
| `npm test` | Запускает все тесты из `apps/client/src/**/tests` встроенным раннером Node |

### Папки

- `src/pages/` — маршруты: главная, коллекция игр, по странице на каждую игру, таблица лидеров, «About». Страница игры только ставит игру на место.
- `src/shell/` — сайт вокруг игр: макет, шапка, подвал, карточки игр, данные каталога, помощник ссылок `withBase`.
- `src/shared/` — код для двух и более игр: экран конца партии, случайные числа по зерну, сохранения.
- `src/games/<игра>/` — всё, что относится к одной игре: `components/`, `hooks/`, `engine/`, `assets/`, `tests/`, `README.md`.
- `public/games/chess/` — движок Stockfish (GPL-3.0) с лицензией и ссылкой на исходники, обложка шахмат.

Почему дерево устроено именно так, объясняет Библия проекта: замеры, правила импортов, выбор языков. Она есть на пяти языках: [Русский](../../COSMO_GAME_HUB_BIBLE.md#russian) · [English](../../COSMO_GAME_HUB_BIBLE.md#english) · [עברית](../../COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](../../COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](../../COSMO_GAME_HUB_BIBLE.md#french).

---

<a name="hebrew"></a>

<div dir="rtl">

## עברית

אתר ה-Astro של Cosmo Game Hub. תיאור הפרויקט, היכולות והקרדיטים נמצאים ב-[README הראשי](../../README.md).

### פקודות

מריצים אותן מתיקיית השורש של המאגר:

| פקודה | פעולה |
| :-- | :-- |
| `npm install` | מתקינה את התלויות של כל ה-workspaces |
| `npm run dev --workspace client` | מפעילה את שרת הפיתוח בכתובת http://localhost:4321/cosmo-game-hub/ |
| `npm run build --workspace client` | בונה את האתר הסטטי לתוך `apps/client/dist` |
| `npm run preview --workspace client` | מגישה את האתר הבנוי מקומית |
| `npm test` | מריצה את כל הבדיקות שבתיקיות `tests` עם מריץ הבדיקות המובנה של Node |

### תיקיות

- נתיבים (`src/pages`): דף הבית, אוסף המשחקים, דף לכל משחק, טבלת המובילים, אודות. דף משחק רק ממקם את המשחק שלו.
- המעטפת (`src/shell`): האתר שמסביב למשחקים — פריסה, כותרת עליונה ותחתונה, כרטיסי משחקים, נתוני הקטלוג, פונקציית הקישורים `withBase`.
- קוד משותף (`src/shared`): קוד ששני משחקים או יותר משתמשים בו — מסך סיום המשחק, מחולל אקראיות לפי זרע, משחקים שמורים.
- תיקיית משחק (למשל `src/games/chess`): כל מה ששייך למשחק אחד — רכיבים, hooks, מנוע, קבצי מדיה, בדיקות ו-README.
- קבצים בכתובת קבועה (`public/games/chess`): מנוע Stockfish ‏(GPL-3.0) עם הרישיון והקישור לקוד המקור, ותמונת השער של השחמט.

המדריך הטכני של הפרויקט (Bible) מסביר למה העץ בנוי כך: מדידות, כללי ייבוא ובחירת השפות. הוא זמין בחמש שפות: [Русский](../../COSMO_GAME_HUB_BIBLE.md#russian) · [English](../../COSMO_GAME_HUB_BIBLE.md#english) · [עברית](../../COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](../../COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](../../COSMO_GAME_HUB_BIBLE.md#french).

</div>

---

<a name="spanish"></a>

## Español

El sitio Astro de Cosmo Game Hub. La descripción del proyecto, las funciones y los créditos están en el [README principal](../../README.md).

### Comandos

Ejecútalos desde la raíz del repositorio:

| Comando | Acción |
| :-- | :-- |
| `npm install` | Instala las dependencias de todos los workspaces |
| `npm run dev --workspace client` | Inicia el servidor de desarrollo en http://localhost:4321/cosmo-game-hub/ |
| `npm run build --workspace client` | Compila el sitio estático en `apps/client/dist/` |
| `npm run preview --workspace client` | Sirve localmente el sitio compilado |
| `npm test` | Ejecuta todas las pruebas de `apps/client/src/**/tests` con el ejecutor de pruebas integrado de Node |

### Carpetas

- `src/pages/` — rutas: inicio, colección de juegos, una página por juego, clasificación, «About». La página de un juego solo coloca su juego.
- `src/shell/` — el sitio alrededor de los juegos: plantilla, cabecera, pie de página, tarjetas de juegos, datos del catálogo, el ayudante de enlaces `withBase`.
- `src/shared/` — código que usan dos o más juegos: la pantalla de fin de partida, el generador aleatorio con semilla, las partidas guardadas.
- `src/games/<juego>/` — todo lo de un juego: `components/`, `hooks/`, `engine/`, `assets/`, `tests/`, `README.md`.
- `public/games/chess/` — el motor Stockfish (GPL-3.0) con su licencia y el enlace al código fuente, y la portada del ajedrez.

La Biblia del proyecto explica por qué el árbol es así: mediciones, reglas de importación y elección de lenguajes. Está disponible en [Русский](../../COSMO_GAME_HUB_BIBLE.md#russian) · [English](../../COSMO_GAME_HUB_BIBLE.md#english) · [עברית](../../COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](../../COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](../../COSMO_GAME_HUB_BIBLE.md#french).

---

<a name="french"></a>

## Français

Le site Astro de Cosmo Game Hub. La description du projet, les fonctionnalités et les crédits se trouvent dans le [README principal](../../README.md).

### Commandes

À lancer depuis la racine du dépôt :

| Commande | Action |
| :-- | :-- |
| `npm install` | Installe les dépendances de tous les workspaces |
| `npm run dev --workspace client` | Lance le serveur de développement sur http://localhost:4321/cosmo-game-hub/ |
| `npm run build --workspace client` | Construit le site statique dans `apps/client/dist/` |
| `npm run preview --workspace client` | Sert localement le site construit |
| `npm test` | Lance tous les tests de `apps/client/src/**/tests` avec l'exécuteur de tests intégré de Node |

### Dossiers

- `src/pages/` — routes : accueil, collection de jeux, une page par jeu, classement, « About ». La page d'un jeu ne fait que placer son jeu.
- `src/shell/` — le site autour des jeux : mise en page, en-tête, pied de page, cartes de jeux, données du catalogue, l'assistant de liens `withBase`.
- `src/shared/` — le code utilisé par deux jeux ou plus : l'écran de fin de partie, le générateur aléatoire à graine, les parties sauvegardées.
- `src/games/<jeu>/` — tout ce qui concerne un jeu : `components/`, `hooks/`, `engine/`, `assets/`, `tests/`, `README.md`.
- `public/games/chess/` — le moteur Stockfish (GPL-3.0) avec sa licence et le lien vers le code source, ainsi que la couverture des échecs.

La Bible du projet explique pourquoi l'arbre est construit ainsi : mesures, règles d'import et choix des langages. Elle existe en [Русский](../../COSMO_GAME_HUB_BIBLE.md#russian) · [English](../../COSMO_GAME_HUB_BIBLE.md#english) · [עברית](../../COSMO_GAME_HUB_BIBLE.md#hebrew) · [Español](../../COSMO_GAME_HUB_BIBLE.md#spanish) · [Français](../../COSMO_GAME_HUB_BIBLE.md#french).
