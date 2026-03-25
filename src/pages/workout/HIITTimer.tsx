import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, Pause, RotateCcw, Plus, Minus, Zap, Coffee, Flag, Volume2, VolumeX } from 'lucide-react';

type Phase = 'work' | 'rest' | 'prepare' | 'done';

interface TimerPreset {
    name: string;
    rounds: number;
    workSeconds: number;
    restSeconds: number;
    prepareSeconds: number;
    color: string;
}

const PRESETS: TimerPreset[] = [
    { name: 'Tabata', rounds: 8, workSeconds: 20, restSeconds: 10, prepareSeconds: 5, color: '#FF453A' },
    { name: 'HIIT 30/30', rounds: 10, workSeconds: 30, restSeconds: 30, prepareSeconds: 5, color: '#FF9500' },
    { name: 'HIIT 40/20', rounds: 8, workSeconds: 40, restSeconds: 20, prepareSeconds: 5, color: '#FFC700' },
    { name: 'EMOM', rounds: 10, workSeconds: 60, restSeconds: 0, prepareSeconds: 5, color: '#32D74B' },
    { name: 'Circuit', rounds: 5, workSeconds: 45, restSeconds: 15, prepareSeconds: 10, color: '#4DD4E6' },
];

const PHASE_CONFIG: Record<Phase, { label: string; color: string; icon: typeof Zap }> = {
    prepare: { label: 'PRZYGOTUJ SIĘ', color: '#FFC700', icon: Flag },
    work: { label: 'PRACA!', color: '#FF453A', icon: Zap },
    rest: { label: 'ODPOCZYNEK', color: '#4DD4E6', icon: Coffee },
    done: { label: 'KONIEC!', color: '#32D74B', icon: Flag },
};

// Web Audio beep
function useBeep() {
    const ctxRef = useRef<AudioContext | null>(null);

    const getCtx = () => {
        if (!ctxRef.current) ctxRef.current = new AudioContext();
        return ctxRef.current;
    };

    const beep = useCallback((freq: number, duration: number) => {
        try {
            const ctx = getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch { /* audio not available */ }
    }, []);

    const tick = useCallback(() => beep(880, 0.1), [beep]);
    const phaseChange = useCallback(() => beep(1200, 0.15), [beep]);
    const done = useCallback(() => {
        beep(1000, 0.15);
        setTimeout(() => beep(1200, 0.15), 200);
        setTimeout(() => beep(1500, 0.3), 400);
    }, [beep]);

    return { tick, phaseChange, done };
}

export default function HIITTimer() {
    const navigate = useNavigate();
    const { tick, phaseChange, done } = useBeep();

    // Config
    const [rounds, setRounds] = useState(8);
    const [workSec, setWorkSec] = useState(20);
    const [restSec, setRestSec] = useState(10);
    const [prepareSec, setPrepareSec] = useState(5);
    const [soundOn, setSoundOn] = useState(true);

    // Timer state
    const [isRunning, setIsRunning] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [phase, setPhase] = useState<Phase>('prepare');
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [totalElapsed, setTotalElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const totalTime = prepareSec + rounds * workSec + (rounds - 1) * Math.max(restSec, 0);

    const applyPreset = (p: TimerPreset) => {
        if (isStarted) return;
        setRounds(p.rounds);
        setWorkSec(p.workSeconds);
        setRestSec(p.restSeconds);
        setPrepareSec(p.prepareSeconds);
    };

    const startTimer = () => {
        setIsStarted(true);
        setIsRunning(true);
        setPhase('prepare');
        setTimeLeft(prepareSec);
        setCurrentRound(1);
        setTotalElapsed(0);
        if (soundOn) phaseChange();
    };

    const resetTimer = () => {
        setIsRunning(false);
        setIsStarted(false);
        setPhase('prepare');
        setTimeLeft(0);
        setCurrentRound(1);
        setTotalElapsed(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const togglePause = () => setIsRunning(p => !p);

    const phaseRef = useRef<Phase>('prepare');
    const roundRef = useRef(1);
    const timeRef = useRef(0);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);
    useEffect(() => {
        roundRef.current = currentRound;
    }, [currentRound]);
    useEffect(() => {
        timeRef.current = timeLeft;
    }, [timeLeft]);

    useEffect(() => {
        if (!isRunning || !isStarted) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            const t = timeRef.current;
            const p = phaseRef.current;
            const r = roundRef.current;

            if (t <= 1) {
                // Phase transition
                if (p === 'prepare') {
                    if (soundOn) phaseChange();
                    setPhase('work');
                    setTimeLeft(workSec);
                } else if (p === 'work') {
                    if (r >= rounds) {
                        // All rounds done
                        setPhase('done');
                        setTimeLeft(0);
                        setIsRunning(false);
                        if (soundOn) done();
                    } else if (restSec > 0) {
                        // Go to rest
                        if (soundOn) phaseChange();
                        setPhase('rest');
                        setTimeLeft(restSec);
                    } else {
                        // No rest — next round immediately
                        if (soundOn) phaseChange();
                        setCurrentRound(r + 1);
                        setPhase('work');
                        setTimeLeft(workSec);
                    }
                } else if (p === 'rest') {
                    // Rest done — next round
                    if (soundOn) phaseChange();
                    setCurrentRound(r + 1);
                    setPhase('work');
                    setTimeLeft(workSec);
                }
            } else {
                // Normal countdown
                if (t <= 4 && t > 1 && soundOn) tick();
                setTimeLeft(t - 1);
            }

            setTotalElapsed(e => e + 1);
        }, 1000);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, isStarted, rounds, workSec, restSec, soundOn]);

    const phaseConfig = PHASE_CONFIG[phase];
    const PhaseIcon = phaseConfig.icon;

    const phaseDuration = phase === 'prepare' ? prepareSec : phase === 'work' ? workSec : phase === 'rest' ? restSec : 0;
    const progress = phaseDuration > 0 ? ((phaseDuration - timeLeft) / phaseDuration) : 1;

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const numBtn = (value: number, onChange: (v: number) => void, min: number, max: number, step: number, label: string) => (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <button
                    onClick={() => onChange(Math.max(min, value - step))}
                    disabled={isStarted}
                    style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: '#2C2C2E', border: 'none', cursor: isStarted ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: isStarted ? 0.3 : 1,
                    }}
                >
                    <Minus size={16} color="#fff" />
                </button>
                <div style={{
                    fontSize: 28, fontWeight: 700, color: '#fff',
                    minWidth: 60, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                }}>
                    {label === 'Rundy' ? value : formatTime(value)}
                </div>
                <button
                    onClick={() => onChange(Math.min(max, value + step))}
                    disabled={isStarted}
                    style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: '#2C2C2E', border: 'none', cursor: isStarted ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: isStarted ? 0.3 : 1,
                    }}
                >
                    <Plus size={16} color="#fff" />
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                    <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                </button>
                <span style={{ font: 'var(--heading-3)' }}>Timer HIIT</span>
                <button
                    onClick={() => setSoundOn(p => !p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
                >
                    {soundOn ? <Volume2 size={20} color="#fff" /> : <VolumeX size={20} color="var(--text-dim)" />}
                </button>
            </div>

            {!isStarted ? (
                <div style={{ padding: 'var(--space-md)' }}>
                    {/* Presets */}
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                        Szablony
                    </div>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
                        {PRESETS.map(p => (
                            <button
                                key={p.name}
                                onClick={() => applyPreset(p)}
                                style={{
                                    flexShrink: 0, padding: '10px 16px',
                                    background: '#1C1C1E', border: 'none', borderRadius: 12,
                                    cursor: 'pointer', textAlign: 'left',
                                    borderLeft: `3px solid ${p.color}`,
                                }}
                            >
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{p.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                    {p.rounds}x · {p.workSeconds}s/{p.restSeconds}s
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Config */}
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                        Konfiguracja
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                        {numBtn(rounds, setRounds, 1, 50, 1, 'Rundy')}
                        {numBtn(prepareSec, setPrepareSec, 0, 30, 5, 'Przygotowanie')}
                        {numBtn(workSec, setWorkSec, 5, 300, 5, 'Praca')}
                        {numBtn(restSec, setRestSec, 0, 300, 5, 'Odpoczynek')}
                    </div>

                    {/* Summary */}
                    <div style={{
                        background: '#1C1C1E', borderRadius: 14, padding: '16px 20px',
                        display: 'flex', justifyContent: 'space-between', marginBottom: 24,
                    }}>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>Czas trwania</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{formatTime(totalTime)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>Podsumowanie</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                {rounds} rund · {formatTime(workSec)} praca · {formatTime(restSec)} przerwa
                            </div>
                        </div>
                    </div>

                    {/* Start button */}
                    <button
                        onClick={startTimer}
                        style={{
                            width: '100%', padding: '18px 0',
                            background: '#FF453A', color: '#fff',
                            border: 'none', borderRadius: 16,
                            fontSize: 18, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        }}
                    >
                        <Play size={22} strokeWidth={2.5} /> START
                    </button>
                </div>
            ) : (
                /* Active timer view */
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: 'var(--space-md)',
                    minHeight: 'calc(100vh - 70px)',
                }}>
                    {/* Phase label */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                    }}>
                        <PhaseIcon size={20} style={{ color: phaseConfig.color }} />
                        <span style={{
                            fontSize: 16, fontWeight: 700, color: phaseConfig.color,
                            textTransform: 'uppercase', letterSpacing: 2,
                        }}>
                            {phaseConfig.label}
                        </span>
                    </div>

                    {/* Round indicator */}
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
                        {phase !== 'done' ? `Runda ${currentRound} / ${rounds}` : `${rounds} rund ukończonych`}
                    </div>

                    {/* Circular progress */}
                    <div style={{ position: 'relative', width: 240, height: 240, marginBottom: 32 }}>
                        <svg width={240} height={240} style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx={120} cy={120} r={108} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
                            <circle
                                cx={120} cy={120} r={108}
                                fill="none"
                                stroke={phaseConfig.color}
                                strokeWidth={8}
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 108}
                                strokeDashoffset={2 * Math.PI * 108 * (1 - progress)}
                                style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{
                                fontSize: 64, fontWeight: 800, color: '#fff',
                                fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                            }}>
                                {phase === 'done' ? '00:00' : formatTime(timeLeft)}
                            </div>
                        </div>
                    </div>

                    {/* Round dots */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {Array.from({ length: rounds }, (_, i) => (
                            <div key={i} style={{
                                width: 10, height: 10, borderRadius: '50%',
                                background: i + 1 < currentRound ? '#32D74B'
                                    : i + 1 === currentRound && phase === 'work' ? phaseConfig.color
                                    : 'rgba(255,255,255,0.12)',
                                transition: 'background 0.3s',
                            }} />
                        ))}
                    </div>

                    {/* Total elapsed */}
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 32 }}>
                        Czas: {formatTime(totalElapsed)}
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: 16 }}>
                        <button
                            onClick={resetTimer}
                            style={{
                                width: 60, height: 60, borderRadius: '50%',
                                background: '#2C2C2E', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <RotateCcw size={24} color="#fff" />
                        </button>

                        {phase !== 'done' ? (
                            <button
                                onClick={togglePause}
                                style={{
                                    width: 80, height: 80, borderRadius: '50%',
                                    background: phaseConfig.color, border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                {isRunning
                                    ? <Pause size={32} color="#fff" strokeWidth={2.5} />
                                    : <Play size={32} color="#fff" strokeWidth={2.5} style={{ marginLeft: 4 }} />
                                }
                            </button>
                        ) : (
                            <button
                                onClick={resetTimer}
                                style={{
                                    width: 80, height: 80, borderRadius: '50%',
                                    background: '#32D74B', border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <RotateCcw size={32} color="#fff" strokeWidth={2.5} />
                            </button>
                        )}

                        <button
                            onClick={() => { resetTimer(); navigate(-1); }}
                            style={{
                                width: 60, height: 60, borderRadius: '50%',
                                background: '#2C2C2E', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 600, color: '#FF453A',
                            }}
                        >
                            Wyjdź
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
