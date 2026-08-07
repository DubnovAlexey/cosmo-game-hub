// [EN] EngineManager class encapsulates the Web Worker and UCI protocol communication
// [RU] Класс EngineManager инкапсулирует общение с Web Worker и протоколом UCI
export class EngineManager {
    // [EN] Reference to the background thread (Worker)
    // [RU] Ссылка на фоновый поток (Worker)
    private worker: Worker | null = null;

    // [EN] Flag to track if the engine is ready
    // [RU] Флаг для отслеживания готовности движка
    private isReady: boolean = false;

    // [EN] Callback to resolve the Promise when the best move is found
    // [RU] Коллбэк для успешного выполнения Promise, когда найден лучший ход
    private bestMoveResolve: ((move: string) => void) | null = null;

    constructor() {
        this.init();
    }

    // [EN] FIX: exposes engine readiness to callers — previously `isReady` was set on 'readyok' but
    // never read anywhere, which TypeScript's noUnusedLocals correctly flagged (TS6133). This getter
    // makes it genuinely usable (e.g. for a future "engine loading..." indicator) without changing any
    // existing behavior — getBestMove still sends commands immediately, exactly as before.
    // [RU] ИСПРАВЛЕНИЕ: открывает готовность движка для вызывающего кода — раньше `isReady`
    // выставлялся при 'readyok', но нигде не читался, что noUnusedLocals в TypeScript корректно
    // пометил как ошибку (TS6133). Этот геттер делает поле реально полезным (например, для будущего
    // индикатора "движок загружается...") без изменения текущего поведения — getBestMove по-прежнему
    // отправляет команды сразу же, как и раньше.
    public get ready(): boolean {
        return this.isReady;
    }

    // [EN] Initialize the Web Worker and send initial UCI commands
    // [RU] Инициализация Web Worker и отправка начальных команд UCI
    private init() {
        if (typeof window === 'undefined') return; // [EN] SSR Guard [RU] Защита от серверного рендеринга (SSR)

        // [EN] Instantiate the worker directly from the public asset.
        // [EN] FIX: prefixed with import.meta.env.BASE_URL. The old hardcoded '/engines/chess/stockfish.js'
        // only worked because the site was served from the domain root. Once deployed to GitHub Pages
        // under base: '/cosmo-game-hub', the real file lives at /cosmo-game-hub/engines/chess/stockfish.js —
        // a raw string path like this doesn't go through Astro's asset resolution, so it needs the
        // base prefix added explicitly, unlike @assets imports which get it automatically.
        // [RU] Создаем экземпляр воркера напрямую из публичного ассета.
        // [RU] ИСПРАВЛЕНИЕ: добавлен префикс import.meta.env.BASE_URL. Старый жёстко прописанный путь
        // '/engines/chess/stockfish.js' работал только потому, что сайт отдавался из корня домена.
        // После деплоя на GitHub Pages с base: '/cosmo-game-hub' реальный файл лежит по адресу
        // /cosmo-game-hub/engines/chess/stockfish.js — такая сырая строка не проходит через
        // резолвинг ассетов Astro, поэтому префикс base нужно добавлять вручную, в отличие от
        // импортов через @assets, которые получают его автоматически.
        this.worker = new Worker(`${import.meta.env.BASE_URL}/engines/chess/stockfish.js`);

        // [EN] Listen for messages from the engine
        // [RU] Слушаем сообщения от движка
        this.worker.onmessage = (event: MessageEvent) => {
            const line = event.data as string;

            // [EN] Engine confirms it is ready
            // [RU] Движок подтверждает свою готовность
            if (line === 'readyok') {
                this.isReady = true;
            }

            // [EN] Parse the best move from the engine output
            // [RU] Парсим лучший ход из вывода движка
            if (line.startsWith('bestmove')) {
                // [EN] Example output: "bestmove e2e4 ponder e7e5"
                // [RU] Пример вывода: "bestmove e2e4 ponder e7e5"
                const parts = line.split(' ');
                const move = parts[1]; // [EN] 'e2e4' [RU] Извлекаем 'e2e4'

                if (this.bestMoveResolve) {
                    this.bestMoveResolve(move);
                    this.bestMoveResolve = null; // [EN] Clear callback [RU] Очищаем коллбэк во избежание утечек памяти
                }
            }
        };

        // [EN] Initialize the UCI protocol
        // [RU] Инициализируем протокол UCI
        this.sendCommand('uci');
        this.sendCommand('isready');
    }

    // [EN] Helper method to safely send commands to the engine
    // [RU] Вспомогательный метод для безопасной отправки команд движку
    private sendCommand(command: string) {
        if (this.worker) {
            this.worker.postMessage(command);
        }
    }

    // [EN] Request the best move based on current FEN and difficulty level
    // [RU] Запрос лучшего хода на основе текущего FEN и уровня сложности
    public getBestMove(fen: string, level: number): Promise<string> {
        return new Promise((resolve) => {
            if (!this.worker) {
                resolve('');
                return;
            }

            // [EN] Store the resolve function to call it later in onmessage
            // [RU] Сохраняем функцию resolve, чтобы вызвать её позже в onmessage
            this.bestMoveResolve = resolve;

            // [EN] Map our 1-10 level to Stockfish's Skill Level (0-20)
            // [RU] Преобразуем наш уровень 1-10 в уровень навыка Stockfish (0-20)
            const stockfishSkillLevel = Math.round((level / 10) * 20);

            // [EN] Configure engine strength
            // [RU] Настраиваем силу движка
            this.sendCommand(`setoption name Skill Level value ${stockfishSkillLevel}`);

            // [EN] Set the current board position
            // [RU] Устанавливаем текущую позицию на доске
            this.sendCommand(`position fen ${fen}`);

            // [EN] Tell engine to start searching. Depth limits the search speed.
            // [RU] Даем команду на поиск. Глубина (Depth) ограничивает скорость поиска.
            const depth = Math.max(1, Math.round(level * 1.5));
            this.sendCommand(`go depth ${depth}`);
        });
    }

    // [EN] Cleanup method to terminate the worker
    // [RU] Метод очистки для принудительного завершения работы воркера
    public destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}