import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getUser, getMeals, getWaterToday, addWater, getActiveWorkout,
    getFeed, removeFeedPost
} from '../data/store';
import { exerciseDatabase } from '../data/exercises';
import { formatDuration, timeAgo } from '../utils/calculations';
import {
    Dumbbell, Scale, Heart, MessageCircle,
    Send, Bookmark, MoreHorizontal, Zap, Trash2, X,
    Users, Lock, ChevronLeft, ChevronRight, List
} from 'lucide-react';
import type { FeedPost } from '../data/store';

interface Props { onRefresh: () => void; }

function SwipeCarousel({ slides }: { slides: React.ReactNode[] }) {
    const [idx, setIdx] = useState(0);
    const touchRef = useRef<{ startX: number; startY: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const total = slides.length;
    if (total === 0) return null;

    const handleTouchStart = (e: React.TouchEvent) => {
        touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchRef.current) return;
        const dx = e.changedTouches[0].clientX - touchRef.current.startX;
        const dy = e.changedTouches[0].clientY - touchRef.current.startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            if (dx < 0 && idx < total - 1) setIdx(idx + 1);
            if (dx > 0 && idx > 0) setIdx(idx - 1);
        }
        touchRef.current = null;
    };

    return (
        <div style={{ position: 'relative' }}>
            <div
                ref={containerRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{ overflow: 'hidden', borderRadius: 10, margin: '0 16px' }}
            >
                <div style={{
                    display: 'flex', transition: 'transform 0.3s ease',
                    transform: `translateX(-${idx * 100}%)`,
                }}>
                    {slides.map((slide, i) => (
                        <div key={i} style={{ width: '100%', flexShrink: 0 }}>{slide}</div>
                    ))}
                </div>
            </div>
            {idx > 0 && (
                <button onClick={() => setIdx(idx - 1)} style={{
                    position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                    width: 28, height: 28, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                }}>
                    <ChevronLeft size={16} color="#fff" />
                </button>
            )}
            {idx < total - 1 && (
                <button onClick={() => setIdx(idx + 1)} style={{
                    position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                    width: 28, height: 28, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                }}>
                    <ChevronRight size={16} color="#fff" />
                </button>
            )}
            {total > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
                    {slides.map((_, i) => (
                        <div key={i} style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: i === idx ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
                            transition: 'background 0.2s',
                        }} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ExerciseSlide({ exercises, onExpand }: { exercises: any[]; onExpand: () => void }) {
    return (
        <div
            onClick={onExpand}
            style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
                minHeight: 280, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: 20, cursor: 'pointer',
                borderRadius: 10,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <List size={16} color="var(--accent)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {exercises.length} ćwiczeń
                </span>
            </div>
            {exercises.slice(0, 6).map((ex: any, i: number) => {
                const info = exerciseDatabase.find(e => e.id === ex.exercise_id);
                const completedSets = ex.sets?.length || 0;
                const bestSet = ex.sets?.reduce((best: any, s: any) => {
                    const vol = (s.weight_kg || 0) * (s.reps || 0);
                    return vol > (best ? (best.weight_kg || 0) * (best.reps || 0) : 0) ? s : best;
                }, null);
                return (
                    <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: i < Math.min(exercises.length, 6) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{info?.name || ex.exercise_id}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                {completedSets} {completedSets === 1 ? 'seria' : completedSets < 5 ? 'serie' : 'serii'}
                            </div>
                        </div>
                        {bestSet && bestSet.weight_kg && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                {bestSet.weight_kg}kg × {bestSet.reps}
                            </div>
                        )}
                    </div>
                );
            })}
            {exercises.length > 6 && (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>
                    +{exercises.length - 6} więcej...
                </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', marginTop: 12 }}>
                Kliknij, aby zobaczyć szczegóły
            </div>
        </div>
    );
}

export default function Dashboard({ onRefresh }: Props) {
    const navigate = useNavigate();
    const user = getUser();
    const activeWorkout = getActiveWorkout();
    const [water, setWater] = useState(getWaterToday());
    const todayMeals = getMeals();
    const totalCal = todayMeals.reduce((s, m) => s + m.calories, 0);
    const calGoal = user.calorie_goal || 2200;
    const waterGoal = user.water_goal_ml || 2500;

    const [feed, setFeed] = useState<FeedPost[]>(() =>
        getFeed().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
    const [menuPost, setMenuPost] = useState<string | null>(null);
    const [expandedExercises, setExpandedExercises] = useState<any[] | null>(null);
    const [feedTab, setFeedTab] = useState<'foryou' | 'friends' | 'followers'>('foryou');

    const toggleLike = (id: string) => {
        setLikedPosts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSave = (id: string) => {
        setSavedPosts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const deletePost = (id: string) => {
        removeFeedPost(id);
        setFeed(prev => prev.filter(p => p.id !== id));
        setMenuPost(null);
    };

    const handleAddWater = (ml: number) => {
        addWater(ml);
        setWater(prev => prev + ml);
        onRefresh();
    };

    const userName = user.name?.split(' ')[0] || 'Ty';


    return (
        <div className="page" style={{ paddingLeft: 0, paddingRight: 0 }}>
            {/* Header */}
            <div style={{ padding: '0 var(--space-md)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>GYM+</h1>
                    <div className="flex items-center gap-sm">
                        {activeWorkout && (
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/workout/active')}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                                <Zap size={14} /> W toku
                            </button>
                        )}
                    </div>
                </div>
            </div>


            {/* Today's quick stats */}
            <div style={{ padding: '0 var(--space-md)', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {([
                        { value: String(Math.round(totalCal)), label: `/ ${calGoal} kcal`, color: totalCal >= calGoal ? 'var(--accent)' : 'var(--text-primary)', isButton: false },
                        { value: `${(water / 1000).toFixed(1)}L`, label: `/ ${(waterGoal / 1000).toFixed(1)}L wody`, color: water >= waterGoal ? '#4DD4E6' : 'var(--text-primary)', isButton: false },
                        { value: '+250ml', label: 'dodaj wodę', color: '#4DD4E6', isButton: true },
                    ]).map((item, i) => (
                        <div
                            key={i}
                            onClick={item.isButton ? () => handleAddWater(250) : undefined}
                            style={{
                                background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                                border: item.isButton ? '1px solid rgba(77,212,230,0.2)' : '1px solid var(--border)',
                                padding: 0, height: 72, boxSizing: 'border-box',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                textAlign: 'center', cursor: item.isButton ? 'pointer' : undefined,
                            }}
                        >
                            <div style={{ fontSize: 18, fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feed tabs */}
            <div style={{
                display: 'flex', borderBottom: '1px solid var(--border-light)',
                position: 'sticky', top: 0, zIndex: 5,
                background: 'var(--bg)',
            }}>
                {([
                    { key: 'foryou' as const, label: 'Dla Ciebie' },
                    { key: 'friends' as const, label: 'Znajomi' },
                    { key: 'followers' as const, label: 'Obserwowani' },
                ]).map(tab => {
                    const active = feedTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setFeedTab(tab.key)}
                            style={{
                                flex: 1, padding: '12px 0',
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 13, fontWeight: active ? 700 : 500,
                                color: active ? '#fff' : 'var(--text-dim)',
                                position: 'relative',
                            }}
                        >
                            {tab.label}
                            {active && (
                                <div style={{
                                    position: 'absolute', bottom: 0, left: '20%', right: '20%',
                                    height: 2.5, borderRadius: 2, background: '#fff',
                                }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Feed */}
            {(() => {
                const filteredFeed = feedTab === 'foryou'
                    ? feed
                    : feedTab === 'followers'
                        ? feed.filter(p => p.visibility === 'followers' || p.visibility === 'public')
                        : feed.filter(p => p.visibility === 'public');
                return filteredFeed.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px var(--space-md)', color: 'var(--text-dim)' }}>
                    <Dumbbell size={40} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div style={{ fontSize: 14 }}>
                        {feedTab === 'foryou' ? 'Twój feed jest pusty' :
                         feedTab === 'friends' ? 'Brak postów znajomych' :
                         'Brak postów obserwowanych'}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-dim)' }}>
                        {feedTab === 'foryou'
                            ? 'Po zakończeniu treningu lub zdobyciu odznaki możesz udostępnić to na feed!'
                            : 'Posty od innych osób pojawią się tutaj'}
                    </div>
                    {feedTab === 'foryou' && (
                        <button className="btn btn-primary mt-lg" onClick={() => navigate('/workout')}>
                            Rozpocznij trening
                        </button>
                    )}
                </div>
            ) : (
                filteredFeed.map(post => (
                    <div key={post.id} style={{ borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
                        {/* Post header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px var(--space-md) 8px' }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                                border: '2px solid rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                                        <circle cx="12" cy="8" r="4" /><path d="M6 20c0-4 2.7-7 6-7s6 3 6 7" />
                                    </svg>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{user.username || userName}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 8 }}>{timeAgo(post.timestamp)}</span>
                            </div>
                            <button
                                onClick={() => setMenuPost(menuPost === post.id ? null : post.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            >
                                <MoreHorizontal size={18} color="var(--text-dim)" strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Post menu */}
                        {menuPost === post.id && (
                            <div style={{
                                position: 'absolute', right: 16, top: 48, zIndex: 10,
                                background: 'var(--surface)', border: '1px solid var(--border-light)',
                                borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            }}>
                                <button
                                    onClick={() => deletePost(post.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '10px 16px', background: 'none', border: 'none',
                                        cursor: 'pointer', color: '#FF6B6B', fontSize: 13, fontWeight: 600, width: '100%',
                                    }}
                                >
                                    <Trash2 size={16} strokeWidth={1.5} /> Usuń z feed
                                </button>
                            </div>
                        )}

                        {/* Post content */}
                        {post.type === 'workout' && (() => {
                            const photos = post.photos || [];
                            const exercises = post.data.exercises || [];
                            const slides: React.ReactNode[] = [];

                            photos.forEach((photo, i) => (
                                slides.push(
                                    <img key={`ph-${i}`} src={photo} alt="" style={{
                                        width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10,
                                        display: 'block',
                                    }} />
                                )
                            ));

                            if (exercises.length > 0) {
                                slides.push(
                                    <ExerciseSlide
                                        exercises={exercises}
                                        onExpand={() => setExpandedExercises(exercises)}
                                    />
                                );
                            }

                            return (
                                <>
                                    {/* Stats header — always visible above carousel */}
                                    <div style={{ padding: '0 var(--space-md) 8px' }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
                                            border: '1px solid rgba(34,197,94,0.12)',
                                            borderRadius: 12, padding: '14px 16px',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                                <Dumbbell size={16} color="var(--accent)" strokeWidth={2} />
                                                <span style={{ fontSize: 15, fontWeight: 700 }}>{post.data.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 16 }}>
                                                <div>
                                                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{formatDuration(post.data.duration_seconds || 0)}</div>
                                                    <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>czas</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 18, fontWeight: 800 }}>{Math.round(post.data.total_volume_kg || 0).toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400 }}>kg</span></div>
                                                    <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>objętość</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 18, fontWeight: 800 }}>{post.data.total_sets || 0}</div>
                                                    <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>serie</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 18, fontWeight: 800 }}>{post.data.total_reps || 0}</div>
                                                    <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>powt.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Photo/exercise carousel */}
                                    {slides.length > 0 && (
                                        <div style={{ paddingBottom: 8 }}>
                                            <SwipeCarousel slides={slides} />
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {post.type === 'badge' && (
                            <div style={{ padding: '0 var(--space-md)' }}>
                                <div className="card" style={{
                                    background: 'linear-gradient(135deg, rgba(255,199,0,0.1), rgba(255,199,0,0.02))',
                                    border: '1px solid rgba(255,199,0,0.15)',
                                    textAlign: 'center',
                                    padding: '20px 16px',
                                }}>
                                    <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 10 }}>{post.data.icon}</div>
                                    <div style={{ fontSize: 11, color: '#FFC700', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                                        Nowa odznaka!
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 800 }}>{post.data.name}</div>
                                </div>
                            </div>
                        )}

                        {post.type === 'weight' && (
                            <div style={{ padding: '0 var(--space-md)' }}>
                                <div className="card" style={{
                                    background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(167,139,250,0.02))',
                                    border: '1px solid rgba(167,139,250,0.15)',
                                }}>
                                    <div className="flex items-center gap-xs" style={{ marginBottom: 4 }}>
                                        <Scale size={16} color="#A78BFA" strokeWidth={2} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Pomiar wagi</span>
                                    </div>
                                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                                        {post.data.weight_kg} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>kg</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {post.description && (
                            <div style={{ padding: '6px var(--space-md) 4px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 700, marginRight: 6 }}>{user.username || userName}</span>
                                {post.description}
                            </div>
                        )}

                        {/* Visibility badge */}
                        {post.visibility && post.visibility !== 'public' && (
                            <div style={{ padding: '2px var(--space-md)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-dim)' }}>
                                {post.visibility === 'followers' && <><Users size={10} /> Obserwujący</>}
                                {post.visibility === 'private' && <><Lock size={10} /> Prywatny</>}
                            </div>
                        )}

                        {/* Post actions */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '10px var(--space-md) 12px', gap: 16 }}>
                            <button onClick={() => toggleLike(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                                <Heart
                                    size={22} strokeWidth={1.5}
                                    color={likedPosts.has(post.id) ? '#FF6B6B' : 'var(--text-secondary)'}
                                    fill={likedPosts.has(post.id) ? '#FF6B6B' : 'none'}
                                />
                            </button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <MessageCircle size={22} strokeWidth={1.5} color="var(--text-secondary)" />
                            </button>
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <Send size={22} strokeWidth={1.5} color="var(--text-secondary)" />
                            </button>
                            <div style={{ flex: 1 }} />
                            <button onClick={() => toggleSave(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <Bookmark
                                    size={22} strokeWidth={1.5}
                                    color={savedPosts.has(post.id) ? 'var(--accent)' : 'var(--text-secondary)'}
                                    fill={savedPosts.has(post.id) ? 'var(--accent)' : 'none'}
                                />
                            </button>
                        </div>
                    </div>
                ))
            );
            })()}

            <div style={{ height: 40 }} />

            {/* Exercise detail modal */}
            {expandedExercises && (
                <>
                    <div
                        onClick={() => setExpandedExercises(null)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }}
                    />
                    <div style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                        background: 'var(--bg)', borderRadius: '16px 16px 0 0',
                        maxHeight: '80vh', overflowY: 'auto',
                        padding: '20px 16px 32px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontSize: 16, fontWeight: 700 }}>Ćwiczenia ({expandedExercises.length})</span>
                            <button onClick={() => setExpandedExercises(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <X size={20} color="#fff" />
                            </button>
                        </div>
                        {expandedExercises.map((ex: any, i: number) => {
                            const info = exerciseDatabase.find(e => e.id === ex.exercise_id);
                            return (
                                <div key={i} style={{
                                    marginBottom: 16, background: 'var(--surface)',
                                    borderRadius: 12, padding: 14,
                                }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                                        {info?.name || ex.exercise_id}
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'left', padding: '4px 0', fontWeight: 600, textTransform: 'uppercase' }}>Seria</th>
                                                <th style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', padding: '4px 0', fontWeight: 600, textTransform: 'uppercase' }}>Ciężar</th>
                                                <th style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', padding: '4px 0', fontWeight: 600, textTransform: 'uppercase' }}>Powt.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(ex.sets || []).map((set: any, si: number) => (
                                                <tr key={si} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <td style={{ fontSize: 12, padding: '6px 0', color: set.set_type === 'warmup' ? 'var(--warning)' : 'var(--text-secondary)' }}>
                                                        {set.set_type === 'warmup' ? 'R' : si + 1}
                                                    </td>
                                                    <td style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '6px 0' }}>
                                                        {set.weight_kg ? `${set.weight_kg} kg` : '—'}
                                                    </td>
                                                    <td style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '6px 0' }}>
                                                        {set.reps || '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
