# Preferans · Преферанс · פרפרנס · Préférence

[English](#english) · [Русский](#russian) · [עברית](#hebrew) · [Español](#spanish) · [Français](#french)

<a name="english"></a>

## English

You against bots with characters in a vampire lair: two at the table (with a dummy), three, or four (the dealer sits out), by Sochi, Leningrad, Rostov or Classic rules.

- **Fair bots.** They never look at hidden cards and decide from what their seat can know.
- **Saved after every move.** The pool continues where you stopped.
- **The table menu works like a restaurant menu.**
  - First come the players, rules, pool length, all-pass prices and bots; then the conventions of the variant and the extras.
  - Options that contradict each other cannot be chosen together; a closed option says why.
  - Every option explains what it is, how it plays and what it changes in the score, on hover or with its "?" button.
  - "Play plain preferans" starts at once with the usual rules.
- **The score sheet is always in sight**, drawn like the paper sheet on a real table.
  - Mountain, pool and whists are written as running totals, and each player's result sits by the centre circle.
  - On a phone, a strip above the table keeps the score and opens the sheet large.
- **A lair around a real table.** Emerald felt with an embossed damask; cast frames, plaques and buttons of blackened silver on velvet; candelabra with living flames, lancet windows with moonlight, bats with red eyes. The cards are large (up to 112 px): the game is the focus, the rest sets the mood. The score sheet is a big page with a scorched corner and a raven-feather quill; won tricks stay on the table as separate stacks laid crosswise. The concept and the Midjourney prompts: [DESIGN_CONCEPT_RU.md](DESIGN_CONCEPT_RU.md) (in Russian).
- **95 characters.** The opponents change from pool to pool and the winner stays; each has a portrait in a silver frame, a funny biography and a playing style of their own. You can pick them on the menu.
- **Every menu option plays:** whist–pass–half-whist, misère without the talon, dark bids and bombs, paid talon, American help, the dealer's whist and shared misère at four, teeth.
- **Finger and mouse alike.** The table is tested by touch on phones and tablets and with a mouse on a computer; the pool is saved after every move, with the «Save» button and when the page is hidden.
- **Five languages** (RU, EN, HE, ES, FR), switched in the header or in the menu. Hebrew reads right to left, while the table and the sheet keep their layout.

### Rules in short (Sochi, as implemented)

The full rules, five languages in one file: [RULES.md](RULES.md#english).

- **Deal.** 32 cards (7 to ace), three players, ten cards each and two in the talon. The first hand sits to the dealer's left.
- **Auction.**
  - The ladder runs 6♠ 6♣ 6♦ 6♥ 6NT … 10NT. Misère sits between 8NT and 9♠ and may only be a player's first bid.
  - The senior hand may hold an equal bid («здесь»).
  - Two passes end the auction. When everybody passes, the deal is an all-pass.
- **Talon.** It is shown to everyone. The winner takes it, discards two cards and names the final game, equal to the winning bid or higher. A misère stays a misère.
- **Whist.**
  - The defenders, the declarer's left neighbour first, say whist or pass.
  - Obligations: 4 tricks against a six, 2 against a seven, 1 against an eight or nine. A ten is checked, not whisted.
  - Half-whist on six and seven, which the first defender may take back.
  - A single whister plays open or closed.
- **Play.** Follow suit. With none, play a trump. With neither, play any card.
- **All-pass.**
  - Take as few tricks as you can.
  - The talon cards lead the first two tricks, and the first hand leads the third.
- **Scoring.**
  - Prices: 6 = 2, 7 = 4, 8 = 6, 9 = 8, 10 = 10, misère = 10.
  - A made game puts its price in the pool. Every missing trick puts the price in the mountain, and both defenders get the price per missing trick as consolation.
  - Whists are the price per trick. A single whister takes all the defence's tricks («жлобский» whist).
  - Defenders short of their obligation pay the price per missing trick into their mountain.
  - All-pass costs 1, 2, 3 per trick in a row, and a clean all-pass earns that price in the pool.
  - The final balance in whists sums to zero.
- **Extras you can switch on.**
  - Stalingrad: both defenders must whist a six of spades.
  - Conceding a hopeless game two down or three down after the talon (one of the two).

**Sources.** The rules research of 08.11.2026 used the 1996 Кодекс, pref-bridge, Gambler, preferans.games, the sport federation FSPR, rulespal and Wikipedia. Its main finding: the variants (Leningrad, Rostov, Classic) differ almost only in scoring, so they will come as named presets of about thirty rule parameters.

### How it works

| Folder | What lives there |
|---|---|
| `engine/` | Pure TypeScript, no React or DOM: `cards`, `bids`, `rules` (the rule set as data plus `customizeRules`), `tableOptions` (the table menu as data: choices, conflicts, requirements), `bidding`, `play`, `deal` (the state machine `newDeal` → `legalActions` / `applyAction` → `result`), `scoring`, and `worker.ts` (the bots' Web Worker) |
| `engine/ai/` | `solver`: an exact double-dummy solver using alpha-beta, a transposition table and equivalent cards. `knowledge`: what a seat may know, including voids from play, and deals sampled from it. `bot`: Perfect-Information Monte Carlo for the cards, quick estimates for the auction, discard and whist. `evaluate`: those estimates |
| `hooks/usePreferans.ts` | The pool in React: the deal, the bot seats (`SEAT_KINDS`: human, bot, later remote), saving after every move, resuming, results |
| `components/` | `PreferansGame` (the island: language, texts, direction), `PreferansTable` (the table), `SetupPanel` (the table menu), `Pulka` (the paper sheet in SVG) with `handwriting` (one-stroke pen digits), `ScoreSheet`, `ScoreStrip` and `ScoreSheetDialog`, `PlayerSeat`, `TrickArea`, `ActionPanel`, `PlayingCard` (card faces drawn in CSS), `sheetHistory`, `format` |
| `i18n/` | The five languages: `types` (the shape every language fills in full, so TypeScript catches a forgotten text), `ru`, `en`, `he`, `es`, `fr`; only the chosen one is loaded. Sentences about a player take the seat, not the name, so the verbs agree with "you", Orion (he) and Vega (she) |
| `assets/` | `card-back.svg`, the card back |
| `tests/` | 49 tests. The solver must give exactly the answer of a plain minimax on 400 random positions. Scoring examples come from the rulebook, the deal machine is tested on every path, and bots play whole deals. The menu's conflicts and requirements, Stalingrad, conceding, the sheet history and the five languages are tested too |

**Measured:**
- A full ten-card deal is solved in 5 ms (median), 47 ms (95%) and 0.33 s at worst on 400 random deals: about 4 times faster than before the typed-array table of 08.11, with exactly the same answers.
- Load test of 08.11 (`npm run load`): strong bots play 145 deals a minute on one thread and 563 on eight, with no hang in 384 deals. At the table in a browser, 95% of bot answers came within 91 ms and the longest took 0.9 s, with 0 long tasks on a computer; a bot move is capped by the clock, about 2.7 s at most, even on a slow phone.
- The table bundle is 50 KB (17 KB gzipped) and the worker 12 KB (5 KB).

### Engine language

The rules stay in TypeScript: they are one source of truth for the UI, the worker, the tests and the future game server. The solver is the compute kernel. When stronger bots need more samples than the current time budget allows, it moves to Rust compiled to WebAssembly, inside the same worker and behind the same `scoreMoves` interface. The TypeScript solver then stays as the reference for tests and as the fallback. The reasoning is in the [project Bible](../../../../../COSMO_GAME_HUB_BIBLE.md#english).

### TODO

- **Variants:** Leningrad/Piter, Rostov and Classic (with bombs) as named presets.
- **House rules:** exits from all-pass, whist responsibility, misère without the talon, whist–pass–half-whist.
- **Players:** two (Gusarik with a dummy) and four (the dealer sits out); the sheet then gets two or four sectors.
- **Bots:** calibrate the auction; today they pass too often, so all-pass comes up too often.
- **Rules:** «помощь» when a pool overflows its target.
- **Online play:** remote seats through a server running this engine (see the [project Bible](../../../../../COSMO_GAME_HUB_BIBLE.md#english), "Online play").
- **Languages:** native speakers to proofread the Hebrew, Spanish and French texts.

---

<a name="russian"></a>

## Русский

Вы против ботов с характерами в вампирском логове: вдвоём (с болваном), втроём или вчетвером (сдающий сидит на прикупе), по правилам Сочинки, Ленинградки, Ростовки или Классики.

- **Честные боты.** Они никогда не подглядывают в чужие карты и решают по тому, что можно знать с их места.
- **Сохранение после каждого хода.** Пуля продолжается с того места, где вы остановились.
- **Меню стола устроено как меню в ресторане.**
  - Сначала игроки, правила, длина пули, цены распасов и боты, потом настройки варианта и добавки.
  - Несовместимые опции нельзя выбрать вместе, а закрытая опция объясняет почему.
  - У каждой опции есть объяснение при наведении или по кнопке «?»: что это, как с этим играть и что меняется в счёте.
  - «Играть простой преферанс» сразу начинает с обычными правилами.
- **Лист пули всегда перед глазами** и нарисован как бумажный лист на настоящем столе.
  - Гора, пуля и висты пишутся нарастающим итогом, а итог каждого игрока стоит у центрального круга.
  - На телефоне над столом идёт полоса со счётом, которая открывает лист крупно.
- **Логово вокруг настоящего стола.** Изумрудное сукно с тиснёным дамаском; литые рамки, таблички и кнопки черненого серебра на бархате; канделябры с живым пламенем, стрельчатые окна с луной, летучие мыши с красными глазами. Карты крупные (до 112 px): игра в центре внимания, остальное создаёт атмосферу. Пуля — большой лист с обожжённым углом и пером из воронова крыла; взятки лежат на столе отдельными стопками крест-накрест. Замысел и промпты для Midjourney — в [DESIGN_CONCEPT_RU.md](DESIGN_CONCEPT_RU.md).
- **95 героев.** Соперники меняются от пули к пуле, победитель остаётся; у каждого портрет в серебряной рамке, смешная биография и свой стиль игры. Соперников можно выбрать в меню.
- **Все опции меню играются:** вист–пас–полвиста, мизер без прикупа, тёмные заявки и бомбы, платный прикуп, американская помощь, вист сдающего и мизер пополам вчетвером, зубы.
- **Пальцем и мышью одинаково.** Стол проверяется касаниями на телефоне и планшете и мышью на компьютере; пуля сохраняется после каждого хода, по кнопке «Сохранить» и при сворачивании страницы.
- **Пять языков** (RU, EN, HE, ES, FR): переключаются в шапке или в меню. Иврит читается справа налево, а стол и пуля сохраняют свою раскладку.

### Правила коротко (Сочинка, как сделано)

Полные правила, пять языков в одном файле: [RULES.md](RULES.md#russian).

- **Сдача.** 32 карты (от семёрки до туза), три игрока, по десять карт и две в прикупе. Первая рука сидит слева от сдающего.
- **Торговля.**
  - Лестница заявок: 6♠ 6♣ 6♦ 6♥ 6БК … 10БК. Мизер стоит между 8БК и 9♠ и разрешён только первым словом игрока.
  - Старшая рука может сказать «здесь».
  - Торговля заканчивается после двух пасов. Все спасовали — распасы.
- **Прикуп.** Его видят все. Победитель берёт прикуп, сносит две карты и называет окончательную игру: равную выигранной заявке или выше. Мизер остаётся мизером.
- **Вист.**
  - Вистующие, начиная с левого соседа играющего, говорят «вист» или «пас».
  - Обязательства: 4 взятки на шестерной, 2 на семерной, 1 на восьмерной и девятерной. Десятерная проверяется, а не вистуется.
  - Полвиста на шестерной и семерной, первый вистующий может его вернуть.
  - Одиночный вистующий играет в светлую или в тёмную.
- **Розыгрыш.** Ходят в масть. Если масти нет — козырем. Если нет и козырей — любой картой.
- **Распасы.**
  - Цель — взять как можно меньше взяток.
  - Первые две взятки ведут карты прикупа, третью — первая рука.
- **Запись.**
  - Цены игр: 6 = 2, 7 = 4, 8 = 6, 9 = 8, 10 = 10, мизер = 10.
  - Сыгранная игра даёт цену в пулю. Каждая недобранная взятка — цену в гору, а оба вистующих получают цену за каждую недобранную взятку как консоляцию.
  - Висты: цена за взятку. Одиночный вистующий забирает все взятки защиты («жлобский» вист).
  - Недобор вистов: цена за недостающую взятку в гору ответственному вистующему.
  - Распасы подряд стоят 1, 2, 3 за взятку, а чистые распасы дают эту цену в пулю.
  - Итог в вистах сходится в ноль.
- **Добавки, которые можно включить.**
  - «Сталинград»: на шестерной пик оба защитника обязаны вистовать.
  - Уход с безнадёжной игры «без двух» или «без трёх» после прикупа (одно из двух).

**Источники.** Исследование правил от 08.11.2026 опиралось на Кодекс 1996 года, pref-bridge, Gambler, preferans.games, спортивную федерацию ФСПР, rulespal и Википедию. Главный вывод: варианты (Ленинградка, Ростовская, Классика) различаются почти только счётом, поэтому они появятся как готовые наборы примерно из тридцати параметров правил.

### Как устроено

| Папка | Что там лежит |
|---|---|
| `engine/` | Чистый TypeScript без React и DOM: `cards`, `bids`, `rules` (вариант правил как данные плюс `customizeRules`), `tableOptions` (меню стола как данные: выбор, запреты, зависимости), `bidding`, `play`, `deal` (машина состояний `newDeal` → `legalActions` / `applyAction` → `result`), `scoring`, а также `worker.ts` (Web Worker ботов) |
| `engine/ai/` | `solver`: точный решатель «в открытую» на alpha-beta, с таблицей позиций и одинаковыми картами. `knowledge`: что может знать игрок, включая пустые масти из хода игры, и выборка раскладов. `bot`: PIMC для карт, быстрые оценки для торговли, сноса и виста. `evaluate`: эти оценки |
| `hooks/usePreferans.ts` | Пуля в React: раздача, места ботов (`SEAT_KINDS`: человек, бот, позже удалённый игрок), сохранение после каждого хода, продолжение, результаты |
| `components/` | `PreferansGame` (остров: язык, тексты, направление), `PreferansTable` (сам стол), `SetupPanel` (меню стола), `Pulka` (бумажный лист в SVG) и `handwriting` (цифры ручкой одним штрихом), `ScoreSheet`, `ScoreStrip` и `ScoreSheetDialog`, `PlayerSeat`, `TrickArea`, `ActionPanel`, `PlayingCard` (лицо карт на CSS), `sheetHistory`, `format` |
| `i18n/` | Пять языков: `types` (форма, которую каждый язык заполняет целиком, — TypeScript ловит забытый текст), `ru`, `en`, `he`, `es`, `fr`; загружается только выбранный. Фразы об игроке получают место, а не имя, поэтому глаголы согласуются с «вы», Орионом (он) и Вегой (она) |
| `assets/` | `card-back.svg` — рубашка карт |
| `tests/` | 49 тестов. Решатель обязан дать ровно ответ простого полного перебора на 400 случайных позициях. Примеры записи взяты из свода правил, раздача проверена по всем путям, боты играют целые раздачи. Проверены и запреты и зависимости меню, «Сталинград», уход, история листа пули и пять языков |

**Замеры:**
- Полная раздача из десяти взяток решается за 5 мс (медиана), 47 мс (95%) и 0,33 с в худшем из 400 случайных раскладов. Это примерно в 4 раза быстрее, чем до числовой таблицы позиций 08.11, и ответы точно те же.
- Нагрузочная проверка 08.11 (`npm run load`): сильные боты играют 145 раздач в минуту в одном потоке и 563 в восьми, без единого зависания на 384 раздачах. За столом в браузере 95% ответов ботов пришли быстрее 91 мс, самый долгий — 0,9 с, долгих задач на компьютере 0. Ход бота ограничен по часам, не больше примерно 2,7 с даже на медленном телефоне.
- Файл стола весит 50 КБ (17 КБ в gzip), файл воркера 12 КБ (5 КБ).

### Язык движка

Правила остаются на TypeScript: это один источник истины для интерфейса, воркера, тестов и будущего игрового сервера. Решатель — вычислительное ядро. Когда сильным ботам понадобится больше раскладов, чем позволяет нынешний бюджет времени, он переедет на Rust, собранный в WebAssembly, — в тот же воркер, за тот же интерфейс `scoreMoves`. Решатель на TypeScript тогда останется эталоном для тестов и запасным вариантом. Все рассуждения — в [Библии проекта](../../../../../COSMO_GAME_HUB_BIBLE.md#russian).

### TODO

- **Варианты:** Ленинградка/Питер, Ростовская и Классика (с бомбами) как готовые наборы правил.
- **Договорные правила:** выход из распасов, ответственность виста, мизер без прикупа, вист–пас–полвиста.
- **Игроки:** на двоих (гусарик с болваном) и на четверых (сдающий на прикупе); у листа пули тогда будет два или четыре сектора.
- **Боты:** откалибровать торговлю; сейчас они слишком часто пасуют, и распасы выпадают слишком часто.
- **Правила:** «помощь» при переполнении пули.
- **Игра по сети:** удалённые места через сервер с этим же движком (см. [Библию проекта](../../../../../COSMO_GAME_HUB_BIBLE.md#russian), «Игра по сети»).
- **Языки:** вычитать тексты на иврите, испанском и французском с носителями языка.

---

<a name="hebrew"></a>

<div dir="rtl">

## עברית

אתם מול בוטים עם אופי במאורת ערפדים: שניים ליד השולחן (עם דחליל), שלושה או ארבעה (המחלק יושב על הקופה), לפי חוקי סוצ׳י, לנינגרד, רוסטוב או קלאסיקה.

- **בוטים הוגנים.** הם לעולם אינם מציצים בקלפים נסתרים, ומחליטים לפי מה שאפשר לדעת מהמקום שלהם.
- **שמירה אחרי כל מהלך.** הפוליה ממשיכה מהמקום שבו עצרתם.
- **תפריט השולחן בנוי כמו תפריט במסעדה.**
  - קודם שחקנים, חוקים, אורך הפוליה, מחירי הפאס הכללי ובוטים, ואחר כך המוסכמות של הגרסה והתוספות.
  - אי אפשר לבחור יחד אפשרויות שסותרות זו את זו, ואפשרות סגורה מסבירה למה.
  - לכל אפשרות יש הסבר במעבר העכבר או בכפתור «?»: מה זה, איך משחקים עם זה ומה זה משנה בניקוד.
  - «לשחק פרפרנס פשוט» מתחיל מיד עם החוקים הרגילים.
- **דף הניקוד תמיד מול העיניים**, מצויר כמו דף הנייר על שולחן אמיתי.
  - ההר, הפוליה והוויסטים נרשמים כסכומים מצטברים, והתוצאה של כל שחקן מופיעה ליד העיגול שבמרכז.
  - בטלפון יש מעל השולחן רצועה עם הניקוד, ונגיעה בה פותחת את הדף בגדול.
- **מאורה סביב שולחן אמיתי.** לבד אזמרגד עם דמשק מוטבע; מסגרות, שלטים וכפתורים מכסף מושחר על קטיפה; מנורות עם להבה חיה, חלונות גותיים באור ירח, עטלפים עם עיניים אדומות. הקלפים גדולים (עד 112 פיקסלים): המשחק במרכז, והשאר יוצר אווירה. דף הניקוד גדול, עם פינה חרוכה ונוצת עורב; הלקיחות נשארות על השולחן כערימות נפרדות, אחת לאורך ואחת לרוחב. הרעיון והפרומפטים ל־Midjourney: [DESIGN_CONCEPT_RU.md](DESIGN_CONCEPT_RU.md) (ברוסית).
- **95 דמויות.** היריבים מתחלפים מפוליה לפוליה והמנצח נשאר; לכל אחד דיוקן במסגרת כסף, ביוגרפיה מצחיקה וסגנון משחק משלו. אפשר לבחור אותם בתפריט.
- **כל אפשרויות התפריט משחקות:** ויסט–פאס–חצי ויסט, מיזר בלי קופה, הכרזות בעיוורון ופצצות, קופה בתשלום, עזרה אמריקאית, ויסט המחלק ומיזר חצי־חצי בארבעה, שיניים.
- **באצבע ובעכבר באותה מידה.** השולחן נבדק במגע בטלפון ובטאבלט ובעכבר במחשב; הפוליה נשמרת אחרי כל מהלך, בכפתור «לשמור» וכשהדף מוסתר.
- **חמש שפות** (רוסית, אנגלית, עברית, ספרדית, צרפתית), מתחלפות בכותרת או בתפריט. העברית נקראת מימין לשמאל, והשולחן והדף שומרים על הפריסה שלהם.

### החוקים בקצרה (סוצ'י, כפי שמומשו)

החוקים המלאים, חמש שפות בקובץ אחד: [RULES.md](RULES.md#hebrew).

- **החלוקה.** ‏32 קלפים (מ-7 ועד אס), שלושה שחקנים, עשרה קלפים לכל אחד ושניים בקופה. היד הראשונה יושבת משמאל למחלק.
- **ההכרזות.**
  - הסולם: 6♠ 6♣ 6♦ 6♥ 6NT … 10NT. המיזר נמצא בין 8NT ל-9♠ ומותר רק כהכרזה הראשונה של שחקן.
  - היד הבכירה רשאית להחזיק הכרזה שווה («здесь»).
  - שני פאסים מסיימים את ההכרזות. אם כולם אמרו פאס, משחקים פאס כללי.
- **הקופה.** כולם רואים אותו. הזוכה לוקח אותו, משליך שני קלפים ומכריז על המשחק הסופי, שווה להכרזה הזוכה או גבוה ממנה. מיזר נשאר מיזר.
- **ויסט.**
  - המגינים, החל מהשכן השמאלי של המכריז, אומרים «ויסט» או «פאס».
  - חובות: 4 לקיחות מול שש, 2 מול שבע, 1 מול שמונה או תשע. עשר נבדקת ואינה מוויסטת.
  - חצי ויסט בשש ובשבע, והמגן הראשון רשאי לקחת אותו בחזרה.
  - מוויסט יחיד משחק פתוח או סגור.
- **משחק הקלפים.** משחקים באותה סדרה. אם אין — בשליט. אם אין גם שליט — כל קלף.
- **פאס כללי.**
  - המטרה היא לקחת כמה שפחות לקיחות.
  - קלפי הקופה מובילים את שתי הלקיחות הראשונות, והיד הראשונה מובילה את השלישית.
- **ניקוד.**
  - מחירים: 6 = 2, ‏7 = 4, ‏8 = 6, ‏9 = 8, ‏10 = 10, מיזר = 10.
  - משחק שבוצע מכניס את מחירו לפוליה. כל לקיחה חסרה מכניסה את המחיר להר, ושני המגינים מקבלים את המחיר על כל לקיחה חסרה כנחמה (консоляция).
  - ויסטים: המחיר לכל לקיחה. מוויסט יחיד לוקח את כל הלקיחות של ההגנה (ויסט «жлобский»).
  - מגינים שלא השלימו את החובה משלמים את המחיר על כל לקיחה חסרה להר שלהם.
  - פאסים כלליים ברצף עולים 1, 2, 3 ללקיחה, ופאס כללי נקי מכניס את המחיר הזה לפוליה.
  - המאזן הסופי בוויסטים מסתכם באפס.
- **תוספות שאפשר להפעיל.**
  - סטלינגרד: בחוזה 6♠ שני המגינים חייבים לוויסט.
  - ויתור על משחק אבוד בחיסרון של שתיים או של שלוש אחרי הקופה (אחת מהשתיים).

**מקורות.** מחקר החוקים מ-08.11.2026 נשען על הקודקס משנת 1996, ‏pref-bridge, ‏Gambler, ‏preferans.games, איגוד הספורט ФСПР, ‏rulespal ווויקיפדיה. המסקנה העיקרית: הגרסאות (לנינגרד, רוסטוב, קלאסיקה) נבדלות כמעט רק בניקוד, ולכן הן יגיעו כערכות מוכנות של כשלושים פרמטרים של חוקים.

### איך זה בנוי

| תיקייה | מה יש בה |
|---|---|
| מנוע (`engine`) | ‏TypeScript טהור בלי React ובלי DOM: קלפים, הכרזות, החוקים כנתונים (`rules`), תפריט השולחן כנתונים עם ההתנגשויות והדרישות (`tableOptions`), מהלך ההכרזות, משחק הקלפים, מכונת המצבים של החלוקה (`deal`), הניקוד, וה-worker של הבוטים |
| בינה (`engine/ai`) | פותר מדויק בקלפים פתוחים (אלפא-בטא, טבלת טרנספוזיציות, קלפים שקולים), מה שכל מקום יכול לדעת ודגימת חלוקות, הבוט (PIMC למשחק הקלפים והערכות מהירות לשאר) |
| מצב (`hooks/usePreferans.ts`) | הפוליה ב-React: החלוקה, מקומות הבוטים, שמירה אחרי כל מהלך, המשך ותוצאות |
| רכיבים (`components`) | האי (שפה, טקסטים, כיוון), השולחן עצמו, תפריט השולחן, דף הניקוד (הדף ב-SVG עם ספרות בכתב יד, הרצועה והחלון הגדול), המקומות, מרכז השולחן, לוח הפעולות ופני הקלפים המצוירים ב-CSS |
| שפות (`i18n`) | חמש השפות: הצורה שכל שפה ממלאת עד הסוף (TypeScript תופס טקסט שנשכח) והמילונים `ru`, `en`, `he`, `es`, `fr`; נטען רק המילון שנבחר. משפטים על שחקן מקבלים את המקום ולא את השם, כך שהפעלים מתאימים ל"את/ה", לאוריון (הוא) ולוגה (היא) |
| תמונות (`assets`) | `card-back.svg` — גב הקלפים |
| בדיקות (`tests`) | ‏49 בדיקות: הפותר מול חיפוש מלא על 400 מצבים, דוגמאות ניקוד מספר החוקים, כל המסלולים של חלוקה, בוטים שמשחקים חלוקות שלמות, התפריט, סטלינגרד, הוויתור, היסטוריית דף הניקוד וחמש השפות |

**מדידות:**
- חלוקה מלאה של עשר לקיחות נפתרת ב-5 אלפיות שנייה (חציון), ב-47 (95%) וב-0.33 שנייה במקרה הגרוע מבין 400 חלוקות אקראיות. זה בערך פי 4 מהר יותר מלפני הטבלה המספרית של 08.11, והתשובות זהות בדיוק.
- בדיקת העומס מ-08.11 (`npm run load`): בוטים חזקים משחקים 145 חלוקות לדקה בתהליכון אחד ו-563 בשמונה, בלי אף תקיעה ב-384 חלוקות. ליד השולחן בדפדפן ‏95% מתשובות הבוטים הגיעו תוך 91 אלפיות שנייה, והארוכה ביותר לקחה 0.9 שנייה, עם אפס משימות ארוכות במחשב. מסע של בוט מוגבל לפי שעון, לכל היותר כ-2.7 שניות, גם בטלפון איטי.
- קובץ השולחן שוקל 50 KB ‏(17 KB בדחיסת gzip), וקובץ ה-worker שוקל 12 KB ‏(5 KB).

### שפת המנוע

החוקים נשארים ב-TypeScript: הם מקור אמת יחיד לממשק, ל-worker, לבדיקות ולשרת המשחק העתידי. הפותר הוא גרעין החישוב. כשבוטים חזקים יותר יצטרכו יותר דגימות ממה שתקציב הזמן מאפשר, הוא יעבור ל-Rust שמהודר ל-WebAssembly, באותו worker ומאחורי אותו ממשק. הפותר ב-TypeScript יישאר אז הייחוס לבדיקות והחלופה. הנימוקים נמצאים [במדריך הטכני של הפרויקט](../../../../../COSMO_GAME_HUB_BIBLE.md#hebrew).

### לעשות

- **גרסאות:** לנינגרד/פיטר, רוסטוב וקלאסיקה (עם «פצצות») כערכות מוכנות.
- **חוקי בית:** יציאה מפאס כללי, אחריות הוויסט, מיזר בלי קופה, ויסט–פאס–חצי ויסט.
- **שחקנים:** שניים (גוסריק עם «דמה») וארבעה (המחלק יושב בחוץ); לדף הניקוד יהיו אז שתי גזרות או ארבע.
- **בוטים:** לכייל את ההכרזות; היום הם אומרים פאס לעיתים קרובות מדי, ולכן יש יותר מדי פאסים כלליים.
- **חוקים:** «помощь» כשפוליה עוברת את היעד.
- **משחק ברשת:** מקומות מרוחקים דרך שרת שמריץ את אותו מנוע (ראו [המדריך הטכני](../../../../../COSMO_GAME_HUB_BIBLE.md#hebrew), "משחק ברשת").
- **שפות:** לבקש מדוברי השפות לעבור על הטקסטים בעברית, בספרדית ובצרפתית.

</div>

---

<a name="spanish"></a>

## Español

Tú contra bots con carácter en una guarida de vampiros: dos en la mesa (con el Muerto), tres o cuatro (el repartidor descansa en el talón), con las reglas de Sochi, Leningrado, Rostov o la Clásica.

- **Bots honestos.** Nunca miran las cartas ocultas y deciden con lo que se puede saber desde su asiento.
- **Guardado tras cada jugada.** La pulya continúa donde la dejaste.
- **El menú de la mesa funciona como la carta de un restaurante.**
  - Primero vienen los jugadores, las reglas, el largo de la pulya, los precios del pase general y los bots; luego las convenciones de la variante y los extras.
  - Las opciones que se contradicen no se pueden elegir juntas, y una opción cerrada explica por qué.
  - Cada opción explica qué es, cómo se juega y qué cambia en la puntuación, al pasar el ratón o con su botón «?».
  - «Jugar preferans sencillo» empieza al instante con las reglas habituales.
- **La hoja de puntuación siempre está a la vista**, dibujada como la hoja de papel de una mesa de verdad.
  - Montaña, pulya y whists se anotan como totales acumulados, y el resultado de cada jugador está junto al círculo central.
  - En el móvil, una franja encima de la mesa muestra la puntuación y abre la hoja en grande.
- **Una guarida alrededor de una mesa de verdad.** Tapete esmeralda con damasco en relieve; marcos, placas y botones de plata ennegrecida sobre terciopelo; candelabros con llama viva, ventanas ojivales con luz de luna, murciélagos de ojos rojos. Las cartas son grandes (hasta 112 px): el juego es el centro y lo demás crea ambiente. La hoja es una página grande con una esquina chamuscada y una pluma de cuervo; las bazas quedan en la mesa como montones separados, cruzados. La idea y los prompts para Midjourney: [DESIGN_CONCEPT_RU.md](DESIGN_CONCEPT_RU.md) (en ruso).
- **95 personajes.** Los rivales cambian de una pulya a otra y el ganador se queda; cada uno tiene retrato en marco de plata, una biografía divertida y su propio estilo de juego. Se pueden elegir en el menú.
- **Todas las opciones del menú se juegan:** whist–paso–medio whist, miseria sin talón, declaraciones a ciegas y bombas, talón pagado, ayuda americana, el whist del repartidor y la miseria a medias entre cuatro, dientes.
- **Con el dedo y con el ratón por igual.** La mesa se prueba al tacto en móviles y tabletas y con ratón en el ordenador; la pulya se guarda tras cada jugada, con el botón «Guardar» y cuando la página se oculta.
- **Cinco idiomas** (RU, EN, HE, ES, FR), que se cambian en la cabecera o en el menú. El hebreo se lee de derecha a izquierda, y la mesa y la hoja mantienen su disposición.

### Reglas en breve (Sochi, tal como están hechas)

Las reglas completas, cinco idiomas en un solo archivo: [RULES.md](RULES.md#spanish).

- **Reparto.** 32 cartas (del 7 al as), tres jugadores, diez cartas cada uno y dos en el talón. La primera mano está a la izquierda del repartidor.
- **Subasta.**
  - La escalera va 6♠ 6♣ 6♦ 6♥ 6ST … 10ST. La miseria va entre 8ST y 9♠ y solo puede ser la primera declaración de un jugador.
  - La mano mayor puede mantener una declaración igual («здесь»).
  - Dos pases terminan la subasta. Si todos pasan, hay pase general («распасы»).
- **Talón.** Se muestra a todos. El ganador lo toma, descarta dos cartas y declara el juego final, igual o superior a la declaración ganadora. Una miseria sigue siendo miseria.
- **Whist.**
  - Los defensores, empezando por el vecino izquierdo del declarante, dicen whist o pase.
  - Obligaciones: 4 bazas contra un seis, 2 contra un siete, 1 contra un ocho o un nueve. El diez se comprueba, no se defiende con whist.
  - Medio whist con seis y siete, que el primer defensor puede recuperar.
  - Un defensor en solitario juega abierto o cerrado.
- **Juego.** Hay que seguir el palo. Sin él, triunfo. Sin ninguno de los dos, cualquier carta.
- **Pase general.**
  - Se trata de hacer las menos bazas posibles.
  - Las cartas del talón abren las dos primeras bazas, y la primera mano abre la tercera.
- **Puntuación.**
  - Precios: 6 = 2, 7 = 4, 8 = 6, 9 = 8, 10 = 10, miseria = 10.
  - Un juego cumplido suma su precio a la pulya. Cada baza que falta suma el precio a la montaña, y los dos defensores reciben el precio por cada baza que falta como consolación.
  - Los whists valen el precio por baza. Un defensor en solitario se lleva todas las bazas de la defensa (whist «жлобский»).
  - Los defensores que no cumplen su obligación pagan el precio por cada baza que falta a su montaña.
  - Los pases generales seguidos cuestan 1, 2, 3 por baza, y un pase general limpio da ese precio en la pulya.
  - El balance final en whists suma cero.
- **Extras que se pueden activar.**
  - Stalingrado: los dos defensores deben hacer whist contra un seis de picas.
  - Rendirse ante una partida perdida con dos o tres bazas de menos tras el talón (una de las dos).

**Fuentes.** La investigación de reglas del 08.11.2026 se basó en el Кодекс de 1996, pref-bridge, Gambler, preferans.games, la federación deportiva ФСПР, rulespal y Wikipedia. Su conclusión principal: las variantes (Leningrado, Rostov, Clásica) se diferencian casi solo en la puntuación, así que llegarán como conjuntos predefinidos de unos treinta parámetros de reglas.

### Cómo funciona

| Carpeta | Qué contiene |
|---|---|
| `engine/` | TypeScript puro, sin React ni DOM: `cards`, `bids`, `rules` (las reglas como datos, más `customizeRules`), `tableOptions` (el menú de la mesa como datos: elecciones, conflictos, requisitos), `bidding`, `play`, `deal` (la máquina de estados `newDeal` → `legalActions` / `applyAction` → `result`), `scoring` y `worker.ts` (el Web Worker de los bots) |
| `engine/ai/` | `solver`: un solver exacto a cartas vistas con alfa-beta, tabla de transposición y cartas equivalentes. `knowledge`: lo que puede saber un asiento, incluidos los fallos vistos en el juego, y repartos muestreados a partir de ello. `bot`: Perfect-Information Monte Carlo para las cartas y estimaciones rápidas para la subasta, el descarte y el whist. `evaluate`: esas estimaciones |
| `hooks/usePreferans.ts` | La pulya en React: el reparto, los asientos de los bots (`SEAT_KINDS`), el guardado tras cada jugada, la continuación y los resultados |
| `components/` | `PreferansGame` (la isla: idioma, textos, dirección), `PreferansTable` (la mesa), `SetupPanel` (el menú), `Pulka` (la hoja de papel en SVG) con `handwriting` (cifras de pluma de un solo trazo), `ScoreSheet`, `ScoreStrip` y `ScoreSheetDialog`, `PlayerSeat`, `TrickArea`, `ActionPanel`, `PlayingCard` (la cara de las cartas dibujada en CSS), `sheetHistory`, `format` |
| `i18n/` | Los cinco idiomas: `types` (la forma que cada idioma rellena entera, así TypeScript detecta un texto olvidado), `ru`, `en`, `he`, `es`, `fr`; solo se carga el elegido. Las frases sobre un jugador reciben el asiento, no el nombre, para que los verbos concuerden con «tú», Orión (él) y Vega (ella) |
| `assets/` | `card-back.svg`, el reverso de las cartas |
| `tests/` | 49 pruebas: el solver frente a un minimax simple en 400 posiciones, ejemplos de puntuación del reglamento, todos los caminos de un reparto, bots que juegan repartos completos, el menú, Stalingrado, la rendición, la historia de la hoja y los cinco idiomas |

**Medido:**
- Un reparto completo de diez bazas se resuelve en 5 ms (mediana), 47 ms (95 %) y 0,33 s en el peor de 400 repartos aleatorios: unas 4 veces más rápido que antes de la tabla numérica del 08.11, con exactamente las mismas respuestas.
- Prueba de carga del 08.11 (`npm run load`): los bots fuertes juegan 145 repartos por minuto en un hilo y 563 en ocho, sin ningún bloqueo en 384 repartos. En la mesa del navegador, el 95 % de las respuestas de los bots llegó en menos de 91 ms y la más larga tardó 0,9 s, con 0 tareas largas en un ordenador; la jugada de un bot está limitada por reloj, unos 2,7 s como mucho, incluso en un móvil lento.
- El archivo de la mesa pesa 50 KB (17 KB con gzip) y el del worker 12 KB (5 KB).

### Lenguaje del motor

Las reglas siguen en TypeScript: son una única fuente de verdad para la interfaz, el worker, las pruebas y el futuro servidor de juego. El solver es el núcleo de cálculo. Cuando bots más fuertes necesiten más muestras de las que permite el presupuesto de tiempo, pasará a Rust compilado a WebAssembly, en el mismo worker y detrás de la misma interfaz `scoreMoves`. El solver en TypeScript quedará entonces como referencia para las pruebas y como reserva. El razonamiento está en la [Biblia del proyecto](../../../../../COSMO_GAME_HUB_BIBLE.md#spanish).

### Pendiente

- **Variantes:** Leningrado/Píter, Rostov y Clásica (con bombas) como conjuntos predefinidos.
- **Reglas de la casa:** salidas del pase general, responsabilidad del whist, miseria sin talón, whist–pase–medio whist.
- **Jugadores:** dos (Gusarik con muerto) y cuatro (el repartidor se queda fuera); la hoja tendrá entonces dos o cuatro sectores.
- **Bots:** calibrar la subasta; hoy pasan demasiado, y por eso salen demasiados pases generales.
- **Reglas:** «помощь» cuando una pulya supera su objetivo.
- **Juego en línea:** asientos remotos a través de un servidor con este mismo motor (véase la [Biblia del proyecto](../../../../../COSMO_GAME_HUB_BIBLE.md#spanish), «Juego en línea»).
- **Idiomas:** que hablantes nativos revisen los textos en hebreo, español y francés.

---

<a name="french"></a>

## Français

Vous contre des bots pleins de caractère dans un repaire de vampires : à deux (avec le Mort), à trois ou à quatre (le donneur reste au talon), aux règles de Sotchi, Leningrad, Rostov ou Classique.

- **Des bots honnêtes.** Ils ne regardent jamais les cartes cachées et décident d'après ce que leur place peut savoir.
- **Sauvegarde après chaque coup.** La poule reprend là où vous vous êtes arrêté.
- **Le menu de la table fonctionne comme la carte d'un restaurant.**
  - D'abord les joueurs, les règles, la longueur de la poule, les prix de la passe générale et les bots ; ensuite les conventions de la variante et les extras.
  - Les options qui se contredisent ne peuvent pas être choisies ensemble, et une option fermée explique pourquoi.
  - Chaque option explique ce qu'elle est, comment on la joue et ce qu'elle change dans la marque, au survol ou avec son bouton « ? ».
  - « Jouer la version simple » démarre tout de suite avec les règles habituelles.
- **La feuille de marque est toujours sous les yeux**, dessinée comme la feuille de papier d'une vraie table.
  - Montagne, poule et whists s'inscrivent en totaux cumulés, et le résultat de chaque joueur figure près du cercle central.
  - Sur téléphone, une bande au-dessus de la table garde la marque et ouvre la feuille en grand.
- **Un repaire autour d’une vraie table.** Tapis émeraude au damas gaufré ; cadres, plaques et boutons d’argent noirci sur velours ; candélabres aux flammes vivantes, fenêtres en ogive baignées de lune, chauves-souris aux yeux rouges. Les cartes sont grandes (jusqu’à 112 px) : le jeu est au centre, le reste crée l’ambiance. La feuille est une grande page au coin brûlé avec une plume de corbeau ; les plis restent sur la table en piles séparées, croisées. L’idée et les prompts Midjourney : [DESIGN_CONCEPT_RU.md](DESIGN_CONCEPT_RU.md) (en russe).
- **95 personnages.** Les adversaires changent d’une poule à l’autre et le vainqueur reste ; chacun a un portrait dans un cadre d’argent, une biographie drôle et son propre style de jeu. On peut les choisir dans le menu.
- **Toutes les options du menu se jouent :** whist–passe–demi-whist, misère sans talon, annonces à l’aveugle et bombes, talon payant, aide américaine, le whist du donneur et la misère partagée à quatre, dents.
- **Au doigt comme à la souris.** La table est testée au toucher sur téléphone et tablette et à la souris sur ordinateur ; la poule est enregistrée après chaque coup, avec le bouton « Enregistrer » et quand la page est masquée.
- **Cinq langues** (RU, EN, HE, ES, FR), qui se changent dans l’en-tête ou dans le menu. L’hébreu se lit de droite à gauche, et la table et la feuille gardent leur disposition.

### Les règles en bref (Sotchi, telles qu'elles sont faites)

Les règles complètes, cinq langues dans un seul fichier : [RULES.md](RULES.md#french).

- **Donne.** 32 cartes (du 7 à l'as), trois joueurs, dix cartes chacun et deux au talon. La première main est à gauche du donneur.
- **Enchères.**
  - L'échelle va de 6♠ 6♣ 6♦ 6♥ 6SA … 10SA. La misère se place entre 8SA et 9♠ et ne peut être que la première enchère d'un joueur.
  - La main aînée peut maintenir une enchère égale (« здесь »).
  - Deux passes terminent les enchères. Si tout le monde passe, on joue la passe générale.
- **Talon.** Il est montré à tous. Le gagnant le prend, écarte deux cartes et annonce le contrat final, égal ou supérieur à l'enchère gagnante. Une misère reste une misère.
- **Whist.**
  - Les défenseurs, à commencer par le voisin de gauche du déclarant, disent whist ou passe.
  - Obligations : 4 plis contre un six, 2 contre un sept, 1 contre un huit ou un neuf. Le dix est vérifié, pas défendu au whist.
  - Demi-whist sur le six et le sept, que le premier défenseur peut reprendre.
  - Un défenseur seul joue ouvert ou fermé.
- **Jeu de la carte.** Il faut fournir. Sinon, couper. Sinon, n'importe quelle carte.
- **Passe générale.**
  - Le but est de faire le moins de plis possible.
  - Les cartes du talon entament les deux premiers plis, et la première main entame le troisième.
- **Marque.**
  - Prix : 6 = 2, 7 = 4, 8 = 6, 9 = 8, 10 = 10, misère = 10.
  - Un contrat réussi inscrit son prix dans la poule. Chaque pli manquant inscrit le prix dans la montagne, et les deux défenseurs reçoivent le prix par pli manquant en consolation.
  - Les whists valent le prix par pli. Un défenseur seul prend tous les plis de la défense (whist « жлобский »).
  - Les défenseurs qui n'atteignent pas leur obligation paient le prix par pli manquant dans leur montagne.
  - Des passes générales à la suite coûtent 1, 2, 3 par pli, et une passe générale propre rapporte ce prix dans la poule.
  - Le solde final en whists fait zéro.
- **Extras à activer.**
  - Stalingrad : les deux défenseurs doivent faire whist contre un six de pique.
  - Abandonner une partie perdue à deux ou trois de chute après le talon (l'un ou l'autre).

**Sources.** La recherche sur les règles du 08.11.2026 s'est appuyée sur le Кодекс de 1996, pref-bridge, Gambler, preferans.games, la fédération sportive ФСПР, rulespal et Wikipédia. Sa conclusion principale : les variantes (Leningrad, Rostov, Classique) ne diffèrent presque que par la marque, elles arriveront donc sous forme de jeux prédéfinis d'une trentaine de paramètres de règles.

### Comment c'est construit

| Dossier | Ce qu'il contient |
|---|---|
| `engine/` | TypeScript pur, sans React ni DOM : `cards`, `bids`, `rules` (les règles comme données, plus `customizeRules`), `tableOptions` (le menu de la table comme données : choix, conflits, conditions), `bidding`, `play`, `deal` (la machine à états `newDeal` → `legalActions` / `applyAction` → `result`), `scoring` et `worker.ts` (le Web Worker des bots) |
| `engine/ai/` | `solver` : un solveur exact à cartes ouvertes avec alpha-bêta, table de transposition et cartes équivalentes. `knowledge` : ce qu'une place peut savoir, y compris les chicanes vues en jeu, et des donnes échantillonnées à partir de là. `bot` : Perfect-Information Monte Carlo pour les cartes et des estimations rapides pour les enchères, l'écart et le whist. `evaluate` : ces estimations |
| `hooks/usePreferans.ts` | La poule en React : la donne, les places des bots (`SEAT_KINDS`), la sauvegarde après chaque coup, la reprise et les résultats |
| `components/` | `PreferansGame` (l'îlot : langue, textes, sens), `PreferansTable` (la table), `SetupPanel` (le menu), `Pulka` (la feuille de papier en SVG) avec `handwriting` (des chiffres à la plume d'un seul trait), `ScoreSheet`, `ScoreStrip` et `ScoreSheetDialog`, `PlayerSeat`, `TrickArea`, `ActionPanel`, `PlayingCard` (la face des cartes dessinée en CSS), `sheetHistory`, `format` |
| `i18n/` | Les cinq langues : `types` (la forme que chaque langue remplit entièrement, ainsi TypeScript repère un texte oublié), `ru`, `en`, `he`, `es`, `fr` ; seule la langue choisie est chargée. Les phrases sur un joueur reçoivent la place, pas le nom, pour que les verbes s'accordent avec « vous », Orion (il) et Véga (elle) |
| `assets/` | `card-back.svg`, le dos des cartes |
| `tests/` | 49 tests : le solveur face à un minimax simple sur 400 positions, des exemples de marque tirés du règlement, tous les chemins d'une donne, des bots qui jouent des donnes entières, le menu, Stalingrad, l'abandon, l'historique de la feuille et les cinq langues |

**Mesures :**
- Une donne complète de dix plis se résout en 5 ms (médiane), 47 ms (95 %) et 0,33 s au pire sur 400 donnes aléatoires : environ 4 fois plus vite qu'avant la table numérique du 08.11, avec exactement les mêmes réponses.
- Test de charge du 08.11 (`npm run load`) : les bots forts jouent 145 donnes par minute sur un fil et 563 sur huit, sans aucun blocage sur 384 donnes. À la table dans un navigateur, 95 % des réponses des bots sont arrivées en moins de 91 ms et la plus longue a pris 0,9 s, sans tâche longue sur ordinateur ; le coup d'un bot est limité à l'horloge, environ 2,7 s au plus, même sur un téléphone lent.
- Le fichier de la table pèse 50 Ko (17 Ko en gzip), celui du worker 12 Ko (5 Ko).

### Langage du moteur

Les règles restent en TypeScript : elles sont une source unique de vérité pour l'interface, le worker, les tests et le futur serveur de jeu. Le solveur est le noyau de calcul. Quand des bots plus forts auront besoin de plus d'échantillons que le budget de temps ne le permet, il passera à Rust compilé en WebAssembly, dans le même worker et derrière la même interface `scoreMoves`. Le solveur TypeScript restera alors la référence des tests et la solution de secours. Le raisonnement se trouve dans la [Bible du projet](../../../../../COSMO_GAME_HUB_BIBLE.md#french).

### À faire

- **Variantes :** Leningrad/Piter, Rostov et Classique (avec bombes) en jeux prédéfinis.
- **Règles maison :** sorties de la passe générale, responsabilité du whist, misère sans talon, whist–passe–demi-whist.
- **Joueurs :** deux (Gusarik avec un mort) et quatre (le donneur reste hors jeu) ; la feuille aura alors deux ou quatre secteurs.
- **Bots :** calibrer les enchères ; aujourd'hui ils passent trop souvent, donc les passes générales sont trop fréquentes.
- **Règles :** « помощь » quand une poule dépasse son objectif.
- **Jeu en ligne :** des places distantes via un serveur qui fait tourner ce même moteur (voir la [Bible du projet](../../../../../COSMO_GAME_HUB_BIBLE.md#french), « Jeu en ligne »).
- **Langues :** faire relire les textes en hébreu, espagnol et français par des locuteurs natifs.
