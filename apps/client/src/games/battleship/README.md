# Sea Battle · Морской бой · צוללות · Batalla naval · Bataille navale

[English](#english) · [Русский](#russian) · [עברית](#hebrew) · [Español](#spanish) · [Français](#french)

<a name="english"></a>

## English

Battleship on the night sea of the vampire lair: your fleet against the fleet of one of the dwellers of the crypt. The rules: [RULES.md](RULES.md).

- **Two well-known games in one.** «Classic» is the notebook game: ten ships (4, 3, 3, 2, 2, 2 and four boats), ships never touch even by a corner, a hit gives another shot. «Boxed game» is the game sold in a box: five ships (5, 4, 3, 3, 2), ships may lie side by side, one shot per turn. Two switches on the menu mix them.
- **A hero of the lair as the opponent.** One of the shared heroes of the hub is drawn by lot; «Another opponent» draws again. The portrait grows under the mouse, a press opens the hero's card.
- **Three levels of gunnery, all fair.** The gunner sees only what a person sees: the marks on the sea and which ships are still afloat. «Like a cabin boy» shoots at random and now and then forgets a wounded ship; «like a navigator» combs the sea in a pattern no ship slips through and finishes a ship along its line; «like an admiral» counts where a ship is likeliest to lie and hides its own fleet more cunningly.
- **The fleet is set out by finger and by mouse alike.** A random fleet waits on the sea, so «To battle!» works at once. A press on a ship takes it into the hand, a press on the sea puts it down, «Turn» (or the key R) changes its direction; a mouse also sees in green or red where the ship would stand.
- **A phone is not a small computer.** On a phone the buttons of the fleet lie right under the sea; in a battle the opponent's sea is full width and your own sea is a smaller chart under it, so both are seen without scrolling. On a wide screen the seas lie side by side like a notebook sheet.
- **Saved after every shot**, with the «Save» button and when the page hides; «Continue the battle» on the menu.
- **Five languages** (RU, EN, HE, ES, FR). The letters of the columns follow the language: А–К without Ё and Й in Russian, A–J in Latin, א–י in Hebrew; the chart itself keeps column А on the left in Hebrew too.

**Inside.** `engine/` is pure TypeScript without React: `rules.ts` (the two rule sets as data), `board.ts` (ships, placement, shots, the marks of a sea), `battle.ts` (whose turn it is, the log, the winner), `ai/gunner.ts` (the three gunners). `hooks/useBattleship.ts` runs the battle and its save, `components/` draws it (`SeaBoard` is one sea: every cell is a button with a spoken name), `i18n/` holds the five languages. Tests: `tests/*.test.ts` (`npm test`); checks in a browser: `scripts/load/battleship-touch.mjs` (a whole battle by finger or by mouse) and `layout-audit.mjs --game battleship` (the layout in five languages).

[↑ Languages](#sea-battle--морской-бой--צוללות--batalla-naval--bataille-navale)

---

<a name="russian"></a>

## Русский

Морской бой на ночном море вампирского логова: ваш флот против флота одного из обитателей склепа. Правила: [RULES.md](RULES.md).

- **Две известные игры в одной.** «Классика» — тетрадная игра: десять кораблей (4, 3, 3, 2, 2, 2 и четыре катера), корабли не касаются даже углами, попал — стреляй ещё. «Международные» — коробочная игра: пять кораблей (5, 4, 3, 3, 2), корабли могут стоять вплотную, один выстрел за ход. Два переключателя в меню смешивают их.
- **Соперник — герой логова.** Один из общих героев хаба выбирается по жребию; «Другой соперник» тянет жребий заново. Портрет растёт под мышью, нажатие открывает карточку героя.
- **Три уровня меткости, все честные.** Наводчик видит только то, что видит человек: отметки на море и какие корабли ещё на плаву. «Как юнга» стреляет наугад и иногда забывает про раненый корабль; «как штурман» прочёсывает море по сетке, сквозь которую не проскользнёт ни один корабль, и добивает корабль по его линии; «как адмирал» считает, где кораблю лежать вероятнее всего, и свой флот прячет хитрее.
- **Флот расставляется пальцем и мышью одинаково.** Случайный флот уже ждёт на море, поэтому «В бой!» работает сразу. Нажатие на корабль берёт его в руку, нажатие на море ставит его, «Повернуть» (или клавиша R) меняет направление; мышь ещё и видит зелёным или красным, где встанет корабль.
- **Телефон — не маленький компьютер.** На телефоне кнопки расстановки лежат сразу под морем; в бою море соперника во всю ширину, а своё море — карта поменьше под ним: оба видны без прокрутки. На широком экране моря лежат рядом, как на листе тетради.
- **Сохранение после каждого выстрела**, по кнопке «Сохранить» и при сворачивании страницы; «Продолжить бой» в меню.
- **Пять языков** (RU, EN, HE, ES, FR). Буквы колонок идут за языком: А–К без Ё и Й по-русски, A–J латиницей, א–י на иврите; сама карта и на иврите держит колонку А слева.

**Внутри.** `engine/` — чистый TypeScript без React: `rules.ts` (два набора правил как данные), `board.ts` (корабли, расстановка, выстрелы, отметки моря), `battle.ts` (чей ход, журнал, победитель), `ai/gunner.ts` (три наводчика). `hooks/useBattleship.ts` ведёт бой и его сохранение, `components/` его рисуют (`SeaBoard` — одно море: каждая клетка — кнопка с названием для диктора), в `i18n/` пять языков. Тесты: `tests/*.test.ts` (`npm test`); проверки в браузере: `scripts/load/battleship-touch.mjs` (целый бой пальцем или мышью) и `layout-audit.mjs --game battleship` (вёрстка на пяти языках).

[↑ К выбору языка](#sea-battle--морской-бой--צוללות--batalla-naval--bataille-navale)

---

<a name="hebrew"></a>

<div dir="rtl">

## עברית

צוללות בים הלילי של מאורת הערפדים: הצי שלכם מול הצי של אחד מדיירי המרתף. החוקים: [RULES.md](RULES.md).

- **שני משחקים מוכרים באחד.** "קלאסי" הוא משחק המחברת: עשר ספינות (4, ‏3, ‏3, ‏2, ‏2, ‏2 וארבע סירות), ספינות אינן נוגעות זו בזו גם לא בפינה, פגיעה נותנת ירייה נוספת. "משחק הקופסה" הוא המשחק שנמכר בקופסה: חמש ספינות (5, ‏4, ‏3, ‏3, ‏2), ספינות יכולות לעמוד צמודות, ירייה אחת בתור. שני מתגים בתפריט מערבבים ביניהם.
- **היריב הוא גיבור מהמאורה.** אחד מהגיבורים המשותפים של האתר נבחר בהגרלה; "יריב אחר" מגריל שוב. הדיוקן גדל מתחת לעכבר, ולחיצה פותחת את כרטיס הגיבור.
- **שלוש רמות קליעה, כולן הוגנות.** התותחן רואה רק מה שאדם רואה: הסימנים על הים ואילו ספינות עדיין צפות. "כמו נער סיפון" יורה באקראי ולפעמים שוכח ספינה פגועה; "כמו נווט" סורק את הים בתבנית ששום ספינה לא חומקת דרכה ומחסל ספינה לאורך הקו שלה; "כמו אדמירל" מחשב היכן הכי סביר שספינה שוכבת, ומסתיר את הצי שלו בעורמה רבה יותר.
- **הצי מוצב באצבע ובעכבר באותה מידה.** צי אקראי כבר מחכה על הים, ולכן "לקרב!" עובד מיד. לחיצה על ספינה לוקחת אותה ליד, לחיצה על הים מניחה אותה, "לסובב" (או המקש R) משנה את הכיוון; העכבר גם רואה בירוק או באדום היכן הספינה תעמוד.
- **טלפון אינו מחשב קטן.** בטלפון כפתורי ההצבה נמצאים מיד מתחת לים; בקרב הים של היריב ברוחב מלא והים שלכם הוא מפה קטנה יותר מתחתיו, כך ששניהם נראים בלי גלילה. במסך רחב הימים שוכבים זה לצד זה כמו בדף מחברת.
- **נשמר אחרי כל ירייה**, בכפתור "לשמור" וכשהדף מוסתר; "להמשיך בקרב" בתפריט.
- **חמש שפות** (RU, EN, HE, ES, FR). אותיות העמודות הולכות אחרי השפה: А–К ברוסית, A–J בלטינית, א–י בעברית; המפה עצמה שומרת גם בעברית את העמודה הראשונה משמאל.

**בפנים.** `engine/` הוא TypeScript טהור בלי React: ‏`rules.ts` (שתי מערכות החוקים כנתונים), `board.ts` (ספינות, הצבה, יריות, סימני הים), `battle.ts` (תור מי, היומן, המנצח), `ai/gunner.ts` (שלושת התותחנים). `hooks/useBattleship.ts` מנהל את הקרב ואת השמירה שלו, `components/` מציירים אותו (`SeaBoard` הוא ים אחד: כל משבצת היא כפתור עם שם לקורא מסך), ב-`i18n/` חמש השפות. בדיקות: `tests/*.test.ts` (`npm test`); בדיקות בדפדפן: `scripts/load/battleship-touch.mjs` (קרב שלם באצבע או בעכבר) ו-`layout-audit.mjs --game battleship` (הפריסה בחמש שפות).

[↑ לבחירת שפה](#sea-battle--морской-бой--צוללות--batalla-naval--bataille-navale)

</div>

---

<a name="spanish"></a>

## Español

Batalla naval en el mar nocturno de la guarida de vampiros: tu flota contra la flota de uno de los habitantes de la cripta. Las reglas: [RULES.md](RULES.md).

- **Dos juegos conocidos en uno.** «Clásica» es el juego de cuaderno: diez barcos (4, 3, 3, 2, 2, 2 y cuatro lanchas), los barcos no se tocan ni por una esquina, un acierto da otro disparo. «Juego de caja» es el que se vende en caja: cinco barcos (5, 4, 3, 3, 2), los barcos pueden estar pegados, un disparo por turno. Dos interruptores del menú los mezclan.
- **Un héroe de la guarida como rival.** Se sortea uno de los héroes comunes del sitio; «Otro rival» vuelve a sortear. El retrato crece bajo el ratón y una pulsación abre la ficha del héroe.
- **Tres niveles de puntería, todos limpios.** El artillero ve solo lo que ve una persona: las marcas en el mar y qué barcos siguen a flote. «Como un grumete» dispara al azar y a veces olvida un barco tocado; «como un piloto» peina el mar con un patrón por el que no se escapa ningún barco y remata un barco a lo largo de su línea; «como un almirante» calcula dónde es más probable que haya un barco y esconde su propia flota con más astucia.
- **La flota se coloca igual con el dedo que con el ratón.** Una flota al azar ya espera en el mar, así que «¡Al combate!» funciona enseguida. Pulsar un barco lo toma en la mano, pulsar el mar lo coloca, «Girar» (o la tecla R) cambia su dirección; el ratón además ve en verde o en rojo dónde quedaría el barco.
- **Un teléfono no es un ordenador pequeño.** En el teléfono los botones de la flota están justo debajo del mar; en combate el mar del rival ocupa todo el ancho y el tuyo es una carta más pequeña debajo, de modo que ambos se ven sin desplazarse. En una pantalla ancha los mares están uno junto al otro, como en una hoja de cuaderno.
- **Se guarda tras cada disparo**, con el botón «Guardar» y cuando la página se oculta; «Continuar la batalla» en el menú.
- **Cinco idiomas** (RU, EN, HE, ES, FR). Las letras de las columnas siguen al idioma: А–К en ruso, A–J en latín, א–י en hebreo; la carta mantiene la primera columna a la izquierda también en hebreo.

**Por dentro.** `engine/` es TypeScript puro sin React: `rules.ts` (los dos reglamentos como datos), `board.ts` (barcos, colocación, disparos, marcas del mar), `battle.ts` (de quién es el turno, el registro, el ganador), `ai/gunner.ts` (los tres artilleros). `hooks/useBattleship.ts` lleva el combate y su guardado, `components/` lo dibujan (`SeaBoard` es un mar: cada casilla es un botón con nombre para el lector de pantalla), `i18n/` contiene los cinco idiomas. Pruebas: `tests/*.test.ts` (`npm test`); comprobaciones en el navegador: `scripts/load/battleship-touch.mjs` (un combate entero con el dedo o con el ratón) y `layout-audit.mjs --game battleship` (la maquetación en cinco idiomas).

[↑ Idiomas](#sea-battle--морской-бой--צוללות--batalla-naval--bataille-navale)

---

<a name="french"></a>

## Français

Bataille navale sur la mer nocturne du repaire de vampires : votre flotte contre celle d’un des habitants de la crypte. Les règles : [RULES.md](RULES.md).

- **Deux jeux connus en un.** « Classique », c’est le jeu de cahier : dix navires (4, 3, 3, 2, 2, 2 et quatre vedettes), les navires ne se touchent jamais, même par un coin, un coup au but donne un autre tir. « Jeu de boîte », c’est celui vendu en boîte : cinq navires (5, 4, 3, 3, 2), les navires peuvent être côte à côte, un tir par tour. Deux interrupteurs du menu les mélangent.
- **Un héros du repaire pour adversaire.** L’un des héros communs du site est tiré au sort ; « Un autre adversaire » tire de nouveau. Le portrait grandit sous la souris, un appui ouvre la fiche du héros.
- **Trois niveaux de tir, tous honnêtes.** Le canonnier ne voit que ce que voit une personne : les marques sur la mer et les navires encore à flot. « Comme un mousse » tire au hasard et oublie parfois un navire touché ; « comme un navigateur » ratisse la mer selon un motif qu’aucun navire ne traverse et achève un navire le long de sa ligne ; « comme un amiral » calcule où un navire a le plus de chances de se trouver et cache sa propre flotte avec plus de ruse.
- **La flotte se dispose au doigt comme à la souris.** Une flotte au hasard attend déjà sur la mer : « Au combat ! » fonctionne aussitôt. Un appui sur un navire le prend en main, un appui sur la mer le pose, « Tourner » (ou la touche R) change sa direction ; la souris voit en plus, en vert ou en rouge, où le navire se placerait.
- **Un téléphone n’est pas un petit ordinateur.** Sur un téléphone, les boutons de la flotte sont juste sous la mer ; au combat, la mer de l’adversaire prend toute la largeur et la vôtre est une carte plus petite en dessous : les deux se voient sans défilement. Sur un écran large, les mers sont côte à côte, comme sur une feuille de cahier.
- **Enregistré après chaque tir**, avec le bouton « Enregistrer » et quand la page se cache ; « Continuer la bataille » dans le menu.
- **Cinq langues** (RU, EN, HE, ES, FR). Les lettres des colonnes suivent la langue : А–К en russe, A–J en latin, א–י en hébreu ; la carte garde la première colonne à gauche, même en hébreu.

**À l’intérieur.** `engine/` est du TypeScript pur sans React : `rules.ts` (les deux règlements comme données), `board.ts` (navires, placement, tirs, marques de la mer), `battle.ts` (à qui le tour, le journal, le vainqueur), `ai/gunner.ts` (les trois canonniers). `hooks/useBattleship.ts` mène le combat et sa sauvegarde, `components/` le dessinent (`SeaBoard` est une mer : chaque case est un bouton avec un nom pour le lecteur d’écran), `i18n/` contient les cinq langues. Tests : `tests/*.test.ts` (`npm test`) ; vérifications dans le navigateur : `scripts/load/battleship-touch.mjs` (un combat entier au doigt ou à la souris) et `layout-audit.mjs --game battleship` (la mise en page en cinq langues).

[↑ Langues](#sea-battle--морской-бой--צוללות--batalla-naval--bataille-navale)
