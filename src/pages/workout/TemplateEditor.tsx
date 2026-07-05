import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTemplates, saveTemplate, uuid } from '../../data/store';
import { exerciseDatabase, muscleGroupNames, exerciseFilters } from '../../data/exercises';
import type { WorkoutTemplate, TemplateExercise, TemplateSet, TemplateTrackType } from '../../types/workout';
import { ChevronLeft, Check, X, Search, Dumbbell, Plus, Timer, User } from 'lucide-react';

const TRACK_LABELS: Record<TemplateTrackType, string> = {
    weight_reps: 'Ciężar + powtórzenia',
    bodyweight_reps: 'Bez ciężaru (powtórzenia)',
    time: 'Czas (sekundy)',
};

export default function TemplateEditor() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [template, setTemplate] = useState<WorkoutTemplate>(() => {
        const found = getTemplates().find(t => t.id === id);
        return found!;
    });
    const [showExercises, setShowExercises] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pickerFilter, setPickerFilter] = useState<string | null>(null);

    if (!template) {
        navigate('/workout/templates');
        return null;
    }

    const persist = (updates: Partial<WorkoutTemplate>) => {
        const updated = { ...template, ...updates };
        setTemplate(updated);
        saveTemplate(updated);
    };

    const addExercise = (exerciseId: string) => {
        const info = exerciseDatabase.find(e => e.id === exerciseId);
        const isBodyweight = info?.is_bodyweight ?? false;
        const newEx: TemplateExercise = {
            id: uuid(),
            exercise_id: exerciseId,
            order: template.exercises.length,
            target_sets: 3,
            target_reps_min: 8,
            target_reps_max: 12,
            rest_seconds: 90,
            notes: '',
            track_type: isBodyweight ? 'bodyweight_reps' : 'weight_reps',
            sets: [{ id: uuid() }],
        };
        persist({ exercises: [...template.exercises, newEx] });
        setShowExercises(false);
        setSearchQuery('');
    };

    const removeExercise = (exId: string) =>
        persist({ exercises: template.exercises.filter(ex => ex.id !== exId) });

    const updateEx = (exId: string, updates: Partial<TemplateExercise>) =>
        persist({
            exercises: template.exercises.map(ex => ex.id === exId ? { ...ex, ...updates } : ex)
        });

    const addSet = (exId: string) => {
        const ex = template.exercises.find(e => e.id === exId)!;
        const prev = ex.sets?.at(-1);
        const newSet: TemplateSet = { id: uuid(), weight_kg: prev?.weight_kg, reps: prev?.reps, duration_seconds: prev?.duration_seconds };
        updateEx(exId, { sets: [...(ex.sets || []), newSet] });
    };

    const removeSet = (exId: string, setId: string) => {
        const ex = template.exercises.find(e => e.id === exId)!;
        const newSets = (ex.sets || []).filter(s => s.id !== setId);
        updateEx(exId, { sets: newSets.length > 0 ? newSets : [{ id: uuid() }] });
    };

    const updateSet = (exId: string, setId: string, updates: Partial<TemplateSet>) => {
        const ex = template.exercises.find(e => e.id === exId)!;
        updateEx(exId, {
            sets: (ex.sets || []).map(s => s.id === setId ? { ...s, ...updates } : s)
        });
    };

    const filteredExercises = exerciseDatabase.filter(ex => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(q) || ex.name_en.toLowerCase().includes(q);
        const matchesFilter = !pickerFilter || (ex.filters || []).includes(pickerFilter);
        return matchesSearch && matchesFilter;
    });

    const trackIcons: Record<TemplateTrackType, React.ReactNode> = {
        weight_reps: <Dumbbell size={12} />,
        bodyweight_reps: <User size={12} />,
        time: <Timer size={12} />,
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Header */}
            <div className="workout-header" style={{
                position: 'sticky', top: 0, background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(40px)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
            }}>
                <button onClick={() => navigate('/workout/templates')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                    <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                </button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <input
                        value={template.name}
                        onChange={e => persist({ name: e.target.value })}
                        style={{ font: 'var(--heading-3)', background: 'none', border: 'none', color: 'var(--text-primary)', width: '100%', textAlign: 'center' }}
                        placeholder="Nazwa szablonu"
                    />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/workout/templates')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={14} strokeWidth={2} /> Gotowe
                </button>
            </div>

            {/* Stats */}
            <div className="flex justify-between" style={{ padding: 'var(--space-sm) var(--space-md)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{template.exercises.length}</strong> ćwiczeń
                </span>
                <span style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>
                        {template.exercises.reduce((s, ex) => s + (ex.sets?.length || 0), 0)}
                    </strong> serii
                </span>
            </div>

            {/* Exercise list */}
            <div style={{ padding: 'var(--space-md)', paddingBottom: 100 }}>
                {template.exercises.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon"><Dumbbell size={32} strokeWidth={1.5} /></div>
                        <div className="empty-state-text">Dodaj pierwsze ćwiczenie do szablonu</div>
                    </div>
                )}

                {template.exercises.map((ex) => {
                    const info = exerciseDatabase.find(e => e.id === ex.exercise_id);
                    const trackType: TemplateTrackType = ex.track_type || 'weight_reps';
                    const sets = ex.sets || [];

                    return (
                        <div key={ex.id} className="card" style={{ marginBottom: 'var(--space-md)' }}>
                            {/* Exercise header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{info?.name || 'Ćwiczenie'}</h3>
                                    <p style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                                        {info && muscleGroupNames[info.primary_muscle]?.pl} · {info && info.equipment}
                                    </p>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => removeExercise(ex.id)} aria-label="Usuń ćwiczenie" style={{ padding: 4 }}>
                                    <X size={16} strokeWidth={1.5} style={{ color: '#FF6B6B' }} />
                                </button>
                            </div>

                            {/* Track type selector */}
                            <div className="flex gap-xs" style={{ marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                                {(Object.keys(TRACK_LABELS) as TemplateTrackType[]).map(t => (
                                    <div
                                        key={t}
                                        className={`chip ${trackType === t ? 'active' : ''}`}
                                        style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                        onClick={() => updateEx(ex.id, { track_type: t })}
                                    >
                                        {trackIcons[t]} {TRACK_LABELS[t]}
                                    </div>
                                ))}
                            </div>

                            {/* Set rows header */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: trackType === 'weight_reps' ? '28px 1fr 1fr 32px' : '28px 1fr 32px',
                                gap: 'var(--space-sm)', alignItems: 'center', padding: '4px 0',
                                font: 'var(--label)', textTransform: 'uppercase', color: 'var(--text-dim)',
                            }}>
                                <span>#</span>
                                {trackType === 'weight_reps' && <><span>kg</span><span>Powt.</span></>}
                                {trackType === 'bodyweight_reps' && <span>Powt.</span>}
                                {trackType === 'time' && <span>Czas (s)</span>}
                                <span></span>
                            </div>

                            {/* Individual set rows */}
                            {sets.map((set, idx) => (
                                <div key={set.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: trackType === 'weight_reps' ? '28px 1fr 1fr 32px' : '28px 1fr 32px',
                                    gap: 'var(--space-sm)', alignItems: 'center', padding: 'var(--space-xs) 0',
                                    borderBottom: idx < sets.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
                                }}>
                                    <span style={{ font: 'var(--caption)', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center' }}>{idx + 1}</span>

                                    {trackType === 'weight_reps' && <>
                                        <input type="number" className="set-input" placeholder="kg" value={set.weight_kg ?? ''} onChange={e => updateSet(ex.id, set.id, { weight_kg: e.target.value ? Number(e.target.value) : undefined })} />
                                        <input type="number" className="set-input" placeholder="reps" value={set.reps ?? ''} onChange={e => updateSet(ex.id, set.id, { reps: e.target.value ? Number(e.target.value) : undefined })} />
                                    </>}

                                    {trackType === 'bodyweight_reps' && (
                                        <input type="number" className="set-input" placeholder="reps" value={set.reps ?? ''} onChange={e => updateSet(ex.id, set.id, { reps: e.target.value ? Number(e.target.value) : undefined })} />
                                    )}

                                    {trackType === 'time' && (
                                        <input type="number" className="set-input" placeholder="sek" value={set.duration_seconds ?? ''} onChange={e => updateSet(ex.id, set.id, { duration_seconds: e.target.value ? Number(e.target.value) : undefined })} />
                                    )}

                                    <button className="btn btn-ghost btn-sm" style={{ padding: 4, width: 32, height: 32 }} onClick={() => removeSet(ex.id, set.id)} aria-label="Usuń serię">
                                        <X size={14} strokeWidth={1.5} style={{ opacity: 0.4 }} />
                                    </button>
                                </div>
                            ))}

                            <button className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-sm)' }} onClick={() => addSet(ex.id)}>
                                <Plus size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Dodaj serię
                            </button>

                            {/* Notes */}
                            <div style={{ marginTop: 'var(--space-sm)' }}>
                                <input
                                    className="input"
                                    style={{ font: 'var(--caption)', padding: '8px 12px', height: 'auto' }}
                                    placeholder="Notatki do ćwiczenia..."
                                    value={ex.notes || ''}
                                    onChange={e => updateEx(ex.id, { notes: e.target.value })}
                                />
                            </div>
                        </div>
                    );
                })}

                <button className="btn btn-secondary btn-full btn-lg" style={{ marginTop: template.exercises.length > 0 ? 'var(--space-sm)' : 0 }} onClick={() => setShowExercises(true)}>
                    <Plus size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> Dodaj ćwiczenie
                </button>
            </div>

            {/* Exercise Browser Sheet */}
            {showExercises && (
                <>
                    <div className="bottom-sheet-overlay" onClick={() => { setShowExercises(false); setSearchQuery(''); setPickerFilter(null); }} />
                    <div className="bottom-sheet" style={{ maxHeight: '85vh' }}>
                        <div className="bottom-sheet-handle" />
                        <div className="bottom-sheet-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h3 className="section-title" style={{ margin: 0 }}>Dodaj ćwiczenie</h3>
                                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{filteredExercises.length}</span>
                            </div>
                            <div className="search-bar" style={{ marginBottom: 10 }}>
                                <Search size={18} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                                <input
                                    placeholder="Szukaj ćwiczenia..."
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setPickerFilter(null); }}
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} aria-label="Wyczyść wyszukiwanie" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                        <X size={14} color="var(--text-dim)" />
                                    </button>
                                )}
                            </div>
                            {!searchQuery && (
                                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', flexShrink: 0 }}>
                                    <div
                                        onClick={() => setPickerFilter(null)}
                                        style={{
                                            flexShrink: 0, fontSize: 12, fontWeight: 600, padding: '6px 14px',
                                            borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
                                            background: !pickerFilter ? 'var(--accent)' : 'rgba(255,255,255,0.07)',
                                            color: !pickerFilter ? '#000' : 'var(--text-muted)',
                                        }}
                                    >
                                        Wszystkie
                                    </div>
                                    {exerciseFilters.map(f => (
                                        <div
                                            key={f.key}
                                            onClick={() => setPickerFilter(pickerFilter === f.key ? null : f.key)}
                                            style={{
                                                flexShrink: 0, fontSize: 12, fontWeight: 600, padding: '6px 14px',
                                                borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
                                                background: pickerFilter === f.key ? 'var(--accent)' : 'rgba(255,255,255,0.07)',
                                                color: pickerFilter === f.key ? '#000' : 'var(--text-muted)',
                                            }}
                                        >
                                            {f.pl}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ overflowY: 'auto', flex: 1 }}>
                                {filteredExercises.map(ex => (
                                    <div key={ex.id} className="exercise-browser-item" onClick={() => addExercise(ex.id)}>
                                        <div className="icon-container">
                                            <Dumbbell size={20} strokeWidth={1.5} />
                                        </div>
                                        <div className="ex-info">
                                            <div className="ex-name">{ex.name}</div>
                                            <div className="ex-meta">
                                                {muscleGroupNames[ex.primary_muscle]?.pl} · {ex.equipment}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
