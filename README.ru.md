# Cosmo Game Hub

[English](README.md) · [עברית](README.he.md) · **Русский**

Веб-платформа классических логических игр. Первая игра — шахматы против движка Stockfish — полностью готова. Остальные игры в разработке и показаны в коллекции с пометкой «Скоро».

**Демо:** https://dubnovalexey.github.io/cosmo-game-hub/

## Возможности

- Шахматы против компьютера: игра белыми или чёрными, сила движка от 1 до 10.
- Контроль времени: 3 и 5 минут (блиц), 10 минут (рапид), 30 минут (классика).
- История ходов, взятые фигуры, окно превращения пешки и звуки ходов.
- Экран конца партии: победа, поражение, ничья.
- Сыгранную партию можно скачать файлом PGN — это стандартный формат записи шахматных партий.
- Движок работает в Web Worker, поэтому доска не замирает, пока компьютер думает.
- Коллекция игр и таблица лидеров. Пока нет аккаунтов игроков, таблица показывает демо-данные.

## Технологии

Astro 7 · React 19 · TypeScript · Tailwind CSS 4 · chess.js · react-chessboard · Stockfish в Web Worker · npm workspaces · GitHub Actions · GitHub Pages

## Устройство проекта

```text
apps/client/                    сайт на Astro; игры — React-острова
  src/components/games/chess/   доска, часы, история ходов, окна
  src/hooks/useChessLogic.ts    состояние партии поверх chess.js
  src/utils/engine/             Stockfish в Web Worker (протокол UCI)
  public/engines/chess/         файл движка, его лицензия и ссылка на исходники
.github/workflows/deploy.yml    сборка и публикация на GitHub Pages при каждом push в main
```

## Что я отработал

- Подключение шахматного движка через Web Worker и текстовый протокол UCI.
- Состояние партии в React-хуках поверх chess.js: ходы, шах, мат, превращение пешки, часы.
- Отрисовку тяжёлого компонента только в браузере (`client:only`), чтобы движок не запускался при сборке.
- Публикацию Astro-сайта из монорепозитория на GitHub Pages с базовым путём `/cosmo-game-hub/`.

## Запуск на своём компьютере

Нужен Node.js 22.12 или новее.

```sh
npm install
npm run dev --workspace client
```

Затем откройте http://localhost:4321/cosmo-game-hub/. Сайт использует тот же базовый путь, что и на GitHub Pages.

Сборка статического сайта: `npm run build --workspace client` (результат — в `apps/client/dist/`).

## Планы

- Общая оболочка игр: настройки, часы, история ходов и экран конца партии для всех игр.
- Новые игры по одной: сначала крестики-нолики, Cosmo Snake и шашки, потом большие карточные и настольные игры.
- Аккаунты игроков и настоящая таблица лидеров.
- Юнит-тесты и проверка каждого pull request.

## Авторы и лицензии

- Шахматный движок: [Stockfish](https://stockfishchess.org/), собранный в JavaScript проектом stockfish.js (версия 10.0.2), лицензия GPL-3.0. Текст лицензии и ссылка на полный исходный код — в папке [`apps/client/public/engines/chess`](apps/client/public/engines/chess/README.md).
- Библиотеки: [chess.js](https://github.com/jhlywa/chess.js) (BSD-2-Clause), [react-chessboard](https://github.com/Clariity/react-chessboard) (MIT).

## Проверки движка

`npm test` из корня проверяет готовность Worker, очередность UCI-запросов и освобождение ожиданий при закрытии. Поздние ответы после изменения позиции или размонтирования не применяются. Для сборки: `npm run build --workspace client`.
