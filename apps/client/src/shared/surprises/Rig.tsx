// [EN] FILE: shared/surprises/Rig.tsx — draws a rigged photograph (rigs.ts) as one SVG: the body is the photo with
//      the parts cut out (even-odd clip), every part is the same photo clipped to its outline in a group that turns
//      round its joint, lids lie over the eyes. All moves are CSS animations of SVG groups (transform-box: view-box,
//      the joint in px of the picture): no filters, cheap on a phone.
// [RU] ФАЙЛ: рисует оснащённую фотографию (rigs.ts) одним SVG: тело — фотография с вырезанными частями (обрезка
//      even-odd), каждая часть — та же фотография, обрезанная по своему контуру, в группе, которая поворачивается
//      вокруг сустава; поверх глаз лежат веки. Все движения — CSS-анимации групп SVG (transform-box: view-box, сустав
//      в px картинки): без фильтров, дёшево для телефона.
import React, { useId } from 'react';
import type { Rig } from './rigs';
import styles from './Surprises.module.css';

type Points = Rig['parts'][number]['points'];
const path = (points: Points): string => `M${points.map(([x, y]) => `${x} ${y}`).join('L')}Z`;

/**
 * [EN] The outline pulled 3 px toward its centre: the body keeps a thin band under the edge of every part, so the
 *      part lies on it with an overlap and no light seam shows along the cut.
 * [RU] Контур, стянутый на 3 px к своему центру: тело сохраняет тонкую полоску под краем каждой части, часть ложится на
 *      неё внахлёст, и вдоль разреза не видно светлого шва.
 */
function shrink(points: Points, by = 3): Points {
    const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length;
    const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length;
    return points.map(([x, y]) => {
        const length = Math.hypot(cx - x, cy - y) || 1;
        return [Math.round((x + ((cx - x) * by) / length) * 10) / 10, Math.round((y + ((cy - y) * by) / length) * 10) / 10] as const;
    });
}

export const RigFigure: React.FC<{ href: string; rig: Rig; size: number }> = ({ href, rig, size }) => {
    const id = useId().replace(/[^a-zA-Z0-9]/g, '');
    const { width: w, height: h } = rig;
    const photo = (clip: string): React.ReactElement => <image href={href} width={w} height={h} clipPath={`url(#${id}-${clip})`} />;
    // [EN] An eye: the flare (if any) under the lid, so a blink hides it too. [RU] Глаз: вспышка (если есть) под веком, моргание прячет и её.
    const lidsOf = (part?: string): React.ReactElement[] => rig.eyes.filter(eye => eye.part === part).map(eye => (
        <g key={`${eye.x}-${eye.y}`}>
            {eye.glow && <circle className={styles.eyeFlare} cx={eye.x} cy={eye.y} r={Math.max(eye.rx, eye.ry) * 1.1} fill={eye.glow} />}
            <ellipse className={styles.lid} cx={eye.x} cy={eye.y} rx={eye.rx} ry={eye.ry} fill={eye.lid}
                style={{ transformOrigin: `${eye.x}px ${eye.y - eye.ry}px` }} />
        </g>
    ));
    return (
        <svg width={size} height={(size * h) / w} viewBox={`0 0 ${w} ${h}`} className={styles.rig}>
            <defs>
                <clipPath id={`${id}-body`}>
                    <path clipRule="evenodd" d={`M0 0H${w}V${h}H0Z${rig.parts.filter(part => !part.overlay).map(part => path(rig.translucent ? part.points : shrink(part.points))).join('')}`} />
                </clipPath>
                {rig.parts.map(part => <clipPath key={part.name} id={`${id}-${part.name}`}><path d={path(part.points)} /></clipPath>)}
            </defs>
            <g className={rig.breathe ? styles.breathe : undefined} style={{ transformOrigin: `${w / 2}px ${h}px` }}>
                {/* [EN] the dark of an open mouth under a jaw that moves away / [RU] темнота открытого рта под отходящей челюстью */}
                {rig.parts.filter(part => part.fill).map(part => <path key={`${part.name}-fill`} d={path(part.points)} fill={part.fill} />)}
                {photo('body')}
                {lidsOf()}
                {rig.parts.map(part => (
                    <g key={part.name} className={styles[part.move]} style={{ transformOrigin: `${part.pivot[0]}px ${part.pivot[1]}px` }}>
                        {photo(part.name)}
                        {lidsOf(part.name)}
                    </g>
                ))}
            </g>
        </svg>
    );
};
