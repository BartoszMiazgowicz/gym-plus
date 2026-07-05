import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getCompletedWorkouts, getBadges, saveUser, getAllMeals, getWeightEntries, getAllWater } from '../data/store';
import { isDeveloperEmail } from '../lib/developers';
import { Settings, LogOut, Flame, Pencil, Code2 } from 'lucide-react';

const ALL_BADGE_MAP: Record<string, { icon: string; name: string }> = {
    // Workout badges
    first: { icon: '🏋️', name: 'Pierwszy trening' },
    w10: { icon: '💪', name: 'Regularny' },
    w25: { icon: '🔥', name: 'Wytrwały' },
    w50: { icon: '⚡', name: 'Maszyna' },
    w100: { icon: '👑', name: 'Centurion' },
    v1t: { icon: '🏗️', name: '1 tona' },
    v10t: { icon: '🏔️', name: '10 ton' },
    v100t: { icon: '🌋', name: '100 ton' },
    r500: { icon: '🔄', name: '500 powtórzeń' },
    r2000: { icon: '💥', name: '2000 powtórzeń' },
    r5000: { icon: '🚀', name: '5000 powtórzeń' },
    h10: { icon: '⏱️', name: '10 godzin' },
    h50: { icon: '⏰', name: '50 godzin' },
    h100: { icon: '🕐', name: '100 godzin' },
    ex10: { icon: '🎯', name: 'Wszechstronny' },
    ex25: { icon: '🧠', name: 'Encyklopedia' },
    vol1k: { icon: '💣', name: 'Ciężka sesja' },
    dur90: { icon: '🏃', name: 'Maraton' },
    s3: { icon: '📅', name: '3 dni z rzędu' },
    s7: { icon: '🗓️', name: 'Tydzień non-stop' },
    s14: { icon: '🔥', name: '2 tygodnie ognia' },
    // Diet badges
    d_first: { icon: '🍽️', name: 'Pierwszy posiłek' },
    d_m50: { icon: '📝', name: 'Dziennik' },
    d_m200: { icon: '📚', name: 'Kronikarz' },
    d_m500: { icon: '🏆', name: 'Mistrz logowania' },
    d_d7: { icon: '📅', name: 'Tydzień diety' },
    d_d30: { icon: '🗓️', name: 'Miesiąc diety' },
    d_d100: { icon: '💯', name: '100 dni' },
    d_s3: { icon: '🔥', name: '3 dni z rzędu' },
    d_s7: { icon: '⚡', name: 'Tydzień non-stop' },
    d_s30: { icon: '👑', name: 'Miesiąc bez przerwy' },
    d_target5: { icon: '🎯', name: 'Na celowniku' },
    d_target20: { icon: '🏹', name: 'Snajper' },
    d_target50: { icon: '💎', name: 'Perfekcjonista' },
    d_prot10: { icon: '🥩', name: 'Białkowy wojownik' },
    d_prot50: { icon: '💪', name: 'Maszyna białkowa' },
    d_food10: { icon: '🥗', name: 'Smakosz' },
    d_food30: { icon: '🌍', name: 'Kuchnia świata' },
    d_bf10: { icon: '🌅', name: 'Śniadaniowicz' },
    d_bf30: { icon: '☀️', name: 'Poranny rytuał' },
    d_rec1: { icon: '👨‍🍳', name: 'Kucharz' },
    d_rec5: { icon: '📖', name: 'Książka kucharska' },
    d_weight10: { icon: '⚖️', name: 'Kontrola wagi' },
};

type Metric = 'hours' | 'volume' | 'reps';
type Period = '3m' | '1y' | 'all';

function getWeeklyData(period: Period, metric: Metric) {
    const workouts = getCompletedWorkouts();
    const now = new Date();

    let weeks: number;
    if (period === '3m') weeks = 13;
    else if (period === '1y') weeks = 52;
    else {
        if (workouts.length === 0) return [];
        const oldest = new Date(workouts[workouts.length - 1].started_at);
        weeks = Math.max(Math.ceil((now.getTime() - oldest.getTime()) / (7 * 24 * 3600 * 1000)), 1);
    }

    const result: { label: string; value: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1 - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekWorkouts = workouts.filter(w => {
            const d = new Date(w.started_at);
            return d >= weekStart && d < weekEnd;
        });

        let value = 0;
        if (metric === 'hours') {
            value = Math.round((weekWorkouts.reduce((s, w) => s + (w.duration_seconds || 0), 0) / 3600) * 10) / 10;
        } else if (metric === 'volume') {
            value = Math.round(weekWorkouts.reduce((s, w) => s + (w.total_volume_kg || 0), 0));
        } else {
            value = weekWorkouts.reduce((s, w) => s + (w.total_reps || 0), 0);
        }

        const dd = weekStart.getDate().toString().padStart(2, '0');
        const mm = (weekStart.getMonth() + 1).toString().padStart(2, '0');
        result.push({ label: `${dd}.${mm}`, value });
    }
    return result;
}


function formatTotal(value: number, metric: Metric): string {
    if (metric === 'hours') return `${value.toFixed(1)}h`;
    if (metric === 'volume') return value >= 1000 ? `${(value / 1000).toFixed(1)}t` : `${Math.round(value)}kg`;
    return `${Math.round(value)}`;
}

const metricLabels: Record<Metric, string> = { hours: 'Godziny', volume: 'Ciężar', reps: 'Powtórzenia' };
const periodLabels: Record<Period, string> = { '3m': '3 mies.', '1y': 'Rok', all: 'Całość' };

// ===== DIET CHART =====
type DietMetric = 'weight' | 'calories' | 'water';
type DietPeriod = 'daily' | 'weekly' | 'month' | 'all';

const dietMetricLabels: Record<DietMetric, string> = { weight: 'Waga', calories: 'Kalorie', water: 'Woda' };
const dietPeriodLabels: Record<DietPeriod, string> = { daily: 'Dziennie', weekly: 'Tygodn.', month: 'Miesiąc', all: 'Całość' };

function getDietChartData(period: DietPeriod, metric: DietMetric): { label: string; value: number }[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (metric === 'weight') {
        const entries = getWeightEntries(); // sorted desc
        if (entries.length === 0) return [];
        let filtered = [...entries].reverse(); // oldest first
        if (period === 'daily') filtered = filtered.slice(-30);
        else if (period === 'weekly') filtered = filtered.slice(-90);
        else if (period === 'month') filtered = filtered.slice(-30);
        // 'all' = all entries

        return filtered.map(e => {
            const d = new Date(e.date);
            return { label: `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`, value: e.weight_kg };
        });
    }

    // For calories and water, aggregate by day or week
    const meals = getAllMeals();
    const waterEntries = getAllWater();

    // Build daily map
    const dayMap = new Map<string, number>();

    if (metric === 'calories') {
        for (const m of meals) {
            dayMap.set(m.date, (dayMap.get(m.date) || 0) + m.calories);
        }
    } else {
        for (const w of waterEntries) {
            dayMap.set(w.date, (dayMap.get(w.date) || 0) + w.amount_ml);
        }
    }

    if (dayMap.size === 0) return [];

    const sortedDays = [...dayMap.keys()].sort();

    if (period === 'daily') {
        // Last 30 days, show each day
        const days: { label: string; value: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const dd = d.getDate().toString().padStart(2, '0');
            const mm = (d.getMonth() + 1).toString().padStart(2, '0');
            days.push({ label: `${dd}.${mm}`, value: dayMap.get(key) || 0 });
        }
        return days;
    }

    if (period === 'weekly') {
        // Last 12 weeks, aggregate per week
        const weeks: { label: string; value: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() + 1 - i * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            let total = 0;
            let count = 0;
            for (const [day, val] of dayMap) {
                const d = new Date(day);
                if (d >= weekStart && d < weekEnd) { total += val; count++; }
            }
            const dd = weekStart.getDate().toString().padStart(2, '0');
            const mm = (weekStart.getMonth() + 1).toString().padStart(2, '0');
            weeks.push({ label: `${dd}.${mm}`, value: count > 0 ? Math.round(total / count) : 0 });
        }
        return weeks;
    }

    if (period === 'month') {
        // Last 30 days daily
        const days: { label: string; value: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const dd = d.getDate().toString().padStart(2, '0');
            const mm = (d.getMonth() + 1).toString().padStart(2, '0');
            days.push({ label: `${dd}.${mm}`, value: dayMap.get(key) || 0 });
        }
        return days;
    }

    // all — weekly averages from the beginning
    if (sortedDays.length === 0) return [];
    const oldest = new Date(sortedDays[0]);
    const totalWeeks = Math.max(Math.ceil((now.getTime() - oldest.getTime()) / (7 * 24 * 3600 * 1000)), 1);
    const weeks: { label: string; value: number }[] = [];
    for (let i = totalWeeks - 1; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1 - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        let total = 0;
        let count = 0;
        for (const [day, val] of dayMap) {
            const d = new Date(day);
            if (d >= weekStart && d < weekEnd) { total += val; count++; }
        }
        const dd = weekStart.getDate().toString().padStart(2, '0');
        const mm = (weekStart.getMonth() + 1).toString().padStart(2, '0');
        weeks.push({ label: `${dd}.${mm}`, value: count > 0 ? Math.round(total / count) : 0 });
    }
    return weeks;
}


function getStreak(): number {
    const workouts = getCompletedWorkouts();
    if (workouts.length === 0) return 0;

    const trainingDays = new Set(
        workouts.map(w => {
            const d = new Date(w.started_at);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if trained today or yesterday (to not break streak mid-day)
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

    let streak = 0;
    let checkDate: Date;

    if (trainingDays.has(todayKey)) {
        checkDate = new Date(today);
    } else if (trainingDays.has(yesterdayKey)) {
        checkDate = new Date(yesterday);
    } else {
        return 0;
    }

    while (true) {
        const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
        if (trainingDays.has(key)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

export default function Profile() {
    const navigate = useNavigate();
    const { signOut, user: authUser } = useAuth();
    const isDev = isDeveloperEmail(authUser?.email);
    const [user, setUser] = useState(getUser());
    const workoutCount = getCompletedWorkouts().length;
    const streak = useMemo(() => getStreak(), []);
    const [metric, setMetric] = useState<Metric>('hours');
    const [period, setPeriod] = useState<Period>('3m');
    const [dietMetric, setDietMetric] = useState<DietMetric>('weight');
    const [dietPeriod, setDietPeriod] = useState<DietPeriod>('month');
    const [showBadgePicker, setShowBadgePicker] = useState(false);

    const unlockedBadges = useMemo(() => getBadges(), []);
    const featured = (user.featured_badges || []).filter(id => unlockedBadges.some(b => b.id === id));

    const toggleFeatured = (id: string) => {
        let next: string[];
        if (featured.includes(id)) {
            next = featured.filter(f => f !== id);
        } else {
            if (featured.length >= 3) return;
            next = [...featured, id];
        }
        const updated = { ...user, featured_badges: next };
        setUser(updated);
        saveUser(updated);
    };

    const chartData = useMemo(() => getWeeklyData(period, metric), [period, metric]);
    const maxVal = Math.max(...chartData.map(w => w.value), 1);
    const totalVal = chartData.reduce((s, w) => s + w.value, 0);
    const avgVal = chartData.length > 0 ? totalVal / chartData.length : 0;
    const labelStep = chartData.length > 20 ? Math.ceil(chartData.length / 10) : chartData.length > 10 ? 2 : 1;

    // Diet chart
    const dietData = useMemo(() => getDietChartData(dietPeriod, dietMetric), [dietPeriod, dietMetric]);
    const dietMaxVal = dietData.length > 0 ? Math.max(...dietData.map(d => d.value), 1) : 1;
    const dietMinVal = dietMetric === 'weight' && dietData.length > 0 ? Math.min(...dietData.filter(d => d.value > 0).map(d => d.value)) : 0;
    const dietNonZero = dietData.filter(d => d.value > 0);
    const dietAvg = dietNonZero.length > 0 ? dietNonZero.reduce((s, d) => s + d.value, 0) / dietNonZero.length : 0;
    const dietLabelStep = dietData.length > 20 ? Math.ceil(dietData.length / 10) : dietData.length > 10 ? 2 : 1;

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="page-title">Profil</h1>
                <button
                    onClick={() => navigate('/settings')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
                >
                    <Settings size={22} color="var(--text-secondary)" strokeWidth={1.5} />
                </button>
            </div>

            {/* User info */}
            <div className="card mb-lg">
                <div className="flex items-center gap-md">
                    <div style={{
                        width: 104, height: 104, borderRadius: '50%',
                        background: 'transparent',
                        border: '2px solid rgba(255, 255, 255, 0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
                        overflow: 'hidden',
                    }}>
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M6 20c0-4 2.7-7 6-7s6 3 6 7" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-xs" style={{ font: 'var(--heading-3)', color: 'var(--text-primary)' }}>
                            {user.name || 'Brak imienia'}
                            {isDev && (
                                <span
                                    title="Konto deweloperskie"
                                    className="flex items-center gap-xs"
                                    style={{
                                        fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                                        color: '#A78BFA', background: 'rgba(167, 139, 250, 0.15)',
                                        border: '1px solid rgba(167, 139, 250, 0.4)',
                                        borderRadius: 999, padding: '2px 7px',
                                    }}
                                >
                                    <Code2 size={11} strokeWidth={2} />
                                    DEV
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-xs mt-xs">
                            <span style={{ font: 'var(--caption)', color: 'var(--text-secondary)' }}>
                                @{user.username || 'identyfikator'}
                            </span>
                        </div>
                        <div className="flex items-center gap-md" style={{ marginTop: 10 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{workoutCount}</div>
                                <div style={{ font: 'var(--label)', color: 'var(--text-muted)', fontSize: 10 }}>treningów</div>
                            </div>
                            <div style={{ width: 1, height: 24, background: 'var(--border-light)' }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>0</div>
                                <div style={{ font: 'var(--label)', color: 'var(--text-muted)', fontSize: 10 }}>obserwujących</div>
                            </div>
                            <div style={{ width: 1, height: 24, background: 'var(--border-light)' }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>0</div>
                                <div style={{ font: 'var(--label)', color: 'var(--text-muted)', fontSize: 10 }}>obserwowanych</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured badges */}
            {unlockedBadges.length > 0 && (
                <div className="card mb-lg">
                    <div className="flex items-center justify-between" style={{ marginBottom: featured.length > 0 ? 12 : 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Moje odznaki</span>
                        <button
                            onClick={() => setShowBadgePicker(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}
                        >
                            <Pencil size={12} strokeWidth={1.5} />
                            {featured.length === 0 ? 'Wybierz' : 'Zmień'}
                        </button>
                    </div>
                    {featured.length > 0 ? (
                        <div className="flex items-center justify-center" style={{ gap: 40, padding: '12px 0' }}>
                            {featured.map(id => {
                                const badge = ALL_BADGE_MAP[id];
                                if (!badge) return null;
                                return (
                                    <div key={id} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 6 }}>{badge.icon}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, maxWidth: 80, lineHeight: 1.2 }}>{badge.name}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 12, color: 'var(--text-dim)' }}>
                            Wybierz do 3 odznak do wyświetlenia
                        </div>
                    )}
                </div>
            )}

            {/* Streak */}
            {streak > 0 && (
                <div className="card mb-lg" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'rgba(255, 149, 0, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Flame size={24} color="#FF9500" strokeWidth={2} />
                    </div>
                    <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#FF9500', lineHeight: 1 }}>{streak}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {streak === 1 ? 'Trenujesz 1 dzień bez przerwy'
                                : `Trenujesz ${streak} dni bez przerwy`}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats chart */}
            <div className="card mb-lg">
                {/* Metric selector */}
                <div className="chips-row" style={{ margin: '0 0 12px 0', gap: 4 }}>
                    {(['hours', 'volume', 'reps'] as Metric[]).map(m => (
                        <div key={m} className={`chip ${metric === m ? 'active' : ''}`} onClick={() => setMetric(m)}>
                            {metricLabels[m]}
                        </div>
                    ))}
                </div>

                {/* Period selector */}
                <div className="chips-row" style={{ margin: '0 0 16px 0', gap: 4 }}>
                    {(['3m', '1y', 'all'] as Period[]).map(p => (
                        <div key={p} className={`chip ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}
                            style={{ fontSize: 11, padding: '4px 10px' }}>
                            {periodLabels[p]}
                        </div>
                    ))}
                </div>

                {/* Bar chart */}
                {chartData.length > 0 ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: chartData.length > 20 ? 2 : 6, height: 120, marginBottom: 8 }}>
                            {chartData.map((w, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                    <div style={{
                                        width: '100%',
                                        maxWidth: chartData.length > 20 ? 16 : 32,
                                        height: `${Math.max((w.value / maxVal) * 100, w.value > 0 ? 8 : 3)}%`,
                                        background: w.value > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                                        borderRadius: chartData.length > 20 ? 2 : 4,
                                        minHeight: 3,
                                        transition: 'height 0.3s ease',
                                    }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: chartData.length > 20 ? 2 : 6 }}>
                            {chartData.map((w, i) => (
                                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: 'var(--text-dim)', overflow: 'hidden' }}>
                                    {i % labelStep === 0 ? w.label : ''}
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'center', gap: 24 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{formatTotal(totalVal, metric)}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>łącznie</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{formatTotal(avgVal, metric)}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>śr. tyg.</div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 13 }}>
                        Brak danych treningowych
                    </div>
                )}
            </div>

            {/* Diet chart */}
            <div className="card mb-lg">
                {/* Metric selector */}
                <div className="chips-row" style={{ margin: '0 0 12px 0', gap: 4 }}>
                    {(['weight', 'calories', 'water'] as DietMetric[]).map(m => (
                        <div key={m} className={`chip ${dietMetric === m ? 'active' : ''}`} onClick={() => setDietMetric(m)}>
                            {dietMetricLabels[m]}
                        </div>
                    ))}
                </div>

                {/* Period selector */}
                <div className="chips-row" style={{ margin: '0 0 16px 0', gap: 4 }}>
                    {(['daily', 'weekly', 'month', 'all'] as DietPeriod[]).map(p => (
                        <div key={p} className={`chip ${dietPeriod === p ? 'active' : ''}`} onClick={() => setDietPeriod(p)}
                            style={{ fontSize: 11, padding: '4px 10px' }}>
                            {dietPeriodLabels[p]}
                        </div>
                    ))}
                </div>

                {dietData.length > 0 ? (
                    <>
                        {dietMetric === 'weight' ? (
                            /* Line chart for weight */
                            <svg width="100%" height="120" viewBox={`0 0 ${dietData.length * 20} 120`} preserveAspectRatio="none" style={{ display: 'block', marginBottom: 8 }}>
                                {(() => {
                                    const range = dietMaxVal - dietMinVal || 1;
                                    const pad = range * 0.1;
                                    const min = dietMinVal - pad;
                                    const max = dietMaxVal + pad;
                                    const w = dietData.length * 20;
                                    const points = dietData.map((d, i) => {
                                        const x = dietData.length === 1 ? w / 2 : (i / (dietData.length - 1)) * w;
                                        const y = d.value > 0 ? 110 - ((d.value - min) / (max - min)) * 100 : 110;
                                        return `${x},${y}`;
                                    }).join(' ');
                                    return (
                                        <>
                                            <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            {dietData.map((d, i) => {
                                                if (d.value <= 0) return null;
                                                const x = dietData.length === 1 ? w / 2 : (i / (dietData.length - 1)) * w;
                                                const y = 110 - ((d.value - min) / (max - min)) * 100;
                                                return <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />;
                                            })}
                                        </>
                                    );
                                })()}
                            </svg>
                        ) : (
                            /* Bar chart for calories/water */
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: dietData.length > 20 ? 2 : 6, height: 120, marginBottom: 8 }}>
                                {dietData.map((d, i) => (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                                        <div style={{
                                            width: '100%',
                                            maxWidth: dietData.length > 20 ? 16 : 32,
                                            height: `${Math.max((d.value / dietMaxVal) * 100, d.value > 0 ? 8 : 3)}%`,
                                            background: d.value > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                                            borderRadius: dietData.length > 20 ? 2 : 4,
                                            minHeight: 3,
                                            transition: 'height 0.3s ease',
                                        }} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Labels */}
                        <div style={{ display: 'flex', gap: dietData.length > 20 ? 2 : 6 }}>
                            {dietData.map((d, i) => (
                                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 8, color: 'var(--text-dim)', overflow: 'hidden' }}>
                                    {i % dietLabelStep === 0 ? d.label : ''}
                                </div>
                            ))}
                        </div>
                        {/* Summary */}
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'center', gap: 24 }}>
                            {dietMetric === 'weight' ? (
                                <>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                                            {dietNonZero.length > 0 ? dietNonZero[dietNonZero.length - 1].value.toFixed(1) : '—'} kg
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>aktualna</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {dietNonZero.length >= 2
                                                ? `${(dietNonZero[dietNonZero.length - 1].value - dietNonZero[0].value) > 0 ? '+' : ''}${(dietNonZero[dietNonZero.length - 1].value - dietNonZero[0].value).toFixed(1)} kg`
                                                : '—'}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>zmiana</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                                            {dietMetric === 'calories'
                                                ? `${Math.round(dietAvg)} kcal`
                                                : `${(dietAvg / 1000).toFixed(1)} L`}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>średnia</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {dietMetric === 'calories'
                                                ? `${Math.round(dietMaxVal)} kcal`
                                                : `${(dietMaxVal / 1000).toFixed(1)} L`}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>max</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 13 }}>
                        Brak danych
                    </div>
                )}
            </div>

            {/* Sylwetka button */}
            <div
                className="card mb-lg"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
                onClick={() => navigate('/physique')}
            >
                <div className="flex items-center gap-sm">
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(77,212,230,0.2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: 22 }}>💪</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Sylwetka</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wymiary, BMI, skład ciała</div>
                    </div>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: 18 }}>→</span>
            </div>

            {/* Weight Plan button */}
            <div
                className="card mb-lg"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
                onClick={() => navigate('/weight-plan')}
            >
                <div className="flex items-center gap-sm">
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(255,107,107,0.2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: 22 }}>⚖️</span>
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Plan wagowy</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cel, tempo, kalorie, makro</div>
                    </div>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: 18 }}>→</span>
            </div>

            <div className="section-label">DANE I KONTO</div>

            <button
                className="btn btn-secondary btn-full"
                style={{ background: 'rgba(255, 107, 107, 0.12)', borderColor: 'rgba(255, 107, 107, 0.3)', color: '#FF6B6B' }}
                onClick={signOut}
            >
                <LogOut size={18} strokeWidth={1.5} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
                Wyloguj się
            </button>

            <div style={{ font: 'var(--caption)', color: 'var(--text-dim)', textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
                GYM+ v1.0.0
            </div>

            {/* Badge picker bottom sheet */}
            {showBadgePicker && (
                <>
                    <div className="bottom-sheet-overlay" onClick={() => setShowBadgePicker(false)} />
                    <div className="bottom-sheet">
                        <div className="bottom-sheet-handle" />
                        <div className="bottom-sheet-content">
                            <div className="flex items-center justify-between mb-sm">
                                <h3 className="section-title" style={{ margin: 0 }}>Wybierz odznaki (max 3)</h3>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowBadgePicker(false)}
                                >
                                    Gotowe
                                </button>
                            </div>
                            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                                {unlockedBadges.map(record => {
                                    const badge = ALL_BADGE_MAP[record.id];
                                    if (!badge) return null;
                                    const isSelected = featured.includes(record.id);
                                    const isFull = featured.length >= 3 && !isSelected;
                                    return (
                                        <div
                                            key={record.id}
                                            onClick={() => !isFull && toggleFeatured(record.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '10px 0',
                                                borderBottom: '1px solid var(--border-light)',
                                                cursor: isFull ? 'default' : 'pointer',
                                                opacity: isFull ? 0.35 : 1,
                                            }}
                                        >
                                            <div style={{ fontSize: 28, lineHeight: 1 }}>{badge.icon}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{badge.name}</div>
                                                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                                    Zdobyta {new Date(record.unlocked_at).toLocaleDateString('pl-PL')}
                                                </div>
                                            </div>
                                            <div style={{
                                                width: 24, height: 24, borderRadius: 6,
                                                border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border-light)',
                                                background: isSelected ? 'var(--accent)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.15s',
                                            }}>
                                                {isSelected && <span style={{ color: '#000', fontSize: 14, fontWeight: 700 }}>✓</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {unlockedBadges.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontSize: 13 }}>
                                        Brak zdobytych odznak
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
