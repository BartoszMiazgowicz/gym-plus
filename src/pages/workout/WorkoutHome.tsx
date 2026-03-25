import { useNavigate } from 'react-router-dom';
import { getCompletedWorkouts, getActiveWorkout, saveWorkout, uuid, getUser, getBadges } from '../../data/store';
import { timeAgo, formatDuration } from '../../utils/calculations';
import { Zap, Play, RotateCcw, Calendar, ClipboardList, Dumbbell, Award, ChevronRight, Timer, Scale, Activity, BookOpen } from 'lucide-react';

interface Props { onRefresh: () => void; }

export default function WorkoutHome({ }: Props) {
    const navigate = useNavigate();
    const user = getUser();
    const workouts = getCompletedWorkouts().slice(0, 5);
    const activeWorkout = getActiveWorkout();
    const unlockedBadges = getBadges().length;

    const startWorkout = (type: 'empty' | 'repeat') => {
        if (type === 'repeat' && workouts.length > 0) {
            const last = workouts[0];
            const session = {
                id: crypto.randomUUID(),
                user_id: 'local-user',
                name: last.name,
                started_at: new Date().toISOString(),
                total_volume_kg: 0,
                total_sets: 0,
                total_reps: 0,
                exercises: last.exercises.map((ex) => ({
                    ...ex,
                    id: crypto.randomUUID(),
                    session_id: '',
                    sets: ex.sets.map((s) => ({
                        ...s,
                        id: crypto.randomUUID(),
                        is_completed: false,
                        completed_at: undefined,
                    })),
                })),
                status: 'active' as const,
                created_at: new Date().toISOString(),
            };
            saveWorkout(session as any);
            navigate('/workout/active');
        } else {
            const session = {
                id: uuid(),
                user_id: 'local-user',
                name: 'Trening',
                started_at: new Date().toISOString(),
                total_volume_kg: 0,
                total_sets: 0,
                total_reps: 0,
                exercises: [],
                status: 'active' as const,
                created_at: new Date().toISOString(),
            };
            saveWorkout(session);
            navigate('/workout/active');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Trening</h1>
            </div>

            {activeWorkout ? (
                <div className="card-gradient" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={16} strokeWidth={1.5} /> Trening w toku
                    </div>
                    <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                        {activeWorkout.name} · {activeWorkout.exercises.length} ćwiczeń
                    </div>
                    <button className="btn btn-primary btn-full" onClick={() => navigate('/workout/active')}>
                        Kontynuuj →
                    </button>
                </div>
            ) : (
                <button className="btn btn-primary btn-full btn-lg" onClick={() => startWorkout('empty')} style={{ marginBottom: 'var(--space-lg)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Play size={20} strokeWidth={2} /> START TRENING
                </button>
            )}

            {!activeWorkout && workouts.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="flex items-center justify-between mb-sm">
                        <span style={{ font: 'var(--body)', fontWeight: 600 }}>Ostatni trening</span>
                        <span style={{ font: 'var(--caption)', color: 'var(--text-muted) ' }}>{timeAgo(workouts[0].started_at)}</span>
                    </div>
                    <div style={{ font: 'var(--heading-3)', marginBottom: 4 }}>{workouts[0].name}</div>
                    <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                        {formatDuration(workouts[0].duration_seconds || 0)} · {Math.round(workouts[0].total_volume_kg).toLocaleString()}{user.weight_unit} · {workouts[0].total_sets} serii
                    </div>
                    <button className="btn btn-secondary btn-full" onClick={() => startWorkout('repeat')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <RotateCcw size={16} strokeWidth={1.5} /> Powtórz
                    </button>
                </div>
            )}

            <div className="section-label">SZYBKI DOSTĘP</div>
            <div className="quick-grid">
                <div className="quick-item" onClick={() => navigate('/workout/calendar')}>
                    <span className="quick-item-icon"><Calendar size={22} strokeWidth={1.5} /></span>
                    <span className="quick-item-label">Kalendarz</span>
                </div>
                <div className="quick-item" onClick={() => navigate('/workout/history')}>
                    <span className="quick-item-icon"><ClipboardList size={22} strokeWidth={1.5} /></span>
                    <span className="quick-item-label">Historia</span>
                </div>
                <div className="quick-item" onClick={() => navigate('/workout/templates')}>
                    <span className="quick-item-icon"><Dumbbell size={22} strokeWidth={1.5} /></span>
                    <span className="quick-item-label">Szablony</span>
                </div>
                <div className="quick-item" onClick={() => navigate('/workout/timer')}>
                    <span className="quick-item-icon"><Timer size={22} strokeWidth={1.5} /></span>
                    <span className="quick-item-label">HIIT Timer</span>
                </div>
                <div className="quick-item" onClick={() => navigate('/workout/calculator')}>
                    <span className="quick-item-icon"><Scale size={22} strokeWidth={1.5} /></span>
                    <span className="quick-item-label">Kalkulator</span>
                </div>
                <div className="quick-item" onClick={() => navigate('/workout/muscles')}>
                    <span className="quick-item-icon"><Activity size={22} strokeWidth={1.5} /></span>
                    <span className="quick-item-label">Mięśnie</span>
                </div>
                <div className="quick-item" onClick={() => navigate('/workout/exercises')}>
                    <span className="quick-item-icon"><BookOpen size={22} strokeWidth={1.5} /></span>
                    <span className="quick-item-label">Ćwiczenia</span>
                </div>
            </div>

            <div
                className="card mb-lg"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => navigate('/workout/badges')}
            >
                <div className="flex items-center gap-sm">
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(255, 199, 0, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Award size={22} color="#FFC700" strokeWidth={1.5} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Odznaki</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {unlockedBadges > 0 ? `${unlockedBadges} zdobytych` : 'Zdobywaj odznaki!'}
                        </div>
                    </div>
                </div>
                <ChevronRight size={18} strokeWidth={1.5} color="var(--text-dim)" />
            </div>

            <div className="section-label">OSTATNIE TRENINGI</div>
            {workouts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Dumbbell size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-text">Brak treningów. Zacznij swój pierwszy!</div>
                </div>
            ) : (
                workouts.map(w => (
                    <div key={w.id} className="history-item" onClick={() => navigate(`/workout/detail/${w.id}`)} style={{ cursor: 'pointer' }}>
                        <div className="history-dot" />
                        <div className="history-info">
                            <div className="history-name">{w.name}</div>
                            <div className="history-stats">
                                {formatDuration(w.duration_seconds || 0)} · {w.total_sets} serii · {Math.round(w.total_volume_kg).toLocaleString()}{user.weight_unit}
                            </div>
                        </div>
                        <div className="history-date">{timeAgo(w.started_at)}</div>
                    </div>
                ))
            )}
        </div>
    );
}
