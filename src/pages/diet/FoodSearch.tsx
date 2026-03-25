import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { foodDatabase } from '../../data/foods';
import { saveMeal, uuid, todayStr } from '../../data/store';
import type { MealEntry, FoodItem } from '../../types/diet';
import { ChevronLeft, Search, Check } from 'lucide-react';

interface Props { onRefresh: () => void; }

export default function FoodSearch({ onRefresh }: Props) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const mealType = (params.get('meal') || 'snack') as MealEntry['meal_type'];
    const [search, setSearch] = useState('');
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [amount, setAmount] = useState('');

    const filtered = foodDatabase.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.category && f.category.toLowerCase().includes(search.toLowerCase()))
    );

    const handleAdd = () => {
        if (!selectedFood) return;
        const grams = Number(amount) || selectedFood.default_serving_g;
        const ratio = grams / 100;

        const entry: MealEntry = {
            id: uuid(),
            date: todayStr(),
            meal_type: mealType,
            food_id: selectedFood.id,
            food_name: selectedFood.name,
            amount_g: grams,
            calories: Math.round(selectedFood.calories_per_100g * ratio),
            protein: Math.round(selectedFood.protein_per_100g * ratio * 10) / 10,
            carbs: Math.round(selectedFood.carbs_per_100g * ratio * 10) / 10,
            fat: Math.round(selectedFood.fat_per_100g * ratio * 10) / 10,
            created_at: new Date().toISOString(),
        };

        saveMeal(entry);
        onRefresh();
        navigate('/diet');
    };

    const mealLabels: Record<string, string> = {
        breakfast: 'Śniadanie', lunch: 'Obiad', dinner: 'Kolacja', snack: 'Przekąski',
    };

    if (selectedFood) {
        const grams = Number(amount) || selectedFood.default_serving_g;
        const ratio = grams / 100;
        return (
            <div className="page">
                <div className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => setSelectedFood(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                            <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                        </button>
                        <span style={{ font: 'var(--heading-3)' }}>Wróć</span>
                    </div>
                </div>

                <h2 style={{ font: 'var(--heading-2)', marginBottom: 'var(--space-sm)' }}>{selectedFood.name}</h2>
                {selectedFood.brand && <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>{selectedFood.brand}</div>}

                <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div className="section-label">Na 100g</div>
                    <div className="stats-grid" style={{ marginBottom: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ font: 'var(--heading-3)' }}>{selectedFood.calories_per_100g}</div>
                            <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>kcal</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ font: 'var(--heading-3)', color: 'var(--protein)' }}>{selectedFood.protein_per_100g}g</div>
                            <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>Białko</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ font: 'var(--heading-3)', color: 'var(--carbs)' }}>{selectedFood.carbs_per_100g}g</div>
                            <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>Węgle</div>
                        </div>
                    </div>
                </div>

                <div className="section-label">ILOŚĆ</div>
                <div className="chips-row">
                    {[50, 100, 150, 200].map(g => (
                        <div key={g} className={`chip ${Number(amount) === g ? 'active' : ''}`} onClick={() => setAmount(String(g))}>{g}g</div>
                    ))}
                    {selectedFood.serving_label && (
                        <div className={`chip ${Number(amount) === selectedFood.default_serving_g ? 'active' : ''}`} onClick={() => setAmount(String(selectedFood.default_serving_g))}>
                            {selectedFood.serving_label} ({selectedFood.default_serving_g}g)
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label className="input-label">Gramy</label>
                    <input
                        type="number"
                        className="input"
                        placeholder={String(selectedFood.default_serving_g)}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                </div>

                <div className="card-gradient" style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ font: 'var(--body)', fontWeight: 700, textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
                        {Math.round(selectedFood.calories_per_100g * ratio)} kcal
                    </div>
                    <div className="flex justify-between">
                        <span style={{ font: 'var(--caption)' }}>B: {(selectedFood.protein_per_100g * ratio).toFixed(1)}g</span>
                        <span style={{ font: 'var(--caption)' }}>W: {(selectedFood.carbs_per_100g * ratio).toFixed(1)}g</span>
                        <span style={{ font: 'var(--caption)' }}>T: {(selectedFood.fat_per_100g * ratio).toFixed(1)}g</span>
                    </div>
                </div>

                <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                    Dodaj do: <strong>{mealLabels[mealType]}</strong>
                </div>

                <button className="btn btn-primary btn-full btn-lg" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Check size={16} strokeWidth={2} /> Dodaj do {mealLabels[mealType].toLowerCase()}
                </button>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate('/diet')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)' }}>Dodaj jedzenie</span>
                </div>
            </div>

            <div style={{ font: 'var(--caption)', color: 'var(--accent)', marginBottom: 'var(--space-md)' }}>
                Do: {mealLabels[mealType]}
            </div>

            <div className="search-bar">
                <Search size={18} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                <input placeholder="Szukaj produktu..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            </div>

            {!search && (
                <div className="chips-row">
                    {['mięso', 'nabiał', 'zboża', 'owoce', 'warzywa', 'orzechy', 'przekąski'].map(cat => (
                        <div key={cat} className="chip" onClick={() => setSearch(cat)} style={{ textTransform: 'capitalize' }}>{cat}</div>
                    ))}
                </div>
            )}

            <div>
                {filtered.slice(0, 20).map(f => (
                    <div key={f.id} className="food-item" onClick={() => { setSelectedFood(f); setAmount(String(f.default_serving_g)); }}>
                        <div className="food-item-info">
                            <div className="food-item-name">{f.name}</div>
                            <div className="food-item-macros">
                                B:{f.protein_per_100g}g · W:{f.carbs_per_100g}g · T:{f.fat_per_100g}g
                                {f.serving_label && ` · ${f.serving_label}: ${f.default_serving_g}g`}
                            </div>
                        </div>
                        <div className="food-item-cal">{f.calories_per_100g} kcal/100g</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
