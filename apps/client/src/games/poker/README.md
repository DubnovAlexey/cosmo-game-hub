# Poker · Покер · פוקר · Póker · Poker

[English](#english) · [Русский](#russian) · [עברית](#hebrew) · [Español](#spanish) · [Français](#french)

<a name="english"></a>

## English

No-limit Texas hold'em at the poker table of the vampire lair: a sit-and-go of two to six players, you against the regulars of the crypt. Play chips only — a game and a lesson in probability, never a bet for money. The rules: [RULES.md](RULES.md).

- **A real tournament.** Equal stacks (1 000, 1 500 or 3 000), blinds that rise every 15, 10 or 6 hands, antes from 100/200; it goes on until one player holds every chip. Your place is written into the results.
- **Casino rules.** Heads-up the button posts the small blind; a raise is at least the last full raise; an all-in for less does not reopen the betting; side pots, an uncalled bet coming back, the odd chip to the first winner left of the button; the board is dealt out when nobody can bet any more.
- **Ten regulars with a poker manner each.** Count Vlad the tight shark, Carmilla who bluffs with a smile, Koschei the rock, Captain Galleon the gambler, Treasurer Knuckles who pays to see every card… Tap a portrait for the tagline.
- **Fair bots.** They never read hidden cards: Monte Carlo equity against the hands the betting suggests, pot odds, raises sized like a person's, push-or-fold with a short stack. They think in a Web Worker, so the table never freezes.
- **The lair's look.** The same club as the preferans table: deep bottle-emerald felt in a lacquered rail, blackened silver on velvet, the scribe's quill, the engraved vampire skull on the card backs.
- **Finger and mouse alike.** Big buttons, a bet slider with quick sizes (½ pot, ¾ pot, pot, all); tested by touch on phones and tablets and with a mouse on a computer.
- **Saved after every action**, with the «Save» button and when the page hides; «Continue» on the menu.
- **Five languages** (RU, EN, HE, ES, FR).

**Inside.** `engine/` is pure TypeScript without React: `cards.ts` (52 cards as numbers 0…51), `evaluate.ts` (the best five of up to seven cards as one comparable number, our own code checked against all 2 598 960 five-card hands), `holdem.ts` (the table and every rule), `ai/equity.ts` and `ai/bot.ts` (the bots), `worker.ts`. `hooks/usePoker.ts` runs the tournament, `components/` draws it, `i18n/` holds the five languages, `characters.ts` the regulars. Tests: `tests/*.test.ts` (`npm test`); load checks: `scripts/load/poker-bots.mjs` and `poker-touch.mjs`.

[↑ Languages](#poker--покер--פוקר--póker--poker)

---

<a name="russian"></a>

## Русский

Безлимитный техасский холдем за покерным столом вампирского логова: турнир на выбывание от двух до шести игроков, вы против завсегдатаев склепа. Только игровые фишки — это игра и урок вероятностей, а не ставки на деньги. Правила: [RULES.md](RULES.md).

- **Настоящий турнир.** Равные стеки (1 000, 1 500 или 3 000), блайнды растут каждые 15, 10 или 6 раздач, анте с уровня 100/200; игра идёт, пока все фишки не окажутся у одного. Ваше место записывается в результаты.
- **Правила казино.** Вдвоём баттон ставит малый блайнд; рейз — не меньше последнего полного рейза; олл-ин меньше рейза не открывает торговлю заново; побочные банки, возврат неуравненной ставки, лишняя фишка — первому победителю слева от баттона; доска сдаётся до конца, когда ставить больше некому.
- **Десять завсегдатаев, у каждого своя покерная манера.** Граф Влад — плотная акула, Кармилла блефует с улыбкой, Кощей — «камень», Капитан Галеон — игрок, Казначей Костяшкин платит, чтобы посмотреть каждую карту… Нажмите на портрет — появится подпись.
- **Честные боты.** Они никогда не смотрят в чужие карты: эквити по Монте-Карло против рук, на которые указывает торговля, шансы банка, рейзы размером как у человека, «пуш или фолд» с коротким стеком. Думают в Web Worker, поэтому стол не замирает.
- **Облик логова.** Тот же клуб, что у стола преферанса: глубокое бутылочно-изумрудное сукно в лакированном борту, черненое серебро на бархате, перо писаря, гравированный череп вампира на рубашках.
- **Палец и мышь на равных.** Крупные кнопки, ползунок ставки с быстрыми размерами (½ банка, ¾ банка, банк, всё); проверено касаниями на телефонах и планшетах и мышью на компьютере.
- **Сохранение после каждого действия**, по кнопке «Сохранить» и при сворачивании страницы; «Продолжить» в меню.
- **Пять языков** (RU, EN, HE, ES, FR).

**Внутри.** `engine/` — чистый TypeScript без React: `cards.ts` (52 карты числами 0…51), `evaluate.ts` (лучшая пятёрка из семи карт одним числом для сравнения, свой код, проверенный на всех 2 598 960 пятикарточных руках), `holdem.ts` (стол и все правила), `ai/equity.ts` и `ai/bot.ts` (боты), `worker.ts`. `hooks/usePoker.ts` ведёт турнир, `components/` его рисуют, в `i18n/` пять языков, в `characters.ts` завсегдатаи. Тесты: `tests/*.test.ts` (`npm test`); нагрузочные проверки: `scripts/load/poker-bots.mjs` и `poker-touch.mjs`.

[↑ К выбору языка](#poker--покер--פוקר--póker--poker)

---

<a name="hebrew"></a>

<div dir="rtl">

## עברית

טקסס הולדם ללא הגבלה ליד שולחן הפוקר של מאורת הערפדים: טורניר הדחה לשניים עד שישה שחקנים, את/ה מול קבועי המרתף. רק אסימוני משחק — משחק ושיעור בהסתברות, לא הימור על כסף. החוקים: [RULES.md](RULES.md).

- **טורניר אמיתי.** ערימות שוות (1 000, ‏1 500 או 3 000), בליינדים שעולים כל 15, ‏10 או 6 ידיים, אנטה מרמה 100/200; המשחק נמשך עד שכל האסימונים אצל שחקן אחד. המקום שלך נרשם בתוצאות.
- **חוקי קזינו.** בשניים הכפתור שם את הבליינד הקטן; רייז — לפחות הרייז המלא האחרון; אול-אין קטן מרייז לא פותח מחדש את ההימורים; קופות צד, החזרת הימור שלא הושווה, האסימון העודף למנצח הראשון משמאל לכפתור; הלוח מחולק עד הסוף כשאין עוד מי שיהמר.
- **עשרה קבועים, לכל אחד סגנון פוקר משלו.** הרוזן ולאד — כריש הדוק, קרמילה מבלפת בחיוך, קושצ׳יי — "סלע", קפטן גליון — מהמר, הגזבר עצמות משלם כדי לראות כל קלף… נגיעה בדיוקן מציגה את הכיתוב.
- **בוטים הוגנים.** הם לעולם לא מציצים בקלפים נסתרים: אקוויטי במונטה קרלו מול הידיים שההימורים מרמזים עליהן, סיכויי קופה, רייזים בגודל של אדם, "פוש או פולד" עם ערימה קצרה. הם חושבים ב-Web Worker, כך שהשולחן לא קופא.
- **המראה של המאורה.** אותו מועדון כמו שולחן הפרפרנס: לבד אזמרגד בקבוק עמוק במסגרת מלוכה, כסף מושחר על קטיפה, נוצת הסופר, גולגולת ערפד חרוטה על גב הקלפים.
- **אצבע ועכבר באותה מידה.** כפתורים גדולים, מחוון הימור עם גדלים מהירים (½ קופה, ¾ קופה, קופה, הכול); נבדק בנגיעות בטלפונים ובטאבלטים ובעכבר במחשב.
- **נשמר אחרי כל פעולה**, בכפתור «לשמור» וכשהדף מוסתר; «להמשיך» בתפריט.
- **חמש שפות** (RU, EN, HE, ES, FR).

**בפנים.** `engine/` הוא TypeScript נקי בלי React: ‏`cards.ts` (52 קלפים כמספרים 0…51), ‏`evaluate.ts` (חמישיית הקלפים הטובה ביותר מתוך עד שבעה כמספר אחד להשוואה, קוד שלנו שנבדק על כל 2 598 960 ידיים של חמישה קלפים), ‏`holdem.ts` (השולחן וכל החוקים), ‏`ai/equity.ts` ו-`ai/bot.ts` (הבוטים), ‏`worker.ts`. ‏`hooks/usePoker.ts` מנהל את הטורניר, ‏`components/` מציירים אותו, ב-`i18n/` חמש השפות, ב-`characters.ts` הקבועים. בדיקות: `tests/*.test.ts` ‏(`npm test`); בדיקות עומס: `scripts/load/poker-bots.mjs` ו-`poker-touch.mjs`.

[↑ חזרה לבחירת השפה](#poker--покер--פוקר--póker--poker)

</div>

---

<a name="spanish"></a>

## Español

Texas hold'em sin límite en la mesa de póker de la guarida de vampiros: un torneo de eliminación de dos a seis jugadores, tú contra los habituales de la cripta. Solo fichas de juego: un juego y una lección de probabilidad, nunca apuestas con dinero. Las reglas: [RULES.md](RULES.md).

- **Un torneo de verdad.** Pilas iguales (1 000, 1 500 o 3 000), ciegas que suben cada 15, 10 o 6 manos, ante desde 100/200; sigue hasta que un jugador tiene todas las fichas. Tu puesto queda en los resultados.
- **Reglas de casino.** En el mano a mano el botón pone la ciega pequeña; una subida es al menos la última subida completa; un all-in menor no reabre las apuestas; botes secundarios, la apuesta no igualada vuelve, la ficha sobrante para el primer ganador a la izquierda del botón; el tablero se reparte hasta el final cuando nadie puede apostar más.
- **Diez habituales, cada uno con su estilo de póker.** El Conde Vlad, tiburón cerrado; Carmilla, que farolea con una sonrisa; Koschéi, la roca; el Capitán Galeón, el jugador; el Tesorero Nudillos, que paga por ver cada carta… Toca un retrato para ver su lema.
- **Bots honestos.** Nunca miran cartas ocultas: equity por Monte Carlo contra las manos que sugiere la apuesta, probabilidades del bote, subidas del tamaño de una persona, «push o fold» con poca pila. Piensan en un Web Worker, así que la mesa nunca se congela.
- **El aspecto de la guarida.** El mismo club que la mesa de preferans: tapete esmeralda botella profundo en un borde lacado, plata ennegrecida sobre terciopelo, la pluma del escribano, la calavera de vampiro grabada en los reversos.
- **Dedo y ratón por igual.** Botones grandes, un deslizador de apuesta con tamaños rápidos (½ bote, ¾ bote, bote, todo); probado al tacto en móviles y tabletas y con ratón en el ordenador.
- **Se guarda tras cada acción**, con el botón «Guardar» y al ocultarse la página; «Seguir» en el menú.
- **Cinco idiomas** (RU, EN, HE, ES, FR).

**Por dentro.** `engine/` es TypeScript puro sin React: `cards.ts` (52 cartas como números 0…51), `evaluate.ts` (la mejor quinta de hasta siete cartas como un número comparable, código propio comprobado con las 2 598 960 manos de cinco cartas), `holdem.ts` (la mesa y todas las reglas), `ai/equity.ts` y `ai/bot.ts` (los bots), `worker.ts`. `hooks/usePoker.ts` lleva el torneo, `components/` lo dibujan, `i18n/` guarda los cinco idiomas, `characters.ts` los habituales. Pruebas: `tests/*.test.ts` (`npm test`); pruebas de carga: `scripts/load/poker-bots.mjs` y `poker-touch.mjs`.

[↑ Volver a los idiomas](#poker--покер--פוקר--póker--poker)

---

<a name="french"></a>

## Français

Texas hold'em sans limite à la table de poker du repaire des vampires : un tournoi à élimination de deux à six joueurs, vous contre les habitués de la crypte. Jetons de jeu seulement : un jeu et une leçon de probabilités, jamais un pari d'argent. Les règles : [RULES.md](RULES.md).

- **Un vrai tournoi.** Des tapis égaux (1 000, 1 500 ou 3 000), des blindes qui montent toutes les 15, 10 ou 6 mains, l'ante à partir de 100/200 ; cela dure jusqu'à ce qu'un joueur ait tous les jetons. Votre place s'inscrit dans les résultats.
- **Les règles du casino.** En tête-à-tête, le bouton pose la petite blinde ; une relance vaut au moins la dernière relance complète ; un tapis plus petit ne rouvre pas les enchères ; pots annexes, mise non suivie rendue, jeton impair au premier gagnant à gauche du bouton ; le tableau est distribué jusqu'au bout quand plus personne ne peut miser.
- **Dix habitués, chacun avec sa manière.** Le Comte Vlad, requin serré ; Carmilla, qui bluffe en souriant ; Kochtcheï, le roc ; le Capitaine Galion, le joueur ; le Trésorier Osselet, qui paie pour voir chaque carte… Touchez un portrait pour sa devise.
- **Des bots honnêtes.** Ils ne lisent jamais les cartes cachées : équité par Monte-Carlo contre les mains que suggèrent les enchères, cote du pot, relances de la taille d'une personne, « push or fold » avec un petit tapis. Ils réfléchissent dans un Web Worker : la table ne se fige jamais.
- **L'allure du repaire.** Le même club que la table de préférence : tapis émeraude bouteille profond dans un rebord laqué, argent noirci sur velours, la plume du scribe, le crâne de vampire gravé au dos des cartes.
- **Le doigt et la souris à égalité.** De gros boutons, un curseur de mise avec des tailles rapides (½ pot, ¾ pot, pot, tout) ; testé au toucher sur téléphones et tablettes et à la souris sur ordinateur.
- **Enregistré après chaque action**, avec le bouton « Enregistrer » et quand la page se masque ; « Reprendre » dans le menu.
- **Cinq langues** (RU, EN, HE, ES, FR).

**Dedans.** `engine/` est du TypeScript pur sans React : `cards.ts` (52 cartes comme nombres 0…51), `evaluate.ts` (la meilleure main de cinq parmi sept cartes en un seul nombre comparable, notre propre code vérifié sur les 2 598 960 mains de cinq cartes), `holdem.ts` (la table et toutes les règles), `ai/equity.ts` et `ai/bot.ts` (les bots), `worker.ts`. `hooks/usePoker.ts` mène le tournoi, `components/` le dessinent, `i18n/` contient les cinq langues, `characters.ts` les habitués. Tests : `tests/*.test.ts` (`npm test`) ; tests de charge : `scripts/load/poker-bots.mjs` et `poker-touch.mjs`.

[↑ Retour aux langues](#poker--покер--פוקר--póker--poker)
