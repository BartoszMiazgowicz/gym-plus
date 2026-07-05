import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeals, deleteMeal, getUser, getWaterToday, addWater, getWeightEntries, getAllMeals } from '../../data/store';
import ProgressRing from '../../components/ProgressRing';
import { Coffee, UtensilsCrossed, Moon, Cookie, Plus, Droplets, X, Award, ChevronRight, Target, Check, ChevronDown } from 'lucide-react';
import { getBadges } from '../../data/store';

const mealTypes = [
    { key: 'breakfast', icon: Coffee, label: 'Śniadanie' },
    { key: 'lunch', icon: UtensilsCrossed, label: 'Obiad' },
    { key: 'dinner', icon: Moon, label: 'Kolacja' },
    { key: 'snack', icon: Cookie, label: 'Przekąski' },
] as const;

interface Props { onRefresh: () => void; }

export default function DietJournal({ onRefresh }: Props) {
    const navigate = useNavigate();
    const user = getUser();
    const meals = getMeals();
    const [water, setWater] = useState(getWaterToday());
    const [planExpanded, setPlanExpanded] = useState(false);

    const totalCal = meals.reduce((s, m) => s + m.calories, 0);
    const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
    const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
    const totalFat = meals.reduce((s, m) => s + m.fat, 0);

    const calGoal = user.calorie_goal || 2200;
    const proteinGoal = user.protein_goal || 160;
    const carbsGoal = user.carbs_goal || 220;
    const fatGoal = user.fat_goal || 73;
    const waterGoal = user.water_goal_ml || 2500;

    const handleDeleteMeal = (id: string) => {
        deleteMeal(id);
        onRefresh();
    };

    const handleAddWater = (ml: number) => {
        addWater(ml);
        setWater(prev => prev + ml);
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Dieta</h1>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/diet/goals')}>Cele</button>
            </div>

            {/* Calorie ring */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="flex justify-center" style={{ padding: 'var(--space-md) 0' }}>
                    <ProgressRing value={Math.round(totalCal)} max={calGoal} size={180} />
                </div>

                <div style={{ marginTop: 'var(--space-md)' }}>
                    <div className="macro-row">
                        <div className="macro-dot protein" />
                        <span className="macro-label">Białko</span>
                        <span className="macro-value">{Math.round(totalProtein)}/{proteinGoal}g</span>
                        <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill protein" style={{ width: `${Math.min(totalProtein / proteinGoal * 100, 100)}%` }} />
                        </div>
                    </div>
                    <div className="macro-row">
                        <div className="macro-dot carbs" />
                        <span className="macro-label">Węgle</span>
                        <span className="macro-value">{Math.round(totalCarbs)}/{carbsGoal}g</span>
                        <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill carbs" style={{ width: `${Math.min(totalCarbs / carbsGoal * 100, 100)}%` }} />
                        </div>
                    </div>
                    <div className="macro-row">
                        <div className="macro-dot fat" />
                        <span className="macro-label">Tłuszcz</span>
                        <span className="macro-value">{Math.round(totalFat)}/{fatGoal}g</span>
                        <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill fat" style={{ width: `${Math.min(totalFat / fatGoal * 100, 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Weight plan countdown + calendar */}
            {(() => {
                if (user.weight_goal_kg == null || !user.weight_plan_start_date || user.weight_plan_weeks == null) return null;
                const startDate = new Date(user.weight_plan_start_date);
                const endDate = new Date(startDate.getTime() + user.weight_plan_weeks * 7 * 24 * 60 * 60 * 1000);
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const daysElapsed = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const daysLeft = Math.max(totalDays - daysElapsed, 0);
                const progress = totalDays > 0 ? Math.min(daysElapsed / totalDays, 1) : 0;

                const weights = getWeightEntries();
                const currentWeight = weights.length > 0 ? weights[0].weight_kg : null;
                const isCut = currentWeight != null && user.weight_goal_kg < currentWeight;
                const accentColor = isCut ? '#FF6B6B' : '#22C55E';
                const kgLeft = currentWeight != null ? Math.abs(currentWeight - user.weight_goal_kg) : null;

                // Today's check
                const todayDayCompleted = (() => {
                    if (isCut) {
                        return totalCal > 0 && totalCal <= calGoal && totalProtein >= proteinGoal * 0.9;
                    }
                    return totalCal >= calGoal * 0.9 && totalProtein >= proteinGoal * 0.9;
                })();

                // Calendar: compute completed days from meal history
                const allMeals = getAllMeals();
                const dayMap = new Map<string, { cal: number; protein: number }>();
                for (const m of allMeals) {
                    const prev = dayMap.get(m.date) || { cal: 0, protein: 0 };
                    dayMap.set(m.date, { cal: prev.cal + m.calories, protein: prev.protein + m.protein });
                }

                const isDayCompleted = (dateStr: string) => {
                    const d = dayMap.get(dateStr);
                    if (!d || d.cal === 0) return false;
                    if (isCut) return d.cal <= calGoal && d.protein >= proteinGoal * 0.9;
                    return d.cal >= calGoal * 0.9 && d.protein >= proteinGoal * 0.9;
                };

                // Build calendar weeks from plan start
                const calendarWeeks: { date: Date; dateStr: string; inRange: boolean }[][] = [];
                const calStart = new Date(startDate);
                calStart.setDate(calStart.getDate() - calStart.getDay() + 1); // Monday
                const calEnd = new Date(Math.min(endDate.getTime(), now.getTime()));
                calEnd.setDate(calEnd.getDate() + (7 - calEnd.getDay()) % 7); // end of week

                const cursor = new Date(calStart);
                while (cursor <= calEnd) {
                    const week: typeof calendarWeeks[0] = [];
                    for (let d = 0; d < 7; d++) {
                        const ds = cursor.toISOString().split('T')[0];
                        const inRange = cursor >= startDate && cursor <= now;
                        week.push({ date: new Date(cursor), dateStr: ds, inRange });
                        cursor.setDate(cursor.getDate() + 1);
                    }
                    calendarWeeks.push(week);
                }

                const completedCount = Array.from(dayMap.keys()).filter(d => {
                    const dd = new Date(d);
                    return dd >= startDate && dd <= now && isDayCompleted(d);
                }).length;

                return (
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        {/* Header - clickable to expand */}
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                            onClick={() => setPlanExpanded(prev => !prev)}
                        >
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: `${accentColor}18`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Target size={18} color={accentColor} strokeWidth={1.5} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>
                                    {isCut ? 'Redukcja' : 'Budowanie masy'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    Cel: {user.weight_goal_kg} kg
                                    {kgLeft != null && kgLeft > 0.1 && ` · Zostało ${kgLeft.toFixed(1)} kg`}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {/* Today's status check */}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: accentColor, lineHeight: 1 }}>
                                        {daysLeft}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                        {daysLeft === 1 ? 'dzień' : 'dni'}
                                    </div>
                                </div>
                                {totalCal > 0 && (
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: todayDayCompleted ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                                        border: `2px solid ${todayDayCompleted ? accentColor : 'rgba(255,255,255,0.1)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Check size={22} color={todayDayCompleted ? accentColor : 'var(--text-dim)'} strokeWidth={3} />
                                    </div>
                                )}
                                <ChevronDown
                                    size={16} color="var(--text-dim)" strokeWidth={1.5}
                                    style={{ transition: 'transform 0.2s', transform: planExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
                                />
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="progress-bar" style={{ height: 6, marginTop: 12 }}>
                            <div style={{
                                width: `${progress * 100}%`,
                                height: '100%',
                                borderRadius: 'inherit',
                                background: accentColor,
                                transition: 'width 0.3s',
                            }} />
                        </div>

                        {/* Expanded: calendar + stats */}
                        {planExpanded && (
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                {/* Stats row */}
                                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16, textAlign: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: accentColor }}>{completedCount}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>zaliczonych</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 800 }}>{Math.max(daysElapsed, 0)}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>łącznie dni</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: '#FFB84D' }}>
                                            {daysElapsed > 0 ? Math.round((completedCount / daysElapsed) * 100) : 0}%
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>skuteczność</div>
                                    </div>
                                </div>

                                {/* Calendar */}
                                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>
                                    Kalendarz planu
                                </div>

                                {/* Day labels */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4, textAlign: 'center' }}>
                                    {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(d => (
                                        <div key={d} style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>{d}</div>
                                    ))}
                                </div>

                                {/* Calendar grid */}
                                {calendarWeeks.map((week, wi) => (
                                    <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                                        {week.map((day, di) => {
                                            const isToday = day.dateStr === todayStr;
                                            const completed = day.inRange && isDayCompleted(day.dateStr);
                                            const hasMeals = dayMap.has(day.dateStr) && (dayMap.get(day.dateStr)!.cal > 0);
                                            const isPast = day.inRange && day.dateStr < todayStr;
                                            const failed = isPast && hasMeals && !completed;
                                            const dayNum = day.date.getDate();

                                            let bg = 'transparent';
                                            let color = 'var(--text-dim)';
                                            let border = '1px solid transparent';

                                            if (completed) {
                                                bg = `${accentColor}25`;
                                                color = accentColor;
                                                border = `1px solid ${accentColor}40`;
                                            } else if (failed) {
                                                bg = 'rgba(255,107,107,0.08)';
                                                color = 'rgba(255,107,107,0.5)';
                                            } else if (isToday) {
                                                border = '1px solid var(--text-muted)';
                                                color = 'var(--text-primary)';
                                            } else if (!day.inRange) {
                                                color = 'rgba(255,255,255,0.1)';
                                            }

                                            return (
                                                <div
                                                    key={di}
                                                    style={{
                                                        aspectRatio: '1',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: 8,
                                                        background: bg,
                                                        border,
                                                        fontSize: 11,
                                                        fontWeight: isToday ? 800 : 500,
                                                        color,
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {dayNum}
                                                    {completed && (
                                                        <Check size={8} strokeWidth={3} style={{ position: 'absolute', bottom: 2 }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}

                                {/* Edit plan link */}
                                <button
                                    className="btn btn-ghost btn-sm btn-full"
                                    style={{ marginTop: 12, fontSize: 12 }}
                                    onClick={() => navigate('/weight-plan')}
                                >
                                    Edytuj plan →
                                </button>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Meals */}
            {mealTypes.map(mt => {
                const Icon = mt.icon;
                const mealItems = meals.filter(m => m.meal_type === mt.key);
                const mealCal = mealItems.reduce((s, m) => s + m.calories, 0);
                return (
                    <div key={mt.key} style={{ marginBottom: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="icon-container" style={{ width: 32, height: 32 }}>
                                    <Icon size={16} strokeWidth={1.5} />
                                </div>
                                <h3 style={{ fontSize: 14, fontWeight: 600 }}>{mt.label}</h3>
                            </div>
                            <span style={{ font: 'var(--caption)', fontWeight: 600 }}>{Math.round(mealCal)} kcal</span>
                        </div>
                        <div className="card">
                            {mealItems.map((m, index) => (
                                <div key={m.id}>
                                    <div style={{ paddingBottom: 12, paddingTop: index > 0 ? 12 : 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 400, marginBottom: 4 }}>{m.food_name}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                                                    B: {Math.round(m.protein)}g · W: {Math.round(m.carbs)}g · T: {Math.round(m.fat)}g
                                                </p>
                                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                    {Math.round(m.calories)} kcal
                                                </span>
                                            </div>
                                        </div>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteMeal(m.id)} aria-label="Usuń posiłek" style={{ padding: 4, opacity: 0.5 }}>
                                            <X size={14} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    {index < mealItems.length - 1 && <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }} />}
                                </div>
                            ))}
                            <button
                                className="btn btn-ghost btn-full btn-sm mt-sm"
                                onClick={() => navigate(`/diet/search?meal=${mt.key}`)}
                                style={{ textAlign: 'center' }}
                            >
                                <Plus size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                                Dodaj
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Water */}
            <div className="section-label">WODA</div>
            <div className="card">
                <div className="flex items-center justify-between mb-sm">
                    <span style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Droplets size={16} style={{ opacity: 0.5 }} />
                        {(water / 1000).toFixed(1)} / {(waterGoal / 1000).toFixed(1)} L
                    </span>
                    <span style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>{Math.round(water / waterGoal * 100)}%</span>
                </div>
                <div className="progress-bar mb-sm" style={{ height: 8 }}>
                    <div className="progress-fill water" style={{ width: `${Math.min(water / waterGoal * 100, 100)}%` }} />
                </div>
                <div className="flex gap-sm">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAddWater(250)}>+250ml</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAddWater(500)}>+500ml</button>
                </div>
            </div>

            {/* Badges button */}
            <div
                className="card mt-lg"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => navigate('/diet/badges')}
            >
                <div className="flex items-center gap-sm">
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(255, 199, 0, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Award size={22} color="#FFC700" strokeWidth={1.5} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Odznaki diety</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {getBadges().filter(b => b.id.startsWith('d_')).length > 0
                                ? `${getBadges().filter(b => b.id.startsWith('d_')).length} zdobytych`
                                : 'Zdobywaj odznaki!'}
                        </div>
                    </div>
                </div>
                <ChevronRight size={18} strokeWidth={1.5} color="var(--text-dim)" />
            </div>

        </div>
    );
}
