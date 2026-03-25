import { useNavigate } from 'react-router-dom';
import { getCompletedWorkouts } from '../../data/store';
import { formatDuration, timeAgo } from '../../utils/calculations';
import { ChevronLeft, Calendar } from 'lucide-react';

export default function History() {
    const navigate = useNavigate();
    const workouts = getCompletedWorkouts();

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)' }}>Historia</span>
                </div>
                <span style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>{workouts.length} treningów</span>
            </div>

            {workouts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Calendar size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-text">Brak historii treningów</div>
                    <button className="btn btn-primary" onClick={() => navigate('/workout')}>Zacznij trening</button>
                </div>
            ) : (
                workouts.map(w => (
                    <div key={w.id} className="history-item" onClick={() => navigate(`/workout/detail/${w.id}`)} style={{ cursor: 'pointer' }}>
                        <div className="history-dot" />
                        <div className="history-info">
                            <div className="history-name">{w.name}</div>
                            <div className="history-stats">
                                {formatDuration(w.duration_seconds || 0)} · {w.total_sets} serii · {Math.round(w.total_volume_kg).toLocaleString()}kg · {w.exercises.length} ćwiczeń
                            </div>
                        </div>
                        <div className="history-date">{timeAgo(w.started_at)}</div>
                    </div>
                ))
            )}
        </div>
    );
}
