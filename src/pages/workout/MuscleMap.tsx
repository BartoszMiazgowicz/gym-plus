import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getCompletedWorkouts } from '../../data/store';
import { exerciseDatabase } from '../../data/exercises';
import type { MuscleGroup } from '../../types/workout';

// ─── i18n ────────────────────────────────────────────────────────────────────
const MUSCLE_PL: Record<MuscleGroup, string> = {
    chest: 'Klatka piersiowa',
    back: 'Plecy środkowe',
    lats: 'Najszersze grzbietu',
    shoulders: 'Barki',
    biceps: 'Biceps',
    triceps: 'Triceps',
    forearms: 'Przedramiona',
    quadriceps: 'Uda przednie',
    hamstrings: 'Uda tylne',
    glutes: 'Pośladki',
    calves: 'Łydki',
    abs: 'Brzuch',
    traps: 'Trapez',
    cardio: 'Cardio',
    full_body: 'Pełne ciało',
    other: 'Inne',
};

// ─── Scoring ─────────────────────────────────────────────────────────────────
type ScoreMap = Record<string, number>;

function computeScores(days: number): ScoreMap {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const s: ScoreMap = {};
    for (const w of getCompletedWorkouts()) {
        if (new Date(w.started_at).getTime() < cutoff) continue;
        for (const ex of w.exercises) {
            const def = exerciseDatabase.find(e => e.id === ex.exercise_id);
            if (!def) continue;
            const done = ex.sets.filter(set => set.is_completed).length;
            if (!done) continue;
            s[def.primary_muscle] = (s[def.primary_muscle] ?? 0) + done;
            for (const m of def.secondary_muscles)
                s[m] = (s[m] ?? 0) + done * 0.5;
        }
    }
    return s;
}

// ─── Heat colour ─────────────────────────────────────────────────────────────
const LEVELS = [
    { min: 0,  color: 'rgba(255,255,255,0.07)', label: 'Brak' },
    { min: 1,  color: 'rgba(107,159,255,0.50)', label: 'Lekkie' },
    { min: 5,  color: 'rgba(255,184,77,0.72)',  label: 'Umiarkowane' },
    { min: 12, color: 'rgba(255,107,107,0.88)', label: 'Intensywne' },
];

function heat(score?: number): string {
    const s = score ?? 0;
    let col = LEVELS[0].color;
    for (const l of LEVELS) if (s >= l.min) col = l.color;
    return col;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BASE    = 'rgba(255,255,255,0.07)';
const NEUTRAL = 'rgba(255,255,255,0.03)';
const STROKE  = 'rgba(255,255,255,0.10)';

// ─── Front Body SVG ──────────────────────────────────────────────────────────
function FrontBody({ s }: { s: ScoreMap }) {
    const h = (m: MuscleGroup) => heat(s[m]);
    return (
        <svg viewBox="0 0 100 262" width="96" height="251" style={{ display: 'block' }}>
            {/* ── Silhouette base ── */}
            <g fill={BASE} stroke={STROKE} strokeWidth="0.5">
                <circle cx="50" cy="18" r="13" />
                <rect x="44" y="30" width="12" height="12" rx="2" />
                {/* torso */}
                <path d="M 30,42 Q 20,50 20,70 L 20,130 Q 28,136 50,137 Q 72,136 80,130 L 80,70 Q 80,50 70,42 Z" />
                {/* left upper arm */}
                <path d="M 28,47 Q 13,53 11,88 Q 11,112 19,116 Q 23,116 25,110 Q 26,80 28,52 Z" />
                {/* right upper arm */}
                <path d="M 72,47 Q 87,53 89,88 Q 89,112 81,116 Q 77,116 75,110 Q 74,80 72,52 Z" />
                {/* left forearm */}
                <path d="M 11,118 Q 5,124 7,148 Q 11,154 19,152 Q 25,148 25,112 Z" />
                {/* right forearm */}
                <path d="M 89,118 Q 95,124 93,148 Q 89,154 81,152 Q 75,148 75,112 Z" />
                {/* hands */}
                <ellipse cx="7"  cy="156" rx="6" ry="7" fill={NEUTRAL} />
                <ellipse cx="93" cy="156" rx="6" ry="7" fill={NEUTRAL} />
                {/* left thigh */}
                <path d="M 22,140 Q 16,150 20,203 Q 26,209 36,207 Q 48,205 50,146 Q 42,133 22,140 Z" />
                {/* right thigh */}
                <path d="M 50,146 Q 52,205 64,207 Q 74,209 80,203 Q 84,150 78,140 Q 58,133 50,146 Z" />
                {/* left calf */}
                <path d="M 20,205 Q 14,214 18,247 Q 24,253 36,251 Q 48,249 50,205 Q 36,201 20,205 Z" />
                {/* right calf */}
                <path d="M 50,205 Q 52,249 64,251 Q 76,253 82,247 Q 86,214 80,205 Q 64,201 50,205 Z" />
                {/* feet */}
                <ellipse cx="30" cy="254" rx="12" ry="5" fill={NEUTRAL} />
                <ellipse cx="70" cy="254" rx="12" ry="5" fill={NEUTRAL} />
            </g>

            {/* ── Muscle overlays ── */}
            {/* shoulders */}
            <path d="M 28,48 Q 13,55 13,72 Q 13,84 21,86 Q 25,84 27,77 Q 27,61 28,53 Z" fill={h('shoulders')} />
            <path d="M 72,48 Q 87,55 87,72 Q 87,84 79,86 Q 75,84 73,77 Q 73,61 72,53 Z" fill={h('shoulders')} />

            {/* chest */}
            <path d="M 30,42 Q 50,37 70,42 Q 72,76 50,79 Q 28,76 30,42 Z" fill={h('chest')} />

            {/* abs */}
            <path d="M 28,80 Q 50,77 72,80 Q 74,130 50,133 Q 26,130 28,80 Z" fill={h('abs')} />

            {/* biceps */}
            <path d="M 13,57 Q 9,65 11,97 Q 13,112 19,112 Q 23,112 25,106 Q 25,73 23,59 Z" fill={h('biceps')} />
            <path d="M 87,57 Q 91,65 89,97 Q 87,112 81,112 Q 77,112 75,106 Q 75,73 77,59 Z" fill={h('biceps')} />

            {/* forearms */}
            <path d="M 11,114 Q 5,120 7,146 Q 11,152 19,150 Q 25,146 25,110 Z" fill={h('forearms')} />
            <path d="M 89,114 Q 95,120 93,146 Q 89,152 81,150 Q 75,146 75,110 Z" fill={h('forearms')} />

            {/* quads */}
            <path d="M 22,144 Q 16,154 20,201 Q 26,207 36,205 Q 48,203 50,150 Q 42,137 22,144 Z" fill={h('quadriceps')} />
            <path d="M 50,150 Q 52,203 64,205 Q 74,207 80,201 Q 84,154 78,144 Q 58,137 50,150 Z" fill={h('quadriceps')} />

            {/* calves */}
            <path d="M 20,203 Q 14,213 18,245 Q 24,251 36,249 Q 48,247 50,203 Q 36,199 20,203 Z" fill={h('calves')} />
            <path d="M 50,203 Q 52,247 64,249 Q 76,251 82,245 Q 86,213 80,203 Q 64,199 50,203 Z" fill={h('calves')} />
        </svg>
    );
}

// ─── Back Body SVG ───────────────────────────────────────────────────────────
function BackBody({ s }: { s: ScoreMap }) {
    const h = (m: MuscleGroup) => heat(s[m]);
    return (
        <svg viewBox="0 0 100 262" width="96" height="251" style={{ display: 'block' }}>
            {/* ── Silhouette base (same shape as front) ── */}
            <g fill={BASE} stroke={STROKE} strokeWidth="0.5">
                <circle cx="50" cy="18" r="13" />
                <rect x="44" y="30" width="12" height="12" rx="2" />
                <path d="M 30,42 Q 20,50 20,70 L 20,130 Q 28,136 50,137 Q 72,136 80,130 L 80,70 Q 80,50 70,42 Z" />
                <path d="M 28,47 Q 13,53 11,88 Q 11,112 19,116 Q 23,116 25,110 Q 26,80 28,52 Z" />
                <path d="M 72,47 Q 87,53 89,88 Q 89,112 81,116 Q 77,116 75,110 Q 74,80 72,52 Z" />
                <path d="M 11,118 Q 5,124 7,148 Q 11,154 19,152 Q 25,148 25,112 Z" />
                <path d="M 89,118 Q 95,124 93,148 Q 89,154 81,152 Q 75,148 75,112 Z" />
                <ellipse cx="7"  cy="156" rx="6" ry="7" fill={NEUTRAL} />
                <ellipse cx="93" cy="156" rx="6" ry="7" fill={NEUTRAL} />
                <path d="M 22,140 Q 16,150 20,203 Q 26,209 36,207 Q 48,205 50,146 Q 42,133 22,140 Z" />
                <path d="M 50,146 Q 52,205 64,207 Q 74,209 80,203 Q 84,150 78,140 Q 58,133 50,146 Z" />
                <path d="M 20,205 Q 14,214 18,247 Q 24,253 36,251 Q 48,249 50,205 Q 36,201 20,205 Z" />
                <path d="M 50,205 Q 52,249 64,251 Q 76,253 82,247 Q 86,214 80,205 Q 64,201 50,205 Z" />
                <ellipse cx="30" cy="254" rx="12" ry="5" fill={NEUTRAL} />
                <ellipse cx="70" cy="254" rx="12" ry="5" fill={NEUTRAL} />
            </g>

            {/* ── Muscle overlays ── */}
            {/* shoulders (rear delts) */}
            <path d="M 28,48 Q 13,55 13,72 Q 13,84 21,86 Q 25,84 27,77 Q 27,61 28,53 Z" fill={h('shoulders')} />
            <path d="M 72,48 Q 87,55 87,72 Q 87,84 79,86 Q 75,84 73,77 Q 73,61 72,53 Z" fill={h('shoulders')} />

            {/* traps */}
            <path d="M 30,42 Q 50,37 70,42 Q 68,68 50,70 Q 32,68 30,42 Z" fill={h('traps')} />

            {/* lats */}
            <path d="M 30,68 Q 20,74 20,108 Q 26,118 34,112 Q 40,98 38,71 Z" fill={h('lats')} />
            <path d="M 70,68 Q 80,74 80,108 Q 74,118 66,112 Q 60,98 62,71 Z" fill={h('lats')} />

            {/* back middle */}
            <path d="M 34,70 Q 50,68 66,70 Q 68,130 50,132 Q 32,130 34,70 Z" fill={h('back')} />

            {/* triceps */}
            <path d="M 13,57 Q 9,65 11,97 Q 13,112 19,112 Q 23,112 25,106 Q 25,73 23,59 Z" fill={h('triceps')} />
            <path d="M 87,57 Q 91,65 89,97 Q 87,112 81,112 Q 77,112 75,106 Q 75,73 77,59 Z" fill={h('triceps')} />

            {/* forearms */}
            <path d="M 11,114 Q 5,120 7,146 Q 11,152 19,150 Q 25,146 25,110 Z" fill={h('forearms')} />
            <path d="M 89,114 Q 95,120 93,146 Q 89,152 81,150 Q 75,146 75,110 Z" fill={h('forearms')} />

            {/* glutes */}
            <path d="M 22,140 Q 16,150 20,182 Q 26,188 38,186 Q 50,184 50,150 Q 42,133 22,140 Z" fill={h('glutes')} />
            <path d="M 50,150 Q 50,184 62,186 Q 74,188 80,182 Q 84,150 78,140 Q 58,133 50,150 Z" fill={h('glutes')} />

            {/* hamstrings */}
            <path d="M 20,184 Q 16,194 20,207 Q 26,213 36,209 Q 48,207 50,186 Q 40,182 20,184 Z" fill={h('hamstrings')} />
            <path d="M 50,186 Q 52,207 64,209 Q 74,213 80,207 Q 84,194 80,184 Q 60,182 50,186 Z" fill={h('hamstrings')} />

            {/* calves */}
            <path d="M 20,203 Q 14,213 18,245 Q 24,251 36,249 Q 48,247 50,203 Q 36,199 20,203 Z" fill={h('calves')} />
            <path d="M 50,203 Q 52,247 64,249 Q 76,251 82,245 Q 86,213 80,203 Q 64,199 50,203 Z" fill={h('calves')} />
        </svg>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
    { label: '7 dni',  days: 7  },
    { label: '14 dni', days: 14 },
    { label: '30 dni', days: 30 },
];

const ALL_MUSCLES: MuscleGroup[] = [
    'chest', 'back', 'lats', 'traps', 'shoulders',
    'biceps', 'triceps', 'forearms',
    'abs', 'quadriceps', 'hamstrings', 'glutes', 'calves',
];

export default function MuscleMap() {
    const navigate = useNavigate();
    const [days, setDays] = useState(7);
    const scores = computeScores(days);

    const sorted = ALL_MUSCLES
        .map(m => ({ m, score: scores[m] ?? 0 }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

    const totalSets = Object.values(scores).reduce((a, b) => a + (b ?? 0), 0);

    return (
        <div className="page">
            <div className="page-header">
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                    <ChevronLeft size={24} strokeWidth={1.5} />
                </button>
                <h1 className="page-title">Mapa mięśni</h1>
            </div>

            {/* Period selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-lg)' }}>
                {PERIOD_OPTIONS.map(o => (
                    <button
                        key={o.days}
                        onClick={() => setDays(o.days)}
                        className={days === o.days ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ flex: 1 }}
                    >
                        {o.label}
                    </button>
                ))}
            </div>

            {/* Bodies */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                {totalSets === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>💪</div>
                        <div style={{ font: 'var(--body)', color: 'var(--text-muted)' }}>
                            Brak treningów w ostatnich {days} dniach
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 'var(--space-md)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>PRZÓD</div>
                                <FrontBody s={scores} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>TYŁ</div>
                                <BackBody s={scores} />
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                            {LEVELS.map(l => (
                                <div key={l.min} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <span style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>{l.label}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Breakdown list */}
            {sorted.length > 0 && (
                <>
                    <div className="section-label">SZCZEGÓŁY — {days} DNI</div>
                    <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
                        {sorted.map(({ m, score }, i) => {
                            const pct = Math.round((score / (sorted[0].score || 1)) * 100);
                            const color = heat(score);
                            return (
                                <div key={m} style={{
                                    padding: '10px 0',
                                    borderBottom: i < sorted.length - 1 ? '1px solid var(--border-light)' : undefined,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <span style={{ font: 'var(--body)', fontWeight: 500 }}>{MUSCLE_PL[m]}</span>
                                        <span style={{ font: 'var(--caption)', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            {Math.round(score)} serii
                                        </span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-elevated)' }}>
                                        <div style={{
                                            height: '100%',
                                            borderRadius: 2,
                                            width: `${pct}%`,
                                            background: color,
                                            transition: 'width 0.4s ease',
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
