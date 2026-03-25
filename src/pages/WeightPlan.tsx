import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, saveUser, getWeightEntries } from '../data/store';

const KCAL_PER_KG = 7700;

function calcBMR(gender: string, weightKg: number, heightCm: number, age: number): number {
    if (gender === 'female') {
        return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

function getTDEEMultiplier(activityLevel: string): number {
    switch (activityLevel) {
        case 'sedentary': return 1.2;
        case 'light': return 1.375;
        case 'moderate': return 1.55;
        case 'active': return 1.725;
        case 'very_active': return 1.9;
        default: return 1.55;
    }
}

function calcMacros(calories: number, weightKg: number) {
    const protein = Math.round(weightKg * 2);
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
    return { protein, fat, carbs: Math.max(carbs, 0) };
}

type GoalType = 'cut' | 'maintain' | 'bulk';

export default function WeightPlan() {
    const navigate = useNavigate();
    const user = getUser();
    const weights = getWeightEntries();
    const currentWeight = weights.length > 0 ? weights[0].weight_kg : 80;

    const userAge = user.birth_date
        ? Math.floor((Date.now() - new Date(user.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 25;

    const [goalType, setGoalType] = useState<GoalType>(() => {
        if (user.weight_goal_kg != null) {
            return user.weight_goal_kg < currentWeight ? 'cut' : user.weight_goal_kg > currentWeight ? 'bulk' : 'maintain';
        }
        return 'maintain';
    });
    const [targetWeight, setTargetWeight] = useState(() => String(user.weight_goal_kg ?? ''));
    const [adjustment, setAdjustment] = useState(() => user.weight_plan_calorie_adjustment ?? 500);
    const [saved, setSaved] = useState(false);

    const plan = useMemo(() => {
        const w = currentWeight;
        const h = user.height_cm || 175;
        const bmr = calcBMR(user.gender || 'male', w, h, userAge);
        const tdee = Math.round(bmr * getTDEEMultiplier(user.activity_level || 'moderate'));

        let targetCalories = tdee;
        if (goalType === 'cut') targetCalories = tdee - adjustment;
        else if (goalType === 'bulk') targetCalories = tdee + adjustment;
        targetCalories = Math.max(targetCalories, 1200);

        const tw = Number(targetWeight) || w;
        const diff = Math.abs(tw - w);
        const weeklyChange = goalType === 'maintain' ? 0 : (adjustment * 7) / KCAL_PER_KG;
        const weeks = weeklyChange > 0 ? Math.ceil(diff / weeklyChange) : 0;
        const macros = calcMacros(targetCalories, w);

        return { bmr, tdee, targetCalories, diff, weeklyChange, weeks, macros };
    }, [currentWeight, user.height_cm, user.gender, userAge, user.activity_level, goalType, targetWeight, adjustment]);

    const handleSave = () => {
        const u = getUser();
        u.calorie_goal = plan.targetCalories;
        u.protein_goal = plan.macros.protein;
        u.carbs_goal = plan.macros.carbs;
        u.fat_goal = plan.macros.fat;
        if (goalType === 'maintain') {
            u.weight_goal_kg = undefined;
            u.weight_plan_start_date = undefined;
            u.weight_plan_weeks = undefined;
            u.weight_plan_calorie_adjustment = undefined;
        } else {
            u.weight_goal_kg = Number(targetWeight) || undefined;
            u.weight_plan_start_date = new Date().toISOString().split('T')[0];
            u.weight_plan_weeks = plan.weeks;
            u.weight_plan_calorie_adjustment = adjustment;
        }
        saveUser(u);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const goalOptions: { value: GoalType; label: string; color: string }[] = [
        { value: 'cut', label: 'Redukcja', color: '#FF6B6B' },
        { value: 'maintain', label: 'Utrzymanie', color: '#FFB84D' },
        { value: 'bulk', label: 'Masa', color: '#22C55E' },
    ];

    const accentColor = goalType === 'cut' ? '#FF6B6B' : goalType === 'bulk' ? '#22C55E' : '#FFB84D';

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center gap-md">
                    <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                    <h1 className="page-title">Plan wagowy</h1>
                </div>
            </div>

            {/* Goal type selector */}
            <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
                <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Cel
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {goalOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setGoalType(opt.value)}
                            style={{
                                padding: '12px 8px',
                                borderRadius: 'var(--radius-md)',
                                border: `1px solid ${goalType === opt.value ? opt.color : 'var(--border)'}`,
                                background: goalType === opt.value ? `${opt.color}15` : 'transparent',
                                color: goalType === opt.value ? opt.color : 'var(--text-secondary)',
                                fontWeight: goalType === opt.value ? 700 : 500,
                                fontSize: 14,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Weight info */}
            <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: goalType === 'maintain' ? '1fr' : '1fr 1fr', gap: 16 }}>
                    <div>
                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 8 }}>Aktualna waga</div>
                        <div style={{ font: 'var(--heading-2)' }}>{currentWeight} kg</div>
                    </div>
                    {goalType !== 'maintain' && (
                        <div>
                            <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                                Waga docelowa (kg)
                            </label>
                            <input
                                type="number" step="0.1" className="input"
                                placeholder={goalType === 'cut' ? 'np. 70' : 'np. 90'}
                                value={targetWeight}
                                onChange={e => {
                                    const v = e.target.value;
                                    if (v === '') { setTargetWeight(v); return; }
                                    const num = Number(v);
                                    if (goalType === 'cut' && num >= currentWeight) return;
                                    if (goalType === 'bulk' && num <= currentWeight) return;
                                    setTargetWeight(v);
                                }}
                                style={{ borderRadius: 'var(--radius-full)', fontSize: 16 }}
                            />
                            <div style={{ font: 'var(--label)', color: 'var(--text-dim)', marginTop: 6 }}>
                                {goalType === 'cut'
                                    ? `Musi być mniejsza niż ${currentWeight} kg`
                                    : `Musi być większa niż ${currentWeight} kg`
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Calorie adjustment slider */}
            {goalType !== 'maintain' && (
                <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
                    <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {goalType === 'cut' ? 'Deficyt kaloryczny' : 'Nadwyżka kaloryczna'}
                    </div>
                    <div style={{ font: 'var(--heading-2)', color: accentColor, marginBottom: 16 }}>
                        {adjustment} kcal/dzień
                    </div>
                    <input
                        type="range" min={100} max={1000} step={50}
                        value={adjustment}
                        onChange={e => setAdjustment(Number(e.target.value))}
                        style={{ width: '100%', accentColor }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--label)', color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>100</span>
                        <span>1000 kcal</span>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="card mb-lg" style={{ padding: 'var(--space-lg)' }}>
                <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Podsumowanie
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                        <div style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>TDEE</div>
                        <div style={{ font: 'var(--heading-3)' }}>{plan.tdee} kcal</div>
                    </div>
                    <div>
                        <div style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>Cel kaloryczny</div>
                        <div style={{ font: 'var(--heading-3)', color: accentColor }}>{plan.targetCalories} kcal</div>
                    </div>
                </div>

                {goalType !== 'maintain' && targetWeight && (
                    <>
                        <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <div style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>
                                    {goalType === 'cut' ? 'Do zrzucenia' : 'Do przybrania'}
                                </div>
                                <div style={{ font: 'var(--heading-3)' }}>{plan.diff.toFixed(1)} kg</div>
                            </div>
                            <div>
                                <div style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>Tempo</div>
                                <div style={{ font: 'var(--heading-3)' }}>{plan.weeklyChange.toFixed(2)} kg/tydz</div>
                            </div>
                        </div>

                        <div style={{
                            background: `${accentColor}15`,
                            border: `1px solid ${accentColor}30`,
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-md)',
                            textAlign: 'center',
                            marginBottom: 16,
                        }}>
                            <div style={{ font: 'var(--label)', color: 'var(--text-muted)', marginBottom: 4 }}>Szacowany czas</div>
                            <div style={{ font: 'var(--heading-2)', color: accentColor }}>
                                {plan.weeks < 52
                                    ? `${plan.weeks} tyg.`
                                    : `${Math.round(plan.weeks / 4)} mies.`
                                }
                            </div>
                            <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginTop: 4 }}>
                                {currentWeight} kg → {targetWeight} kg
                            </div>
                        </div>
                    </>
                )}

                <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

                {/* Macros */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                    <div>
                        <div style={{ font: 'var(--label)', color: '#6B9FFF' }}>Białko</div>
                        <div style={{ font: 'var(--heading-3)' }}>{plan.macros.protein}g</div>
                    </div>
                    <div>
                        <div style={{ font: 'var(--label)', color: '#FFB84D' }}>Węgle</div>
                        <div style={{ font: 'var(--heading-3)' }}>{plan.macros.carbs}g</div>
                    </div>
                    <div>
                        <div style={{ font: 'var(--label)', color: '#FF6B6B' }}>Tłuszcze</div>
                        <div style={{ font: 'var(--heading-3)' }}>{plan.macros.fat}g</div>
                    </div>
                </div>
            </div>

            {/* Save button */}
            <button
                className="btn btn-primary btn-lg btn-full"
                onClick={handleSave}
                style={{ marginBottom: 'var(--space-2xl)' }}
            >
                {saved ? 'Zapisano!' : 'Zapisz plan'}
            </button>
        </div>
    );
}
