import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMeals, getUser, getRecipes, getWeightEntries, getBadges, saveBadges, addFeedPost } from '../../data/store';
import { Lock, CheckCircle, Share2 } from 'lucide-react';
import type { BadgeRecord } from '../../data/store';

interface BadgeDef {
    id: string;
    icon: string;
    name: string;
    description: string;
    category: string;
    check: (ctx: DietContext) => boolean;
    progressFn: (ctx: DietContext) => { current: number; target: number };
}

interface DietContext {
    totalMeals: number;
    uniqueDays: number;
    totalCalories: number;
    totalProtein: number;
    totalWaterEntries: number;
    recipesCount: number;
    weightEntries: number;
    uniqueFoods: number;
    daysOnTarget: number;
    highProteinDays: number;
    streak: number;
    breakfastCount: number;
}

function computeDietContext(): DietContext {
    const meals = getAllMeals();
    const user = getUser();
    const recipes = getRecipes();
    const weightEntries = getWeightEntries();

    const totalMeals = meals.length;
    const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
    const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
    const uniqueFoods = new Set(meals.map(m => m.food_id)).size;
    const recipesCount = recipes.length;

    // Unique days with logged meals
    const daySet = new Set(meals.map(m => m.date));
    const uniqueDays = daySet.size;

    // Breakfast count
    const breakfastCount = new Set(meals.filter(m => m.meal_type === 'breakfast').map(m => m.date)).size;

    // Days on calorie target (within ±10%)
    const calGoal = user.calorie_goal || 2200;
    const proteinGoal = user.protein_goal || 160;
    const dayMap = new Map<string, { cal: number; protein: number }>();
    for (const m of meals) {
        const prev = dayMap.get(m.date) || { cal: 0, protein: 0 };
        dayMap.set(m.date, { cal: prev.cal + m.calories, protein: prev.protein + m.protein });
    }
    let daysOnTarget = 0;
    let highProteinDays = 0;
    for (const [, v] of dayMap) {
        if (v.cal >= calGoal * 0.9 && v.cal <= calGoal * 1.1) daysOnTarget++;
        if (v.protein >= proteinGoal) highProteinDays++;
    }

    // Logging streak (consecutive days with meals)
    const sortedDays = [...daySet].sort().reverse();
    let streak = 0;
    if (sortedDays.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let checkDate: Date;
        if (daySet.has(todayStr)) {
            checkDate = new Date(today);
        } else if (daySet.has(yesterdayStr)) {
            checkDate = new Date(yesterday);
        } else {
            checkDate = new Date(today); // will give 0
        }

        while (true) {
            const key = checkDate.toISOString().split('T')[0];
            if (daySet.has(key)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
    }

    return {
        totalMeals, uniqueDays, totalCalories, totalProtein,
        totalWaterEntries: 0, // water tracked separately
        recipesCount, weightEntries: weightEntries.length,
        uniqueFoods, daysOnTarget, highProteinDays, streak, breakfastCount,
    };
}

const DIET_BADGES: BadgeDef[] = [
    // Logowanie posiłków
    { id: 'd_first', icon: '🍽️', name: 'Pierwszy posiłek', description: 'Zaloguj swój pierwszy posiłek', category: 'Logowanie',
        check: c => c.totalMeals >= 1, progressFn: c => ({ current: Math.min(c.totalMeals, 1), target: 1 }) },
    { id: 'd_m50', icon: '📝', name: 'Dziennik', description: 'Zaloguj 50 posiłków', category: 'Logowanie',
        check: c => c.totalMeals >= 50, progressFn: c => ({ current: Math.min(c.totalMeals, 50), target: 50 }) },
    { id: 'd_m200', icon: '📚', name: 'Kronikarz', description: 'Zaloguj 200 posiłków', category: 'Logowanie',
        check: c => c.totalMeals >= 200, progressFn: c => ({ current: Math.min(c.totalMeals, 200), target: 200 }) },
    { id: 'd_m500', icon: '🏆', name: 'Mistrz logowania', description: 'Zaloguj 500 posiłków', category: 'Logowanie',
        check: c => c.totalMeals >= 500, progressFn: c => ({ current: Math.min(c.totalMeals, 500), target: 500 }) },

    // Regularność
    { id: 'd_d7', icon: '📅', name: 'Tydzień diety', description: 'Loguj posiłki przez 7 różnych dni', category: 'Regularność',
        check: c => c.uniqueDays >= 7, progressFn: c => ({ current: Math.min(c.uniqueDays, 7), target: 7 }) },
    { id: 'd_d30', icon: '🗓️', name: 'Miesiąc diety', description: 'Loguj posiłki przez 30 różnych dni', category: 'Regularność',
        check: c => c.uniqueDays >= 30, progressFn: c => ({ current: Math.min(c.uniqueDays, 30), target: 30 }) },
    { id: 'd_d100', icon: '💯', name: '100 dni', description: 'Loguj posiłki przez 100 różnych dni', category: 'Regularność',
        check: c => c.uniqueDays >= 100, progressFn: c => ({ current: Math.min(c.uniqueDays, 100), target: 100 }) },

    // Streak
    { id: 'd_s3', icon: '🔥', name: '3 dni z rzędu', description: 'Loguj posiłki 3 dni bez przerwy', category: 'Streak',
        check: c => c.streak >= 3, progressFn: c => ({ current: Math.min(c.streak, 3), target: 3 }) },
    { id: 'd_s7', icon: '⚡', name: 'Tydzień non-stop', description: 'Loguj posiłki 7 dni bez przerwy', category: 'Streak',
        check: c => c.streak >= 7, progressFn: c => ({ current: Math.min(c.streak, 7), target: 7 }) },
    { id: 'd_s30', icon: '👑', name: 'Miesiąc bez przerwy', description: 'Loguj posiłki 30 dni bez przerwy', category: 'Streak',
        check: c => c.streak >= 30, progressFn: c => ({ current: Math.min(c.streak, 30), target: 30 }) },

    // Cele kaloryczne
    { id: 'd_target5', icon: '🎯', name: 'Na celowniku', description: 'Traf w cel kaloryczny 5 razy (±10%)', category: 'Cele',
        check: c => c.daysOnTarget >= 5, progressFn: c => ({ current: Math.min(c.daysOnTarget, 5), target: 5 }) },
    { id: 'd_target20', icon: '🏹', name: 'Snajper', description: 'Traf w cel kaloryczny 20 razy', category: 'Cele',
        check: c => c.daysOnTarget >= 20, progressFn: c => ({ current: Math.min(c.daysOnTarget, 20), target: 20 }) },
    { id: 'd_target50', icon: '💎', name: 'Perfekcjonista', description: 'Traf w cel kaloryczny 50 razy', category: 'Cele',
        check: c => c.daysOnTarget >= 50, progressFn: c => ({ current: Math.min(c.daysOnTarget, 50), target: 50 }) },

    // Białko
    { id: 'd_prot10', icon: '🥩', name: 'Białkowy wojownik', description: 'Osiągnij cel białkowy 10 razy', category: 'Białko',
        check: c => c.highProteinDays >= 10, progressFn: c => ({ current: Math.min(c.highProteinDays, 10), target: 10 }) },
    { id: 'd_prot50', icon: '💪', name: 'Maszyna białkowa', description: 'Osiągnij cel białkowy 50 razy', category: 'Białko',
        check: c => c.highProteinDays >= 50, progressFn: c => ({ current: Math.min(c.highProteinDays, 50), target: 50 }) },

    // Różnorodność
    { id: 'd_food10', icon: '🥗', name: 'Smakosz', description: 'Jedz 10 różnych produktów', category: 'Różnorodność',
        check: c => c.uniqueFoods >= 10, progressFn: c => ({ current: Math.min(c.uniqueFoods, 10), target: 10 }) },
    { id: 'd_food30', icon: '🌍', name: 'Kuchnia świata', description: 'Jedz 30 różnych produktów', category: 'Różnorodność',
        check: c => c.uniqueFoods >= 30, progressFn: c => ({ current: Math.min(c.uniqueFoods, 30), target: 30 }) },

    // Śniadania
    { id: 'd_bf10', icon: '🌅', name: 'Śniadaniowicz', description: 'Zaloguj śniadanie 10 razy', category: 'Nawyki',
        check: c => c.breakfastCount >= 10, progressFn: c => ({ current: Math.min(c.breakfastCount, 10), target: 10 }) },
    { id: 'd_bf30', icon: '☀️', name: 'Poranny rytuał', description: 'Zaloguj śniadanie 30 razy', category: 'Nawyki',
        check: c => c.breakfastCount >= 30, progressFn: c => ({ current: Math.min(c.breakfastCount, 30), target: 30 }) },

    // Przepisy i waga
    { id: 'd_rec1', icon: '👨‍🍳', name: 'Kucharz', description: 'Stwórz swój pierwszy przepis', category: 'Extras',
        check: c => c.recipesCount >= 1, progressFn: c => ({ current: Math.min(c.recipesCount, 1), target: 1 }) },
    { id: 'd_rec5', icon: '📖', name: 'Książka kucharska', description: 'Stwórz 5 przepisów', category: 'Extras',
        check: c => c.recipesCount >= 5, progressFn: c => ({ current: Math.min(c.recipesCount, 5), target: 5 }) },
    { id: 'd_weight10', icon: '⚖️', name: 'Kontrola wagi', description: 'Zaloguj wagę 10 razy', category: 'Extras',
        check: c => c.weightEntries >= 10, progressFn: c => ({ current: Math.min(c.weightEntries, 10), target: 10 }) },
];

export default function DietBadges() {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState<string | null>(null);
    const [savedBadges, setSavedBadges] = useState<BadgeRecord[]>(getBadges());
    const [sharedBadges, setSharedBadges] = useState<Set<string>>(new Set());

    const handleShareBadge = (def: BadgeDef, e: React.MouseEvent) => {
        e.stopPropagation();
        addFeedPost({
            id: `badge-${def.id}-${Date.now()}`,
            type: 'badge',
            timestamp: new Date().toISOString(),
            data: { icon: def.icon, name: def.name },
        });
        setSharedBadges(prev => new Set(prev).add(def.id));
    };

    const ctx = useMemo(() => computeDietContext(), []);

    // Persist newly unlocked badges
    useEffect(() => {
        let changed = false;
        const current = [...savedBadges];
        for (const def of DIET_BADGES) {
            const isUnlocked = def.check(ctx);
            const alreadySaved = current.find(b => b.id === def.id);
            if (isUnlocked && !alreadySaved) {
                current.push({ id: def.id, unlocked_at: new Date().toISOString() });
                changed = true;
            }
        }
        if (changed) {
            saveBadges(current);
            setSavedBadges(current);
        }
    }, [ctx]);

    const unlockedIds = new Set(savedBadges.map(b => b.id));
    const unlockedCount = DIET_BADGES.filter(d => unlockedIds.has(d.id)).length;
    const categories = [...new Set(DIET_BADGES.map(b => b.category))];

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center gap-md">
                    <button className="back-btn" onClick={() => navigate('/diet')}>←</button>
                    <h1 className="page-title">Odznaki diety</h1>
                </div>
                <span style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                    {unlockedCount}/{DIET_BADGES.length} zdobytych
                </span>
            </div>

            {/* Overall progress */}
            <div className="card mb-lg" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{unlockedCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 10 }}>zdobytych odznak</div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: 2, background: 'var(--accent)',
                        width: `${(unlockedCount / DIET_BADGES.length) * 100}%`,
                        transition: 'width 0.4s ease',
                    }} />
                </div>
            </div>

            {categories.map(cat => {
                const catBadges = DIET_BADGES.filter(b => b.category === cat);
                return (
                    <div key={cat}>
                        <div className="section-label">{cat.toUpperCase()}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 'var(--space-md)' }}>
                            {catBadges.map(def => {
                                const record = savedBadges.find(b => b.id === def.id);
                                const unlocked = unlockedIds.has(def.id);
                                const isExpanded = expanded === def.id;
                                const progress = def.progressFn(ctx);
                                const pct = Math.min((progress.current / progress.target) * 100, 100);

                                return (
                                    <div key={def.id}
                                        onClick={() => setExpanded(isExpanded ? null : def.id)}
                                        className="card"
                                        style={{
                                            padding: '14px 8px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            gridColumn: isExpanded ? '1 / -1' : undefined,
                                        }}
                                    >
                                        <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 6,
                                            filter: unlocked ? 'none' : 'grayscale(1)', opacity: unlocked ? 1 : 0.5 }}>
                                            {def.icon}
                                        </div>
                                        <div style={{
                                            fontSize: 11, fontWeight: 700, lineHeight: 1.2,
                                            color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        }}>
                                            {def.name}
                                        </div>

                                        {isExpanded && (
                                            <div style={{ marginTop: 12, textAlign: 'left' }}>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                                    {def.description}
                                                </div>

                                                {unlocked && record ? (
                                                    <div className="flex items-center gap-xs" style={{ marginBottom: 8 }}>
                                                        <CheckCircle size={14} color="var(--accent)" strokeWidth={2} />
                                                        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                                                            Zdobyta {new Date(record.unlocked_at).toLocaleDateString('pl-PL')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-xs" style={{ marginBottom: 8 }}>
                                                        <Lock size={14} color="var(--text-dim)" strokeWidth={2} />
                                                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                                            Brakuje: {progress.target - progress.current}
                                                        </span>
                                                    </div>
                                                )}

                                                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 3,
                                                        background: unlocked ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                                                        width: `${pct}%`,
                                                        transition: 'width 0.3s ease',
                                                    }} />
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                    {progress.current} / {progress.target}
                                                </div>

                                                {unlocked && (
                                                    <button
                                                        onClick={(e) => handleShareBadge(def, e)}
                                                        disabled={sharedBadges.has(def.id)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                            width: '100%', marginTop: 10, padding: '8px 0',
                                                            background: sharedBadges.has(def.id) ? 'rgba(34,197,94,0.1)' : 'rgba(255,199,0,0.12)',
                                                            border: 'none', borderRadius: 8, cursor: sharedBadges.has(def.id) ? 'default' : 'pointer',
                                                            fontSize: 12, fontWeight: 700,
                                                            color: sharedBadges.has(def.id) ? 'var(--accent)' : '#FFC700',
                                                        }}
                                                    >
                                                        {sharedBadges.has(def.id) ? (
                                                            <><CheckCircle size={14} strokeWidth={2} /> Udostępniono</>
                                                        ) : (
                                                            <><Share2 size={14} strokeWidth={2} /> Udostępnij na feed</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
