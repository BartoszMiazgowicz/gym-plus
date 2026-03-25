import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveWorkout, saveWorkout, getWorkouts, uuid, getUser, addFeedPost, savePR, getBestPR } from '../../data/store';
import { exerciseDatabase, muscleGroupNames, exerciseFilters } from '../../data/exercises';
import { formatDuration, calculateVolume, estimate1RM } from '../../utils/calculations';
import { playRestEndSound } from '../../utils/sounds';
import type { WorkoutExercise, SetEntry, SetType, Exercise } from '../../types/workout';
import { ChevronLeft, MoreVertical, Check, X, Search, Plus, Minus, Dumbbell, Share2, Clock, BarChart3, Repeat, Image, Globe, Users, Lock, RotateCw, RotateCcw, FlipHorizontal2, Trophy, Info } from 'lucide-react';
import type { PostVisibility } from '../../data/store';

interface PhotoEditorProps {
    src: string;
    onDone: (result: string) => void;
    onCancel: () => void;
}

function PhotoEditor({ src, onDone, onCancel }: PhotoEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

    useEffect(() => {
        const img = new window.Image();
        img.onload = () => { imgRef.current = img; setLoaded(true); };
        img.src = src;
    }, [src]);

    const SIZE = Math.min(window.innerWidth - 32, 400);

    useEffect(() => {
        if (!loaded || !imgRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d')!;
        const img = imgRef.current;
        canvasRef.current.width = SIZE;
        canvasRef.current.height = SIZE;

        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.save();
        ctx.translate(SIZE / 2, SIZE / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        if (flipped) ctx.scale(-1, 1);

        const isRotated = rotation % 180 !== 0;
        const iw = isRotated ? img.height : img.width;
        const ih = isRotated ? img.width : img.height;
        const fitScale = Math.max(SIZE / iw, SIZE / ih) * scale;
        const dw = img.width * fitScale;
        const dh = img.height * fitScale;

        ctx.drawImage(img, -dw / 2 + offset.x, -dh / 2 + offset.y, dw, dh);
        ctx.restore();
    }, [loaded, rotation, flipped, offset, scale, SIZE]);

    const handleTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0];
        dragRef.current = { startX: t.clientX, startY: t.clientY, ox: offset.x, oy: offset.y };
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!dragRef.current) return;
        e.preventDefault();
        const t = e.touches[0];
        setOffset({
            x: dragRef.current.ox + (t.clientX - dragRef.current.startX),
            y: dragRef.current.oy + (t.clientY - dragRef.current.startY),
        });
    };
    const handleTouchEnd = () => { dragRef.current = null; };

    const handleMouseDown = (e: React.MouseEvent) => {
        dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragRef.current) return;
        setOffset({
            x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
            y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
        });
    };
    const handleMouseUp = () => { dragRef.current = null; };

    const handleConfirm = () => {
        if (!canvasRef.current) return;
        onDone(canvasRef.current.toDataURL('image/jpeg', 0.8));
    };

    const toolBtn = {
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12,
        padding: '10px 14px', cursor: 'pointer', display: 'flex' as const,
        flexDirection: 'column' as const, alignItems: 'center' as const, gap: 4,
        color: '#fff', fontSize: 10, fontWeight: 600 as const,
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: '#000', display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px',
            }}>
                <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <X size={24} color="#fff" />
                </button>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Przytnij zdjęcie</span>
                <button onClick={handleConfirm} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Check size={24} color="var(--accent)" />
                </button>
            </div>

            {/* Canvas area */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
                    <canvas
                        ref={canvasRef}
                        width={SIZE} height={SIZE}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        style={{
                            width: SIZE, height: SIZE, borderRadius: 4,
                            cursor: 'grab', touchAction: 'none',
                        }}
                    />
                    {/* Corner guides */}
                    {[{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }].map((pos, i) => (
                        <div key={i} style={{
                            position: 'absolute', ...pos, width: 20, height: 20,
                            borderTop: pos.top === 0 ? '2px solid #fff' : 'none',
                            borderBottom: pos.bottom === 0 ? '2px solid #fff' : 'none',
                            borderLeft: pos.left === 0 ? '2px solid #fff' : 'none',
                            borderRight: pos.right === 0 ? '2px solid #fff' : 'none',
                            pointerEvents: 'none',
                        }} />
                    ))}
                    {/* Grid lines */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', left: '33.3%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.15)' }} />
                        <div style={{ position: 'absolute', left: '66.6%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.15)' }} />
                        <div style={{ position: 'absolute', top: '33.3%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.15)' }} />
                        <div style={{ position: 'absolute', top: '66.6%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.15)' }} />
                    </div>
                </div>
            </div>

            {/* Zoom slider */}
            <div style={{ padding: '0 40px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Minus size={14} color="rgba(255,255,255,0.4)" />
                <input
                    type="range" min="1" max="3" step="0.05" value={scale}
                    onChange={e => setScale(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <Plus size={14} color="rgba(255,255,255,0.4)" />
            </div>

            {/* Tools */}
            <div style={{
                display: 'flex', justifyContent: 'center', gap: 16,
                padding: '12px 20px 40px',
            }}>
                <button style={toolBtn} onClick={() => { setRotation(r => (r - 90) % 360); setOffset({ x: 0, y: 0 }); }}>
                    <RotateCcw size={20} /> W lewo
                </button>
                <button style={toolBtn} onClick={() => { setRotation(r => (r + 90) % 360); setOffset({ x: 0, y: 0 }); }}>
                    <RotateCw size={20} /> W prawo
                </button>
                <button style={toolBtn} onClick={() => setFlipped(f => !f)}>
                    <FlipHorizontal2 size={20} /> Lustro
                </button>
            </div>
        </div>
    );
}

interface Props { onRefresh: () => void; }

/** Find the last completed result for a given exercise + set index */
function getPrevResult(exerciseId: string, setIndex: number): string {
    const history = getWorkouts().filter(w => w.status === 'completed');
    for (const session of history) {
        const ex = session.exercises.find(e => e.exercise_id === exerciseId);
        if (ex) {
            const s = ex.sets[setIndex];
            if (s?.is_completed) {
                if (s.weight_kg && s.reps) return `${s.weight_kg}kg × ${s.reps}`;
                if (s.reps) return `${s.reps} reps`;
            }
        }
    }
    return '—';
}

export default function ActiveWorkout({ onRefresh }: Props) {
    const navigate = useNavigate();
    const user = getUser();
    const [workout, setWorkout] = useState(getActiveWorkout());
    const [elapsed, setElapsed] = useState(0);
    const [showExercises, setShowExercises] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pickerFilter, setPickerFilter] = useState<string | null>(null);
    const filtersRowRef = useRef<HTMLDivElement>(null);
    const [restTimer, setRestTimer] = useState(0);
    const [restTotal, setRestTotal] = useState(user.rest_timer_default);
    const [showTimer, setShowTimer] = useState(false);
    const [exRestMap, setExRestMap] = useState<Record<string, number>>({});
    const [showSummary, setShowSummary] = useState(false);
    const [finishedData, setFinishedData] = useState<any>(null);
    const [postTitle, setPostTitle] = useState('');
    const [postDesc, setPostDesc] = useState('');
    const [postPhotos, setPostPhotos] = useState<string[]>([]);
    const [editQueue, setEditQueue] = useState<string[]>([]);
    const [postVisibility, setPostVisibility] = useState<PostVisibility>('public');
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [prSets, setPrSets] = useState<Map<string, string[]>>(() => {
        const w = getActiveWorkout();
        if (!w) return new Map();
        const map = new Map<string, string[]>();
        for (const ex of w.exercises) {
            for (const set of ex.sets) {
                if (!set.is_completed || !set.weight_kg || !set.reps || set.set_type === 'warmup') continue;
                const types: string[] = [];
                const bestWeight = getBestPR(ex.exercise_id, 'max_weight');
                if (!bestWeight || set.weight_kg > bestWeight.value) types.push('max_weight');
                const e1rm = estimate1RM(set.weight_kg, set.reps);
                const best1RM = getBestPR(ex.exercise_id, 'estimated_1rm');
                if (e1rm > 0 && (!best1RM || e1rm > best1RM.value)) types.push('estimated_1rm');
                if (types.length > 0) map.set(set.id, types);
            }
        }
        return map;
    });
    const saveRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const SET_TYPE_CYCLE: SetType[] = ['working', 'warmup', 'dropset', 'failure', 'amrap'];
    const SET_TYPE_LABELS: Record<SetType, string> = {
        working: '', warmup: 'R', dropset: 'D', failure: 'F', amrap: 'A',
    };
    const SET_TYPE_COLORS: Record<SetType, string> = {
        working: 'var(--text-muted)', warmup: '#FFB84D', dropset: '#FF6B6B', failure: '#FF4444', amrap: '#4DD4E6',
    };
    const SET_TYPE_NAMES: Record<SetType, string> = {
        working: 'Normalna', warmup: 'Rozgrzewka', dropset: 'Dropset', failure: 'Do upadku', amrap: 'AMRAP',
    };

    useEffect(() => {
        if (!workout) return;
        const start = new Date(workout.started_at).getTime();
        const ticker = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
        return () => clearInterval(ticker);
    }, [workout?.started_at]);

    useEffect(() => {
        if (restTimer <= 0) { setShowTimer(false); return; }
        if (restTimer === 1) {
            setTimeout(() => playRestEndSound(), 1000);
        }
        const t = setInterval(() => setRestTimer(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [restTimer]);

    useEffect(() => {
        if (!workout) return;
        saveRef.current = setInterval(() => saveWorkout(workout), 5000);
        return () => clearInterval(saveRef.current);
    }, [workout]);

    if (!workout) { navigate('/workout'); return null; }

    const updateWorkout = (updates: Partial<typeof workout>) => {
        const updated = { ...workout, ...updates };
        setWorkout(updated as any);
        saveWorkout(updated as any);
    };

    const addExercise = (exercise: Exercise) => {
        const newEx: WorkoutExercise = {
            id: uuid(),
            session_id: workout.id,
            exercise_id: exercise.id,
            order: workout.exercises.length,
            sets: [{
                id: uuid(),
                workout_exercise_id: '',
                set_number: 1,
                weight_kg: undefined,
                reps: undefined,
                set_type: 'working',
                is_completed: false,
            }],
        };
        const defaultRest = user.rest_timer_default;
        setExRestMap(m => ({ ...m, [newEx.id]: defaultRest }));
        updateWorkout({ exercises: [...workout.exercises, newEx] });
        setShowExercises(false);
        setSearchQuery('');
    };

    const addSet = (exIndex: number) => {
        const exercises = [...workout.exercises];
        const lastSet = exercises[exIndex].sets.at(-1);
        exercises[exIndex].sets.push({
            id: uuid(),
            workout_exercise_id: exercises[exIndex].id,
            set_number: exercises[exIndex].sets.length + 1,
            weight_kg: lastSet?.weight_kg,
            reps: lastSet?.reps,
            set_type: 'working',
            is_completed: false,
        });
        updateWorkout({ exercises });
    };

    const removeSet = (exIndex: number, setIndex: number) => {
        const exercises = [...workout.exercises];
        if (exercises[exIndex].sets.length <= 1) return;
        exercises[exIndex].sets.splice(setIndex, 1);
        exercises[exIndex].sets.forEach((s, i) => { s.set_number = i + 1; });
        updateWorkout({ exercises });
    };

    const updateSet = (exIndex: number, setIndex: number, field: keyof SetEntry, value: any) => {
        const exercises = [...workout.exercises];
        (exercises[exIndex].sets[setIndex] as any)[field] = value;
        updateWorkout({ exercises });
    };

    const cycleSetType = (exIndex: number, setIndex: number) => {
        const exercises = [...workout.exercises];
        const set = exercises[exIndex].sets[setIndex];
        if (set.is_completed) return;
        const currentIdx = SET_TYPE_CYCLE.indexOf(set.set_type);
        set.set_type = SET_TYPE_CYCLE[(currentIdx + 1) % SET_TYPE_CYCLE.length];
        updateWorkout({ exercises });
    };

    const checkPRTypes = (exerciseId: string, set: SetEntry): string[] => {
        if (!set.weight_kg || !set.reps || set.set_type === 'warmup') return [];
        const types: string[] = [];

        const bestWeight = getBestPR(exerciseId, 'max_weight');
        if (!bestWeight || set.weight_kg > bestWeight.value) types.push('max_weight');

        const e1rm = estimate1RM(set.weight_kg, set.reps);
        const best1RM = getBestPR(exerciseId, 'estimated_1rm');
        if (e1rm > 0 && (!best1RM || e1rm > best1RM.value)) types.push('estimated_1rm');

        return types;
    };

    const persistPRs = () => {
        for (const ex of workout.exercises) {
            for (const set of ex.sets) {
                if (!set.is_completed) continue;
                const types = prSets.get(set.id);
                if (!types || types.length === 0) continue;
                if (!set.weight_kg || !set.reps) continue;

                if (types.includes('max_weight')) {
                    const bestWeight = getBestPR(ex.exercise_id, 'max_weight');
                    savePR({
                        id: uuid(),
                        exercise_id: ex.exercise_id,
                        pr_type: 'max_weight',
                        value: set.weight_kg,
                        weight_kg: set.weight_kg,
                        reps: set.reps,
                        achieved_at: new Date().toISOString(),
                        previous_value: bestWeight?.value,
                    });
                }

                if (types.includes('estimated_1rm')) {
                    const e1rm = estimate1RM(set.weight_kg, set.reps);
                    const best1RM = getBestPR(ex.exercise_id, 'estimated_1rm');
                    savePR({
                        id: uuid(),
                        exercise_id: ex.exercise_id,
                        pr_type: 'estimated_1rm',
                        value: Math.round(e1rm * 10) / 10,
                        weight_kg: set.weight_kg,
                        reps: set.reps,
                        achieved_at: new Date().toISOString(),
                        previous_value: best1RM?.value,
                    });
                }
            }
        }
    };

    const toggleSetComplete = (exIndex: number, setIndex: number) => {
        const exercises = [...workout.exercises];
        const set = exercises[exIndex].sets[setIndex];
        set.is_completed = !set.is_completed;
        if (set.is_completed) {
            set.completed_at = new Date().toISOString();
            const exId = exercises[exIndex].id;
            const dur = exRestMap[exId] ?? (user.rest_timer_default);
            setRestTotal(dur);
            setRestTimer(dur);
            setShowTimer(true);

            // Visual PR indicator only — not saved yet
            const exerciseId = exercises[exIndex].exercise_id;
            const prTypes = checkPRTypes(exerciseId, set);
            if (prTypes.length > 0) {
                setPrSets(prev => new Map(prev).set(set.id, prTypes));
            }
        } else {
            setPrSets(prev => {
                const next = new Map(prev);
                next.delete(set.id);
                return next;
            });
        }
        updateWorkout({ exercises });
    };

    const removeExercise = (exIndex: number) =>
        updateWorkout({ exercises: workout.exercises.filter((_, i) => i !== exIndex) });

    const finishWorkout = () => {
        const allSets = workout.exercises.flatMap(e => e.sets.filter(s => s.is_completed));
        const finished = {
            status: 'completed' as const,
            finished_at: new Date().toISOString(),
            duration_seconds: elapsed,
            total_volume_kg: calculateVolume(allSets),
            total_sets: allSets.length,
            total_reps: allSets.reduce((s, set) => s + (set.reps || 0), 0),
        };
        updateWorkout(finished);

        // Save PRs only when workout is completed
        persistPRs();

        setFinishedData({ ...workout, ...finished });
        setPostTitle(workout.name);
        setShowSummary(true);
    };

    const loadFileAsDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                // Pre-scale to max 1200px for editor performance
                const maxW = 1200;
                const s = Math.min(1, maxW / Math.max(img.width, img.height));
                const w = Math.round(img.width * s);
                const h = Math.round(img.height * s);
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                c.getContext('2d')!.drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL('image/jpeg', 0.9));
            };
            img.src = url;
        });
    };

    const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const loaded: string[] = [];
        for (const file of Array.from(files)) {
            loaded.push(await loadFileAsDataUrl(file));
        }
        setEditQueue(prev => [...prev, ...loaded]);
        e.target.value = '';
    };

    const handleEditorDone = (result: string) => {
        setPostPhotos(prev => [...prev, result]);
        setEditQueue(prev => prev.slice(1));
    };

    const handleEditorCancel = () => {
        setEditQueue(prev => prev.slice(1));
    };

    const handlePublish = () => {
        const fd = finishedData || workout;
        if (postTitle && postTitle !== fd.name) {
            updateWorkout({ name: postTitle });
        }
        const post: any = {
            id: `w-${fd.id}-${Date.now()}`,
            type: 'workout',
            timestamp: fd.finished_at || new Date().toISOString(),
            description: postDesc || undefined,
            photos: postPhotos.length > 0 ? postPhotos : undefined,
            visibility: postVisibility,
            data: {
                name: postTitle || fd.name,
                duration_seconds: fd.duration_seconds || elapsed,
                total_volume_kg: fd.total_volume_kg || totalVolume,
                total_sets: fd.total_sets || completedSets.length,
                total_reps: fd.total_reps || completedSets.reduce((s: number, set: any) => s + (set.reps || 0), 0),
                exercises_count: fd.exercises?.length || workout.exercises.length,
                exercises: (fd.exercises || workout.exercises).map((ex: any) => ({
                    exercise_id: ex.exercise_id,
                    sets: (ex.sets || []).filter((s: any) => s.is_completed).map((s: any) => ({
                        weight_kg: s.weight_kg,
                        reps: s.reps,
                        set_type: s.set_type,
                    })),
                })),
            },
        };
        try {
            addFeedPost(post);
        } catch {
            // Storage full — retry without photos
            post.photos = undefined;
            try { addFeedPost(post); } catch { /* ignore */ }
        }
        onRefresh();
        navigate('/workout');
    };

    const handleSkipPublish = () => {
        const fd = finishedData || workout;
        if (postTitle && postTitle !== fd.name) {
            updateWorkout({ name: postTitle });
        }
        onRefresh();
        navigate('/workout');
    };

    const discardWorkout = () => setShowDiscardConfirm(true);

    const confirmDiscard = () => {
        updateWorkout({ status: 'discarded' });
        navigate('/workout');
    };

    const filteredExercises = exerciseDatabase.filter(ex => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(q) || ex.name_en.toLowerCase().includes(q);
        const matchesFilter = !pickerFilter || (ex.filters || []).includes(pickerFilter);
        return matchesSearch && matchesFilter;
    });

    const completedSets = workout.exercises.flatMap(e => e.sets.filter(s => s.is_completed));
    const totalVolume = calculateVolume(completedSets);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Header */}
            <div className="workout-header" style={{
                position: 'sticky', top: 0, background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(40px)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
            }}>
                <button onClick={() => navigate('/workout')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                    <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
                </button>
                <div style={{ flex: 1 }}>
                    <input
                        value={workout.name}
                        onChange={e => updateWorkout({ name: e.target.value })}
                        style={{ font: 'var(--heading-3)', background: 'none', border: 'none', color: 'var(--text-primary)', width: '100%', textAlign: 'center' }}
                    />
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatDuration(elapsed)}</div>
            </div>

            {/* Stats bar */}
            <div className="flex justify-between" style={{ padding: 'var(--space-sm) var(--space-md)', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{completedSets.length}</strong> serii
                </div>
                <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{Math.round(totalVolume).toLocaleString()}</strong> {user.weight_unit}
                </div>
                <div style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{workout.exercises.length}</strong> ćwiczeń
                </div>
            </div>

            {/* Exercise cards */}
            <div style={{ padding: 'var(--space-md)', paddingBottom: showTimer ? 160 : 100 }}>
                {workout.exercises.map((ex, exIdx) => {
                    const info = exerciseDatabase.find(e => e.id === ex.exercise_id);
                    const exRest = exRestMap[ex.id] ?? (user.rest_timer_default);

                    return (
                        <div key={ex.id} className="card" style={{ marginBottom: 'var(--space-md)' }}>
                            {/* Exercise header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{info?.name || 'Ćwiczenie'}</h3>
                                    <p style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>
                                        {info && muscleGroupNames[info.primary_muscle]?.pl}
                                        {info && ` · ${info.equipment}`}
                                    </p>
                                    {/* Rest timer editor */}
                                    <div className="flex items-center gap-xs" style={{ marginTop: 6 }}>
                                        <span style={{ font: 'var(--caption)', color: 'var(--text-dim)' }}>Przerwa:</span>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ padding: '2px 6px', fontSize: 11, color: 'var(--text-secondary)' }}
                                            onClick={() => setExRestMap(m => ({ ...m, [ex.id]: Math.max(0, exRest - 15) }))}
                                        ><Minus size={12} /></button>
                                        <span style={{ font: 'var(--caption)', fontWeight: 600, color: 'var(--accent)', minWidth: 32, textAlign: 'center' }}>
                                            {exRest}s
                                        </span>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            style={{ padding: '2px 6px', fontSize: 11, color: 'var(--text-secondary)' }}
                                            onClick={() => setExRestMap(m => ({ ...m, [ex.id]: exRest + 15 }))}
                                        ><Plus size={12} /></button>
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => removeExercise(exIdx)} style={{ padding: 4 }}>
                                    <MoreVertical size={20} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Set table */}
                            <table className="set-table" style={{ marginTop: 16, marginBottom: 12, width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ font: 'var(--label)', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '4px 0', border: 'none' }}>TYP</th>
                                        <th style={{ font: 'var(--label)', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '4px 0', border: 'none' }}>POPRZ.</th>
                                        <th style={{ font: 'var(--label)', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '4px 0', border: 'none' }}>{user.weight_unit.toUpperCase()}</th>
                                        <th style={{ font: 'var(--label)', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '4px 0', border: 'none' }}>POWT.</th>
                                        <th style={{ font: 'var(--label)', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '4px 0', border: 'none' }}>RPE</th>
                                        <th style={{ font: 'var(--label)', textTransform: 'uppercase', color: 'var(--text-dim)', padding: '4px 0', width: 34, border: 'none' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ex.sets.map((set, setIdx) => {
                                        const prev = getPrevResult(ex.exercise_id, setIdx);
                                        const rpe = (set as any).rpe ?? '';
                                        const prTypes = prSets.get(set.id);
                                        const isPR = !!prTypes && prTypes.length > 0;
                                        const rowBg = isPR
                                            ? 'rgba(255, 199, 0, 0.12)'
                                            : set.is_completed
                                                ? 'rgba(255, 255, 255, 0.08)'
                                                : 'transparent';
                                        const rowShadow = isPR
                                            ? '0 0 12px rgba(255, 199, 0, 0.2)'
                                            : set.is_completed
                                                ? '0 0 8px rgba(255, 255, 255, 0.05)'
                                                : 'none';
                                        return (
                                            <tr key={set.id} style={{
                                                background: rowBg,
                                                boxShadow: rowShadow,
                                                transition: 'background 0.3s, box-shadow 0.3s',
                                            }}>
                                                <td
                                                    style={{
                                                        font: 'var(--caption)', fontWeight: 700,
                                                        color: SET_TYPE_COLORS[set.set_type] || 'var(--text-muted)',
                                                        textAlign: 'center', padding: '6px 4px',
                                                        cursor: set.is_completed ? 'default' : 'pointer',
                                                        userSelect: 'none',
                                                        position: 'relative',
                                                        border: 'none',
                                                    }}
                                                    onClick={() => cycleSetType(exIdx, setIdx)}
                                                    title={SET_TYPE_NAMES[set.set_type]}
                                                >
                                                    {isPR && <Trophy size={10} style={{ color: '#FFC700', position: 'absolute', top: 2, right: 0 }} />}
                                                    {SET_TYPE_LABELS[set.set_type] || (setIdx + 1)}
                                                </td>
                                                <td style={{ padding: '6px 4px', border: 'none' }}>
                                                    <button
                                                        style={{ font: 'var(--caption)', color: 'var(--text-dim)', cursor: 'pointer', background: 'none', border: 'none', padding: 4, fontSize: 10 }}
                                                        onClick={() => {
                                                            const h = getWorkouts().filter(w => w.status === 'completed');
                                                            for (const session of h) {
                                                                const hEx = session.exercises.find(e => e.exercise_id === ex.exercise_id);
                                                                if (hEx?.sets[setIdx]?.is_completed) {
                                                                    const s = hEx.sets[setIdx];
                                                                    if (s.weight_kg) updateSet(exIdx, setIdx, 'weight_kg', s.weight_kg);
                                                                    if (s.reps) updateSet(exIdx, setIdx, 'reps', s.reps);
                                                                    break;
                                                                }
                                                            }
                                                        }}
                                                    >{prev}</button>
                                                </td>
                                                <td style={{ padding: '6px 4px', border: 'none' }}>
                                                    <input
                                                        type="number"
                                                        className="set-input"
                                                        placeholder={user.weight_unit}
                                                        value={set.weight_kg ?? ''}
                                                        disabled={set.is_completed}
                                                        onChange={e => updateSet(exIdx, setIdx, 'weight_kg', e.target.value ? Number(e.target.value) : undefined)}
                                                        style={{ opacity: set.is_completed ? 0.5 : 1 }}
                                                    />
                                                </td>
                                                <td style={{ padding: '6px 4px', border: 'none' }}>
                                                    <input
                                                        type="number"
                                                        className="set-input"
                                                        placeholder="reps"
                                                        value={set.reps ?? ''}
                                                        disabled={set.is_completed}
                                                        onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value ? Number(e.target.value) : undefined)}
                                                        style={{ opacity: set.is_completed ? 0.5 : 1 }}
                                                    />
                                                </td>
                                                <td style={{ padding: '6px 4px', border: 'none' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                        <input
                                                            type="range"
                                                            min={6} max={10} step={0.5}
                                                            value={rpe || 7}
                                                            disabled={set.is_completed}
                                                            onChange={e => updateSet(exIdx, setIdx, 'rpe', Number(e.target.value))}
                                                            style={{ width: 58, height: 20, accentColor: 'var(--accent)', cursor: set.is_completed ? 'default' : 'pointer' }}
                                                        />
                                                        <span style={{ font: 'var(--label)', color: rpe ? 'var(--accent)' : 'var(--text-dim)', fontSize: 10 }}>
                                                            {rpe || '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '6px 4px', border: 'none' }}>
                                                    <button
                                                        className={`set-checkbox ${set.is_completed ? 'checked' : ''}`}
                                                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                                                        style={isPR ? {
                                                            background: 'rgba(255, 199, 0, 0.25)',
                                                            borderColor: '#FFC700',
                                                            color: '#FFC700',
                                                        } : undefined}
                                                    >
                                                        {set.is_completed && (isPR ? <Trophy size={14} strokeWidth={2.5} /> : <Check size={16} strokeWidth={3} />)}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* PR banners for this exercise */}
                            {(() => {
                                const exPRSets = ex.sets.filter(s => prSets.has(s.id) && s.is_completed);
                                if (exPRSets.length === 0) return null;
                                return exPRSets.map(s => {
                                    const types = prSets.get(s.id)!;
                                    return (
                                        <div key={s.id} style={{
                                            background: 'linear-gradient(135deg, rgba(255,199,0,0.15) 0%, rgba(255,149,0,0.10) 100%)',
                                            border: '1px solid rgba(255,199,0,0.3)',
                                            borderRadius: 10, padding: '10px 12px', marginTop: 8,
                                            display: 'flex', alignItems: 'center', gap: 10,
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                background: 'rgba(255,199,0,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                <Trophy size={16} style={{ color: '#FFC700' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFC700', marginBottom: 2 }}>
                                                    Nowy rekord osobisty!
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    {types.includes('max_weight') && (
                                                        <span>Najcięższy ciężar: <strong style={{ color: '#FFC700' }}>{s.weight_kg}{user.weight_unit}</strong></span>
                                                    )}
                                                    {types.includes('estimated_1rm') && (
                                                        <span>1RM: <strong style={{ color: '#FFC700' }}>~{Math.round(estimate1RM(s.weight_kg!, s.reps!))}{user.weight_unit}</strong></span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}

                            {/* Card footer */}
                            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => addSet(exIdx)}>
                                    <Plus size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Seria
                                </button>
                                {ex.sets.length > 1 && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: 'var(--text-dim)' }}
                                        onClick={() => removeSet(exIdx, ex.sets.length - 1)}
                                    >
                                        <Minus size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Usuń serię
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Empty state */}
                {workout.exercises.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 16px 32px' }}>
                        <Dumbbell size={48} strokeWidth={1} style={{ marginBottom: 16, opacity: 0.2 }} />
                        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Zacznij!</div>
                        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Dodaj ćwiczenie, aby zacząć swój trening</div>
                    </div>
                )}

                <button className="btn btn-primary btn-full btn-lg" onClick={() => setShowExercises(true)}
                    style={{ marginBottom: 16 }}>
                    <Plus size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} /> Dodaj ćwiczenie
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button
                        onClick={finishWorkout}
                        style={{
                            background: 'none', border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 10, padding: '8px 20px', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}
                    >
                        <Check size={14} /> Zakończ
                    </button>
                    <button
                        onClick={discardWorkout}
                        style={{
                            background: 'none', border: '1px solid rgba(255,107,107,0.2)',
                            borderRadius: 10, padding: '8px 20px', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, color: 'rgba(255,107,107,0.6)',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}
                    >
                        <X size={14} /> Odrzuć
                    </button>
                </div>
            </div>

            {/* Rest Timer Bar */}
            {showTimer && restTimer > 0 && (
                <div className="rest-timer-float">
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                            Odpoczynek {formatDuration(restTimer)}
                        </div>
                        <div className="progress-bar" style={{ height: 3 }}>
                            <div className="progress-fill" style={{ width: `${(restTimer / restTotal) * 100}%`, backgroundColor: '#4DD4E6' }} />
                        </div>
                    </div>
                    <div className="flex gap-xs" style={{ marginLeft: 12 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRestTimer(p => Math.max(0, p - 15))}>−15</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRestTimer(p => p + 15)}>+15</button>
                        <button className="btn btn-sm btn-primary" onClick={() => { setRestTimer(0); setShowTimer(false); }}>Gotowy</button>
                    </div>
                    <button onClick={() => { setRestTimer(0); setShowTimer(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 8 }}>
                        <X size={20} color="rgba(255, 255, 255, 0.6)" strokeWidth={1.5} />
                    </button>
                </div>
            )}

            {/* Exercise Picker — fullscreen modal */}
            {showExercises && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 150,
                    background: 'var(--bg)', display: 'flex', flexDirection: 'column',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '16px 16px 12px',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        <button
                            onClick={() => { setShowExercises(false); setSearchQuery(''); setPickerFilter(null); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
                        >
                            <X size={22} color="#fff" strokeWidth={2} />
                        </button>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} strokeWidth={1.5} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                placeholder={pickerFilter ? `Szukaj w kategorii...` : `Szukaj ćwiczenia...`}
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); }}
                                autoFocus
                                style={{
                                    width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)',
                                    borderRadius: 12, padding: '10px 12px 10px 36px', color: '#fff',
                                    fontSize: 14, outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                                    <X size={14} color="var(--text-dim)" />
                                </button>
                            )}
                        </div>
                        {filteredExercises.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>{filteredExercises.length}</span>}
                    </div>

                    {/* Category pills */}
                    {!searchQuery && (
                        <div
                            className="picker-filters-row"
                            ref={filtersRowRef}
                            onWheel={e => { e.preventDefault(); filtersRowRef.current!.scrollLeft += e.deltaY + e.deltaX; }}
                            onMouseDown={e => {
                                const el = filtersRowRef.current!;
                                const startX = e.pageX - el.offsetLeft;
                                const scrollLeft = el.scrollLeft;
                                const onMove = (ev: MouseEvent) => { el.scrollLeft = scrollLeft - (ev.pageX - el.offsetLeft - startX); };
                                const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                                window.addEventListener('mousemove', onMove);
                                window.addEventListener('mouseup', onUp);
                            }}
                        >
                            <div
                                onClick={() => setPickerFilter(null)}
                                style={{
                                    flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '7px 16px',
                                    borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
                                    background: !pickerFilter ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                                    color: !pickerFilter ? '#000' : 'var(--text-muted)',
                                    border: !pickerFilter ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                Wszystkie
                            </div>
                            {exerciseFilters.map(f => (
                                <div
                                    key={f.key}
                                    onClick={() => setPickerFilter(pickerFilter === f.key ? null : f.key)}
                                    style={{
                                        flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '7px 16px',
                                        borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
                                        background: pickerFilter === f.key ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                                        color: pickerFilter === f.key ? '#000' : 'var(--text-muted)',
                                        border: pickerFilter === f.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    {f.pl}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Exercise list */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
                        {filteredExercises.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                                <Dumbbell size={32} strokeWidth={1.5} style={{ opacity: 0.2, marginBottom: 8 }} />
                                <div>Brak ćwiczeń</div>
                            </div>
                        ) : (
                            filteredExercises.map(ex => (
                                <div key={ex.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {ex.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 4, alignItems: 'center' }}>
                                            {ex.bodyParts?.[0] && <span>{ex.bodyParts[0].name}</span>}
                                            {ex.bodyParts?.[0] && <span>·</span>}
                                            <span>{ex.equipment}</span>
                                        </div>
                                    </div>
                                    {/* Info button */}
                                    <button
                                        onClick={() => navigate(`/workout/exercise/${ex.id}`)}
                                        style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        <Info size={16} strokeWidth={1.5} color="var(--text-muted)" />
                                    </button>
                                    {/* Add button */}
                                    <button
                                        onClick={() => { addExercise(ex); }}
                                        style={{ background: 'var(--accent)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        <Plus size={18} strokeWidth={2.5} color="#000" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Post-workout summary */}
            {showSummary && finishedData && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'var(--bg)', overflowY: 'auto',
                }}>
                    {/* Header */}
                    <div style={{
                        position: 'sticky', top: 0, zIndex: 10,
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(40px)',
                        padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <span style={{ font: 'var(--heading-3)' }}>Podsumowanie</span>
                        <button onClick={handleSkipPublish} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <X size={22} color="#fff" strokeWidth={1.5} />
                        </button>
                    </div>

                    <div style={{ padding: '20px' }}>
                        {/* Stats */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr',
                            gap: 10, marginBottom: 20,
                        }}>
                            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                                <Clock size={18} style={{ marginBottom: 4, opacity: 0.5 }} />
                                <div style={{ fontSize: 18, fontWeight: 700 }}>{formatDuration(finishedData.duration_seconds || 0)}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Czas</div>
                            </div>
                            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                                <BarChart3 size={18} style={{ marginBottom: 4, opacity: 0.5 }} />
                                <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(finishedData.total_volume_kg).toLocaleString()} kg</div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Objętość</div>
                            </div>
                            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                                <Repeat size={18} style={{ marginBottom: 4, opacity: 0.5 }} />
                                <div style={{ fontSize: 18, fontWeight: 700 }}>{finishedData.total_sets}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Serie</div>
                            </div>
                            <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                                <Dumbbell size={18} style={{ marginBottom: 4, opacity: 0.5 }} />
                                <div style={{ fontSize: 18, fontWeight: 700 }}>{finishedData.total_reps}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Powtórzenia</div>
                            </div>
                        </div>

                        {/* Date & time */}
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
                            {new Date(finishedData.finished_at).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            {' · '}
                            {new Date(finishedData.finished_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {/* Title input */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Tytuł</label>
                            <input
                                value={postTitle}
                                onChange={e => setPostTitle(e.target.value)}
                                placeholder="Nazwa treningu"
                                style={{
                                    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: 10, padding: '12px 14px', color: 'var(--text-primary)',
                                    fontSize: 16, fontWeight: 600, outline: 'none',
                                }}
                            />
                        </div>

                        {/* Photos */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Zdjęcia</label>
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                {postPhotos.map((photo, i) => (
                                    <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                                        <img src={photo} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10 }} />
                                        <button
                                            onClick={() => setPostPhotos(prev => prev.filter((_, j) => j !== i))}
                                            style={{
                                                position: 'absolute', top: -6, right: -6,
                                                width: 22, height: 22, borderRadius: '50%',
                                                background: 'rgba(255,107,107,0.9)', border: 'none',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        ><X size={12} color="#fff" /></button>
                                    </div>
                                ))}
                                <label style={{
                                    width: 80, height: 80, flexShrink: 0,
                                    background: 'var(--surface)', border: '2px dashed rgba(255,255,255,0.1)',
                                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                }}>
                                    <Image size={24} style={{ opacity: 0.3 }} />
                                    <input type="file" accept="image/*" multiple hidden onChange={handleAddPhotos} />
                                </label>
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Opis</label>
                            <textarea
                                value={postDesc}
                                onChange={e => setPostDesc(e.target.value)}
                                placeholder="Jak poszło? Jak się czujesz?"
                                rows={3}
                                style={{
                                    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: 10, padding: '12px 14px', color: 'var(--text-primary)',
                                    fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Visibility - inline buttons */}
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Widoczność</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {([
                                    { val: 'public' as PostVisibility, label: 'Publiczny', Icon: Globe },
                                    { val: 'followers' as PostVisibility, label: 'Obserwujący', Icon: Users },
                                    { val: 'private' as PostVisibility, label: 'Prywatny', Icon: Lock },
                                ]).map(({ val, label, Icon }) => (
                                    <button
                                        key={val}
                                        onClick={() => setPostVisibility(val)}
                                        style={{
                                            flex: 1, padding: '10px 8px',
                                            background: postVisibility === val ? 'rgba(255,255,255,0.1)' : 'var(--surface)',
                                            border: postVisibility === val ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                                            borderRadius: 10, cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                            color: postVisibility === val ? 'var(--accent)' : 'var(--text-muted)',
                                            fontSize: 11, fontWeight: 600,
                                        }}
                                    >
                                        <Icon size={16} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ paddingBottom: 32 }}>
                            <button
                                onClick={handlePublish}
                                style={{
                                    width: '100%', padding: '16px 32px', marginBottom: 10,
                                    background: '#fff', color: '#000', border: 'none',
                                    borderRadius: 999, fontSize: 16, fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 8,
                                }}
                            >
                                <Share2 size={18} /> Udostępnij na feed
                            </button>
                            <button
                                onClick={handleSkipPublish}
                                style={{
                                    width: '100%', padding: '14px 32px',
                                    background: 'var(--surface)', color: 'var(--text-secondary)',
                                    border: '1px solid var(--border)', borderRadius: 999,
                                    fontSize: 14, fontWeight: 500, cursor: 'pointer',
                                }}
                            >
                                Pomiń
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Editor */}
            {editQueue.length > 0 && (
                <PhotoEditor
                    src={editQueue[0]}
                    onDone={handleEditorDone}
                    onCancel={handleEditorCancel}
                />
            )}

            {/* Discard confirmation modal */}
            {showDiscardConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 24,
                }}>
                    <div style={{
                        background: '#1C1C1E', borderRadius: 16,
                        padding: 24, width: '100%', maxWidth: 320,
                    }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8, textAlign: 'center' }}>
                            Odrzucić trening?
                        </div>
                        <div style={{ fontSize: 13, color: '#ABABAB', textAlign: 'center', marginBottom: 20, lineHeight: 1.5 }}>
                            Wszystkie dane z tego treningu zostaną utracone. Tej akcji nie można cofnąć.
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button
                                onClick={confirmDiscard}
                                style={{
                                    width: '100%', padding: '14px 0',
                                    background: '#FF453A', color: '#fff',
                                    border: 'none', borderRadius: 12,
                                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                Odrzuć trening
                            </button>
                            <button
                                onClick={() => setShowDiscardConfirm(false)}
                                style={{
                                    width: '100%', padding: '14px 0',
                                    background: '#2C2C2E', color: '#fff',
                                    border: 'none', borderRadius: 12,
                                    fontSize: 15, fontWeight: 500, cursor: 'pointer',
                                }}
                            >
                                Kontynuuj trening
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
