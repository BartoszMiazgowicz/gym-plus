import { getUser } from '../data/store';

type SoundType = 'beep' | 'bell' | 'chime' | 'buzz' | 'none';

let audioCtx: AudioContext | null = null;
function getCtx() {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

const SOUNDS: Record<Exclude<SoundType, 'none'>, () => void> = {
    beep: () => {
        tone(1000, 0.15);
        setTimeout(() => tone(1200, 0.15), 200);
        setTimeout(() => tone(1500, 0.3), 400);
    },
    bell: () => {
        tone(830, 0.6, 'sine', 0.25);
        setTimeout(() => tone(1050, 0.4, 'sine', 0.2), 150);
    },
    chime: () => {
        tone(523, 0.2, 'triangle', 0.3);
        setTimeout(() => tone(659, 0.2, 'triangle', 0.3), 150);
        setTimeout(() => tone(784, 0.3, 'triangle', 0.3), 300);
    },
    buzz: () => {
        tone(200, 0.4, 'sawtooth', 0.15);
        setTimeout(() => tone(200, 0.4, 'sawtooth', 0.15), 500);
    },
};

export function playRestEndSound() {
    try {
        const soundType = getUser().rest_timer_sound || 'beep';
        if (soundType === 'none') return;
        SOUNDS[soundType]();
    } catch { /* audio not available */ }
}

export function previewSound(type: SoundType) {
    try {
        if (type === 'none') return;
        SOUNDS[type]();
    } catch { /* audio not available */ }
}

export const SOUND_LABELS: Record<SoundType, string> = {
    beep: 'Bip',
    bell: 'Dzwonek',
    chime: 'Melodia',
    buzz: 'Wibracja',
    none: 'Brak',
};
