// [EN] FILE: shared/finale/sound.ts — the sounds of the end of a game, made in the browser, no files: a sad trombone
//      and a mocking laugh when you lose, a brass fanfare with timpani when you win, and the hero's own voice (the
//      speech of the browser in the language of the game). Nothing plays while the sound switch of the header is off;
//      a language the browser has no voice for stays silent rather than mumbling in a foreign accent.
// [RU] ФАЙЛ: звуки конца партии, созданные в браузере, без файлов: грустный тромбон и издевательский смех при
//      проигрыше, медные фанфары с литаврами при победе и голос самого героя (синтез речи браузера на языке игры).
//      Пока выключатель звука в шапке выключен, ничего не звучит; язык, для которого у браузера нет голоса, молчит,
//      а не бормочет с чужим акцентом.
import type { Language } from '../i18n/languages.ts';
import { SOUND_KEY, VOICE_LANG, soundEnabled, voiceOf, type Outcome } from './logic.ts';

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

/**
 * [EN] You lost: the sad trombone — wah, wah, wah, waaah with a wobble — and then a cartoon «ha-ha-ha-ha».
 * [RU] Вы проиграли: грустный тромбон — уа, уа, уа, уаааа с дрожью — и следом мультяшное «ха-ха-ха-ха».
 */
function mock(ctx: AudioContext): void {
    const out = master(ctx);
    const notes: readonly [number, number][] = [[293.7, 0.36], [277.2, 0.36], [261.6, 0.36]];
    notes.forEach(([freq, length], index) => play(ctx, out, { at: index * 0.42, length, freq, to: freq * 0.97, volume: 0.22, bright: 1400 }));
    play(ctx, out, { at: 1.3, length: 1.35, freq: 246.9, to: 233, volume: 0.22, vibrato: 7, bright: 1400 });
    // [EN] four syllables of laughter, each lower than the one before [RU] четыре слога смеха, каждый ниже предыдущего
    for (let index = 0; index < 4; index++) {
        const at = 2.85 + index * 0.17;
        play(ctx, out, { at, length: 0.12, freq: 330 - index * 22, to: 250 - index * 18, type: 'square', volume: 0.09, bright: 2400 });
        noise(ctx, out, at, 0.1, 1300, 0.12);
    }
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

/** [EN] Plays the music of the end. [RU] Играет музыку конца. */
export function playFinale(outcome: Outcome): void {
    if (!soundOn()) return;
    const ctx = audio();
    if (!ctx) return;
    try {
        if (outcome === 'lose') mock(ctx);
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
