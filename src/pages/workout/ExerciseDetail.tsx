import { useNavigate, useParams } from 'react-router-dom';
import { exerciseDatabase, muscleGroupNames } from '../../data/exercises';
import { ChevronLeft, Video, Dumbbell, Target, List, Info } from 'lucide-react';

const difficultyLabel: Record<string, string> = {
    poczatkujacy: 'Początkujący',
    sredniozaawansowany: 'Średniozaawansowany',
    zaawansowany: 'Zaawansowany',
};

const difficultyColor: Record<string, string> = {
    poczatkujacy: '#4DD4E6',
    sredniozaawansowany: '#FFC700',
    zaawansowany: '#FF6B6B',
};

export default function ExerciseDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const exercise = exerciseDatabase.find(e => e.id === id);

    if (!exercise) {
        return (
            <div className="page">
                <div className="page-header">
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                </div>
                <div className="empty-state">
                    <div className="empty-state-icon"><Dumbbell size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-text">Ćwiczenie nie znalezione</div>
                </div>
            </div>
        );
    }

    const diff = exercise.difficulty || '';
    const bodyParts = exercise.bodyParts || [];
    const instructions = exercise.instructions || [];
    const subFilters = exercise.subFilters || [];

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)', fontSize: 16 }}>{exercise.name}</span>
                </div>
            </div>

            {/* Video placeholder 1:1 */}
            <div style={{
                width: '100%',
                aspectRatio: '1 / 1',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginBottom: 'var(--space-lg)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Video size={32} strokeWidth={1.5} color="var(--text-dim)" />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>Wideo instruktażowe</span>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', opacity: 0.6 }}>Wkrótce dostępne</span>
                {/* Corner decoration */}
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '4px 10px' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>1:1</span>
                </div>
            </div>

            {/* Name & badges */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{exercise.name}</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{exercise.name_en}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                        background: `${difficultyColor[diff]}22`, color: difficultyColor[diff] || 'var(--text-muted)',
                    }}>
                        {difficultyLabel[diff] || diff}
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                        background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                    }}>
                        {exercise.equipment}
                    </span>
                </div>
            </div>

            {/* Body parts breakdown */}
            {bodyParts.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <Target size={16} strokeWidth={1.5} color="var(--accent)" />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Zaangażowane mięśnie</span>
                    </div>
                    {bodyParts.map((bp, i) => (
                        <div key={i} style={{ marginBottom: i < bodyParts.length - 1 ? 10 : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                                    {muscleGroupNames[bp.name]?.pl || bp.name}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{bp.percentage}%</span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                <div style={{
                                    height: '100%', borderRadius: 2,
                                    width: `${bp.percentage}%`,
                                    background: i === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sub-filters (muscle details) */}
            {subFilters.length > 0 && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                        SZCZEGÓŁOWE PARTIE
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {subFilters.map((sf, i) => (
                            <span key={i} style={{
                                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                                background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}>
                                {sf}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Description */}
            {exercise.description && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Info size={16} strokeWidth={1.5} color="var(--accent)" />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Opis</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{exercise.description}</p>
                </div>
            )}

            {/* Instructions */}
            {instructions.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <List size={16} strokeWidth={1.5} color="var(--accent)" />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Instrukcja wykonania</span>
                    </div>
                    {instructions.map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < instructions.length - 1 ? 12 : 0 }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#000' }}>{i + 1}</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, paddingTop: 3 }}>{step}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
