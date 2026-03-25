import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWeightEntries, saveWeight, uuid, todayStr, addFeedPost } from '../../data/store';
import { formatDateShort } from '../../utils/calculations';
import { getUser } from '../../data/store';
import { ChevronLeft, Scale, Share2 } from 'lucide-react';

export default function WeightTracker() {
    const navigate = useNavigate();
    const user = getUser();
    const entries = getWeightEntries();
    const [newWeight, setNewWeight] = useState('');
    const [showSharePrompt, setShowSharePrompt] = useState(false);
    const [lastSavedWeight, setLastSavedWeight] = useState<number | null>(null);

    const handleSave = () => {
        if (!newWeight) return;
        const weight = Number(newWeight);
        saveWeight({
            id: uuid(),
            date: todayStr(),
            weight_kg: weight,
            created_at: new Date().toISOString(),
        });
        setLastSavedWeight(weight);
        setNewWeight('');
        setShowSharePrompt(true);
    };

    const handleShare = (share: boolean) => {
        if (share && lastSavedWeight !== null) {
            addFeedPost({
                id: `weight-${Date.now()}`,
                type: 'weight',
                timestamp: new Date().toISOString(),
                data: { weight_kg: lastSavedWeight },
            });
        }
        setShowSharePrompt(false);
        window.location.reload();
    };

    const latest = entries[0];
    const trend = entries.length >= 7
        ? Math.round((entries[0]?.weight_kg - entries[Math.min(6, entries.length - 1)]?.weight_kg) * 10) / 10
        : null;

    // SVG chart
    const chartEntries = entries.slice(0, 30).reverse();
    const minW = chartEntries.length > 0 ? Math.min(...chartEntries.map(e => e.weight_kg)) - 1 : 0;
    const maxW = chartEntries.length > 0 ? Math.max(...chartEntries.map(e => e.weight_kg)) + 1 : 100;
    const chartW = 340;
    const chartH = 160;

    const points = chartEntries.map((e, i) => {
        const x = (i / Math.max(chartEntries.length - 1, 1)) * chartW;
        const y = chartH - ((e.weight_kg - minW) / (maxW - minW)) * chartH;
        return { x, y, ...e };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
        <div className="page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8 }}>
                        <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                    </button>
                    <span style={{ font: 'var(--heading-3)' }}>Waga</span>
                </div>
            </div>

            {/* Chart */}
            {chartEntries.length > 1 && (
                <div className="card-gradient" style={{ marginBottom: 'var(--space-lg)' }}>
                    <svg width={chartW} height={chartH + 30} style={{ width: '100%', height: 'auto' }}>
                        {/* Grid lines */}
                        {chartEntries.length > 0 && [
                            Math.round((minW + maxW) / 2 * 2) / 2,
                            Math.round((minW + (maxW - minW) * 0.25) * 2) / 2,
                            Math.round((minW + (maxW - minW) * 0.75) * 2) / 2,
                        ].map((weight) => {
                            const y = chartH - ((weight - minW) / (maxW - minW)) * chartH;
                            return (
                                <g key={weight}>
                                    <line x1={20} y1={y} x2={chartW} y2={y} stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="4 4" />
                                    <text x={15} y={y + 4} fill="rgba(255, 255, 255, 0.35)" fontSize="10" textAnchor="end">{weight}</text>
                                </g>
                            );
                        })}
                        {/* Line */}
                        <path d={pathData} fill="none" stroke="#FFFFFF" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))' }} />
                        {/* Points */}
                        {points.map((point, i) => (
                            <circle key={i} cx={point.x} cy={point.y} r="4" fill="#FFFFFF" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))' }} />
                        ))}
                    </svg>
                    {trend !== null && (
                        <p style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
                            7-dniowa zmiana: {trend > 0 ? '+' : ''}{trend} {user.weight_unit}
                        </p>
                    )}
                </div>
            )}

            {/* Current weight */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 600 }}>
                        {latest ? `${latest.weight_kg} ${user.weight_unit}` : `— ${user.weight_unit}`}
                    </div>
                    {latest && <p style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>{formatDateShort(latest.date)}</p>}
                </div>
                {user.weight_goal_kg && (
                    <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginTop: 4 }}>
                        Cel: {user.weight_goal_kg} {user.weight_unit}
                        {latest && ` · Zostało: ${Math.abs(latest.weight_kg - user.weight_goal_kg).toFixed(1)} ${user.weight_unit}`}
                    </div>
                )}
            </div>

            {/* Input */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="section-label">NOWY WPIS</div>
                <input
                    type="number"
                    className="input"
                    placeholder={user.weight_unit}
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    step="0.1"
                    style={{ marginBottom: 12 }}
                />
                <button className="btn btn-primary btn-full" onClick={handleSave} disabled={!newWeight}>
                    Zapisz wagę
                </button>
            </div>

            {/* History */}
            <div className="section-label">HISTORIA</div>
            {entries.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Scale size={32} strokeWidth={1.5} /></div>
                    <div className="empty-state-text">Zapisz swoją pierwszą wagę powyżej</div>
                </div>
            ) : (
                entries.slice(0, 20).map(e => (
                    <div key={e.id} className="list-row" style={{ padding: '12px 0' }}>
                        <span style={{ flex: 1, font: 'var(--caption)', color: 'var(--text-muted)' }}>{formatDateShort(e.date)}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{e.weight_kg} {user.weight_unit}</span>
                    </div>
                ))
            )}

            {/* Share prompt */}
            {showSharePrompt && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                    padding: 'var(--space-md)',
                }}>
                    <div style={{
                        background: 'var(--surface)', borderRadius: 16, padding: 24,
                        width: '100%', maxWidth: 340, textAlign: 'center',
                    }}>
                        <Scale size={40} color="#A78BFA" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                            {lastSavedWeight} {user.weight_unit}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                            Waga zapisana! Chcesz udostępnić na feed?
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => handleShare(false)}
                                style={{
                                    flex: 1, padding: '12px 0', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.08)', border: 'none',
                                    color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                Pomiń
                            </button>
                            <button
                                onClick={() => handleShare(true)}
                                style={{
                                    flex: 1, padding: '12px 0', borderRadius: 10,
                                    background: '#A78BFA', border: 'none',
                                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                <Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                Udostępnij
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
