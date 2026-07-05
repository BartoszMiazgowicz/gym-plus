import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { exerciseDatabase, exerciseFilters } from '../../data/exercises';
import { ChevronLeft, Search, ChevronRight, X, ArrowLeft } from 'lucide-react';

const categoryMeta: Record<string, { emoji: string; color: string }> = {
    'klatka piersiowa': { emoji: '🫀', color: '#FF6B6B' },
    'plecy':            { emoji: '🔙', color: '#4ECDC4' },
    'barki':            { emoji: '🏋️', color: '#45B7D1' },
    'biceps':           { emoji: '💪', color: '#96CEB4' },
    'triceps':          { emoji: '👊', color: '#FFEAA7' },
    'nogi':             { emoji: '🦵', color: '#DDA0DD' },
    'dwuglowe uda':     { emoji: '🦿', color: '#F0A500' },
    'posladki':         { emoji: '🍑', color: '#FF9FF3' },
    'lydki':            { emoji: '🦶', color: '#54A0FF' },
    'brzuch':           { emoji: '🎯', color: '#5F27CD' },
    'core':             { emoji: '⚡', color: '#FFC700' },
    'przedramiona':     { emoji: '🤜', color: '#10AC84' },
    'cardio':           { emoji: '❤️', color: '#EE5A24' },
    'pelne cialo':      { emoji: '🌟', color: '#C4E538' },
    'mobilnosc':        { emoji: '🧘', color: '#A29BFE' },
    'rehab':            { emoji: '🩹', color: '#74B9FF' },
    'rozciaganie':      { emoji: '🤸', color: '#55EFC4' },
};

const difficultyColor: Record<string, string> = {
    poczatkujacy: '#4DD4E6',
    sredniozaawansowany: '#FFC700',
    zaawansowany: '#FF6B6B',
};

export default function ExerciseBrowser() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null);

    const subFilters = useMemo(() => {
        if (!activeFilter) return [];
        const set = new Set<string>();
        exerciseDatabase
            .filter(e => (e.filters || []).includes(activeFilter))
            .forEach(e => (e.subFilters || []).forEach(sf => set.add(sf)));
        return [...set].sort();
    }, [activeFilter]);

    const filtered = useMemo(() => {
        return exerciseDatabase.filter(ex => {
            const q = search.toLowerCase();
            const matchesSearch = !search || ex.name.toLowerCase().includes(q) || ex.name_en.toLowerCase().includes(q) || ex.equipment.toLowerCase().includes(q);
            const matchesFilter = !activeFilter || (ex.filters || []).includes(activeFilter);
            const matchesSubFilter = !activeSubFilter || (ex.subFilters || []).includes(activeSubFilter);
            return matchesSearch && matchesFilter && matchesSubFilter;
        });
    }, [search, activeFilter, activeSubFilter]);

    const filterCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        exerciseFilters.forEach(f => {
            counts[f.key] = exerciseDatabase.filter(e => (e.filters || []).includes(f.key)).length;
        });
        return counts;
    }, []);

    const inList = search || activeFilter;
    const meta = activeFilter ? categoryMeta[activeFilter] : null;

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => { if (activeFilter) { setActiveFilter(null); setActiveSubFilter(null); } else { navigate(-1); } }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}
                    >
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)' }}>
                        {activeFilter ? (exerciseFilters.find(f => f.key === activeFilter)?.pl ?? 'Ćwiczenia') : 'Baza ćwiczeń'}
                    </span>
                </div>
                {inList && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length}</span>}
            </div>

            {/* Search */}
            <div className="search-bar" style={{ marginBottom: 12 }}>
                <Search size={18} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                <input
                    placeholder="Szukaj ćwiczenia lub sprzętu..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setActiveFilter(null); setActiveSubFilter(null); }}
                />
                {search && (
                    <button onClick={() => setSearch('')} aria-label="Wyczyść wyszukiwanie" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <X size={16} strokeWidth={2} color="var(--text-dim)" />
                    </button>
                )}
            </div>

            {/* Category grid */}
            {!inList && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 'var(--space-lg)' }}>
                    {exerciseFilters.map(f => {
                        const m = categoryMeta[f.key] || { emoji: '💪', color: '#888' };
                        return (
                            <div
                                key={f.key}
                                onClick={() => setActiveFilter(f.key)}
                                style={{
                                    cursor: 'pointer', borderRadius: 16, padding: '16px 8px',
                                    textAlign: 'center',
                                    background: `${m.color}18`,
                                    border: `1px solid ${m.color}30`,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                }}
                            >
                                <span style={{ fontSize: 26 }}>{m.emoji}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{f.pl}</span>
                                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{filterCounts[f.key] || 0}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Active category banner */}
            {activeFilter && !search && meta && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
                    borderRadius: 14, padding: '12px 16px', marginBottom: 12,
                }}>
                    <span style={{ fontSize: 28 }}>{meta.emoji}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{exerciseFilters.find(f => f.key === activeFilter)?.pl}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{filtered.length} ćwiczeń</div>
                    </div>
                    <button onClick={() => { setActiveFilter(null); setActiveSubFilter(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <ArrowLeft size={18} color="var(--text-muted)" strokeWidth={1.5} />
                    </button>
                </div>
            )}

            {/* Sub-filter chips */}
            {activeFilter && subFilters.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {subFilters.map(sf => (
                        <div
                            key={sf}
                            onClick={() => setActiveSubFilter(activeSubFilter === sf ? null : sf)}
                            style={{
                                fontSize: 11, padding: '5px 12px', borderRadius: 20,
                                cursor: 'pointer', fontWeight: 600,
                                background: activeSubFilter === sf ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                                color: activeSubFilter === sf ? '#fff' : 'var(--text-muted)',
                                border: `1px solid ${activeSubFilter === sf ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                            }}
                        >
                            {sf}
                        </div>
                    ))}
                </div>
            )}

            {/* Exercise list */}
            {inList && (
                filtered.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                        Brak wyników
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {filtered.map(ex => (
                            <div
                                key={ex.id}
                                onClick={() => navigate(`/workout/exercise/${ex.id}`)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '13px 16px', cursor: 'pointer',
                                    background: 'var(--surface)', borderRadius: 12,
                                    border: '1px solid var(--border)',
                                    marginBottom: 4,
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: `${difficultyColor[ex.difficulty] || '#888'}18`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16,
                                }}>
                                    {categoryMeta[(ex.filters || [])[0]]?.emoji || '💪'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {ex.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: difficultyColor[ex.difficulty] || '#888', flexShrink: 0 }} />
                                        <span>{ex.equipment}</span>
                                        {ex.bodyParts?.[0] && <><span>·</span><span>{ex.bodyParts[0].name}</span></>}
                                    </div>
                                </div>
                                <ChevronRight size={18} strokeWidth={1.5} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
