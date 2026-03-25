import { useState, useMemo } from 'react';
import { getUser, saveUser, saveWeight, uuid, todayStr } from '../data/store';
import type { User } from '../types/user';

const optionSteps = [
    {
        id: 'gender',
        title: 'Płeć',
        subtitle: 'Potrzebujemy tego do obliczeń',
        options: [
            { value: 'male', title: 'Mężczyzna', desc: '' },
            { value: 'female', title: 'Kobieta', desc: '' },
        ]
    },
    {
        id: 'level',
        title: 'Twój poziom',
        subtitle: 'Jak długo ćwiczysz?',
        options: [
            { value: 'beginner', title: 'Początkujący', desc: 'Dopiero zaczynam lub < 6 miesięcy' },
            { value: 'intermediate', title: 'Średniozaawansowany', desc: '6 miesięcy – 3 lata regularnie' },
            { value: 'advanced', title: 'Zaawansowany', desc: '3+ lata, periodyzacja, progresja' },
        ]
    },
    {
        id: 'goal',
        title: 'Twój cel',
        subtitle: 'Co chcesz osiągnąć?',
        options: [
            { value: 'strength', title: 'Siła', desc: 'Chcę podnosić coraz ciężej' },
            { value: 'hypertrophy', title: 'Masa mięśniowa', desc: 'Chcę budować mięśnie' },
            { value: 'endurance', title: 'Kondycja', desc: 'Chcę być sprawniejszy/a' },
            { value: 'general', title: 'Ogólna forma', desc: 'Chcę być zdrowy/a i fit' },
        ]
    },
    {
        id: 'days',
        title: 'Dni treningowe',
        subtitle: 'Ile razy w tygodniu trenujesz?',
        options: [
            { value: '3', title: '3 dni/tydzień', desc: 'Full Body lub Push/Pull/Legs' },
            { value: '4', title: '4 dni/tydzień', desc: 'Upper/Lower split' },
            { value: '5', title: '5 dni/tydzień', desc: 'Push/Pull/Legs + powtórki' },
            { value: '6', title: '6 dni/tydzień', desc: 'Push/Pull/Legs ×2' },
        ]
    },
    {
        id: 'calories',
        title: 'Cel kaloryczny',
        subtitle: 'Na czym Ci zależy?',
        options: [
            { value: 'cut', title: 'Redukcja (schudnąć)', desc: 'Deficyt kaloryczny, utrata tkanki tłuszczowej' },
            { value: 'maintain', title: 'Utrzymanie wagi', desc: 'Jedzenie na potrzeby organizmu' },
            { value: 'bulk', title: 'Masa (przybrać)', desc: 'Nadwyżka kaloryczna, budowa mięśni' },
        ]
    },
];

// 1 kg body fat ~ 7700 kcal
const KCAL_PER_KG = 7700;

function calcBMR(gender: string, weightKg: number, heightCm: number, age: number): number {
    if (gender === 'female') {
        return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

function getTDEEMultiplier(level: string): number {
    switch (level) {
        case 'beginner': return 1.375;
        case 'intermediate': return 1.55;
        case 'advanced': return 1.725;
        default: return 1.55;
    }
}

function calcMacros(calories: number, weightKg: number) {
    const protein = Math.round(weightKg * 2);
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
    return { protein, fat, carbs: Math.max(carbs, 0) };
}

interface Props {
    onComplete: (user: User) => void;
}

export default function Onboarding({ onComplete }: Props) {
    const [step, setStep] = useState(0);
    const [selections, setSelections] = useState<Record<string, string>>({});

    // Body data inputs
    const [heightCm, setHeightCm] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [age, setAge] = useState('');

    // Weight plan inputs
    const [targetWeight, setTargetWeight] = useState('');
    const [calorieAdjustment, setCalorieAdjustment] = useState(500);

    const hasWeightPlanStep = selections.calories === 'cut' || selections.calories === 'bulk';
    const BODY_STEP = optionSteps.length;
    const WEIGHT_PLAN_STEP = BODY_STEP + 1;
    const TOTAL_STEPS = optionSteps.length + 1 + (hasWeightPlanStep ? 1 : 0);

    const isBodyStep = step === BODY_STEP;
    const isWeightPlanStep = hasWeightPlanStep && step === WEIGHT_PLAN_STEP;
    const currentOption = (!isBodyStep && !isWeightPlanStep) ? optionSteps[step] : null;

    const isSelected = (() => {
        if (currentOption) return selections[currentOption.id] !== undefined;
        if (isBodyStep) return heightCm !== '' && weightKg !== '' && age !== '';
        if (isWeightPlanStep) return targetWeight !== '';
        return false;
    })();

    // Calculate TDEE and weight plan estimates
    const weightPlan = useMemo(() => {
        const w = Number(weightKg);
        const h = Number(heightCm);
        const a = Number(age);
        const tw = Number(targetWeight);
        if (!w || !h || !a) return null;

        const bmr = calcBMR(selections.gender || 'male', w, h, a);
        const tdee = Math.round(bmr * getTDEEMultiplier(selections.level || 'intermediate'));
        const isCut = selections.calories === 'cut';
        const targetCalories = isCut ? tdee - calorieAdjustment : tdee + calorieAdjustment;
        const diff = Math.abs(tw - w);
        const weeklyChange = (calorieAdjustment * 7) / KCAL_PER_KG;
        const weeks = weeklyChange > 0 ? Math.ceil(diff / weeklyChange) : 0;
        const macros = calcMacros(targetCalories, w);

        return { bmr, tdee, targetCalories, diff, weeklyChange, weeks, macros, isCut };
    }, [weightKg, heightCm, age, targetWeight, calorieAdjustment, selections.gender, selections.level, selections.calories]);

    const handleSelect = (value: string) => {
        if (currentOption) {
            setSelections(prev => ({ ...prev, [currentOption.id]: value }));
        }
    };

    const handleNext = () => {
        if (step < TOTAL_STEPS - 1) {
            setStep(step + 1);
        } else {
            // Save everything
            const user = getUser();
            user.onboarding_completed = true;
            user.gender = selections.gender as User['gender'];
            user.training_goal = selections.goal as User['training_goal'];

            const activityMap: Record<string, User['activity_level']> = {
                beginner: 'sedentary',
                intermediate: 'moderate',
                advanced: 'active',
            };
            if (selections.level) user.activity_level = activityMap[selections.level] ?? user.activity_level;

            const daysCount = selections.days ? parseInt(selections.days, 10) : NaN;
            if (!Number.isNaN(daysCount)) user.training_days = [daysCount];

            // Set calorie & macro goals
            if (weightPlan && hasWeightPlanStep) {
                user.calorie_goal = weightPlan.targetCalories;
                user.protein_goal = weightPlan.macros.protein;
                user.carbs_goal = weightPlan.macros.carbs;
                user.fat_goal = weightPlan.macros.fat;
                user.weight_goal_kg = Number(targetWeight);
            } else if (selections.calories === 'maintain' && weightPlan) {
                user.calorie_goal = weightPlan.tdee;
                const macros = calcMacros(weightPlan.tdee, Number(weightKg));
                user.protein_goal = macros.protein;
                user.carbs_goal = macros.carbs;
                user.fat_goal = macros.fat;
            } else {
                if (selections.calories === 'cut') {
                    user.calorie_goal = 2000; user.protein_goal = 160; user.carbs_goal = 200; user.fat_goal = 67;
                } else if (selections.calories === 'bulk') {
                    user.calorie_goal = 2800; user.protein_goal = 180; user.carbs_goal = 300; user.fat_goal = 93;
                } else {
                    user.calorie_goal = 2400; user.protein_goal = 160; user.carbs_goal = 250; user.fat_goal = 80;
                }
            }

            // Body data
            if (heightCm) user.height_cm = Number(heightCm);
            if (age) {
                const birthYear = new Date().getFullYear() - Number(age);
                user.birth_date = `${birthYear}-01-01`;
            }

            saveUser(user);

            // Save initial weight entry
            if (weightKg) {
                saveWeight({
                    id: uuid(), date: todayStr(),
                    weight_kg: Number(weightKg), created_at: new Date().toISOString(),
                });
            }

            onComplete(user);
        }
    };

    const renderStepTitle = () => {
        if (isBodyStep) return { title: 'Twoje ciało', subtitle: 'Podaj podstawowe dane' };
        if (isWeightPlanStep) {
            const isCut = selections.calories === 'cut';
            return {
                title: isCut ? 'Plan redukcji' : 'Plan budowania masy',
                subtitle: isCut ? 'Ustal swoją wagę docelową' : 'Ustal swoją wagę docelową',
            };
        }
        return { title: currentOption!.title, subtitle: currentOption!.subtitle };
    };

    const stepInfo = renderStepTitle();

    return (
        <div className="onboarding">
            <div className="onboarding-step">
                <div className="onboarding-layout">
                    <div className="onboarding-left">
                        <div className="onboarding-progress">
                            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                <div key={i} className={`onboarding-dot ${i <= step ? 'active' : ''}`} />
                            ))}
                        </div>

                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <span style={{ font: 'var(--label)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                GYM+ Krok {step + 1}/{TOTAL_STEPS}
                            </span>
                        </div>

                        <h1 className="onboarding-title">{stepInfo.title}</h1>
                        <p className="onboarding-subtitle">{stepInfo.subtitle}</p>
                    </div>

                    <div className="onboarding-right">
                        {isWeightPlanStep ? (
                            <div className="onboarding-options" style={{ gap: 16 }}>
                                {/* Target weight input */}
                                <div>
                                    <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                                        Waga docelowa (kg)
                                    </label>
                                    <input
                                        type="number" step="0.1" className="input"
                                        placeholder={selections.calories === 'cut' ? 'np. 70' : 'np. 90'}
                                        value={targetWeight}
                                        onChange={e => {
                                            const v = e.target.value;
                                            if (v === '') { setTargetWeight(v); return; }
                                            const num = Number(v);
                                            const w = Number(weightKg);
                                            if (w > 0) {
                                                if (selections.calories === 'cut' && num >= w) return;
                                                if (selections.calories === 'bulk' && num <= w) return;
                                            }
                                            setTargetWeight(v);
                                        }}
                                        style={{ borderRadius: 'var(--radius-full)', fontSize: 16 }}
                                    />
                                    {weightKg && (
                                        <div style={{ font: 'var(--label)', color: 'var(--text-dim)', marginTop: 6 }}>
                                            {selections.calories === 'cut'
                                                ? `Musi być mniejsza niż ${weightKg} kg`
                                                : `Musi być większa niż ${weightKg} kg`
                                            }
                                        </div>
                                    )}
                                </div>

                                {/* Calorie adjustment slider */}
                                <div>
                                    <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                                        {weightPlan?.isCut ? 'Deficyt kaloryczny' : 'Nadwyżka kaloryczna'}: <strong style={{ color: 'var(--text-primary)' }}>{calorieAdjustment} kcal/dzien</strong>
                                    </label>
                                    <input
                                        type="range" min={100} max={1000} step={50}
                                        value={calorieAdjustment}
                                        onChange={e => setCalorieAdjustment(Number(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--accent)' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--label)', color: 'var(--text-muted)', marginTop: 4 }}>
                                        <span>100</span>
                                        <span>1000 kcal</span>
                                    </div>
                                </div>

                                {/* Summary card */}
                                {weightPlan && targetWeight && (
                                    <div className="card" style={{
                                        padding: 'var(--space-lg)',
                                        background: 'rgba(255,255,255,0.04)',
                                        borderRadius: 'var(--radius-lg)',
                                        display: 'flex', flexDirection: 'column', gap: 12,
                                    }}>
                                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                                            Podsumowanie
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <div style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>TDEE</div>
                                                <div style={{ font: 'var(--heading-3)' }}>{weightPlan.tdee} kcal</div>
                                            </div>
                                            <div>
                                                <div style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>Twój cel</div>
                                                <div style={{ font: 'var(--heading-3)', color: weightPlan.isCut ? '#FF6B6B' : '#22C55E' }}>
                                                    {weightPlan.targetCalories} kcal
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ height: 1, background: 'var(--border)' }} />

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <div style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>
                                                    {weightPlan.isCut ? 'Do zrzucenia' : 'Do przybrania'}
                                                </div>
                                                <div style={{ font: 'var(--heading-3)' }}>
                                                    {weightPlan.diff.toFixed(1)} kg
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ font: 'var(--label)', color: 'var(--text-muted)' }}>Tempo</div>
                                                <div style={{ font: 'var(--heading-3)' }}>
                                                    {weightPlan.weeklyChange.toFixed(2)} kg/tydz
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            background: weightPlan.isCut ? 'rgba(255,107,107,0.1)' : 'rgba(34,197,94,0.1)',
                                            border: `1px solid ${weightPlan.isCut ? 'rgba(255,107,107,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            padding: 'var(--space-md)',
                                            textAlign: 'center',
                                        }}>
                                            <div style={{ font: 'var(--label)', color: 'var(--text-muted)', marginBottom: 4 }}>Szacowany czas</div>
                                            <div style={{ font: 'var(--heading-2)', color: weightPlan.isCut ? '#FF6B6B' : '#22C55E' }}>
                                                {weightPlan.weeks < 52
                                                    ? `${weightPlan.weeks} tyg.`
                                                    : `${Math.round(weightPlan.weeks / 4)} mies.`
                                                }
                                            </div>
                                            <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginTop: 4 }}>
                                                {weightKg} kg → {targetWeight} kg
                                            </div>
                                        </div>

                                        <div style={{ height: 1, background: 'var(--border)' }} />

                                        {/* Macros */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                                            <div>
                                                <div style={{ font: 'var(--label)', color: '#6B9FFF' }}>Białko</div>
                                                <div style={{ font: 'var(--heading-3)' }}>{weightPlan.macros.protein}g</div>
                                            </div>
                                            <div>
                                                <div style={{ font: 'var(--label)', color: '#FFB84D' }}>Węgle</div>
                                                <div style={{ font: 'var(--heading-3)' }}>{weightPlan.macros.carbs}g</div>
                                            </div>
                                            <div>
                                                <div style={{ font: 'var(--label)', color: '#FF6B6B' }}>Tłuszcze</div>
                                                <div style={{ font: 'var(--heading-3)' }}>{weightPlan.macros.fat}g</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : isBodyStep ? (
                            <div className="onboarding-options" style={{ gap: 12 }}>
                                <div>
                                    <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Wzrost (cm)</label>
                                    <input
                                        type="number" className="input" placeholder="np. 180"
                                        value={heightCm} onChange={e => setHeightCm(e.target.value)}
                                        style={{ borderRadius: 'var(--radius-full)', fontSize: 16 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Waga (kg)</label>
                                    <input
                                        type="number" step="0.1" className="input" placeholder="np. 80"
                                        value={weightKg} onChange={e => setWeightKg(e.target.value)}
                                        style={{ borderRadius: 'var(--radius-full)', fontSize: 16 }}
                                    />
                                </div>
                                <div>
                                    <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Wiek (lat)</label>
                                    <input
                                        type="number" className="input" placeholder="np. 25"
                                        value={age} onChange={e => setAge(e.target.value)}
                                        style={{ borderRadius: 'var(--radius-full)', fontSize: 16 }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="onboarding-options">
                                {currentOption!.options.map(opt => (
                                    <div
                                        key={opt.value}
                                        className={`onboarding-option ${selections[currentOption!.id] === opt.value ? 'selected' : ''}`}
                                        onClick={() => handleSelect(opt.value)}
                                    >
                                        <div className="onboarding-option-title">{opt.title}</div>
                                        {opt.desc && <div className="onboarding-option-desc">{opt.desc}</div>}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="onboarding-footer">
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                {step > 0 && (
                                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>
                                        ← Wstecz
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary btn-lg"
                                    style={{ flex: 2, opacity: isSelected ? 1 : 0.5 }}
                                    onClick={handleNext}
                                    disabled={!isSelected}
                                >
                                    {step < TOTAL_STEPS - 1 ? 'Dalej →' : 'Zaczynamy!'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
