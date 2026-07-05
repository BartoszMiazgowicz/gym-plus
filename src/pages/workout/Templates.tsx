import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplates, saveTemplate, deleteTemplate, saveWorkout, uuid } from '../../data/store';
import type { WorkoutTemplate, WorkoutSession, WorkoutExercise } from '../../types/workout';
import { ChevronLeft, Plus, Search, Star, ClipboardList, Trash2, Globe, Play, Pencil } from 'lucide-react';

export default function Templates() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<WorkoutTemplate[]>(getTemplates());
    const [showExplore, setShowExplore] = useState(false);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const handleCreate = () => {
        if (!newName.trim()) return;
        const t: WorkoutTemplate = {
            id: uuid(),
            name: newName.trim(),
            description: newDesc.trim(),
            exercises: [],
            difficulty: 'intermediate',
            primary_muscles: [],
            is_builtin: false,
            use_count: 0,
            created_at: new Date().toISOString(),
        };
        saveTemplate(t);
        navigate(`/workout/templates/${t.id}`);
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Usunąć szablon?')) return;
        deleteTemplate(id);
        setTemplates(getTemplates());
    };

    const startFromTemplate = (t: WorkoutTemplate) => {
        const exercises: WorkoutExercise[] = t.exercises.map((ex, idx) => ({
            id: uuid(),
            session_id: '',
            exercise_id: ex.exercise_id,
            order: idx,
            superset_group: ex.superset_group,
            notes: ex.notes || '',
            sets: (ex.sets && ex.sets.length > 0 ? ex.sets : [{ id: uuid() }]).map((s, sIdx) => ({
                id: uuid(),
                workout_exercise_id: '',
                set_number: sIdx + 1,
                weight_kg: s.weight_kg,
                reps: s.reps,
                set_type: 'working' as const,
                is_completed: false,
            })),
        }));

        const session: WorkoutSession = {
            id: uuid(),
            user_id: 'local-user',
            template_id: t.id,
            name: t.name,
            started_at: new Date().toISOString(),
            total_volume_kg: 0,
            total_sets: 0,
            total_reps: 0,
            exercises,
            status: 'active',
            created_at: new Date().toISOString(),
        };

        // Increment use count
        saveTemplate({ ...t, use_count: (t.use_count || 0) + 1 });
        saveWorkout(session);
        navigate('/workout/active');
    };

    const publicTemplates = [
        { name: 'Push Pull Legs', author: '@adam_lift', exercises: 6, rating: 4.8 },
        { name: 'Arnold Split', author: '@bodybuilder_pl', exercises: 7, rating: 4.7 },
        { name: 'Full Body 3x/tydzień', author: '@fitnesscoach', exercises: 5, rating: 4.5 },
        { name: 'Beginner Strength', author: '@strongstart', exercises: 4, rating: 4.6 },
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)' }}>Szablony</span>
                </div>
            </div>

            {/* Top actions */}
            <div className="flex gap-sm mb-lg">
                <button
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={() => { setShowNewForm(true); setShowExplore(false); }}
                >
                    <Plus size={16} strokeWidth={2} /> Nowy szablon
                </button>
                <button
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={() => { setShowExplore(true); setShowNewForm(false); }}
                >
                    <Search size={16} strokeWidth={1.5} /> Explore
                </button>
            </div>

            {/* New template form */}
            {showNewForm && (
                <div className="card mb-lg" style={{ border: '1px solid var(--accent)' }}>
                    <div style={{ font: 'var(--heading-3)', marginBottom: 'var(--space-md)' }}>Nowy szablon</div>
                    <div className="input-group">
                        <label className="input-label">Nazwa *</label>
                        <input className="input" placeholder="np. Push Day" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Opis (opcjonalny)</label>
                        <input className="input" placeholder="np. Klatka, barki, triceps" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                    </div>
                    <div className="flex gap-sm">
                        <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim()}>Utwórz</button>
                        <button className="btn btn-ghost" onClick={() => setShowNewForm(false)}>Anuluj</button>
                    </div>
                </div>
            )}

            {/* Explore section */}
            {showExplore && (
                <div className="mb-lg">
                    <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Globe size={14} strokeWidth={1.5} /> PUBLICZNE SZABLONY
                    </div>
                    {publicTemplates.map((t, i) => (
                        <div key={i} className="card" style={{ marginBottom: 'var(--space-sm)' }}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div style={{ font: 'var(--body)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <ClipboardList size={16} strokeWidth={1.5} /> {t.name}
                                    </div>
                                    <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginTop: 2 }}>
                                        {t.author} · {t.exercises} ćwiczeń
                                    </div>
                                </div>
                                <div className="flex items-center gap-xs">
                                    <Star size={12} strokeWidth={1.5} style={{ color: '#FFB84D' }} />
                                    <span style={{ font: 'var(--caption)', color: '#FFB84D', fontWeight: 600 }}>{t.rating}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div style={{ font: 'var(--caption)', color: 'var(--text-dim)', textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                        Publiczne szablony innych użytkowników pojawią się tutaj
                    </div>
                </div>
            )}

            {/* My templates */}
            <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={14} strokeWidth={1.5} /> MOJE SZABLONY
            </div>
            {templates.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><ClipboardList size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-text">Brak szablonów</div>
                    <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
                        <Plus size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Utwórz pierwszy szablon
                    </button>
                </div>
            ) : (
                templates.map(t => (
                    <div key={t.id} className="card" style={{ marginBottom: 'var(--space-sm)' }}>
                        <div className="flex items-center justify-between">
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/workout/templates/${t.id}`)}>
                                <div style={{ font: 'var(--body)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <ClipboardList size={16} strokeWidth={1.5} /> {t.name}
                                </div>
                                {t.description && (
                                    <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginTop: 2 }}>{t.description}</div>
                                )}
                                <div style={{ font: 'var(--caption)', color: 'var(--text-dim)', marginTop: 4 }}>
                                    {t.exercises?.length || 0} ćwiczeń{t.use_count > 0 ? ` · użyto ${t.use_count}x` : ''}
                                </div>
                            </div>
                            <div className="flex items-center gap-xs" style={{ marginLeft: 'var(--space-sm)' }}>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: 6 }}
                                    onClick={() => navigate(`/workout/templates/${t.id}`)}
                                    title="Edytuj"
                                    aria-label="Edytuj szablon"
                                >
                                    <Pencil size={15} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                                </button>
                                <button
                                    className="btn btn-sm"
                                    style={{
                                        padding: '6px 12px',
                                        background: 'var(--accent)',
                                        color: '#000',
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontWeight: 600,
                                        fontSize: 12,
                                    }}
                                    onClick={() => startFromTemplate(t)}
                                    title="Rozpocznij trening"
                                >
                                    <Play size={13} strokeWidth={2} /> Start
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: '#FF6B6B', padding: 6 }}
                                    onClick={() => handleDelete(t.id)}
                                    title="Usuń"
                                    aria-label="Usuń szablon"
                                >
                                    <Trash2 size={15} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
