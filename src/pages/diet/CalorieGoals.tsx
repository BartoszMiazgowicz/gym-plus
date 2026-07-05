import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, saveUser } from '../../data/store';
import { calculateBMR, calculateTDEE } from '../../utils/calculations';
import { ChevronLeft, TrendingDown, Minus, TrendingUp } from 'lucide-react';

export default function CalorieGoals() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getUser());
    const [goal, setGoal] = useState<'cut' | 'maintain' | 'bulk'>('maintain');
    const [deficit, setDeficit] = useState(500);

    // eslint-disable-next-line react-hooks/purity -- age only needs to be right to the day, a stale value across renders is harmless
    const age = user.birth_date ? Math.floor((Date.now() - new Date(user.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25;
    const weight = 80;
    const height = user.height_cm || 175;
    const gender = user.gender || 'male';
    const activity = user.activity_level || 'moderate';

    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activity);

    const targetKcal = goal === 'cut' ? tdee - deficit : goal === 'bulk' ? tdee + deficit : tdee;
    const proteinGoal = Math.round(weight * 2);
    const fatGoal = Math.round(targetKcal * 0.25 / 9);
    const carbsGoal = Math.round((targetKcal - proteinGoal * 4 - fatGoal * 9) / 4);

    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        const u = { ...user, calorie_goal: targetKcal, protein_goal: proteinGoal, carbs_goal: carbsGoal, fat_goal: fatGoal };
        saveUser(u);
        setUser(u);
        setSaving(true);
        setTimeout(() => navigate('/diet'), 1800);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)' }}>Cele kaloryczne</span>
                </div>
            </div>

            <div className="card mb-lg">
                <div className="section-label">METABOLIZM</div>
                <div className="stats-grid" style={{ marginBottom: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ font: 'var(--heading-3)' }}>{bmr}</div>
                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>BMR</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ font: 'var(--heading-3)', color: 'var(--accent)' }}>{tdee}</div>
                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>TDEE</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ font: 'var(--heading-3)', color: '#6B9FFF' }}>{targetKcal}</div>
                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>Cel</div>
                    </div>
                </div>
            </div>

            <div className="section-label">TWÓJ CEL</div>
            <div className="chips-row" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className={`chip ${goal === 'cut' ? 'active' : ''}`} onClick={() => setGoal('cut')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <TrendingDown size={14} /> Redukcja
                </div>
                <div className={`chip ${goal === 'maintain' ? 'active' : ''}`} onClick={() => setGoal('maintain')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Minus size={14} /> Utrzymanie
                </div>
                <div className={`chip ${goal === 'bulk' ? 'active' : ''}`} onClick={() => setGoal('bulk')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <TrendingUp size={14} /> Masa
                </div>
            </div>

            {goal !== 'maintain' && (
                <div className="card mb-lg">
                    <div className="section-label">{goal === 'cut' ? 'DEFICYT' : 'NADWYŻKA'}: {deficit} kcal</div>
                    <input
                        type="range"
                        min="200" max="1000" step="50"
                        value={deficit}
                        onChange={e => setDeficit(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                    <div className="flex justify-between" style={{ font: 'var(--caption)', color: 'var(--text-dim)' }}>
                        <span>200</span><span>1000</span>
                    </div>
                </div>
            )}

            <div className="card-gradient mb-lg">
                <div style={{ font: 'var(--heading-2)', textAlign: 'center', marginBottom: 'var(--space-md)' }}>
                    {targetKcal} kcal
                </div>
                <div className="stats-grid" style={{ marginBottom: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ font: 'var(--heading-3)', color: '#6B9FFF' }}>{proteinGoal}g</div>
                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>Białko ({Math.round(proteinGoal * 4 / targetKcal * 100)}%)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ font: 'var(--heading-3)', color: '#FFB84D' }}>{carbsGoal}g</div>
                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>Węgle ({Math.round(carbsGoal * 4 / targetKcal * 100)}%)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ font: 'var(--heading-3)', color: '#FF6B6B' }}>{fatGoal}g</div>
                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>Tłuszcz ({Math.round(fatGoal * 9 / targetKcal * 100)}%)</div>
                    </div>
                </div>
            </div>

            {goal !== 'maintain' && (
                <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                    Przewidywana {goal === 'cut' ? 'utrata' : 'przyrost'}: ~{(deficit / 7700).toFixed(1)} kg/tydzień
                </div>
            )}

            <button className="btn btn-primary btn-full btn-lg" onClick={handleSave} disabled={saving}>
                {saving ? 'Zapisywanie w chmurze...' : 'Zapisz cele'}
            </button>
        </div>
    );
}
