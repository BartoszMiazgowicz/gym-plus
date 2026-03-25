import { useNavigate } from 'react-router-dom';
import { getRecipes } from '../../data/store';
import { ChevronLeft, BookOpen } from 'lucide-react';

export default function Recipes() {
    const navigate = useNavigate();
    const recipes = getRecipes();

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)' }}>Przepisy</span>
                </div>
            </div>

            {recipes.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><BookOpen size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-text">Brak przepisów. Dodaj swój pierwszy!</div>
                    <p style={{ font: 'var(--caption)', color: 'var(--text-dim)', marginBottom: 'var(--space-lg)' }}>
                        Przepisy pozwalają szybko dodawać powtarzalne posiłki z obliczonymi makroskładnikami.
                    </p>
                </div>
            ) : (
                recipes.map(r => (
                    <div key={r.id} className="card" style={{ marginBottom: 'var(--space-sm)' }}>
                        <div style={{ font: 'var(--body)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BookOpen size={16} strokeWidth={1.5} /> {r.name}
                        </div>
                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginTop: 4 }}>
                            {Math.round(r.total_calories / r.servings)} kcal · B:{Math.round(r.total_protein / r.servings)}g · {r.servings} porcji
                        </div>
                        <div style={{ font: 'var(--caption)', color: 'var(--text-dim)', marginTop: 2 }}>
                            {r.ingredients.length} składników
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
