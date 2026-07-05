import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, saveUser } from '../data/store';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ImageCropper from '../components/ImageCropper';
import { ChevronRight, ChevronDown, Target, SlidersHorizontal, Volume2, MessageSquareWarning, ClipboardList } from 'lucide-react';
import { previewSound, SOUND_LABELS } from '../utils/sounds';
import { isDeveloperEmail } from '../lib/developers';
import type { User } from '../types/user';

export default function Settings() {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [user, setUser] = useState(getUser());
    const [isSaved, setIsSaved] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [originalUsername] = useState(getUser().username);
    const [cropperImage, setCropperImage] = useState<string | null>(null);
    const [showAppSettings, setShowAppSettings] = useState(false);
    const isDev = isDeveloperEmail(authUser?.email);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', user.theme);
        return () => {
            document.documentElement.setAttribute('data-theme', getUser().theme);
        };
    }, [user.theme]);

    const handleChange = (updates: Partial<User>) => {
        setUser({ ...user, ...updates });
        setIsSaved(false);
    };

    const handleFinalSave = async () => {
        setIsSyncing(true);
        const userToSave = { ...user };
        if (userToSave.username !== originalUsername) {
            userToSave.username_last_changed = new Date().toISOString();
        }
        saveUser(userToSave);
        setUser(userToSave);
        await new Promise(r => setTimeout(r, 2200));
        setIsSyncing(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const usernameLastChangedDate = user.username_last_changed ? new Date(user.username_last_changed).getTime() : 0;
    const canChangeUsername = !user.username_last_changed || (new Date().getTime() - usernameLastChangedDate) > 30 * 24 * 60 * 60 * 1000;
    const daysUntilCanChange = canChangeUsername ? 0 : Math.ceil((30 * 24 * 60 * 60 * 1000 - (new Date().getTime() - usernameLastChangedDate)) / (1000 * 60 * 60 * 24));

    // Step 1: User picks file -> open cropper
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setCropperImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    // Step 2: User confirms crop -> upload
    const handleCropConfirm = async (croppedDataUrl: string) => {
        setCropperImage(null);
        if (!authUser) {
            handleChange({ avatar_url: croppedDataUrl });
            return;
        }

        setUploadingAvatar(true);
        try {
            const res = await fetch(croppedDataUrl);
            const blob = await res.blob();
            const filePath = `${authUser.id}/avatar.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

            if (uploadError) {
                console.error('Avatar upload error:', uploadError);
                handleChange({ avatar_url: croppedDataUrl });
            } else {
                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                handleChange({ avatar_url: urlData.publicUrl + '?t=' + Date.now() });
            }
        } catch (err) {
            console.error('Avatar upload failed:', err);
            handleChange({ avatar_url: croppedDataUrl });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSendFeedback = async () => {
        if (!feedbackText.trim() || !authUser) return;
        setFeedbackStatus('sending');
        const { error } = await supabase.from('feedback').insert({
            user_id: authUser.id,
            username: user.username || user.name || authUser.email,
            message: feedbackText.trim(),
        });
        if (error) {
            console.error('Feedback insert error:', error);
            setFeedbackStatus('error');
            return;
        }
        setFeedbackStatus('sent');
        setFeedbackText('');
        setTimeout(() => {
            setShowFeedback(false);
            setFeedbackStatus('idle');
        }, 1200);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center gap-md">
                    <button className="back-btn" onClick={() => navigate('/profile')}>
                        ←
                    </button>
                    <h1 className="page-title">Ustawienia</h1>
                </div>
            </div>

            <div className="section-label">Twój profil</div>
            <div className="card mb-lg">
                <div className="flex items-start gap-md">
                    <label style={{ cursor: 'pointer', display: 'block', flexShrink: 0, position: 'relative' }}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
                        <img
                            src={user.avatar_url || '/profil.jpg'}
                            alt="Avatar"
                            style={{
                                width: 64, height: 64, borderRadius: 'var(--radius-full)',
                                objectFit: 'cover',
                                opacity: uploadingAvatar ? 0.5 : 1,
                                transition: 'opacity 0.2s',
                                ...(user.avatar_url ? {} : { mixBlendMode: 'screen' as const })
                            }}
                        />
                        <div className="text-center mt-xs" style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, color: 'var(--text-secondary)' }}>
                            {uploadingAvatar ? 'WYSYŁANIE...' : 'ZMIEŃ ZDJĘCIE'}
                        </div>
                    </label>
                    <div style={{ flex: 1 }}>
                        <input
                            value={user.name}
                            onChange={e => handleChange({ name: e.target.value })}
                            className="input"
                            style={{ padding: '8px 12px', marginBottom: 8, height: 'auto', font: 'var(--body)' }}
                            placeholder="Imię"
                        />
                        <div className="flex items-center gap-xs">
                            <span style={{ color: 'var(--text-muted)' }}>@</span>
                            <input
                                value={user.username || ''}
                                onChange={(e) => {
                                    if (!canChangeUsername) return;
                                    const newUsername = e.target.value.replace('@', '').toLowerCase();
                                    handleChange({ username: newUsername });
                                }}
                                disabled={!canChangeUsername}
                                className="input"
                                style={{ padding: '8px 12px', height: 'auto', font: 'var(--caption)', color: canChangeUsername ? 'var(--text-primary)' : 'var(--text-dim)' }}
                                placeholder="identyfikator"
                            />
                        </div>
                        {!canChangeUsername && <div style={{ fontSize: 10, color: 'var(--warning)', marginTop: 4 }}>Zmienisz za {daysUntilCanChange} dni</div>}
                    </div>
                </div>
            </div>

            {/* Zgłoś uwagę (beta) */}
            <div
                className="card mb-lg"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setShowFeedback(true)}
            >
                <span className="flex items-center gap-sm" style={{ fontSize: 14 }}>
                    <MessageSquareWarning size={18} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
                    Zgłoś uwagę / błąd (beta)
                </span>
                <ChevronRight size={18} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            </div>

            {isDev && (
                <div
                    className="card mb-lg"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onClick={() => navigate('/settings/feedback')}
                >
                    <span className="flex items-center gap-sm" style={{ fontSize: 14 }}>
                        <ClipboardList size={18} strokeWidth={1.5} style={{ color: '#A78BFA' }} />
                        Panel uwag (deweloperskie)
                    </span>
                    <ChevronRight size={18} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                </div>
            )}

            {/* Cele kaloryczne */}
            <div
                className="card mb-lg"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => navigate('/diet/goals')}
            >
                <span className="flex items-center gap-sm" style={{ fontSize: 14 }}>
                    <Target size={18} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
                    Cele kaloryczne
                </span>
                <span style={{ font: 'var(--caption)', color: 'var(--text-muted)' }}>{user.calorie_goal} kcal</span>
            </div>

            {/* Ustawienia aplikacji - rozwijane */}
            <div
                className="card mb-lg"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setShowAppSettings(!showAppSettings)}
            >
                <span className="flex items-center gap-sm" style={{ fontSize: 14 }}>
                    <SlidersHorizontal size={18} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
                    Ustawienia aplikacji
                </span>
                {showAppSettings
                    ? <ChevronDown size={18} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                    : <ChevronRight size={18} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                }
            </div>

            {showAppSettings && (
                <div className="card mb-lg">
                    {/* Theme */}
                    <div className="flex items-center justify-between" style={{ padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--border-light)' }}>
                        <span>Motyw</span>
                        <div className="chips-row" style={{ margin: 0, gap: 4 }}>
                            <div className={`chip ${user.theme === 'dark' ? 'active' : ''}`} onClick={() => handleChange({ theme: 'dark' })}>Ciemny</div>
                            <div className={`chip ${user.theme === 'light' ? 'active' : ''}`} onClick={() => handleChange({ theme: 'light' })}>Jasny</div>
                        </div>
                    </div>

                    {/* Units */}
                    <div className="flex items-center justify-between" style={{ padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--border-light)' }}>
                        <span>Jednostki</span>
                        <div className="chips-row" style={{ margin: 0, gap: 4 }}>
                            <div className={`chip ${user.weight_unit === 'kg' ? 'active' : ''}`} onClick={() => handleChange({ weight_unit: 'kg' })}>kg</div>
                            <div className={`chip ${user.weight_unit === 'lb' ? 'active' : ''}`} onClick={() => handleChange({ weight_unit: 'lb' })}>lb</div>
                        </div>
                    </div>

                    {/* 1RM Formula */}
                    <div className="flex items-center justify-between" style={{ padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--border-light)' }}>
                        <span>Formuła 1RM</span>
                        <div className="chips-row" style={{ margin: 0, gap: 4 }}>
                            <div className={`chip ${user.one_rm_formula === 'epley' ? 'active' : ''}`} onClick={() => handleChange({ one_rm_formula: 'epley' })}>Epley</div>
                            <div className={`chip ${user.one_rm_formula === 'brzycki' ? 'active' : ''}`} onClick={() => handleChange({ one_rm_formula: 'brzycki' })}>Brzycki</div>
                        </div>
                    </div>

                    {/* Rest timer slider */}
                    <div style={{ padding: 'var(--space-md) 0', borderBottom: '1px solid var(--border-light)' }}>
                        <div className="flex items-center justify-between mb-sm">
                            <span>Timer przerwy</span>
                            <span className="text-accent font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatTime(user.rest_timer_default)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="600"
                            step="10"
                            value={user.rest_timer_default}
                            onChange={(e) => handleChange({ rest_timer_default: parseInt(e.target.value) })}
                            style={{ width: '100%', accentColor: 'var(--accent)' }}
                        />
                        <div className="flex justify-between text-muted" style={{ fontSize: 10, marginTop: 4 }}>
                            <span>0 min</span>
                            <span>10 min</span>
                        </div>
                    </div>

                    {/* Rest timer sound */}
                    <div style={{ padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--border-light)' }}>
                        <div className="flex items-center justify-between mb-sm">
                            <span className="flex items-center gap-xs">
                                <Volume2 size={14} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                                Dźwięk przerwy
                            </span>
                        </div>
                        <div className="chips-row" style={{ margin: 0, gap: 4, flexWrap: 'wrap' }}>
                            {(Object.keys(SOUND_LABELS) as Array<keyof typeof SOUND_LABELS>).map(key => (
                                <div
                                    key={key}
                                    className={`chip ${user.rest_timer_sound === key ? 'active' : ''}`}
                                    onClick={() => {
                                        handleChange({ rest_timer_sound: key });
                                        previewSound(key);
                                    }}
                                >
                                    {SOUND_LABELS[key]}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Language */}
                    <div className="flex items-center justify-between" style={{ padding: 'var(--space-sm) 0' }}>
                        <span>Język</span>
                        <div className="chips-row" style={{ margin: 0, gap: 4 }}>
                            <div className={`chip ${user.language === 'pl' ? 'active' : ''}`} onClick={() => handleChange({ language: 'pl' })}>PL</div>
                            <div className={`chip ${user.language === 'en' ? 'active' : ''}`} onClick={() => handleChange({ language: 'en' })}>EN</div>
                        </div>
                    </div>
                </div>
            )}

            <button
                className="btn btn-primary btn-full mb-lg"
                onClick={handleFinalSave}
                disabled={isSyncing}
                style={{ position: 'sticky', bottom: '24px', opacity: isSyncing ? 0.7 : 1 }}
            >
                {isSyncing ? "Synchronizowanie..." : isSaved ? "Zapisano w chmurze ✓" : "Zapisz ustawienia"}
            </button>

            <div style={{ font: 'var(--caption)', color: 'var(--text-dim)', textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
                GYM+ v1.0.0 · Ustawienia
            </div>

            {/* Image Cropper Modal */}
            {cropperImage && (
                <ImageCropper
                    imageSrc={cropperImage}
                    onConfirm={handleCropConfirm}
                    onCancel={() => setCropperImage(null)}
                />
            )}

            {/* Feedback bottom sheet */}
            {showFeedback && (
                <>
                    <div className="bottom-sheet-overlay" onClick={() => { setShowFeedback(false); setFeedbackStatus('idle'); }} />
                    <div className="bottom-sheet">
                        <div className="bottom-sheet-handle" />
                        <div className="bottom-sheet-content">
                            <div className="flex items-center justify-between mb-sm">
                                <h3 className="section-title" style={{ margin: 0 }}>Zgłoś uwagę</h3>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={handleSendFeedback}
                                    disabled={feedbackStatus === 'sending' || feedbackStatus === 'sent' || !feedbackText.trim()}
                                >
                                    {feedbackStatus === 'sending' ? 'Wysyłanie...' : feedbackStatus === 'sent' ? 'Wysłano ✓' : 'Wyślij'}
                                </button>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                                Aplikacja jest w wersji beta — jeśli coś nie działa, wygląda dziwnie albo masz pomysł na usprawnienie, napisz tutaj. Uwaga trafi bezpośrednio do dewelopera.
                            </p>
                            <textarea
                                value={feedbackText}
                                onChange={e => setFeedbackText(e.target.value)}
                                placeholder="Opisz błąd lub uwagę..."
                                rows={5}
                                autoFocus
                                style={{
                                    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: 10, padding: '12px 14px', color: 'var(--text-primary)',
                                    fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                                }}
                            />
                            {feedbackStatus === 'error' && (
                                <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>
                                    Nie udało się wysłać. Spróbuj ponownie.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
