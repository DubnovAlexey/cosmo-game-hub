# Checkers · Шашки · דמקה · Damas · Dames

[English](#english) · [Русский](#russian) · [עברית](#hebrew) · [Español](#spanish) · [Français](#french)

<a name="english"></a>

## English

Draughts on the cracked marble of the vampire lair: your men against the men of one of the dwellers of the crypt. The rules: [RULES.md](RULES.md).

- **Two well-known games in one.** «Russian draughts»: white moves first, a man captures backward too, a king flies any distance along a diagonal, a man crowned in the middle of a capture goes on as a king. «English checkers»: black moves first, a man captures only forward, a king steps one square at a time. In both, capturing is compulsory and a series of captures goes on to its end.
- **A hero of the lair as the opponent.** One of the 116 shared heroes of the hub is drawn by lot; «Another opponent» draws again; every second game is played against the board folk — the five necromancers of the catacombs and the sixteen players of the scenes, each pictured at a board. A game against one of those players ends with their own scene. The portrait grows under the mouse, a press opens the hero's card.
- **Three levels, all fair.** The opponent sees only the board. It looks ahead with alpha-beta search, deepening step by step until its time is up, and always counts an exchange to its end. «Like a beginner» sees one move ahead and now and then drops a man; «like a club player» counts two moves ahead; «like a grandmaster» counts as deep as a second allows. It thinks in a Web Worker, so the board never freezes.
- **A move is entered by finger and by mouse alike.** The men that may move glow; press one, then the square it goes to. A capture of several pieces is entered square by square (the jumped pieces are crossed out until the move ends), or by its last square at once when only one way leads there. «Take the move back» and «Resign» (two presses) are beside the board.
- **A phone is not a small computer.** On a phone the board takes the whole width, every square is large enough for a finger, the men and the log are under it. On a wide screen the board stands right under the header — whole on a laptop's screen — with the opponent, the men and the log beside it.
- **The pictures are Alexey's** (his folder «Шашки»): the cover is his favourite — a dead warrior and a nosferatu over a bloodied board; a victory shows the vampire lady over her men, a defeat the dead knight across the board — always whole. The twenty-one new heroes are from the same folder.
- **Saved after every move**, with the «Save» button and when the page hides; «Continue the game» on the menu.
- **Five languages** (RU, EN, HE, ES, FR). The squares are named the same in every language (a1–h8); the board keeps column a on the left in Hebrew too.

**Inside.** `engine/` is pure TypeScript without React: `rules.ts` (the two rule sets as data), `board.ts` (the board, the legal moves, a whole game, the draws, taking back), `ai/search.ts` (the opponent), `worker.ts` (the opponent in a Web Worker). `hooks/useCheckers.ts` runs the game and its save, `components/` draw it (`CheckersBoard`: every square is a button with a spoken name, placed by its column and row in the grid), `i18n/` holds the five languages. Tests: `tests/*.test.ts` (`npm test`); checks in a browser: `scripts/load/checkers-touch.mjs` (a whole game by finger or by mouse) and `layout-audit.mjs --game checkers` (the layout in five languages).

[↑ Languages](#checkers--шашки--דמקה--damas--dames)

---

<a name="russian"></a>

## Русский

Шашки на треснувшем мраморе вампирского логова: ваши шашки против шашек одного из обитателей склепа. Правила: [RULES.md](RULES.md).

- **Две известные игры в одной.** «Русские шашки»: первыми ходят белые, шашка бьёт и назад, дамка летает на любое расстояние по диагонали, шашка, ставшая дамкой посреди взятия, бьёт дальше уже как дамка. «Английские шашки»: первыми ходят чёрные, шашка бьёт только вперёд, дамка ходит на одно поле. В обеих бить обязательно, а серия взятий идёт до конца.
- **Соперник — герой логова.** Один из 116 общих героев хаба выбирается по жребию; «Другой соперник» тянет жребий заново; каждая вторая партия — против народа доски: пятерых некромантов катакомб и шестнадцати игроков со сцен, каждый из которых нарисован за доской. Партия против такого игрока кончается его собственной сценой. Портрет растёт под мышью, нажатие открывает карточку героя.
- **Три уровня, все честные.** Соперник видит только доску. Он смотрит вперёд перебором с альфа-бета отсечением, углубляясь шаг за шагом, пока есть время, и всегда досчитывает размен до конца. «Как новичок» видит на ход вперёд и иногда зевает шашку; «как разрядник» считает на два хода вперёд; «как гроссмейстер» считает так глубоко, как позволяет секунда. Думает он в фоновом потоке (Web Worker), поэтому доска никогда не замирает.
- **Ход вводится пальцем и мышью одинаково.** Шашки, которые могут ходить, светятся; нажмите одну, затем поле, куда она пойдёт. Взятие нескольких шашек вводится поле за полем (перепрыгнутые шашки перечёркнуты до конца хода) или сразу последним полем, если туда ведёт только один путь. «Взять ход назад» и «Сдаться» (два нажатия) — рядом с доской.
- **Телефон — не маленький компьютер.** На телефоне доска во всю ширину, каждое поле достаточно большое для пальца, шашки и ход партии — под ней. На широком экране доска стоит сразу под шапкой — целиком на экране ноутбука, — а соперник, шашки и ход партии рядом.
- **Картинки — Алексея** (его папка «Шашки»): на обложке его любимая — мёртвый воин и носферату над окровавленной доской; победа — вампирша над своими шашками, поражение — мёртвый рыцарь через доску, всегда целиком. Двадцать один новый герой — из той же папки.
- **Сохранение после каждого хода**, по кнопке «Сохранить» и при сворачивании страницы; «Продолжить партию» в меню.
- **Пять языков** (RU, EN, HE, ES, FR). Поля называются одинаково на всех языках (a1–h8); доска и на иврите держит колонку a слева.

**Внутри.** `engine/` — чистый TypeScript без React: `rules.ts` (два набора правил как данные), `board.ts` (доска, правильные ходы, целая партия, ничьи, возврат хода), `ai/search.ts` (соперник), `worker.ts` (соперник в фоновом потоке). `hooks/useCheckers.ts` ведёт партию и её сохранение, `components/` её рисуют (`CheckersBoard`: каждое поле — кнопка с названием для диктора, поставленная в сетку своей колонкой и рядом), в `i18n/` пять языков. Тесты: `tests/*.test.ts` (`npm test`); проверки в браузере: `scripts/load/checkers-touch.mjs` (целая партия пальцем или мышью) и `layout-audit.mjs --game checkers` (вёрстка на пяти языках).

[↑ К выбору языка](#checkers--шашки--דמקה--damas--dames)

---

<a name="hebrew"></a>

<div dir="rtl">

## עברית

דמקה על השיש הסדוק של מאורת הערפדים: האבנים שלכם מול האבנים של אחד מדיירי הקריפטה. החוקים: [RULES.md](RULES.md).

- **שני משחקים מוכרים באחד.** "דמקה רוסית": הלבנות מתחילות, אבן אוכלת גם אחורה, מלך עף לכל מרחק לאורך האלכסון, ואבן שהוכתרה באמצע אכילה ממשיכה לאכול כמלך. "דמקה אנגלית": השחורות מתחילות, אבן אוכלת רק קדימה, מלך זז משבצת אחת. בשתיהן חובה לאכול, וסדרת אכילות נמשכת עד סופה.
- **היריב הוא גיבור מהמאורה.** אחד מ־116 הגיבורים המשותפים של האתר נבחר בהגרלה; "יריב אחר" מגריל שוב; כל משחק שני הוא נגד אנשי הלוח — חמשת הנקרומנטים מהקטקומבות ושישה־עשר השחקנים מהסצנות, שכל אחד מהם מצויר ליד לוח. משחק נגד שחקן כזה נגמר בסצנה שלו. הדיוקן גדל מתחת לעכבר, ולחיצה פותחת את כרטיס הגיבור.
- **שלוש רמות, כולן הוגנות.** היריב רואה רק את הלוח. הוא מחשב קדימה בחיפוש אלפא־בטא, מעמיק צעד אחר צעד כל עוד יש זמן, ותמיד מחשב חילוף עד סופו. "כמו מתחיל" רואה מהלך אחד קדימה ולפעמים מפקיר אבן; "כמו שחקן מועדון" מחשב שני מהלכים קדימה; "כמו רב־אמן" מחשב עמוק ככל ששנייה מאפשרת. הוא חושב ב־Web Worker, ולכן הלוח אף פעם לא קופא.
- **מהלך מוזן באצבע ובעכבר באותה מידה.** האבנים שיכולות לזוז זוהרות; לוחצים על אחת ואז על המשבצת שאליה היא תזוז. אכילה של כמה אבנים מוזנת משבצת אחר משבצת (האבנים שנקפצו מסומנות בקו עד סוף המהלך), או מיד במשבצת האחרונה אם מובילה אליה רק דרך אחת. "לבטל מהלך" ו"להיכנע" (שתי לחיצות) נמצאים ליד הלוח.
- **טלפון אינו מחשב קטן.** בטלפון הלוח ברוחב מלא, כל משבצת גדולה מספיק לאצבע, והאבנים ומהלך המשחק מתחתיו. במסך רחב הלוח עומד מיד מתחת לכותרת — בשלמותו על מסך של מחשב נייד — והיריב, האבנים ומהלך המשחק לצידו.
- **התמונות של אלכסיי** (התיקייה שלו «Шашки»): על הכריכה התמונה האהובה עליו — לוחם מת ונוספרטו מעל לוח מוכתם בדם; ניצחון מראה את הערפדית מעל האבנים שלה, הפסד — את האביר המת מעבר ללוח, תמיד בשלמותן. עשרים ואחד הגיבורים החדשים מאותה תיקייה.
- **נשמר אחרי כל מהלך**, בכפתור "שמירה" וכשהדף מוסתר; "להמשיך את המשחק" בתפריט.
- **חמש שפות** (RU, EN, HE, ES, FR). המשבצות נקראות באותו שם בכל השפות (a1–h8); הלוח שומר גם בעברית את העמודה a משמאל.

**בפנים.** `engine/` הוא TypeScript טהור בלי React: ‏`rules.ts` (שתי מערכות החוקים כנתונים), `board.ts` (הלוח, המהלכים החוקיים, משחק שלם, התיקו, ביטול מהלך), `ai/search.ts` (היריב), `worker.ts` (היריב ב־Web Worker). `hooks/useCheckers.ts` מנהל את המשחק ואת השמירה שלו, `components/` מציירים אותו (`CheckersBoard`: כל משבצת היא כפתור עם שם לקורא מסך, שמוצב ברשת לפי העמודה והשורה שלו), ב-`i18n/` חמש השפות. בדיקות: `tests/*.test.ts` (`npm test`); בדיקות בדפדפן: `scripts/load/checkers-touch.mjs` (משחק שלם באצבע או בעכבר) ו-`layout-audit.mjs --game checkers` (הפריסה בחמש שפות).

[↑ לבחירת שפה](#checkers--шашки--דמקה--damas--dames)

</div>

---

<a name="spanish"></a>

## Español

Damas sobre el mármol agrietado de la guarida de vampiros: tus fichas contra las de uno de los habitantes de la cripta. Las reglas: [RULES.md](RULES.md).

- **Dos juegos conocidos en uno.** «Damas rusas»: empiezan las blancas, la ficha también come hacia atrás, la dama vuela a cualquier distancia en diagonal y una ficha coronada en medio de una captura sigue comiendo como dama. «Damas inglesas»: empiezan las negras, la ficha come solo hacia delante, la dama avanza de una casilla en una. En ambas comer es obligatorio y una serie de capturas sigue hasta el final.
- **Un héroe de la guarida como rival.** Se sortea uno de los 116 héroes comunes del sitio; «Otro rival» vuelve a sortear; una de cada dos partidas es contra la gente del tablero: los cinco nigromantes de las catacumbas y los dieciséis jugadores de las escenas, cada uno pintado ante un tablero. Una partida contra uno de ellos termina con su propia escena. El retrato crece bajo el ratón y una pulsación abre la ficha del héroe.
- **Tres niveles, todos limpios.** El rival solo ve el tablero. Calcula con búsqueda alfa-beta, profundizando paso a paso mientras le quede tiempo, y siempre calcula un cambio hasta el final. «Como un novato» ve una jugada por delante y a veces regala una ficha; «como un jugador de club» calcula dos jugadas por delante; «como un gran maestro» calcula tan hondo como le deja un segundo. Piensa en un Web Worker, así que el tablero nunca se congela.
- **Se juega igual con el dedo que con el ratón.** Las fichas que pueden moverse brillan; pulsa una y luego la casilla adonde irá. Una captura de varias piezas se marca casilla a casilla (las piezas saltadas quedan tachadas hasta el final de la jugada) o directamente por su última casilla si solo un camino lleva hasta ella. «Deshacer la jugada» y «Rendirse» (dos pulsaciones) están junto al tablero.
- **Un teléfono no es un ordenador pequeño.** En el teléfono el tablero ocupa todo el ancho, cada casilla es lo bastante grande para un dedo y las fichas y la partida quedan debajo. En una pantalla ancha el tablero está justo bajo la cabecera, entero en la pantalla de un portátil, con el rival, las fichas y la partida al lado.
- **Las imágenes son de Alexey** (su carpeta «Шашки»): en la portada, su favorita: un guerrero muerto y un nosferatu sobre un tablero ensangrentado; la victoria muestra a la dama vampira sobre sus fichas y la derrota al caballero muerto al otro lado del tablero, siempre enteras. Los veintiún héroes nuevos vienen de la misma carpeta.
- **Se guarda tras cada jugada**, con el botón «Guardar» y cuando la página se oculta; «Continuar la partida» en el menú.
- **Cinco idiomas** (RU, EN, HE, ES, FR). Las casillas se llaman igual en todos los idiomas (a1–h8); el tablero mantiene la columna a a la izquierda también en hebreo.

**Por dentro.** `engine/` es TypeScript puro sin React: `rules.ts` (los dos reglamentos como datos), `board.ts` (el tablero, las jugadas legales, una partida entera, las tablas, deshacer), `ai/search.ts` (el rival), `worker.ts` (el rival en un Web Worker). `hooks/useCheckers.ts` lleva la partida y su guardado, `components/` la dibujan (`CheckersBoard`: cada casilla es un botón con nombre para el lector de pantalla, colocado en la cuadrícula por su columna y su fila), `i18n/` contiene los cinco idiomas. Pruebas: `tests/*.test.ts` (`npm test`); comprobaciones en el navegador: `scripts/load/checkers-touch.mjs` (una partida entera con el dedo o con el ratón) y `layout-audit.mjs --game checkers` (la maquetación en cinco idiomas).

[↑ Idiomas](#checkers--шашки--דמקה--damas--dames)

---

<a name="french"></a>

## Français

Les dames sur le marbre fendu du repaire de vampires : vos pions contre ceux d’un des habitants de la crypte. Les règles : [RULES.md](RULES.md).

- **Deux jeux connus en un.** « Dames russes » : les blancs commencent, le pion prend aussi en arrière, la dame vole à n’importe quelle distance sur la diagonale, et un pion promu au milieu d’une prise continue en dame. « Dames anglaises » : les noirs commencent, le pion ne prend qu’en avant, la dame avance d’une case à la fois. Dans les deux, la prise est obligatoire et une rafle va jusqu’au bout.
- **Un héros du repaire pour adversaire.** L’un des 116 héros communs du site est tiré au sort ; « Un autre adversaire » tire de nouveau ; une partie sur deux se joue contre les gens du damier : les cinq nécromanciens des catacombes et les seize joueurs des scènes, chacun peint devant un damier. Une partie contre l’un d’eux se termine sur sa propre scène. Le portrait grandit sous la souris, un appui ouvre la fiche du héros.
- **Trois niveaux, tous honnêtes.** L’adversaire ne voit que le damier. Il calcule par recherche alpha-bêta, en approfondissant pas à pas tant qu’il a du temps, et compte toujours un échange jusqu’au bout. « Comme un débutant » voit un coup d’avance et laisse parfois filer un pion ; « comme un joueur de club » calcule deux coups d’avance ; « comme un grand maître » calcule aussi loin qu’une seconde le permet. Il réfléchit dans un Web Worker : le damier ne se fige jamais.
- **Un coup se joue au doigt comme à la souris.** Les pions qui peuvent bouger brillent ; touchez-en un, puis la case où il va. Une prise de plusieurs pièces se joue case après case (les pièces sautées sont barrées jusqu’à la fin du coup) ou directement par sa dernière case si un seul chemin y mène. « Reprendre le coup » et « Abandonner » (deux appuis) sont à côté du damier.
- **Un téléphone n’est pas un petit ordinateur.** Sur un téléphone, le damier prend toute la largeur, chaque case est assez grande pour un doigt, les pions et le fil de la partie sont dessous. Sur un écran large, le damier se tient juste sous l’en-tête, entier sur l’écran d’un portable, avec l’adversaire, les pions et le fil de la partie à côté.
- **Les images sont d’Alexey** (son dossier « Шашки ») : sur la couverture, sa préférée : un guerrier mort et un nosferatu au-dessus d’un damier ensanglanté ; la victoire montre la dame vampire au-dessus de ses pions, la défaite le chevalier mort de l’autre côté du damier, toujours entières. Les vingt et un nouveaux héros viennent du même dossier.
- **Enregistré après chaque coup**, avec le bouton « Enregistrer » et quand la page se cache ; « Reprendre la partie » dans le menu.
- **Cinq langues** (RU, EN, HE, ES, FR). Les cases portent le même nom dans toutes les langues (a1–h8) ; le damier garde la colonne a à gauche, même en hébreu.

**À l’intérieur.** `engine/` est du TypeScript pur sans React : `rules.ts` (les deux règlements comme données), `board.ts` (le damier, les coups légaux, une partie entière, les nulles, la reprise d’un coup), `ai/search.ts` (l’adversaire), `worker.ts` (l’adversaire dans un Web Worker). `hooks/useCheckers.ts` mène la partie et sa sauvegarde, `components/` la dessinent (`CheckersBoard` : chaque case est un bouton avec un nom pour le lecteur d’écran, placé dans la grille par sa colonne et sa rangée), `i18n/` contient les cinq langues. Tests : `tests/*.test.ts` (`npm test`) ; vérifications dans le navigateur : `scripts/load/checkers-touch.mjs` (une partie entière au doigt ou à la souris) et `layout-audit.mjs --game checkers` (la mise en page en cinq langues).

[↑ Langues](#checkers--шашки--דמקה--damas--dames)
