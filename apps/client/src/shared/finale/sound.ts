// [EN] FILE: shared/finale/sound.ts — the sounds of the end of a game, made in the browser, no files: a grown-up
//      mockery of its own for every scene when you lose (slow sarcastic applause and a tossed coin; a funeral bell and
//      the smallest violin in the world; a heavy sigh and «tsk-tsk-tsk»; a tin medal and limp polite claps), a brass
//      fanfare with timpani when you win, and the hero's own voice (the speech of the browser in the language of the
//      game). Nothing plays while the sound switch of the header is off; a language the browser has no voice for
//      stays silent rather than mumbling in a foreign accent.
// [RU] ФАЙЛ: звуки конца партии, созданные в браузере, без файлов: при проигрыше — своя взрослая издёвка для каждой
//      сцены (медленные саркастические аплодисменты и брошенная монета; похоронный колокол и самая маленькая скрипка в
//      мире; тяжёлый вздох и «тц-тц-тц»; жестяная медаль и вялые вежливые хлопки), при победе — медные фанфары с
//      литаврами, и голос самого героя (синтез речи браузера на языке игры). Пока выключатель звука в шапке выключен,
//      ничего не звучит; язык, для которого у браузера нет голоса, молчит, а не бормочет с чужим акцентом.
import type { Language } from '../i18n/languages.ts';
import { SOUND_KEY, VOICE_LANG, soundEnabled, voiceOf, type MockScene, type Outcome } from './logic.ts';

let context: AudioContext | null = null;

/** [EN] Whether the player keeps the sound on. [RU] Оставил ли игрок звук включённым. */
export function soundOn(): boolean {
    try {
        return soundEnabled(globalThis.localStorage?.getItem(SOUND_KEY) ?? null);
    } catch {
        return true;
    }
}

function audio(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
        context ??= new AudioContext();
        if (context.state === 'suspended') void context.resume();
        return context;
    } catch {
        return null;
    }
}

interface Note {
    readonly at: number; // [EN] seconds from now / [RU] секунд от «сейчас»
    readonly length: number;
    readonly freq: number;
    readonly to?: number; // [EN] the pitch slides here / [RU] высота съезжает сюда
    readonly type?: OscillatorType;
    readonly volume?: number;
    readonly vibrato?: number; // [EN] depth, Hz / [RU] глубина, Гц
    readonly bright?: number; // [EN] the filter opens to this, Hz / [RU] фильтр раскрывается до этого, Гц
}

/** [EN] One brassy note: a saw wave through a low-pass filter that opens and closes like a lip on a mouthpiece.
 *  [RU] Одна «медная» нота: пила через фильтр, который открывается и закрывается, как губы на мундштуке. */
function play(ctx: AudioContext, out: AudioNode, note: Note): void {
    const start = ctx.currentTime + note.at;
    const end = start + note.length;
    const osc = ctx.createOscillator();
    osc.type = note.type ?? 'sawtooth';
    osc.frequency.setValueAtTime(note.freq, start);
    if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, end);
    if (note.vibrato) {
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.frequency.value = 6;
        depth.gain.value = note.vibrato;
        lfo.connect(depth).connect(osc.frequency);
        lfo.start(start);
        lfo.stop(end);
    }
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, start);
    filter.frequency.linearRampToValueAtTime(note.bright ?? 1800, start + Math.min(0.08, note.length / 3));
    filter.frequency.linearRampToValueAtTime(700, end);
    const gain = ctx.createGain();
    const volume = note.volume ?? 0.2;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.03);
    gain.gain.setValueAtTime(volume, end - Math.min(0.12, note.length / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(filter).connect(gain).connect(out);
    osc.start(start);
    osc.stop(end + 0.02);
}

/** [EN] A burst of filtered noise: breath of a laugh, a drum. [RU] Вспышка отфильтрованного шума: выдох смеха, удар барабана. */
function noise(ctx: AudioContext, out: AudioNode, at: number, length: number, freq: number, volume: number, kind: BiquadFilterType = 'bandpass'): void {
    const start = ctx.currentTime + at;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = kind;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(filter).connect(gain).connect(out);
    source.start(start);
}

function master(ctx: AudioContext): GainNode {
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    gain.connect(ctx.destination);
    return gain;
}

/** [EN] The stone hall of the crypt: a short echo that comes back a few times. [RU] Каменный зал склепа: короткое эхо, которое возвращается несколько раз. */
function crypt(ctx: AudioContext, out: AudioNode): AudioNode {
    const input = ctx.createGain();
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.21;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.38;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2200;
    input.connect(out);
    input.connect(delay).connect(tone).connect(feedback).connect(delay);
    tone.connect(out);
    return input;
}

/** [EN] One clap: two palms, a sharp crack of noise with a body under it. [RU] Один хлопок: две ладони, резкий треск шума с «телом» под ним. */
function clap(ctx: AudioContext, out: AudioNode, at: number, volume: number): void {
    noise(ctx, out, at, 0.06, 1400, volume);
    noise(ctx, out, at + 0.008, 0.12, 900, volume * 0.6);
}

/** [EN] A coin on stone: bright, slightly out-of-tune partials that die fast. [RU] Монета о камень: яркие, чуть расстроенные обертоны, быстро гаснущие. */
function clink(ctx: AudioContext, out: AudioNode, at: number, volume: number): void {
    for (const [freq, share] of [[2637, 1], [3951, 0.6], [5274, 0.35], [6912, 0.2]] as const) {
        play(ctx, out, { at, length: 0.35, freq, type: 'sine', volume: volume * share, bright: 12000 });
    }
}

/**
 * [EN] You lost — and they look down on you, the grown-up way (Alexey, 12.11.2026: «не детская дразнилка, а серьёзная
 *      издевательская сцена… как серьёзные люди издеваются»): the lights go out with a heavy switch, a slow
 *      sarcastic applause rings through the stone crypt, a coin is tossed to you as alms — it clinks, bounces, rolls and
 *      lies still — and then the winner's cold words.
 * [RU] Вы проиграли — и на вас смотрят свысока, по-взрослому (Алексей, 12.11.2026: «не детская дразнилка, а серьёзная
 *      издевательская сцена… как серьёзные люди издеваются»): свет гаснет с тяжёлым щелчком рубильника, по каменному
 *      склепу разносятся медленные саркастические аплодисменты, вам бросают монету-подачку — она звенит, подпрыгивает,
 *      катится и замирает, — а потом холодные слова победителя.
 */
function alms(ctx: AudioContext): void {
    const out = master(ctx);
    const hall = crypt(ctx, out);
    // [EN] the switch and the dark falling [RU] рубильник и падающая темнота
    noise(ctx, hall, 0, 0.05, 3000, 0.3, 'highpass');
    play(ctx, out, { at: 0.02, length: 1.2, freq: 70, to: 42, type: 'sine', volume: 0.32 });
    // [EN] six slow claps, the last two even slower [RU] шесть медленных хлопков, последние два ещё медленнее
    [0.8, 1.45, 2.1, 2.75, 3.55, 4.45].forEach((at, index) => clap(ctx, hall, at, 0.5 - index * 0.03));
    // [EN] the coin: tossed, hits the floor, bounces twice, rattles to rest [RU] монета: брошена, ударяется об пол, дважды подпрыгивает, дребезжит и замирает
    [[5.15, 0.16], [5.42, 0.11], [5.6, 0.07]].forEach(([at, volume]) => clink(ctx, hall, at, volume));
    for (let index = 0; index < 9; index++) clink(ctx, out, 5.72 + index * (0.05 - index * 0.004), 0.03);
}

/**
 * [EN] Condolences: one low funeral bell, then «the smallest violin in the world» — a thin, tiny, mock-tragic tune.
 * [RU] Соболезнования: один низкий похоронный колокол, потом «самая маленькая скрипка в мире» — тонкая, крошечная,
 *      притворно-трагическая мелодия.
 */
function condolences(ctx: AudioContext): void {
    const out = master(ctx);
    const hall = crypt(ctx, out);
    for (const [freq, share] of [[110, 1], [220, 0.5], [264, 0.35], [347, 0.25]] as const) {
        play(ctx, hall, { at: 0, length: 2.4, freq, type: 'sine', volume: 0.22 * share, bright: 4000 });
    }
    // [EN] A minor, high and thin, with a sobbing vibrato. [RU] Ля минор, высоко и тонко, с всхлипывающим вибрато.
    const tune: readonly [number, number][] = [[1760, 0.5], [1568, 0.25], [1397, 0.25], [1319, 0.5], [1175, 0.35], [1319, 0.25], [1397, 0.9]];
    let at = 1.1;
    for (const [freq, length] of tune) {
        play(ctx, out, { at, length, freq, type: 'triangle', volume: 0.06, vibrato: 14, bright: 6000 });
        at += length + 0.03;
    }
}

/**
 * [EN] A shake of the head: a long, heavy, disappointed sigh, «tsk-tsk-tsk», and a second, shorter sigh.
 * [RU] Покачивание головой: долгий, тяжёлый, разочарованный вздох, «тц-тц-тц» и второй, короткий вздох.
 */
function headshake(ctx: AudioContext): void {
    const out = master(ctx);
    noise(ctx, out, 0.25, 1.5, 500, 0.35, 'lowpass');
    play(ctx, out, { at: 0.3, length: 1.3, freq: 150, to: 95, type: 'sine', volume: 0.08 });
    for (const at of [1.95, 2.2, 2.45]) noise(ctx, out, at, 0.025, 4200, 0.5, 'highpass');
    noise(ctx, out, 2.9, 0.7, 450, 0.25, 'lowpass');
}

/**
 * [EN] A medal for taking part: a cheap tin «clank», then a few limp, polite claps of a bored audience.
 * [RU] Медаль за участие: дешёвый жестяной «звяк», потом несколько вялых вежливых хлопков скучающей публики.
 */
function medal(ctx: AudioContext): void {
    const out = master(ctx);
    const hall = crypt(ctx, out);
    for (const [freq, share] of [[880, 1], [1243, 0.7], [1717, 0.4]] as const) {
        play(ctx, hall, { at: 1.2, length: 0.5, freq, type: 'triangle', volume: 0.09 * share, bright: 5000 });
    }
    [1.9, 2.15, 2.5, 2.62, 3.05, 3.3].forEach((at, index) => clap(ctx, hall, at, 0.22 - index * 0.02));
}

/**
 * [EN] You won: a timpani roll under a brass call G-C-E-G and a long C major chord, warm and solemn.
 * [RU] Вы победили: дробь литавр под медный призыв соль-до-ми-соль и долгий до-мажорный аккорд, тёплый и торжественный.
 */
function honour(ctx: AudioContext): void {
    const out = master(ctx);
    for (let index = 0; index < 10; index++) noise(ctx, out, index * 0.06, 0.12, 140, 0.18 - index * 0.012, 'lowpass');
    play(ctx, out, { at: 0, length: 0.5, freq: 98, to: 82, type: 'sine', volume: 0.3 });
    const call: readonly [number, number][] = [[392, 0.2], [523.3, 0.2], [659.3, 0.2], [784, 0.55]];
    call.forEach(([freq, length], index) => play(ctx, out, { at: 0.45 + index * 0.22, length, freq, volume: 0.16, bright: 2600 }));
    for (const freq of [523.3, 659.3, 784, 1046.5]) play(ctx, out, { at: 1.45, length: 1.6, freq, volume: 0.09, vibrato: 3, bright: 2200 });
    play(ctx, out, { at: 1.45, length: 0.8, freq: 98, to: 80, type: 'sine', volume: 0.32 });
    noise(ctx, out, 1.45, 0.5, 160, 0.22, 'lowpass');
}

/**
 * [EN] An award for a losing streak: a solemn fanfare that goes sour on purpose — the third note flat, the last chord
 *      wrong — then a slow, heavy applause in the crypt.
 * [RU] Награда за серию проигрышей: торжественные фанфары, нарочно фальшивые — третья нота ниже, последний аккорд
 *      неправильный, — потом медленные тяжёлые аплодисменты в склепе.
 */
function award(ctx: AudioContext): void {
    const out = master(ctx);
    const hall = crypt(ctx, out);
    for (let index = 0; index < 8; index++) noise(ctx, out, index * 0.06, 0.12, 140, 0.16 - index * 0.015, 'lowpass');
    const call: readonly [number, number][] = [[392, 0.2], [523.3, 0.2], [640, 0.2], [770, 0.6]];
    call.forEach(([freq, length], index) => play(ctx, out, { at: 0.4 + index * 0.22, length, freq, volume: 0.15, bright: 2400 }));
    for (const freq of [523.3, 622.3, 740, 987.8]) play(ctx, out, { at: 1.4, length: 1.3, freq, volume: 0.08, vibrato: 9, bright: 2000 });
    play(ctx, out, { at: 1.4, length: 0.8, freq: 98, to: 70, type: 'sine', volume: 0.3 });
    [2.9, 3.55, 4.2, 4.9].forEach((at, index) => clap(ctx, hall, at, 0.45 - index * 0.04));
}

/**
 * [EN] The super medal «Clinical Idiot»: the sour fanfare, then a salute — rockets whistle up, burst, crackle, and
 *      every burst comes down with a wet splat (the fireworks are made of dung, Alexey's idea).
 * [RU] Супермедаль «Клинический идиот»: фальшивые фанфары, потом салют — ракеты со свистом взлетают, лопаются,
 *      трещат, и каждый разрыв падает мокрым шлепком (фейерверк из говна — идея Алексея).
 */
function clinical(ctx: AudioContext): void {
    award(ctx);
    const out = master(ctx);
    [2.1, 2.7, 3.4, 4.0, 4.7].forEach((at, index) => {
        play(ctx, out, { at, length: 0.45, freq: 600 + index * 60, to: 1900 + index * 120, type: 'sine', volume: 0.05, bright: 8000 });
        noise(ctx, out, at + 0.45, 0.3, 300, 0.45, 'lowpass');
        for (let crack = 0; crack < 5; crack++) noise(ctx, out, at + 0.55 + crack * 0.05, 0.02, 3500, 0.12, 'highpass');
        noise(ctx, out, at + 0.95, 0.2, 500, 0.3, 'lowpass');
    });
}

const MOCKERY: Readonly<Record<MockScene | 'award' | 'clinical', (ctx: AudioContext) => void>> = { alms, condolences, headshake, medal, award, clinical };

/** [EN] Plays the music of the end: honour for a win, the scene's own mockery for a loss. [RU] Играет музыку конца: почёт при победе, свою издёвку сцены при проигрыше. */
export function playFinale(outcome: Outcome, scene: MockScene | 'award' | 'clinical'): void {
    if (!soundOn()) return;
    const ctx = audio();
    if (!ctx) return;
    try {
        if (outcome === 'lose') MOCKERY[scene](ctx);
        else honour(ctx);
    } catch {
        // [EN] an old browser without some node: the picture is enough / [RU] старый браузер без какого-то узла: хватит и картинки
    }
}

/** [EN] The hero says the line aloud, if the browser has a voice for this language. [RU] Герой произносит реплику вслух, если у браузера есть голос для этого языка. */
export function speakLine(line: string, language: Language, outcome: Outcome, female: boolean): void {
    if (!soundOn() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const say = () => {
        const voices = window.speechSynthesis.getVoices().filter(voice => voice.lang.toLowerCase().startsWith(VOICE_LANG[language]));
        if (voices.length === 0) return;
        const utterance = new SpeechSynthesisUtterance(line);
        utterance.voice = voices.find(voice => voice.localService) ?? voices[0];
        utterance.lang = utterance.voice.lang;
        const { pitch, rate } = voiceOf(outcome, female);
        utterance.pitch = pitch;
        utterance.rate = rate;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };
    // [EN] The list of voices arrives a moment after the page opens. [RU] Список голосов приходит чуть позже открытия страницы.
    if (window.speechSynthesis.getVoices().length > 0) say();
    else window.speechSynthesis.addEventListener('voiceschanged', say, { once: true });
}

/** [EN] Stops the voice (the finale was closed). [RU] Останавливает голос (финал закрыли). */
export function hush(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
