import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { generateWarmup } from '../../utils/calculations';

const PLATE_SIZES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COLORS: Record<number, string> = {
    25: '#FF6B6B',
    20: '#6B9FFF',
    15: '#FFB84D',
    10: '#6BCB77',
    5: '#C084FC',
    2.5: 'rgba(255,255,255,0.75)',
    1.25: '#FFC700',
};

function calcPlates(targetWeight: number, barWeight: number): { plate: number; count: number }[] {
    let remaining = Math.round(((targetWeight - barWeight) / 2) * 100) / 100;
    if (remaining < 0) return [];
    const result: { plate: number; count: number }[] = [];
    for (const plate of PLATE_SIZES) {
        const count = Math.floor(remaining / plate);
        if (count > 0) {
            result.push({ plate, count });
            remaining = Math.round((remaining - plate * count) * 100) / 100;
        }
    }
    return result;
}

function isValidWeight(targetWeight: number, barWeight: number): boolean {
    if (targetWeight < barWeight) return false;
    const perSide = (targetWeight - barWeight) / 2;
    return Math.round(perSide * 100) % 125 === 0; // multiple of 1.25
}

export default function StrengthCalculator() {
    const navigate = useNavigate();
    const [barWeight, setBarWeight] = useState(20);
    const [targetWeight, setTargetWeight] = useState(100);
    const [warmupWeight, setWarmupWeight] = useState(100);

    const plates = calcPlates(targetWeight, barWeight);
    const valid = isValidWeight(targetWeight, barWeight);
    const warmups = generateWarmup(warmupWeight);

    const adjustTarget = (delta: number) =>
        setTargetWeight(w => Math.max(barWeight, Math.round((w + delta) * 10) / 10));
    const adjustWarmup = (delta: number) =>
        setWarmupWeight(w => Math.max(21, Math.round((w + delta) * 10) / 10));

    // visual plates — cap at 8 per side to avoid overflow
    const visualPlates = plates.flatMap(({ plate, count }) =>
        Array(Math.min(count, 8)).fill(plate)
    ).slice(0, 10);

    return (
        <div className="page">
            <div className="page-header">
                <button
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft size={24} strokeWidth={1.5} />
                </button>
                <h1 className="page-title">Kalkulator siłowy</h1>
            </div>

            {/* ── PLATE CALCULATOR ── */}
            <div className="section-label">TALERZE NA SZTANGĘ</div>
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                {/* Bar selector */}
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Sztanga</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[15, 20].map(w => (
                            <button
                                key={w}
                                onClick={() => setBarWeight(w)}
                                className={barWeight === w ? 'btn btn-primary' : 'btn btn-secondary'}
                                style={{ flex: 1 }}
                            >
                                {w} kg {w === 20 ? '(olimpijska)' : '(damska)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Weight input */}
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Ciężar docelowy</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                            onClick={() => adjustTarget(-2.5)}
                            style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 22, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >−</button>
                        <div style={{ flex: 1, textAlign: 'center', font: '700 28px/1 var(--font)', color: 'var(--text-primary)' }}>
                            {targetWeight} <span style={{ font: 'var(--body)', color: 'var(--text-muted)' }}>kg</span>
                        </div>
                        <button
                            onClick={() => adjustTarget(2.5)}
                            style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 22, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >+</button>
                    </div>
                </div>

                {!valid ? (
                    <div style={{ textAlign: 'center', color: 'var(--danger)', font: 'var(--caption)', padding: '8px 0' }}>
                        Ciężar musi być wielokrotnością 2.5 kg i ≥ wagi sztangi
                    </div>
                ) : (
                    <>
                        {/* Visual barbell */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginBottom: 'var(--space-md)', minHeight: 64 }}>
                            <div style={{ width: 20, height: 8, background: 'var(--text-dim)', borderRadius: 2 }} />
                            {[...visualPlates].reverse().map((p, i) => (
                                <div key={`l${i}`} style={{
                                    width: 12,
                                    height: Math.round(24 + (p / 25) * 28),
                                    borderRadius: 3,
                                    background: PLATE_COLORS[p] ?? '#888',
                                    opacity: 0.9,
                                    flexShrink: 0,
                                }} />
                            ))}
                            <div style={{ width: 56, height: 10, background: 'var(--text-muted)', borderRadius: 4, flexShrink: 0 }} />
                            {visualPlates.map((p, i) => (
                                <div key={`r${i}`} style={{
                                    width: 12,
                                    height: Math.round(24 + (p / 25) * 28),
                                    borderRadius: 3,
                                    background: PLATE_COLORS[p] ?? '#888',
                                    opacity: 0.9,
                                    flexShrink: 0,
                                }} />
                            ))}
                            <div style={{ width: 20, height: 8, background: 'var(--text-dim)', borderRadius: 2 }} />
                        </div>

                        {/* Plate list */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid var(--border-light)' }}>
                                <span>Talerz</span>
                                <span>Sztuka z każdej strony</span>
                            </div>
                            {plates.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', font: 'var(--caption)', padding: '8px 0' }}>Tylko sztanga ({barWeight} kg)</div>
                            ) : (
                                plates.map(({ plate, count }) => (
                                    <div key={plate} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 10, height: 24, borderRadius: 2, background: PLATE_COLORS[plate] ?? '#888' }} />
                                            <span style={{ font: 'var(--body)', fontWeight: 500 }}>{plate} kg</span>
                                        </div>
                                        <span style={{ font: 'var(--body)', fontWeight: 700 }}>×{count}</span>
                                    </div>
                                ))
                            )}
                            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--surface-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', font: 'var(--caption)', color: 'var(--text-muted)' }}>
                                <span>Sztanga ({barWeight} kg) + talerze</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>= {targetWeight} kg</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── WARMUP GENERATOR ── */}
            <div className="section-label">GENERATOR ROZGRZEWKI</div>
            <div className="card" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', marginBottom: 6 }}>Ciężar roboczy</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                            onClick={() => adjustWarmup(-2.5)}
                            style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 22, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >−</button>
                        <div style={{ flex: 1, textAlign: 'center', font: '700 28px/1 var(--font)', color: 'var(--text-primary)' }}>
                            {warmupWeight} <span style={{ font: 'var(--body)', color: 'var(--text-muted)' }}>kg</span>
                        </div>
                        <button
                            onClick={() => adjustWarmup(2.5)}
                            style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 22, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >+</button>
                    </div>
                </div>

                {warmups.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', font: 'var(--caption)', padding: '12px 0' }}>
                        Ciężar zbyt mały — nie potrzebujesz rozgrzewki
                    </div>
                ) : (
                    <div>
                        {warmups.map((set, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 0',
                                borderBottom: i < warmups.length - 1 ? '1px solid var(--border-light)' : undefined,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: '50%',
                                        background: 'var(--surface-elevated)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        font: 'var(--caption)', fontWeight: 700, color: 'var(--text-muted)',
                                        flexShrink: 0,
                                    }}>{i + 1}</div>
                                    <div>
                                        <div style={{ font: 'var(--body)', fontWeight: 600 }}>{set.weight} kg</div>
                                        <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                                            {Math.round((set.weight / warmupWeight) * 100)}% ciężaru roboczego
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ font: 'var(--body)', fontWeight: 700 }}>{set.reps} reps</div>
                                </div>
                            </div>
                        ))}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginTop: 10, padding: '10px 12px',
                            background: 'var(--accent-dim)',
                            borderRadius: 'var(--radius-sm)',
                        }}>
                            <div style={{ font: 'var(--body)', fontWeight: 700 }}>{warmupWeight} kg</div>
                            <div style={{ font: 'var(--caption)', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>CIĘŻAR ROBOCZY</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
