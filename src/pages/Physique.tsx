import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getUser, saveUser, getWeightEntries, saveWeight, getBodyMeasurements, saveBodyMeasurement,
    deleteBodyMeasurement, uuid, todayStr
} from '../data/store';
import { formatDateShort } from '../utils/calculations';
import {
    Ruler, Activity, Scale, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import type { BodyMeasurement } from '../data/store';

// US Navy body fat formula
function navyBodyFat(gender: string, waist: number, neck: number, heightCm: number, hips?: number): number {
    if (gender === 'female' && hips) {
        return 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.22100 * Math.log10(heightCm)) - 450;
    }
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450;
}

function computeBMI(weightKg: number, heightCm: number): number {
    return weightKg / ((heightCm / 100) ** 2);
}

function bmiCategory(bmi: number): { label: string; color: string } {
    if (bmi < 18.5) return { label: 'Niedowaga', color: '#4DD4E6' };
    if (bmi < 25) return { label: 'Norma', color: '#22C55E' };
    if (bmi < 30) return { label: 'Nadwaga', color: '#FFC700' };
    return { label: 'Otyłość', color: '#FF6B6B' };
}

function bfCategory(bf: number, gender?: string): { label: string; color: string } {
    if (gender === 'female') {
        if (bf < 14) return { label: 'Sportowa', color: '#4DD4E6' };
        if (bf < 21) return { label: 'Fit', color: '#22C55E' };
        if (bf < 25) return { label: 'Średnia', color: '#FFC700' };
        if (bf < 32) return { label: 'Powyżej średniej', color: '#FF9F43' };
        return { label: 'Wysoka', color: '#FF6B6B' };
    }
    if (bf < 6) return { label: 'Zawodnik', color: '#4DD4E6' };
    if (bf < 14) return { label: 'Sportowa', color: '#22C55E' };
    if (bf < 18) return { label: 'Fit', color: '#22C55E' };
    if (bf < 25) return { label: 'Średnia', color: '#FFC700' };
    return { label: 'Wysoka', color: '#FF6B6B' };
}

type MeasureKey = 'neck_cm' | 'waist_cm' | 'hips_cm';

const MEASURE_FIELDS: { key: MeasureKey; label: string; hint: string }[] = [
    { key: 'neck_cm', label: 'Szyja', hint: 'Obwód u podstawy szyi' },
    { key: 'waist_cm', label: 'Talia', hint: 'Obwód w najwęższym miejscu' },
    { key: 'hips_cm', label: 'Biodra', hint: 'Obwód w najszerszym miejscu' },
];

export default function Physique() {
    const navigate = useNavigate();
    const [, setTick] = useState(0);
    const refresh = () => setTick(t => t + 1);

    const user = getUser();
    const weightEntries = getWeightEntries();
    const latestWeight = weightEntries[0]?.weight_kg;
    const measurements = getBodyMeasurements();
    const latest = measurements[0];

    const [newWeight, setNewWeight] = useState('');
    const [height, setHeight] = useState(user.height_cm ? String(user.height_cm) : '');
    const [form, setForm] = useState<Record<string, string>>({});
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const handleSaveHeight = () => {
        if (!height || isNaN(Number(height))) return;
        const updated = { ...getUser(), height_cm: Number(height) };
        saveUser(updated);
    };

    const handleSaveWeight = () => {
        if (!newWeight) return;
        saveWeight({
            id: uuid(), date: todayStr(),
            weight_kg: Number(newWeight), created_at: new Date().toISOString(),
        });
        setNewWeight('');
        refresh();
    };

    const handleSaveMeasurement = () => {
        const entry: BodyMeasurement = {
            id: uuid(), date: todayStr(), created_at: new Date().toISOString(),
        };
        for (const f of MEASURE_FIELDS) {
            const val = form[f.key];
            if (val && !isNaN(Number(val))) {
                entry[f.key] = Number(val);
            }
        }
        // Auto-calculate body fat if we have what we need
        const heightCm = user.height_cm;
        const neck = entry.neck_cm;
        const waist = entry.waist_cm;
        const hips = entry.hips_cm;
        if (heightCm && neck && waist) {
            const bf = navyBodyFat(user.gender || 'male', waist, neck, heightCm, hips);
            if (bf > 0 && bf < 60) entry.body_fat_pct = Math.round(bf * 10) / 10;
        }
        saveBodyMeasurement(entry);
        setForm({});
        refresh();
    };

    const handleDelete = (id: string) => {
        deleteBodyMeasurement(id);
        setDeleteConfirm(null);
        refresh();
    };

    // Computed values
    const heightCm = user.height_cm;
    const bmi = latestWeight && heightCm ? computeBMI(latestWeight, heightCm) : null;
    const bmiInfo = bmi ? bmiCategory(bmi) : null;
    const bodyFat = latest?.body_fat_pct;
    const bfInfo = bodyFat ? bfCategory(bodyFat, user.gender) : null;
    const leanMass = latestWeight && bodyFat ? latestWeight * (1 - bodyFat / 100) : null;
    const fatMass = latestWeight && bodyFat ? latestWeight * (bodyFat / 100) : null;

    const hasFormValue = MEASURE_FIELDS.some(f => form[f.key] && form[f.key] !== '');

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center gap-md">
                    <button className="back-btn" aria-label="Wstecz" onClick={() => navigate(-1)}>←</button>
                    <h1 className="page-title">Sylwetka</h1>
                </div>
            </div>

            {/* Weight section */}
            <div className="section-label">WAGA</div>
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                {latestWeight ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                                {latestWeight} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>{user.weight_unit}</span>
                            </div>
                            {user.weight_goal_kg && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Cel: {user.weight_goal_kg} {user.weight_unit} · Zostało: {Math.abs(latestWeight - user.weight_goal_kg).toFixed(1)} {user.weight_unit}
                                </div>
                            )}
                        </div>
                        <Scale size={24} color="var(--text-dim)" strokeWidth={1.5} />
                    </div>
                ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>Brak wpisów wagi</div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="number" step="0.1" placeholder={`Nowa waga (${user.weight_unit})`}
                        value={newWeight} onChange={e => setNewWeight(e.target.value)}
                        className="input" style={{ flex: 1, padding: '10px 12px', fontSize: 14 }}
                    />
                    <button className="btn btn-primary" onClick={handleSaveWeight} disabled={!newWeight}
                        style={{ padding: '10px 20px' }}>
                        Zapisz
                    </button>
                </div>
            </div>

            {/* Height section */}
            <div className="section-label">WZROST</div>
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Ruler size={20} color="var(--text-dim)" strokeWidth={1.5} />
                    <input
                        type="number" step="1" placeholder="Wzrost (cm)"
                        value={height} onChange={e => setHeight(e.target.value)}
                        onBlur={handleSaveHeight}
                        className="input" style={{ flex: 1, padding: '10px 12px', fontSize: 14 }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>cm</span>
                </div>
                {user.height_cm && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                        Aktualnie: {user.height_cm} cm
                    </div>
                )}
            </div>

            {/* Health indicators */}
            {(bmi != null || bodyFat != null) && (
                <>
                    <div className="section-label">WSKAŹNIKI</div>
                    <div style={{ display: 'grid', gridTemplateColumns: bmi && bodyFat ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 'var(--space-lg)' }}>
                        {bmi != null && bmiInfo && (
                            <div className="card" style={{ textAlign: 'center' }}>
                                <Activity size={18} color={bmiInfo.color} strokeWidth={1.5} style={{ marginBottom: 6 }} />
                                <div style={{ fontSize: 26, fontWeight: 800, color: bmiInfo.color, lineHeight: 1 }}>
                                    {bmi.toFixed(1)}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>BMI</div>
                                <div style={{
                                    fontSize: 10, fontWeight: 700, color: bmiInfo.color,
                                    marginTop: 6, padding: '2px 8px', borderRadius: 10,
                                    background: `${bmiInfo.color}18`, display: 'inline-block',
                                }}>
                                    {bmiInfo.label}
                                </div>
                            </div>
                        )}
                        {bodyFat != null && bfInfo && (
                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 26, fontWeight: 800, color: bfInfo.color, lineHeight: 1 }}>
                                    {bodyFat}%
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>body fat</div>
                                <div style={{
                                    fontSize: 10, fontWeight: 700, color: bfInfo.color,
                                    marginTop: 6, padding: '2px 8px', borderRadius: 10,
                                    background: `${bfInfo.color}18`, display: 'inline-block',
                                }}>
                                    {bfInfo.label}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Body composition */}
            {leanMass != null && fatMass != null && latestWeight && (
                <>
                    <div className="section-label">SKŁAD CIAŁA</div>
                    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#22C55E' }}>{leanMass.toFixed(1)}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>masa mięśniowa (kg)</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#FF9F43' }}>{fatMass.toFixed(1)}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>masa tłuszczu (kg)</div>
                            </div>
                        </div>
                        {/* Visual bar */}
                        <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${(1 - bodyFat! / 100) * 100}%`, background: '#22C55E', transition: 'width 0.3s' }} />
                            <div style={{ width: `${bodyFat!}%`, background: '#FF9F43', transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Beztłuszczowa {(100 - bodyFat!).toFixed(0)}%</span>
                            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Tłuszcz {bodyFat!}%</span>
                        </div>
                    </div>
                </>
            )}

            {/* Measurement form */}
            <div className="section-label">WYMIARY CIAŁA</div>
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Podaj obwody — automatycznie obliczymy body fat (metoda US Navy)
                </div>
                {MEASURE_FIELDS.map(f => (
                    <div key={f.key} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{f.hint}</div>
                            </div>
                            <input
                                type="number" step="0.1" placeholder="cm"
                                value={form[f.key] || ''}
                                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                className="input"
                                style={{ width: 80, padding: '8px 10px', fontSize: 14, textAlign: 'right' }}
                            />
                        </div>
                    </div>
                ))}
                {/* Live body fat preview */}
                {(() => {
                    const neckVal = Number(form.neck_cm);
                    const waistVal = Number(form.waist_cm);
                    const hipsVal = Number(form.hips_cm);
                    const h = user.height_cm;
                    if (h && neckVal > 0 && waistVal > 0) {
                        const liveBf = navyBodyFat(user.gender || 'male', waistVal, neckVal, h, hipsVal || undefined);
                        if (liveBf > 0 && liveBf < 60) {
                            const info = bfCategory(Math.round(liveBf * 10) / 10, user.gender);
                            return (
                                <div style={{
                                    margin: '4px 0 12px', padding: 14, borderRadius: 12,
                                    background: `${info.color}10`, border: `1px solid ${info.color}30`,
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Szacowane body fat
                                    </div>
                                    <div style={{ fontSize: 32, fontWeight: 800, color: info.color, lineHeight: 1 }}>
                                        {(Math.round(liveBf * 10) / 10)}%
                                    </div>
                                    <div style={{
                                        fontSize: 11, fontWeight: 700, color: info.color,
                                        marginTop: 6, padding: '2px 10px', borderRadius: 10,
                                        background: `${info.color}18`, display: 'inline-block',
                                    }}>
                                        {info.label}
                                    </div>
                                </div>
                            );
                        }
                    }
                    return null;
                })()}
                {/* Show last values as reference */}
                {latest && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        Ostatni pomiar ({formatDateShort(latest.date)}):
                        {latest.neck_cm && ` Szyja ${latest.neck_cm}`}
                        {latest.waist_cm && ` · Talia ${latest.waist_cm}`}
                        {latest.hips_cm && ` · Biodra ${latest.hips_cm}`}
                    </div>
                )}
                <button
                    className="btn btn-primary btn-full"
                    onClick={handleSaveMeasurement}
                    disabled={!hasFormValue}
                >
                    Zapisz pomiar
                </button>
                {!heightCm && (
                    <div style={{ fontSize: 11, color: '#FFC700', marginTop: 8, textAlign: 'center' }}>
                        Ustaw wzrost w ustawieniach, żeby obliczyć body fat
                    </div>
                )}
            </div>

            {/* History */}
            {measurements.length > 0 && (
                <>
                    <div className="section-label">HISTORIA POMIARÓW</div>
                    {measurements.map(m => {
                        const isExpanded = expandedEntry === m.id;
                        return (
                            <div key={m.id} className="card" style={{ marginBottom: 8 }}>
                                <div
                                    onClick={() => setExpandedEntry(isExpanded ? null : m.id)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                >
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{formatDateShort(m.date)}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                                            {m.body_fat_pct ? `${m.body_fat_pct}% body fat` : 'Pomiar wymiarów'}
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp size={18} color="var(--text-dim)" /> : <ChevronDown size={18} color="var(--text-dim)" />}
                                </div>
                                {isExpanded && (
                                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        {m.neck_cm && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Szyja</span>
                                                <span style={{ fontWeight: 600 }}>{m.neck_cm} cm</span>
                                            </div>
                                        )}
                                        {m.waist_cm && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Talia</span>
                                                <span style={{ fontWeight: 600 }}>{m.waist_cm} cm</span>
                                            </div>
                                        )}
                                        {m.hips_cm && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Biodra</span>
                                                <span style={{ fontWeight: 600 }}>{m.hips_cm} cm</span>
                                            </div>
                                        )}
                                        {m.body_fat_pct && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Body fat</span>
                                                <span style={{ fontWeight: 600, color: bfCategory(m.body_fat_pct, user.gender).color }}>{m.body_fat_pct}%</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(m.id); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                width: '100%', marginTop: 10, padding: '8px 0',
                                                background: 'rgba(255,107,107,0.1)', border: 'none', borderRadius: 8,
                                                cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#FF6B6B',
                                            }}
                                        >
                                            <Trash2 size={14} strokeWidth={1.5} /> Usuń pomiar
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </>
            )}

            <div style={{ height: 40 }} />

            {/* Delete confirmation */}
            {deleteConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
                    padding: 'var(--space-md)',
                }}>
                    <div style={{
                        background: 'var(--surface)', borderRadius: 16, padding: 24,
                        width: '100%', maxWidth: 320, textAlign: 'center',
                    }}>
                        <Trash2 size={36} color="#FF6B6B" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Usuń pomiar?</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                            Ten pomiar zostanie trwale usunięty.
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                    flex: 1, padding: '12px 0', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.08)', border: 'none',
                                    color: 'var(--text-secondary)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                style={{
                                    flex: 1, padding: '12px 0', borderRadius: 10,
                                    background: '#FF6B6B', border: 'none',
                                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                Usuń
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
