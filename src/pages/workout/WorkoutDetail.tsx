import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCompletedWorkouts, getUser, deleteWorkout } from '../../data/store';
import { exerciseDatabase } from '../../data/exercises';
import { formatDuration, formatDate } from '../../utils/calculations';
import { Clock, Dumbbell, BarChart3, Repeat, Trash2 } from 'lucide-react';

export default function WorkoutDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const user = getUser();
    const workout = getCompletedWorkouts().find(w => w.id === id);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = () => {
        if (!id) return;
        deleteWorkout(id);
        navigate(-1);
    };

    if (!workout) {
        return (
            <div className="page">
                <div className="page-header">
                    <button className="back-btn" aria-label="Wstecz" onClick={() => navigate(-1)}>←</button>
                </div>
                <div className="empty-state">
                    <div className="empty-state-text">Nie znaleziono treningu</div>
                </div>
            </div>
        );
    }

    const unit = user.weight_unit || 'kg';

    // Compute per-exercise stats
    const exerciseStats = workout.exercises.map(ex => {
        const info = exerciseDatabase.find(e => e.id === ex.exercise_id);
        const completedSets = ex.sets.filter(s => s.is_completed);
        const totalReps = completedSets.reduce((s, set) => s + (set.reps || 0), 0);
        const totalVolume = completedSets.reduce((s, set) => s + (set.weight_kg || 0) * (set.reps || 0), 0);
        const maxWeight = completedSets.length > 0
            ? Math.max(...completedSets.map(s => s.weight_kg || 0))
            : 0;
        return { ex, info, completedSets, totalReps, totalVolume, maxWeight };
    });

    // Best set (highest volume in a single set)
    let bestSetLabel = '';
    for (const { ex, info } of exerciseStats) {
        for (const set of ex.sets.filter(s => s.is_completed)) {
            const vol = (set.weight_kg || 0) * (set.reps || 0);
            if (vol > 0 && (!bestSetLabel || vol > parseFloat(bestSetLabel))) {
                const exName = info?.name || 'Ćwiczenie';
                bestSetLabel = `${exName}: ${set.weight_kg}${unit} × ${set.reps}`;
            }
        }
    }

    // Muscle groups hit
    const musclesHit = new Set<string>();
    for (const { info } of exerciseStats) {
        if (info) {
            musclesHit.add(info.primary_muscle);
            info.secondary_muscles.forEach(m => musclesHit.add(m));
        }
    }

    const muscleLabels: Record<string, string> = {
        chest: 'Klatka', back: 'Plecy', shoulders: 'Barki', biceps: 'Biceps',
        triceps: 'Triceps', forearms: 'Przedramiona', quadriceps: 'Quady',
        hamstrings: 'Dwugłowe', glutes: 'Pośladki', calves: 'Łydki',
        abs: 'Brzuch', traps: 'Czworoboczne', lats: 'Najszersze',
    };

    const setTypeLabel: Record<string, string> = {
        warmup: 'R',
        working: '',
        dropset: 'D',
        failure: 'F',
        amrap: 'A',
    };

    return (
        <div className="page">
            {/* Header */}
            <div className="page-header">
                <div className="flex items-center gap-md">
                    <button className="back-btn" aria-label="Wstecz" onClick={() => navigate(-1)}>←</button>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: 2 }}>{workout.name}</h1>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {formatDate(workout.started_at)}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    aria-label="Usuń trening"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
                >
                    <Trash2 size={20} color="#FF6B6B" strokeWidth={1.5} />
                </button>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 'var(--space-lg)' }}>
                <div className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <Clock size={18} color="var(--accent)" strokeWidth={1.5} style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                        {formatDuration(workout.duration_seconds || 0)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase' }}>czas</div>
                </div>
                <div className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <BarChart3 size={18} color="#4DD4E6" strokeWidth={1.5} style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                        {Math.round(workout.total_volume_kg).toLocaleString()}<span style={{ fontSize: 12, fontWeight: 400 }}>{unit}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase' }}>ciężar</div>
                </div>
                <div className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <Dumbbell size={18} color="#A78BFA" strokeWidth={1.5} style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                        {workout.total_sets}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase' }}>serie</div>
                </div>
                <div className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <Repeat size={18} color="#FFC700" strokeWidth={1.5} style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                        {workout.total_reps}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase' }}>powtórzenia</div>
                </div>
            </div>

            {/* Extra stats row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-lg)' }}>
                <div className="card" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{workout.exercises.length}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>ćwiczeń</div>
                </div>
                <div className="card" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{musclesHit.size}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>grup mięśni</div>
                </div>
                {workout.total_sets > 0 && (
                    <div className="card" style={{ flex: 1, padding: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                            {Math.round(workout.total_volume_kg / workout.total_sets)}<span style={{ fontSize: 10, fontWeight: 400 }}>{unit}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>śr./serię</div>
                    </div>
                )}
            </div>

            {/* Muscles hit */}
            {musclesHit.size > 0 && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="section-label">ZAANGAŻOWANE MIĘŚNIE</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {[...musclesHit].map(m => (
                            <span key={m} style={{
                                padding: '4px 10px', borderRadius: 20,
                                background: 'rgba(34,197,94,0.12)', color: 'var(--accent)',
                                fontSize: 11, fontWeight: 600,
                            }}>
                                {muscleLabels[m] || m}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Exercises */}
            <div className="section-label">ĆWICZENIA</div>
            {exerciseStats.map(({ ex, info, completedSets, totalReps, totalVolume, maxWeight }, idx) => (
                <div key={ex.id} className="card" style={{ marginBottom: 8 }}>
                    {/* Exercise header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: 'var(--text-dim)',
                        }}>
                            {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>
                                {info?.name || `Ćwiczenie ${ex.exercise_id}`}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {completedSets.length} serii · {totalReps} powt. · {Math.round(totalVolume).toLocaleString()}{unit}
                                {maxWeight > 0 && ` · max ${maxWeight}${unit}`}
                            </div>
                        </div>
                    </div>

                    {/* Sets table */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                        {/* Header */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr',
                            gap: 4, marginBottom: 4, padding: '0 4px',
                        }}>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>SET</span>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>CIĘŻAR</span>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>POWT.</span>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>EXTRA</span>
                        </div>
                        {/* Rows */}
                        {ex.sets.map((set, si) => {
                            const typeTag = setTypeLabel[set.set_type] || '';
                            return (
                                <div key={set.id} style={{
                                    display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr',
                                    gap: 4, padding: '5px 4px', borderRadius: 6,
                                    background: set.is_completed ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                                    opacity: set.is_completed ? 1 : 0.4,
                                }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)' }}>
                                        {typeTag ? `${typeTag}` : si + 1}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                                        {set.weight_kg != null ? `${set.weight_kg}${unit}` : '—'}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                                        {set.reps != null ? set.reps : '—'}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {set.rpe != null && `RPE ${set.rpe}`}
                                        {set.rir != null && `RIR ${set.rir}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Notes */}
                    {ex.notes && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                            {ex.notes}
                        </div>
                    )}
                </div>
            ))}

            {/* Workout notes */}
            {workout.notes && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                    <div className="section-label">NOTATKI</div>
                    <div className="card" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {workout.notes}
                    </div>
                </div>
            )}

            <div style={{ height: 40 }} />

            {/* Delete confirmation */}
            {showDeleteConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                    padding: 'var(--space-md)',
                }}>
                    <div style={{
                        background: 'var(--surface)', borderRadius: 16, padding: 24,
                        width: '100%', maxWidth: 320, textAlign: 'center',
                    }}>
                        <Trash2 size={36} color="#FF6B6B" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Usuń trening?</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                            Ten trening zostanie trwale usunięty. Tej operacji nie można cofnąć.
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{
                                    flex: 1, padding: '12px 0', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.08)', border: 'none',
                                    color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{
                                    flex: 1, padding: '12px 0', borderRadius: 10,
                                    background: '#FF6B6B', border: 'none',
                                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                Usuń
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
