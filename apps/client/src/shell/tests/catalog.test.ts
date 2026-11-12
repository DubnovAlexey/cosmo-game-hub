// [EN] FILE: shell/tests/catalog.test.ts — the catalog of the hub: every picture of a card lies in public/, the cover
//      comes first and our variants follow it, every card has its title and description in all five languages, and no
//      game borrows a branded name (Alexey's trading game is «Кровная рента», never a copy of a branded one).
// [RU] ФАЙЛ: каталог хаба: каждая картинка карточки лежит в public/, обложка идёт первой, наши варианты — за ней, у
//      каждой карточки есть название и описание на всех пяти языках, и ни одна игра не берёт фирменное имя (торговая
//      игра Алексея — «Кровная рента», а не копия фирменной).
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
// noinspection ES6PreferShortImport
import { games } from '../data/mockGames.ts';
// noinspection ES6PreferShortImport
import { SHELL_TEXTS } from '../i18n/shellTexts.ts';
// noinspection ES6PreferShortImport
import { nextCover } from '../utils/coverCycle.ts';

const PUBLIC = fileURLToPath(new URL('../../../public/', import.meta.url));

test('every picture of the catalog is on disk, the cover first and our variants after it', () => {
    for (const game of games) {
        const pictures = [game.coverUrl, ...(game.covers ?? [])].filter((path): path is string => Boolean(path));
        if (game.covers?.length) assert.ok(game.coverUrl, `${game.title}: variants without a cover`);
        assert.equal(new Set(pictures).size, pictures.length, `${game.title}: a picture twice`);
        for (const path of pictures) assert.ok(existsSync(PUBLIC + path.replace(/^\//, '')), `${game.title}: no ${path}`);
    }
});

test('every card speaks five languages, and no game borrows a branded name', () => {
    for (const game of games) {
        const slug = game.gameUrl.split('/').filter(Boolean).pop() ?? '';
        for (const key of [`game.${slug}.title`, `game.${slug}.description`]) {
            const texts = SHELL_TEXTS[key];
            assert.ok(texts, `${key} is missing`);
            for (const language of ['en', 'ru', 'he', 'es', 'fr'] as const) assert.ok(texts[language], `${key} (${language})`);
        }
        assert.doesNotMatch(`${game.title} ${game.description}`, /monopol/i, game.title);
    }
});

test('the covers go round, the cover first again after the last variant', () => {
    assert.equal(nextCover(0, 4), 1);
    assert.equal(nextCover(3, 4), 0);
    assert.equal(nextCover(0, 1), 0);
    assert.equal(nextCover(0, 0), 0);
});
