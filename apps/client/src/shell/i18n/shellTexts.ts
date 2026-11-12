// =====================================================================
// FILE: apps/client/src/shell/i18n/shellTexts.ts
// PURPOSE: the texts of the hub's own pages (home, games, about, leaderboard, header, footer) in the five languages
//   of every project (RU, EN, HE right-to-left, ES, FR — decision of 08.11.2026). The pages are static Astro: they
//   are written in English and marked with data-i18n keys; applyLanguage.ts swaps the texts in the browser for the
//   language chosen anywhere on the site (the same choice as inside the games).
// [RU] Тексты собственных страниц хаба (главная, игры, о проекте, лидеры, шапка, подвал) на пяти языках всех
//   проектов. Страницы — статический Astro: написаны по-английски и помечены ключами data-i18n; applyLanguage.ts
//   подменяет тексты в браузере на язык, выбранный где угодно на сайте (тот же выбор, что и внутри игр).
// =====================================================================
import type { Language } from '@shared/i18n/languages';

type Texts = Readonly<Record<Language, string>>;
const t = (en: string, ru: string, he: string, es: string, fr: string): Texts => Object.freeze({ en, ru, he, es, fr });

export const SHELL_TEXTS: Readonly<Record<string, Texts>> = Object.freeze({
    // Page titles («… | Cosmo Game Hub»)
    'title.home': t('Home', 'Главная', 'ראשי', 'Inicio', 'Accueil'),
    'title.games': t('Games', 'Игры', 'משחקים', 'Juegos', 'Jeux'),
    'title.about': t('About', 'О проекте', 'אודות', 'Acerca de', 'À propos'),
    'title.leaderboard': t('Leaderboard', 'Лидеры', 'טבלת מובילים', 'Clasificación', 'Classement'),
    'title.chess': t('Chess', 'Шахматы', 'שחמט', 'Ajedrez', 'Échecs'),
    'title.preferans': t('Preferans', 'Преферанс', 'פרפרנס', 'Preferans', 'Préférence'),
    'title.poker': t('Poker', 'Покер', 'פוקר', 'Póquer', 'Poker'),
    'title.battleship': t('Sea Battle', 'Морской бой', 'צוללות', 'Batalla naval', 'Bataille navale'),
    'title.checkers': t('Checkers', 'Шашки', 'דמקה', 'Damas', 'Dames'),

    // Header
    'nav.games': t('Games', 'Игры', 'משחקים', 'Juegos', 'Jeux'),
    'nav.leaderboard': t('Leaderboard', 'Лидеры', 'מובילים', 'Clasificación', 'Classement'),
    'nav.about': t('About', 'О проекте', 'אודות', 'Acerca de', 'À propos'),
    'nav.login': t('Login · soon', 'Вход · скоро', 'כניסה · בקרוב', 'Entrar · pronto', 'Connexion · bientôt'),
    'nav.loginTitle': t('Player accounts are coming soon', 'Аккаунты игроков появятся скоро', 'חשבונות שחקנים יגיעו בקרוב', 'Las cuentas de jugador llegarán pronto', 'Les comptes joueurs arrivent bientôt'),
    'nav.language': t('Language', 'Язык', 'שפה', 'Idioma', 'Langue'),
    'nav.surprises': t('Surprises', 'Неожиданности', 'הפתעות', 'Sorpresas', 'Surprises'),
    'nav.surprisesTitle': t(
        'Ravens, black cats, comets and gulls now and then show up in the games — press to switch them off or on',
        'В играх время от времени появляются вороны, чёрные коты, кометы и чайки — нажмите, чтобы выключить или включить',
        'עורבים, חתולים שחורים, שביטים ושחפים מופיעים מדי פעם במשחקים — לחצו כדי לכבות או להדליק',
        'Cuervos, gatos negros, cometas y gaviotas aparecen a veces en los juegos: pulsa para apagarlos o encenderlos',
        'Corbeaux, chats noirs, comètes et mouettes surgissent parfois dans les jeux — appuyez pour les couper ou les remettre',
    ),
    'nav.sound': t('Sound', 'Звук', 'צליל', 'Sonido', 'Son'),
    'nav.soundTitle': t(
        'The opponent’s voice, applause and fanfares at the end of a game — press to switch them off or on',
        'Голос соперника, аплодисменты и фанфары в конце партии — нажмите, чтобы выключить или включить',
        'קול היריב, מחיאות כפיים ותרועות בסוף המשחק — לחצו כדי לכבות או להדליק',
        'La voz del rival, los aplausos y las fanfarrias al final de la partida: pulsa para apagarlos o encenderlos',
        'La voix de l’adversaire, les applaudissements et les fanfares en fin de partie — appuyez pour les couper ou les remettre',
    ),

    // Footer
    'footer.rights': t('© 2026 Cosmo Game Hub. All rights reserved.', '© 2026 Cosmo Game Hub. Все права защищены.', '© 2026 Cosmo Game Hub. כל הזכויות שמורות.', '© 2026 Cosmo Game Hub. Todos los derechos reservados.', '© 2026 Cosmo Game Hub. Tous droits réservés.'),
    'footer.source': t('Source code on GitHub', 'Исходный код на GitHub', 'קוד המקור ב־GitHub', 'Código fuente en GitHub', 'Code source sur GitHub'),
    'footer.engine': t('Chess engine: Stockfish (GPL-3.0)', 'Шахматный движок: Stockfish (GPL-3.0)', 'מנוע השחמט: Stockfish (GPL-3.0)', 'Motor de ajedrez: Stockfish (GPL-3.0)', 'Moteur d’échecs\u00a0: Stockfish (GPL-3.0)'),
    'footer.license': t('License', 'Лицензия', 'רישיון', 'Licencia', 'Licence'),
    'footer.code': t('Source code', 'Исходный код', 'קוד מקור', 'Código fuente', 'Code source'),

    // Home
    'home.title': t('Welcome to Cosmo Game Hub', 'Добро пожаловать в Cosmo Game Hub', 'ברוכים הבאים ל־Cosmo Game Hub', 'Bienvenido a Cosmo Game Hub', 'Bienvenue sur Cosmo Game Hub'),
    'home.subtitle': t(
        'Your platform for playing, learning and competing in classic logic games — on a computer, a tablet or a phone.',
        'Ваша площадка, чтобы играть, учиться и соревноваться в классических логических играх — на компьютере, планшете или телефоне.',
        'הפלטפורמה שלכם לשחק, ללמוד ולהתחרות במשחקי היגיון קלאסיים — במחשב, בטאבלט או בטלפון.',
        'Tu plataforma para jugar, aprender y competir en juegos clásicos de lógica, en el ordenador, la tableta o el móvil.',
        'Votre plateforme pour jouer, apprendre et rivaliser aux jeux de logique classiques — sur ordinateur, tablette ou téléphone.'),
    'home.start': t('Start playing', 'Начать играть', 'להתחיל לשחק', 'Empezar a jugar', 'Commencer à jouer'),

    // Games
    'games.title': t('Our games collection', 'Наша коллекция игр', 'אוסף המשחקים שלנו', 'Nuestra colección de juegos', 'Notre collection de jeux'),
    'games.soonTitle': t('Coming soon', 'Скоро', 'בקרוב', 'Próximamente', 'Bientôt'),
    'games.soonText': t('More classic logic games are on the way!', 'Новые классические логические игры уже в пути!', 'משחקי היגיון קלאסיים נוספים בדרך!', '¡Más juegos clásicos de lógica están en camino!', 'D’autres jeux de logique classiques arrivent\u00a0!'),
    'card.play': t('Play now', 'Играть', 'לשחק עכשיו', 'Jugar ahora', 'Jouer'),
    'card.soon': t('Coming soon', 'Скоро', 'בקרוב', 'Próximamente', 'Bientôt'),
    'badge.Hot': t('Hot', 'Хит', 'חם', 'Popular', 'Populaire'),
    'badge.New': t('New', 'Новинка', 'חדש', 'Nuevo', 'Nouveau'),
    'badge.Soon': t('Soon', 'Скоро', 'בקרוב', 'Pronto', 'Bientôt'),
    'game.chess.title': t('Chess', 'Шахматы', 'שחמט', 'Ajedrez', 'Échecs'),
    'game.chess.description': t(
        'Classic strategic board game for two players. Master your tactics and checkmate the king.',
        'Классическая стратегическая игра для двоих. Оттачивайте тактику и ставьте мат королю.',
        'משחק לוח אסטרטגי קלאסי לשניים. שכללו את הטקטיקה ותנו מט למלך.',
        'Clásico juego de estrategia para dos. Domina la táctica y da jaque mate al rey.',
        'Le grand jeu de stratégie pour deux joueurs. Affûtez votre tactique et matez le roi.'),
    'game.checkers.title': t('Checkers', 'Шашки', 'דמקה', 'Damas', 'Dames'),
    'game.checkers.description': t(
        'Draughts on the cracked marble of the lair: Russian rules with flying kings or English ones, compulsory captures, a hero of the vampire lair as the opponent, three levels of play.',
        'Шашки на треснувшем мраморе логова: русские правила с летающими дамками или английские, обязательное взятие, соперник — герой вампирского логова, три уровня игры.',
        'דמקה על השיש הסדוק של המאורה: חוקים רוסיים עם מלכים מעופפים או חוקים אנגליים, אכילה חובה, גיבור ממאורת הערפדים כיריב, שלוש רמות משחק.',
        'Damas sobre el mármol agrietado de la guarida: reglas rusas con damas voladoras o inglesas, captura obligatoria, un héroe de la guarida de vampiros como rival, tres niveles de juego.',
        'Les dames sur le marbre fendu du repaire : règles russes avec dames volantes ou règles anglaises, prise obligatoire, un héros du repaire de vampires pour adversaire, trois niveaux de jeu.'),
    'game.go.title': t('Go', 'Го', 'גו', 'Go', 'Go'),
    'game.go.description': t(
        'Ancient abstract strategy game: surround more territory than your opponent.',
        'Древняя стратегическая игра: окружите больше территории, чем соперник.',
        'משחק אסטרטגיה עתיק: הקיפו יותר שטח מהיריב.',
        'Antiguo juego de estrategia: rodea más territorio que tu rival.',
        'Ancien jeu de stratégie\u00a0: encerclez plus de territoire que l’adversaire.'),
    'game.rent.title': t('Blood Rent', 'Кровная рента', 'שכר דירה בדם', 'Renta de sangre', 'Loyer du sang'),
    'game.rent.description': t(
        'Our own trading board game of cosmic horror: buy up the sectors of a dead station, pay rent in credits — or in flesh on infected sectors — and outlive thirty monsters before the station collapses.',
        'Наша собственная торговая настольная игра в жанре космического хоррора: скупайте сектора мёртвой станции, платите ренту кредитами — а на заражённых секторах плотью — и переживите тридцать чудовищ, пока станция не рухнула.',
        'משחק לוח מסחרי משלנו של אימת חלל: קנו את הגזרות של תחנה מתה, שלמו שכירות בקרדיטים — ובגזרות נגועות בבשר — ושרדו שלושים מפלצות לפני שהתחנה קורסת.',
        'Nuestro propio juego de mesa de comercio y horror cósmico: compra los sectores de una estación muerta, paga la renta en créditos —o en carne en los sectores infectados— y sobrevive a treinta monstruos antes de que la estación se derrumbe.',
        'Notre propre jeu de plateau de commerce et d’horreur cosmique : achetez les secteurs d’une station morte, payez le loyer en crédits — ou en chair sur les secteurs infectés — et survivez à trente monstres avant l’effondrement de la station.'),
    'game.preferans.title': t('Preferans', 'Преферанс', 'פרפרנס', 'Preferans', 'Préférence'),
    'game.preferans.description': t(
        'The classic card game of bidding and whist: Sochi, Leningrad, Rostov and Classic rules, two to four at the table, against fair bots with characters in a vampire lair.',
        'Классическая карточная игра торговли и виста: Сочинка, Ленинградка, Ростовка и Классика, от двух до четырёх за столом, против честных ботов с характерами в вампирском логове.',
        'משחק הקלפים הקלאסי של מכרז וויסט: סוצ׳י, לנינגרד, רוסטוב וקלאסיקה, שניים עד ארבעה ליד השולחן, מול בוטים הוגנים עם אופי במאורת ערפדים.',
        'El clásico juego de cartas de subasta y whist: reglas de Sochi, Leningrado, Rostov y Clásica, de dos a cuatro en la mesa, contra bots honestos con carácter en una guarida de vampiros.',
        'Le jeu de cartes classique des enchères et du whist\u00a0: règles de Sotchi, Leningrad, Rostov et Classique, de deux à quatre à table, face à des bots honnêtes et pleins de caractère dans un repaire de vampires.'),
    'game.poker.title': t('Poker', 'Покер', 'פוקר', 'Póquer', 'Poker'),
    'game.poker.description': t(
        'No-limit Texas hold’em, a sit-and-go of two to six: rising blinds, side pots, and the regulars of the vampire lair as opponents, each with a poker manner of their own. Play chips only.',
        'Безлимитный техасский холдем, турнир на выбывание от двух до шести: растущие блайнды, побочные банки и завсегдатаи вампирского логова в соперниках, у каждого своя покерная манера. Только игровые фишки.',
        'טקסס הולדם ללא הגבלה, טורניר הדחה לשניים עד שישה: בליינדים עולים, קופות צד, וקבועי מאורת הערפדים כיריבים, לכל אחד סגנון פוקר משלו. רק אסימוני משחק.',
        'Texas hold’em sin límite, torneo de eliminación de dos a seis: ciegas que suben, botes secundarios y los habituales de la guarida de vampiros como rivales, cada uno con su estilo de póker. Solo fichas de juego.',
        'Texas hold’em sans limite, tournoi à élimination de deux à six : blindes qui montent, pots annexes et les habitués du repaire de vampires pour adversaires, chacun avec sa manière de jouer. Jetons de jeu seulement.'),
    'game.battleship.title': t('Sea Battle', 'Морской бой', 'צוללות', 'Batalla naval', 'Bataille navale'),
    'game.battleship.description': t(
        'Battleship on a night sea: the classic notebook rules or the boxed ones, a hero of the vampire lair as the opponent, three levels of gunnery. Set out your fleet and find the other one first.',
        'Морской бой на ночном море: тетрадная классика или коробочные правила, соперник — герой вампирского логова, три уровня меткости. Расставьте флот и найдите чужой первым.',
        'צוללות בים לילי: חוקי המחברת הקלאסיים או חוקי הקופסה, גיבור ממאורת הערפדים כיריב, שלוש רמות של קליעה. הציבו את הצי ומצאו את של היריב ראשונים.',
        'Batalla naval en un mar nocturno: las reglas clásicas de cuaderno o las de caja, un héroe de la guarida de vampiros como rival, tres niveles de puntería. Coloca tu flota y encuentra antes la ajena.',
        'Bataille navale sur une mer nocturne\u00a0: les règles classiques du cahier ou celles de la boîte, un héros du repaire de vampires pour adversaire, trois niveaux de tir. Disposez votre flotte et trouvez l’autre en premier.',
    ),
    'game.tic-tac-toe.title': t('Tic-Tac-Toe', 'Крестики-нолики', 'איקס עיגול', 'Tres en raya', 'Morpion'),
    'game.tic-tac-toe.description': t(
        'A quick and fun logic game, perfect for a short break.',
        'Быстрая и весёлая логическая игра — как раз для короткого перерыва.',
        'משחק היגיון מהיר ומשעשע, מושלם להפסקה קצרה.',
        'Un juego de lógica rápido y divertido, perfecto para un descanso.',
        'Un jeu de logique rapide et amusant, idéal pour une courte pause.'),
    'game.snake.title': t('Cosmo Snake', 'Космическая змейка', 'נחש קוסמי', 'Serpiente cósmica', 'Serpent cosmique'),
    'game.snake.description': t(
        'Guide your snake through space, collect stars and grow as long as you can without crashing.',
        'Ведите змейку через космос, собирайте звёзды и растите как можно длиннее, не разбившись.',
        'הובילו את הנחש בחלל, אספו כוכבים וגדלו כמה שיותר בלי להתרסק.',
        'Guía tu serpiente por el espacio, recoge estrellas y crece todo lo posible sin chocar.',
        'Guidez votre serpent dans l’espace, ramassez des étoiles et grandissez sans vous écraser.'),

    // About
    'about.title': t('About Cosmo Game Hub', 'О Cosmo Game Hub', 'אודות Cosmo Game Hub', 'Acerca de Cosmo Game Hub', 'À propos de Cosmo Game Hub'),
    'about.mission': t('Our mission', 'Наша цель', 'המטרה שלנו', 'Nuestra misión', 'Notre mission'),
    'about.missionText': t(
        'A modern, fast home for classic logic games — chess, preferans and more to come — that plays as well with a finger on a phone or tablet as with a mouse on a computer. Beginner or grandmaster, you will find your challenge here.',
        'Современный и быстрый дом для классических логических игр — шахмат, преферанса и не только, — где играть одинаково удобно пальцем на телефоне или планшете и мышью на компьютере. Новичок вы или гроссмейстер, здесь найдётся ваш вызов.',
        'בית מודרני ומהיר למשחקי היגיון קלאסיים — שחמט, פרפרנס ועוד בדרך — שנוח לשחק בו באצבע בטלפון או בטאבלט באותה מידה כמו בעכבר במחשב. מתחילים או רבי־אמנים — כאן תמצאו את האתגר שלכם.',
        'Un hogar moderno y rápido para los juegos clásicos de lógica (ajedrez, preferans y más por venir) que se juega igual de bien con el dedo en el móvil o la tableta que con el ratón en el ordenador. Principiante o gran maestro, aquí encontrarás tu reto.',
        'Une maison moderne et rapide pour les jeux de logique classiques — échecs, préférence et d’autres à venir — qui se joue aussi bien du doigt sur téléphone ou tablette qu’à la souris sur ordinateur. Débutant ou grand maître, vous trouverez ici votre défi.'),
    'about.stack': t('Technology', 'Технологии', 'טכנולוגיה', 'Tecnología', 'Technologie'),
    'about.stack1': t('Built with Astro for speed and search engines.', 'Сделано на Astro — быстро и понятно поисковикам.', 'בנוי ב־Astro — מהיר וידידותי למנועי חיפוש.', 'Hecho con Astro, rápido y fácil para los buscadores.', 'Construit avec Astro, rapide et clair pour les moteurs de recherche.'),
    'about.stack2': t('Styled with Tailwind CSS and CSS Modules for a responsive look on every screen.', 'Оформлено на Tailwind CSS и CSS Modules — удобно на любом экране.', 'מעוצב ב־Tailwind CSS וב־CSS Modules — נוח בכל מסך.', 'Con estilos en Tailwind CSS y CSS Modules, cómodo en cualquier pantalla.', 'Mis en forme avec Tailwind CSS et CSS Modules, agréable sur tous les écrans.'),
    'about.stack3': t('Interactive islands in React run the game logic.', 'Логику игр ведут интерактивные острова на React.', 'איים אינטראקטיביים ב־React מריצים את לוגיקת המשחקים.', 'Islas interactivas en React llevan la lógica de los juegos.', 'Des îlots interactifs en React font tourner la logique des jeux.'),
    'about.stack4': t('Computer players think in Web Workers, so the page stays responsive while they do.', 'Компьютерные соперники думают в Web Worker, поэтому страница не замирает, пока они размышляют.', 'שחקני המחשב חושבים ב־Web Worker, כך שהדף נשאר זמין בזמן שהם חושבים.', 'Los rivales del ordenador piensan en Web Workers, así la página no se congela mientras tanto.', 'Les adversaires de l’ordinateur réfléchissent dans des Web Workers\u00a0: la page reste réactive pendant ce temps.'),
    'about.open': t('Open source', 'Открытый код', 'קוד פתוח', 'Código abierto', 'Code ouvert'),
    'about.open1': t('The chess engine is', 'Шахматный движок —', 'מנוע השחמט הוא', 'El motor de ajedrez es', 'Le moteur d’échecs est'),
    'about.open2': t(
        ', compiled to JavaScript by the stockfish.js project (version 10.0.2) and distributed under the',
        ', скомпилированный в JavaScript проектом stockfish.js (версия 10.0.2) и распространяемый по',
        ', שהודר ל־JavaScript על ידי פרויקט stockfish.js (גרסה 10.0.2) ומופץ תחת',
        ', compilado a JavaScript por el proyecto stockfish.js (versión 10.0.2) y distribuido bajo la',
        ', compilé en JavaScript par le projet stockfish.js (version 10.0.2) et distribué sous la'),
    'about.gpl': t('GNU General Public License v3', 'лицензии GNU GPL v3', 'רישיון GNU GPL v3', 'licencia GNU GPL v3', 'licence GNU GPL v3'),
    'about.open3': t('. Its complete source code is available at', '. Его полный исходный код доступен в', '. קוד המקור המלא שלו זמין ב־', '. Su código fuente completo está en', '. Son code source complet est disponible sur'),
    'about.cta': t('Start playing now', 'Начать играть', 'להתחיל לשחק עכשיו', 'Empezar a jugar', 'Commencer à jouer'),

    // Leaderboard
    'leaders.title': t('Top players', 'Лучшие игроки', 'השחקנים המובילים', 'Mejores jugadores', 'Meilleurs joueurs'),
    'leaders.demo': t('Demo', 'Демо', 'הדגמה', 'Demo', 'Démo'),
    'leaders.note': t(
        'Sample data for now: real rankings will appear once player accounts and saved games arrive.',
        'Пока это примерные данные: настоящий рейтинг появится вместе с аккаунтами игроков и сохранёнными партиями.',
        'בינתיים אלה נתוני דוגמה: דירוג אמיתי יופיע עם חשבונות השחקנים והמשחקים השמורים.',
        'Por ahora son datos de ejemplo: la clasificación real llegará con las cuentas de jugador y las partidas guardadas.',
        'Données d’exemple pour l’instant\u00a0: le vrai classement arrivera avec les comptes joueurs et les parties sauvegardées.'),
    'leaders.rank': t('Rank', 'Место', 'מקום', 'Puesto', 'Rang'),
    'leaders.player': t('Player', 'Игрок', 'שחקן', 'Jugador', 'Joueur'),
    'leaders.score': t('Score', 'Очки', 'ניקוד', 'Puntos', 'Score'),
    'leaders.game': t('Game', 'Игра', 'משחק', 'Juego', 'Jeu'),
});

/** The text of a key in a language, English when a key or language is missing. */
export const shellText = (key: string, language: Language): string | null => SHELL_TEXTS[key]?.[language] ?? SHELL_TEXTS[key]?.en ?? null;
