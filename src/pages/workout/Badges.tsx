import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompletedWorkouts, getBadges, saveBadges, addFeedPost } from '../../data/store';
import { Lock, CheckCircle, Share2 } from 'lucide-react';
import type { BadgeRecord } from '../../data/store';

interface BadgeDef {
    id: string;
    icon: string;
    name: string;
    description: string;
    category: string;
    check: (ctx: BadgeContext) => boolean;
    progressFn: (ctx: BadgeContext) => { current: number; target: number };
}

interface BadgeContext {
    count: number;
    totalVolume: number;
    totalReps: number;
    totalHours: number;
    uniqueExercises: number;
    maxVolume: number;
    maxDuration: number;
    streak: number;
}

const BADGE_DEFS: BadgeDef[] = [
    // Treningi
    { id: 'first', icon: '🏋️', name: 'Pierwszy trening', description: 'Ukończ swój pierwszy trening', category: 'Treningi',
        check: c => c.count >= 1, progressFn: c => ({ current: Math.min(c.count, 1), target: 1 }) },
    { id: 'w10', icon: '💪', name: 'Regularny', description: 'Ukończ 10 treningów', category: 'Treningi',
        check: c => c.count >= 10, progressFn: c => ({ current: Math.min(c.count, 10), target: 10 }) },
    { id: 'w25', icon: '🔥', name: 'Wytrwały', description: 'Ukończ 25 treningów', category: 'Treningi',
        check: c => c.count >= 25, progressFn: c => ({ current: Math.min(c.count, 25), target: 25 }) },
    { id: 'w50', icon: '⚡', name: 'Maszyna', description: 'Ukończ 50 treningów', category: 'Treningi',
        check: c => c.count >= 50, progressFn: c => ({ current: Math.min(c.count, 50), target: 50 }) },
    { id: 'w100', icon: '👑', name: 'Centurion', description: 'Ukończ 100 treningów', category: 'Treningi',
        check: c => c.count >= 100, progressFn: c => ({ current: Math.min(c.count, 100), target: 100 }) },

    // Ciężar
    { id: 'v1t', icon: '🏗️', name: '1 tona', description: 'Podnieś łącznie 1 000 kg', category: 'Ciężar',
        check: c => c.totalVolume >= 1000, progressFn: c => ({ current: Math.min(Math.round(c.totalVolume), 1000), target: 1000 }) },
    { id: 'v10t', icon: '🏔️', name: '10 ton', description: 'Podnieś łącznie 10 000 kg', category: 'Ciężar',
        check: c => c.totalVolume >= 10000, progressFn: c => ({ current: Math.min(Math.round(c.totalVolume), 10000), target: 10000 }) },
    { id: 'v100t', icon: '🌋', name: '100 ton', description: 'Podnieś łącznie 100 000 kg', category: 'Ciężar',
        check: c => c.totalVolume >= 100000, progressFn: c => ({ current: Math.min(Math.round(c.totalVolume), 100000), target: 100000 }) },

    // Powtórzenia
    { id: 'r500', icon: '🔄', name: '500 powtórzeń', description: 'Wykonaj łącznie 500 powtórzeń', category: 'Powtórzenia',
        check: c => c.totalReps >= 500, progressFn: c => ({ current: Math.min(c.totalReps, 500), target: 500 }) },
    { id: 'r2000', icon: '💥', name: '2000 powtórzeń', description: 'Wykonaj łącznie 2 000 powtórzeń', category: 'Powtórzenia',
        check: c => c.totalReps >= 2000, progressFn: c => ({ current: Math.min(c.totalReps, 2000), target: 2000 }) },
    { id: 'r5000', icon: '🚀', name: '5000 powtórzeń', description: 'Wykonaj łącznie 5 000 powtórzeń', category: 'Powtórzenia',
        check: c => c.totalReps >= 5000, progressFn: c => ({ current: Math.min(c.totalReps, 5000), target: 5000 }) },

    // Czas
    { id: 'h10', icon: '⏱️', name: '10 godzin', description: 'Trenuj łącznie 10 godzin', category: 'Czas',
        check: c => c.totalHours >= 10, progressFn: c => ({ current: Math.min(Math.round(c.totalHours * 10) / 10, 10), target: 10 }) },
    { id: 'h50', icon: '⏰', name: '50 godzin', description: 'Trenuj łącznie 50 godzin', category: 'Czas',
        check: c => c.totalHours >= 50, progressFn: c => ({ current: Math.min(Math.round(c.totalHours * 10) / 10, 50), target: 50 }) },
    { id: 'h100', icon: '🕐', name: '100 godzin', description: 'Trenuj łącznie 100 godzin', category: 'Czas',
        check: c => c.totalHours >= 100, progressFn: c => ({ current: Math.min(Math.round(c.totalHours * 10) / 10, 100), target: 100 }) },

    // Różnorodność
    { id: 'ex10', icon: '🎯', name: 'Wszechstronny', description: 'Użyj 10 różnych ćwiczeń', category: 'Różnorodność',
        check: c => c.uniqueExercises >= 10, progressFn: c => ({ current: Math.min(c.uniqueExercises, 10), target: 10 }) },
    { id: 'ex25', icon: '🧠', name: 'Encyklopedia', description: 'Użyj 25 różnych ćwiczeń', category: 'Różnorodność',
        check: c => c.uniqueExercises >= 25, progressFn: c => ({ current: Math.min(c.uniqueExercises, 25), target: 25 }) },

    // Pojedyncza sesja
    { id: 'vol1k', icon: '💣', name: 'Ciężka sesja', description: 'Podnieś 1 000 kg w jednym treningu', category: 'Sesja',
        check: c => c.maxVolume >= 1000, progressFn: c => ({ current: Math.min(Math.round(c.maxVolume), 1000), target: 1000 }) },
    { id: 'dur90', icon: '🏃', name: 'Maraton', description: 'Trenuj ponad 90 minut w jednym treningu', category: 'Sesja',
        check: c => c.maxDuration >= 5400, progressFn: c => ({ current: Math.min(Math.round(c.maxDuration / 60), 90), target: 90 }) },

    // Streak
    { id: 's3', icon: '📅', name: '3 dni z rzędu', description: 'Trenuj 3 dni bez przerwy', category: 'Streak',
        check: c => c.streak >= 3, progressFn: c => ({ current: Math.min(c.streak, 3), target: 3 }) },
    { id: 's7', icon: '🗓️', name: 'Tydzień non-stop', description: 'Trenuj 7 dni bez przerwy', category: 'Streak',
        check: c => c.streak >= 7, progressFn: c => ({ current: Math.min(c.streak, 7), target: 7 }) },
    { id: 's14', icon: '🔥', name: '2 tygodnie ognia', description: 'Trenuj 14 dni bez przerwy', category: 'Streak',
        check: c => c.streak >= 14, progressFn: c => ({ current: Math.min(c.streak, 14), target: 14 }) },
];

function computeContext(): BadgeContext {
    const workouts = getCompletedWorkouts();
    const count = workouts.length;
    const totalVolume = workouts.reduce((s, w) => s + (w.total_volume_kg || 0), 0);
    const totalReps = workouts.reduce((s, w) => s + (w.total_reps || 0), 0);
    const totalHours = workouts.reduce((s, w) => s + (w.duration_seconds || 0), 0) / 3600;
    const uniqueExercises = new Set(workouts.flatMap(w => w.exercises.map(e => e.exercise_id))).size;
    const maxVolume = count > 0 ? Math.max(...workouts.map(w => w.total_volume_kg || 0)) : 0;
    const maxDuration = count > 0 ? Math.max(...workouts.map(w => w.duration_seconds || 0)) : 0;

    // Streak
    const trainingDays = new Set(workouts.map(w => new Date(w.started_at).toDateString()));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = new Date(today);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (trainingDays.has(today.toDateString())) checkDate = new Date(today);
    else if (trainingDays.has(yesterday.toDateString())) checkDate = new Date(yesterday);
    if (trainingDays.has(checkDate.toDateString())) {
        while (trainingDays.has(checkDate.toDateString())) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    }

    return { count, totalVolume, totalReps, totalHours, uniqueExercises, maxVolume, maxDuration, streak };
}

export default function Badges() {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState<string | null>(null);
    const [savedBadges, setSavedBadges] = useState<BadgeRecord[]>(getBadges());
    const [sharedBadges, setSharedBadges] = useState<Set<string>>(new Set());
    const [newBadgePopup, setNewBadgePopup] = useState<BadgeDef | null>(null);
    const [popupQueue, setPopupQueue] = useState<BadgeDef[]>([]);

    const handleShareBadge = (def: BadgeDef, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        addFeedPost({
            id: `badge-${def.id}-${Date.now()}`,
            type: 'badge',
            timestamp: new Date().toISOString(),
            data: { icon: def.icon, name: def.name },
        });
        setSharedBadges(prev => new Set(prev).add(def.id));
    };

    const ctx = useMemo(() => computeContext(), []);

    // Check for newly unlocked badges and persist
    useEffect(() => {
        let changed = false;
        const current = [...savedBadges];
        const newlyUnlocked: BadgeDef[] = [];
        for (const def of BADGE_DEFS) {
            const isUnlocked = def.check(ctx);
            const alreadySaved = current.find(b => b.id === def.id);
            if (isUnlocked && !alreadySaved) {
                current.push({ id: def.id, unlocked_at: new Date().toISOString() });
                changed = true;
                newlyUnlocked.push(def);
            }
        }
        if (changed) {
            saveBadges(current);
            setSavedBadges(current);
        }
        if (newlyUnlocked.length > 0) {
            setNewBadgePopup(newlyUnlocked[0]);
            setPopupQueue(newlyUnlocked.slice(1));
        }
    }, [ctx]);

    const handlePopupShare = () => {
        if (newBadgePopup) {
            handleShareBadge(newBadgePopup);
        }
        advancePopup();
    };

    const advancePopup = () => {
        if (popupQueue.length > 0) {
            setNewBadgePopup(popupQueue[0]);
            setPopupQueue(prev => prev.slice(1));
        } else {
            setNewBadgePopup(null);
        }
    };

    const unlockedIds = new Set(savedBadges.map(b => b.id));
    const unlockedCount = BADGE_DEFS.filter(d => unlockedIds.has(d.id)).length;

    // Group by category
    const categories = [...new Set(BADGE_DEFS.map(b => b.category))];

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center gap-md">
                    <button className="back-btn" onClick={() => navigate('/workout')}>←</button>
                    <h1 className="page-title">Odznaki</h1>
                </div>
                <span style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                    {unlockedCount}/{BADGE_DEFS.length} zdobytych
                </span>
            </div>

            {/* Overall progress */}
            <div className="card mb-lg" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{unlockedCount}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 10 }}>zdobytych odznak</div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: 2, background: 'var(--accent)',
                        width: `${(unlockedCount / BADGE_DEFS.length) * 100}%`,
                        transition: 'width 0.4s ease',
                    }} />
                </div>
            </div>

            {categories.map(cat => {
                const catBadges = BADGE_DEFS.filter(b => b.category === cat);
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

                                        {/* Expanded details */}
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
                                                            Brakuje: {progress.target - progress.current} {
                                                                def.category === 'Ciężar' ? 'kg' :
                                                                def.category === 'Czas' ? 'h' :
                                                                def.category === 'Sesja' && def.id === 'dur90' ? 'min' :
                                                                def.category === 'Sesja' ? 'kg' : ''
                                                            }
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Progress bar */}
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

            {/* New badge popup */}
            {newBadgePopup && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    background: 'rgba(0,0,0,0.75)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 24,
                }}>
                    <div style={{
                        background: '#1C1C1E', borderRadius: 20,
                        padding: '32px 24px', width: '100%', maxWidth: 300,
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 20,
                            background: 'rgba(255,199,0,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: 44, lineHeight: 1,
                        }}>
                            {newBadgePopup.icon}
                        </div>
                        <div style={{ fontSize: 13, color: '#FFC700', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                            Nowa odznaka!
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                            {newBadgePopup.name}
                        </div>
                        <div style={{ fontSize: 13, color: '#ABABAB', marginBottom: 24, lineHeight: 1.4 }}>
                            {newBadgePopup.description}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button
                                onClick={handlePopupShare}
                                style={{
                                    width: '100%', padding: '14px 0',
                                    background: '#FFC700', color: '#000',
                                    border: 'none', borderRadius: 12,
                                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                            >
                                <Share2 size={16} strokeWidth={2} /> Udostępnij na feed
                            </button>
                            <button
                                onClick={advancePopup}
                                style={{
                                    width: '100%', padding: '14px 0',
                                    background: '#2C2C2E', color: '#fff',
                                    border: 'none', borderRadius: 12,
                                    fontSize: 15, fontWeight: 500, cursor: 'pointer',
                                }}
                            >
                                Pomiń
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
