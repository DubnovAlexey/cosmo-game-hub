// [EN] FILE: games/checkers/components/scenes.ts — the pictures of the end of a game, all from Alexey's folder «Шашки»
//      (11.11.2026): a player of the lair at a board, your hand at its edge. Each of the sixteen players is a hero of
//      the lair too, so a game against one of them ends with that player's own scene, whatever the outcome. Against
//      anybody else a victory shows a player who is losing to you (the countess deep in thought, the old gravedigger,
//      the plague doctor), a defeat a player who has beaten you and knows it, a draw the two old enemies of the cover
//      or the quartet of four worlds. Which scene of a pool a game shows depends on its seed, so it is the same after
//      a reload. Every picture is whole, only scaled down to 720 × 393 (public/games/checkers/scenes/<hero>.webp).
// [RU] ФАЙЛ: картинки конца партии, все из папки Алексея «Шашки» (11.11.2026): игрок логова за доской, ваша рука у её
//      края. Каждый из шестнадцати игроков — ещё и герой логова, поэтому партия против него кончается его собственной
//      сценой, чем бы она ни кончилась. Против всех остальных победа показывает игрока, который вам проигрывает
//      (графиня в раздумье, старый могильщик, чумной доктор), поражение — того, кто вас обыграл и знает это, ничья —
//      двух старых врагов с обложки или квартет четырёх миров. Какую сцену из набора покажет партия, зависит от её
//      зерна, поэтому после перезагрузки она та же. Каждая картинка целиком, только уменьшена до 720 × 393
//      (public/games/checkers/scenes/<герой>.webp).
// noinspection ES6PreferShortImport
import type { CharacterId } from '../../../shared/characters/roster.ts';

export const SCENE_WIDTH = 720;
export const SCENE_HEIGHT = 393;

/** [EN] The heroes pictured at a board, each with a scene of their own. [RU] Герои, нарисованные за доской, — у каждого своя сцена. */
export const SCENE_PLAYERS = Object.freeze([
    'velmira', 'kostolom', 'strelyany', 'violet', 'prokhor', 'kvartet', 'morok', 'bagryana',
    'rogach', 'agata', 'serebryana', 'scarlett', 'letitia', 'ogneslava', 'celestine', 'vivien',
] as const satisfies readonly CharacterId[]);
type ScenePlayer = (typeof SCENE_PLAYERS)[number];

const POOLS: Readonly<Record<SceneOutcome, readonly ScenePlayer[]>> = Object.freeze({
    won: ['velmira', 'prokhor', 'morok'],
    lost: ['strelyany', 'violet', 'bagryana', 'rogach', 'agata', 'serebryana', 'scarlett', 'letitia', 'ogneslava', 'celestine', 'vivien'],
    draw: ['kostolom', 'kvartet'],
});

export type SceneOutcome = 'won' | 'lost' | 'draw';

const sceneOf = (player: ScenePlayer): string => `games/checkers/scenes/${player}.webp`;
const isScenePlayer = (id: string): id is ScenePlayer => (SCENE_PLAYERS as readonly string[]).includes(id);

/** [EN] The scene for this end of this game against this opponent (a path from the base URL). [RU] Сцена для этого конца этой партии против этого соперника (путь от базового адреса). */
export function scenePath(outcome: SceneOutcome, seed: number, opponent: CharacterId | null = null): string {
    if (opponent !== null && isScenePlayer(opponent)) return sceneOf(opponent);
    const pool = POOLS[outcome];
    return sceneOf(pool[(seed >>> 0) % pool.length]);
}

/** [EN] Every scene, for the tests. [RU] Все сцены — для тестов. */
export const ALL_SCENES: readonly string[] = Object.freeze(SCENE_PLAYERS.map(sceneOf));
