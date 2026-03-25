import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompletedWorkouts } from '../../data/store';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function WorkoutCalendar() {
    const navigate = useNavigate();
    const allWorkouts = getCompletedWorkouts();
    const now = new Date();
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());

    // Map: 'YYYY-MM-DD' -> workout id (pierwszy z danego dnia)
    const workoutDays = new Map<string, string>();
    allWorkouts.forEach(w => {
        const d = new Date(w.started_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!workoutDays.has(key)) workoutDays.set(key, w.id);
    });

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startOffset = (firstDay + 6) % 7; // Pn=0

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    };

    const monthNames = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
    const dayNames = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];

    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);

    // Treningi w bieżącym widoku
    const workoutsThisMonth = allWorkouts.filter(w => {
        const d = new Date(w.started_at);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    });

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)' }}>Kalendarz treningów</span>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                {/* Nawigacja miesiąca */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-muted)' }}>
                        <ChevronLeft size={20} strokeWidth={2} />
                    </button>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {monthNames[viewMonth]} {viewYear}
                    </span>
                    <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-muted)' }}>
                        <ChevronRight size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Nagłówek dni */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                    {dayNames.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, paddingBottom: 4 }}>{d}</div>
                    ))}
                </div>

                {/* Siatka dni */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                    {cells.map((day, i) => {
                        if (!day) return <div key={i} />;
                        const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const workoutId = workoutDays.get(key);
                        const isToday = key === todayKey;
                        const hasWorkout = !!workoutId;
                        return (
                            <div
                                key={i}
                                onClick={hasWorkout ? () => navigate(`/workout/detail/${workoutId}`) : undefined}
                                style={{
                                    aspectRatio: '1',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '50%',
                                    fontSize: 13, fontWeight: hasWorkout ? 700 : 400,
                                    cursor: hasWorkout ? 'pointer' : 'default',
                                    background: hasWorkout
                                        ? 'var(--accent)'
                                        : isToday
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'transparent',
                                    color: hasWorkout ? '#000' : isToday ? 'var(--text-primary)' : 'var(--text-muted)',
                                    outline: isToday && !hasWorkout ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                }}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Podsumowanie miesiąca */}
            <div style={{ marginBottom: 'var(--space-md)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                {workoutsThisMonth.length > 0
                    ? `${workoutsThisMonth.length} trening${workoutsThisMonth.length === 1 ? '' : workoutsThisMonth.length < 5 ? 'i' : 'ów'} w tym miesiącu`
                    : 'Brak treningów w tym miesiącu'}
            </div>

            {/* Lista treningów z tego miesiąca */}
            {workoutsThisMonth.length > 0 && workoutsThisMonth.map(w => {
                const d = new Date(w.started_at);
                const dayNum = d.getDate();
                const dayName = ['Nd','Pn','Wt','Śr','Cz','Pt','So'][d.getDay()];
                return (
                    <div
                        key={w.id}
                        className="history-item"
                        onClick={() => navigate(`/workout/detail/${w.id}`)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'var(--accent)', flexShrink: 0,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#000', lineHeight: 1 }}>{dayNum}</span>
                            <span style={{ fontSize: 9, fontWeight: 600, color: '#000', opacity: 0.7 }}>{dayName}</span>
                        </div>
                        <div className="history-info">
                            <div className="history-name">{w.name}</div>
                            <div className="history-stats">
                                {w.total_sets} serii · {Math.round(w.total_volume_kg).toLocaleString()} kg
                            </div>
                        </div>
                        <ChevronRight size={16} strokeWidth={1.5} color="var(--text-dim)" />
                    </div>
                );
            })}
        </div>
    );
}
