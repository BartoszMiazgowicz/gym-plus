import { useState } from 'react';
import { getCompletedWorkouts, getPRs } from '../../data/store';
import { exerciseDatabase, muscleGroupNames } from '../../data/exercises';
import { estimate1RM, formatDateShort, formatDuration } from '../../utils/calculations';
import { getUser } from '../../data/store';
import { ChevronLeft, Flame, Dumbbell, TrendingUp, Trophy, Target, BarChart3, Clock, Zap, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Period = 'week' | 'month' | 'all';

export default function PRStats() {
    const navigate = useNavigate();
    const workouts = getCompletedWorkouts();
    const user = getUser();
    const prs = getPRs();
    const [period, setPeriod] = useState<Period>('week');
    const [expandedEx, setExpandedEx] = useState<string | null>(null);

    // --- Time filters ---
    const now = Date.now();
    const periodMs: Record<Period, number> = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        all: Infinity,
    };
    const periodLabel: Record<Period, string> = { week: 'Tydzień', month: 'Miesiąc', all: 'Wszystko' };
    const filtered = workouts.filter(w => now - new Date(w.started_at).getTime() < periodMs[period]);

    // --- Aggregate stats ---
    const totalWorkouts = filtered.length;
    const totalSets = filtered.reduce((s, w) => s + w.total_sets, 0);
    const totalReps = filtered.reduce((s, w) => s + w.total_reps, 0);
    const totalVolume = filtered.reduce((s, w) => s + w.total_volume_kg, 0);
    const totalDuration = filtered.reduce((s, w) => s + (w.duration_seconds || 0), 0);
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    const avgVolume = totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;

    // --- Streak calculation ---
    const daySet = new Set(workouts.map(w => new Date(w.started_at).toISOString().slice(0, 10)));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (daySet.has(key)) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }

    // --- Muscle group breakdown ---
    const muscleHits = new Map<string, number>();
    filtered.forEach(w => {
        w.exercises.forEach(ex => {
            const info = exerciseDatabase.find(e => e.id === ex.exercise_id);
            if (info) {
                const completedSets = ex.sets.filter(s => s.is_completed).length;
                muscleHits.set(info.primary_muscle, (muscleHits.get(info.primary_muscle) || 0) + completedSets);
                info.secondary_muscles.forEach(m => {
                    muscleHits.set(m, (muscleHits.get(m) || 0) + Math.round(completedSets * 0.5));
                });
            }
        });
    });
    const muscleEntries = Array.from(muscleHits.entries()).sort((a, b) => b[1] - a[1]);
    const maxMuscleHits = muscleEntries[0]?.[1] || 1;

    // --- Weekly volume chart (last 8 weeks) ---
    const weeklyVolume: { label: string; value: number }[] = [];
    for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now - i * 7 * 24 * 60 * 60 * 1000);
        const vol = workouts
            .filter(w => {
                const d = new Date(w.started_at).getTime();
                return d >= weekStart.getTime() && d < weekEnd.getTime();
            })
            .reduce((s, w) => s + w.total_volume_kg, 0);
        const label = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`;
        weeklyVolume.push({ label, value: vol });
    }
    const maxWeekVol = Math.max(...weeklyVolume.map(w => w.value), 1);

    // --- Exercise PRs from workout history ---
    const exercisePRs = new Map<string, {
        maxWeight: number; maxWeightReps: number; maxWeightDate: string;
        maxReps: number; maxRepsWeight: number; maxRepsDate: string;
        est1RM: number; est1RMWeight: number; est1RMReps: number; est1RMDate: string;
        maxVolume: number; maxVolumeDate: string;
        totalSets: number;
    }>();

    workouts.forEach(w => {
        w.exercises.forEach(ex => {
            const key = ex.exercise_id;
            const current = exercisePRs.get(key) || {
                maxWeight: 0, maxWeightReps: 0, maxWeightDate: '',
                maxReps: 0, maxRepsWeight: 0, maxRepsDate: '',
                est1RM: 0, est1RMWeight: 0, est1RMReps: 0, est1RMDate: '',
                maxVolume: 0, maxVolumeDate: '',
                totalSets: 0,
            };

            let exVolume = 0;
            ex.sets.filter(s => s.is_completed).forEach(s => {
                current.totalSets++;
                if (s.weight_kg && s.reps) {
                    exVolume += s.weight_kg * s.reps;

                    if (s.weight_kg > current.maxWeight) {
                        current.maxWeight = s.weight_kg;
                        current.maxWeightReps = s.reps;
                        current.maxWeightDate = w.started_at;
                    }
                    if (s.reps > current.maxReps) {
                        current.maxReps = s.reps;
                        current.maxRepsWeight = s.weight_kg;
                        current.maxRepsDate = w.started_at;
                    }
                    const est = estimate1RM(s.weight_kg, s.reps, user.one_rm_formula);
                    if (est > current.est1RM) {
                        current.est1RM = est;
                        current.est1RMWeight = s.weight_kg;
                        current.est1RMReps = s.reps;
                        current.est1RMDate = w.started_at;
                    }
                } else if (s.reps && !s.weight_kg) {
                    if (s.reps > current.maxReps) {
                        current.maxReps = s.reps;
                        current.maxRepsWeight = 0;
                        current.maxRepsDate = w.started_at;
                    }
                }
            });
            if (exVolume > current.maxVolume) {
                current.maxVolume = exVolume;
                current.maxVolumeDate = w.started_at;
            }

            exercisePRs.set(key, current);
        });
    });

    const prEntries = Array.from(exercisePRs.entries()).sort((a, b) => b[1].est1RM - a[1].est1RM);

    // --- Recent PRs from store ---
    const recentPRs = [...prs].sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime()).slice(0, 5);

    const prTypeLabel: Record<string, string> = {
        max_weight: 'Najcięższy ciężar',
        max_reps: 'Maks. powtórzeń',
        estimated_1rm: 'Szacowane 1RM',
    };

    const statCard = (icon: React.ReactNode, value: string, label: string, accent?: string) => (
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ marginBottom: 8, opacity: 0.6 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: accent || 'var(--text-primary)', marginBottom: 2 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{label}</div>
        </div>
    );

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)' }}>Statystyki</span>
                </div>
            </div>

            {/* Period selector */}
            <div className="flex gap-xs mb-lg">
                {(['week', 'month', 'all'] as Period[]).map(p => (
                    <button
                        key={p}
                        className={`chip ${period === p ? 'active' : ''}`}
                        onClick={() => setPeriod(p)}
                        style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 13, fontWeight: 600 }}
                    >
                        {periodLabel[p]}
                    </button>
                ))}
            </div>

            {/* Streak + overview */}
            {streak > 0 && (
                <div className="card-gradient" style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'rgba(255, 149, 0, 0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Zap size={24} style={{ color: '#FF9500' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{streak} {streak === 1 ? 'dzień' : streak < 5 ? 'dni' : 'dni'} z rzędu</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Twoja aktualna passa treningowa</div>
                    </div>
                </div>
            )}

            {/* Main stats grid */}
            <div className="section-label">PODSUMOWANIE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 'var(--space-lg)' }}>
                {statCard(<Flame size={18} />, String(totalWorkouts), 'Treningi')}
                {statCard(<Dumbbell size={18} />, String(totalSets), 'Serie')}
                {statCard(<Target size={18} />, totalReps.toLocaleString(), 'Powtórzenia')}
                {statCard(<TrendingUp size={18} />, `${(totalVolume / 1000).toFixed(1)}t`, 'Objętość')}
                {statCard(<Clock size={18} />, formatDuration(avgDuration), 'Śr. czas')}
                {statCard(<BarChart3 size={18} />, `${(avgVolume / 1000).toFixed(1)}t`, 'Śr. objętość')}
            </div>

            {/* Weekly volume chart */}
            <div className="section-label">OBJĘTOŚĆ TYGODNIOWA</div>
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
                    {weeklyVolume.map((w, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{
                                width: '100%', borderRadius: 4,
                                background: i === weeklyVolume.length - 1 ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                                height: Math.max(4, (w.value / maxWeekVol) * 80),
                                transition: 'height 0.3s',
                            }} />
                            <span style={{ fontSize: 8, color: 'var(--text-dim)' }}>{w.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>8 tyg. temu</span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>teraz</span>
                </div>
            </div>

            {/* Muscle breakdown */}
            <div className="section-label">PARTIE MIĘŚNIOWE</div>
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                {muscleEntries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16, fontSize: 13, color: 'var(--text-dim)' }}>Brak danych</div>
                ) : (
                    muscleEntries.map(([muscle, count]) => (
                        <div key={muscle} style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{muscleGroupNames[muscle]?.pl || muscle}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count} serii</span>
                            </div>
                            <div className="progress-bar" style={{ height: 6, borderRadius: 3 }}>
                                <div className="progress-fill" style={{
                                    width: `${(count / maxMuscleHits) * 100}%`,
                                    borderRadius: 3,
                                    transition: 'width 0.4s',
                                }} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Recent PRs */}
            {recentPRs.length > 0 && (<>
                <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trophy size={13} style={{ color: '#FFC700' }} /> OSTATNIE REKORDY
                </div>
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    {recentPRs.map(pr => {
                        const ex = exerciseDatabase.find(e => e.id === pr.exercise_id);
                        return (
                            <div key={pr.id} className="card" style={{
                                marginBottom: 'var(--space-xs)',
                                borderLeft: '3px solid #FFC700',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{ex?.name || 'Ćwiczenie'}</div>
                                        <div style={{ fontSize: 11, color: '#FFC700', fontWeight: 600, marginTop: 2 }}>
                                            {prTypeLabel[pr.pr_type] || pr.pr_type}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#FFC700' }}>
                                            {pr.pr_type === 'max_reps' ? `${pr.value} powt.` : `${pr.value}${user.weight_unit}`}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                            {pr.previous_value != null && (
                                                <span>z {pr.pr_type === 'max_reps' ? `${pr.previous_value} powt.` : `${pr.previous_value}${user.weight_unit}`} → </span>
                                            )}
                                            {formatDateShort(pr.achieved_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>)}

            {/* All exercise PRs */}
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={13} /> REKORDY WG ĆWICZEŃ
            </div>
            {prEntries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><TrendingUp size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-text">Wykonaj treningi, żeby zobaczyć rekordy</div>
                </div>
            ) : (
                prEntries.map(([exId, pr]) => {
                    const ex = exerciseDatabase.find(e => e.id === exId);
                    const isExpanded = expandedEx === exId;
                    return (
                        <div key={exId} className="card" style={{ marginBottom: 'var(--space-sm)', overflow: 'hidden' }}>
                            <div
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => setExpandedEx(isExpanded ? null : exId)}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                                        {ex?.name || 'Ćwiczenie'}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                        {pr.totalSets} serii łącznie
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 16, fontWeight: 700 }}>{pr.maxWeight}{user.weight_unit}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>1RM: ~{Math.round(pr.est1RM)}{user.weight_unit}</div>
                                    </div>
                                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-dim)' }} />}
                                </div>
                            </div>

                            {isExpanded && (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {/* Max weight */}
                                        <div style={{
                                            background: 'rgba(255, 199, 0, 0.08)', borderRadius: 10, padding: '10px 12px',
                                            borderLeft: '3px solid #FFC700',
                                        }}>
                                            <div style={{ fontSize: 10, color: '#FFC700', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Najcięższy ciężar</div>
                                            <div style={{ fontSize: 18, fontWeight: 700 }}>{pr.maxWeight}{user.weight_unit}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{pr.maxWeight}{user.weight_unit} × {pr.maxWeightReps} powt.</div>
                                            {pr.maxWeightDate && <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>{formatDateShort(pr.maxWeightDate)}</div>}
                                        </div>

                                        {/* Est 1RM */}
                                        <div style={{
                                            background: 'rgba(77, 212, 230, 0.08)', borderRadius: 10, padding: '10px 12px',
                                            borderLeft: '3px solid #4DD4E6',
                                        }}>
                                            <div style={{ fontSize: 10, color: '#4DD4E6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Szacowane 1RM</div>
                                            <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(pr.est1RM)}{user.weight_unit}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>z {pr.est1RMWeight}{user.weight_unit} × {pr.est1RMReps}</div>
                                            {pr.est1RMDate && <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>{formatDateShort(pr.est1RMDate)}</div>}
                                        </div>

                                        {/* Max reps */}
                                        <div style={{
                                            background: 'rgba(50, 215, 75, 0.08)', borderRadius: 10, padding: '10px 12px',
                                            borderLeft: '3px solid #32D74B',
                                        }}>
                                            <div style={{ fontSize: 10, color: '#32D74B', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Maks. powtórzeń</div>
                                            <div style={{ fontSize: 18, fontWeight: 700 }}>{pr.maxReps}</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                                {pr.maxRepsWeight > 0 ? `przy ${pr.maxRepsWeight}${user.weight_unit}` : 'bodyweight'}
                                            </div>
                                            {pr.maxRepsDate && <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>{formatDateShort(pr.maxRepsDate)}</div>}
                                        </div>

                                        {/* Max volume per session */}
                                        <div style={{
                                            background: 'rgba(175, 82, 222, 0.08)', borderRadius: 10, padding: '10px 12px',
                                            borderLeft: '3px solid #AF52DE',
                                        }}>
                                            <div style={{ fontSize: 10, color: '#AF52DE', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Maks. objętość</div>
                                            <div style={{ fontSize: 18, fontWeight: 700 }}>{(pr.maxVolume / 1000).toFixed(1)}t</div>
                                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>w jednym treningu</div>
                                            {pr.maxVolumeDate && <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>{formatDateShort(pr.maxVolumeDate)}</div>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            <div style={{ height: 32 }} />
        </div>
    );
}
