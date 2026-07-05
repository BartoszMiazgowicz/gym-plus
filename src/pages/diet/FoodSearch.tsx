import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { foodDatabase } from '../../data/foods';
import { saveMeal, uuid, todayStr } from '../../data/store';
import { supabase } from '../../lib/supabase';
import type { MealEntry, FoodItem } from '../../types/diet';
import { ChevronLeft, Search, Check, Camera, Sparkles } from 'lucide-react';

interface Props { onRefresh: () => void; }

interface AIMealResult {
    food_name: string;
    amount_g: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    note: string;
}

function resizeImageToBase64(file: File): Promise<{ dataUrl: string; base64: string }> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const maxW = 1024;
            const scale = Math.min(1, maxW / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve({ dataUrl, base64: dataUrl.split(',')[1] });
        };
        img.onerror = reject;
        img.src = url;
    });
}

export default function FoodSearch({ onRefresh }: Props) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const mealType = (params.get('meal') || 'snack') as MealEntry['meal_type'];
    const [search, setSearch] = useState('');
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [amount, setAmount] = useState('');
    const [aiStep, setAiStep] = useState<'idle' | 'loading' | 'result' | 'error'>('idle');
    const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
    const [aiError, setAiError] = useState('');
    const [aiForm, setAiForm] = useState<{ food_name: string; amount_g: string; calories: string; protein_g: string; carbs_g: string; fat_g: string; note: string }>({
        food_name: '', amount_g: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', note: '',
    });

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

    const resetAI = () => {
        setAiStep('idle');
        setAiImagePreview(null);
        setAiError('');
    };

    const handleAIPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setAiStep('loading');
        setAiError('');
        try {
            const { dataUrl, base64 } = await resizeImageToBase64(file);
            setAiImagePreview(dataUrl);

            const { data, error } = await supabase.functions.invoke<AIMealResult & { error?: string }>('analyze-meal-photo', {
                body: { image: base64, media_type: 'image/jpeg' },
            });

            if (error || !data || data.error) {
                throw new Error(data?.error || error?.message || 'Analiza nie powiodła się');
            }

            setAiForm({
                food_name: data.food_name || '',
                amount_g: String(Math.round(data.amount_g || 0)),
                calories: String(Math.round(data.calories || 0)),
                protein_g: String(Math.round((data.protein_g || 0) * 10) / 10),
                carbs_g: String(Math.round((data.carbs_g || 0) * 10) / 10),
                fat_g: String(Math.round((data.fat_g || 0) * 10) / 10),
                note: data.note || '',
            });
            setAiStep('result');
        } catch (err) {
            console.error('AI meal scan failed:', err);
            setAiError(err instanceof Error ? err.message : 'Coś poszło nie tak. Spróbuj ponownie.');
            setAiStep('error');
        }
    };

    const handleAIConfirm = () => {
        const entry: MealEntry = {
            id: uuid(),
            date: todayStr(),
            meal_type: mealType,
            food_id: `ai-${uuid()}`,
            food_name: aiForm.food_name || 'Posiłek (AI)',
            amount_g: Number(aiForm.amount_g) || 0,
            calories: Number(aiForm.calories) || 0,
            protein: Number(aiForm.protein_g) || 0,
            carbs: Number(aiForm.carbs_g) || 0,
            fat: Number(aiForm.fat_g) || 0,
            created_at: new Date().toISOString(),
        };
        saveMeal(entry);
        onRefresh();
        navigate('/diet');
    };

    if (aiStep !== 'idle') {
        return (
            <div className="page">
                <div className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={resetAI} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                            <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                        </button>
                        <span style={{ font: 'var(--heading-3)' }}>AI Kalkulator</span>
                    </div>
                </div>

                {aiImagePreview && (
                    <img
                        src={aiImagePreview}
                        alt="Zdjęcie posiłku"
                        style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)' }}
                    />
                )}

                {aiStep === 'loading' && (
                    <div className="card animate-pulse" style={{ textAlign: 'center', padding: '32px 0' }}>
                        <Sparkles size={28} strokeWidth={1.5} style={{ color: 'var(--accent)', marginBottom: 8 }} />
                        <div style={{ font: 'var(--body)' }}>Analizuję zdjęcie...</div>
                    </div>
                )}

                {aiStep === 'error' && (
                    <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                        <div style={{ color: 'var(--warning)', marginBottom: 12, font: 'var(--body)' }}>{aiError}</div>
                        <button className="btn btn-secondary" onClick={resetAI}>Wróć</button>
                    </div>
                )}

                {aiStep === 'result' && (
                    <>
                        {aiForm.note && (
                            <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                                {aiForm.note}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Nazwa</label>
                            <input
                                className="input"
                                value={aiForm.food_name}
                                onChange={e => setAiForm({ ...aiForm, food_name: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Gramy (cała porcja)</label>
                            <input
                                type="number"
                                className="input"
                                value={aiForm.amount_g}
                                onChange={e => setAiForm({ ...aiForm, amount_g: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Kalorie (kcal)</label>
                            <input
                                type="number"
                                className="input"
                                value={aiForm.calories}
                                onChange={e => setAiForm({ ...aiForm, calories: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-sm mb-lg">
                            <div className="input-group" style={{ flex: 1 }}>
                                <label className="input-label" style={{ color: 'var(--protein)' }}>Białko (g)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={aiForm.protein_g}
                                    onChange={e => setAiForm({ ...aiForm, protein_g: e.target.value })}
                                />
                            </div>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label className="input-label" style={{ color: 'var(--carbs)' }}>Węgle (g)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={aiForm.carbs_g}
                                    onChange={e => setAiForm({ ...aiForm, carbs_g: e.target.value })}
                                />
                            </div>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label className="input-label">Tłuszcz (g)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={aiForm.fat_g}
                                    onChange={e => setAiForm({ ...aiForm, fat_g: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                            Dodaj do: <strong>{mealLabels[mealType]}</strong>
                        </div>

                        <button className="btn btn-primary btn-full btn-lg" onClick={handleAIConfirm} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Check size={16} strokeWidth={2} /> Dodaj do {mealLabels[mealType].toLowerCase()}
                        </button>
                    </>
                )}
            </div>
        );
    }

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

            <label
                className="card-gradient mb-lg"
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: 14 }}
            >
                <Camera size={20} strokeWidth={1.5} />
                <span style={{ font: 'var(--body)', fontWeight: 600, flex: 1 }}>AI Kalkulator — zrób zdjęcie posiłku</span>
                <Sparkles size={16} strokeWidth={1.5} />
                <input type="file" accept="image/*" capture="environment" hidden onChange={handleAIPhotoSelect} />
            </label>

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
