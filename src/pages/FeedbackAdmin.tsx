import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { isDeveloperEmail } from '../lib/developers';
import { Check } from 'lucide-react';

interface FeedbackItem {
    id: string;
    user_id: string;
    username: string | null;
    message: string;
    status: 'open' | 'resolved';
    created_at: string;
    resolved_at?: string | null;
}

function timeAgo(date: string): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'teraz';
    if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h temu`;
    const days = Math.floor(diff / 86400);
    if (days === 1) return 'wczoraj';
    if (days < 30) return `${days} dni temu`;
    return new Date(date).toLocaleDateString('pl-PL');
}

export default function FeedbackAdmin() {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const isDev = isDeveloperEmail(authUser?.email);
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isDev) { navigate('/settings'); return; }
        load();
    }, [isDev]);

    const load = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error('Feedback load error:', error);
        setItems(data || []);
        setLoading(false);
    };

    const toggleResolved = async (item: FeedbackItem) => {
        const nextStatus = item.status === 'resolved' ? 'open' : 'resolved';
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus } : i));
        const { error } = await supabase
            .from('feedback')
            .update({ status: nextStatus, resolved_at: nextStatus === 'resolved' ? new Date().toISOString() : null })
            .eq('id', item.id);
        if (error) {
            console.error('Feedback update error:', error);
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: item.status } : i));
        }
    };

    if (!isDev) return null;

    const open = items.filter(i => i.status !== 'resolved');
    const resolved = items.filter(i => i.status === 'resolved');

    const renderItem = (item: FeedbackItem) => (
        <div
            key={item.id}
            className="card mb-sm"
            style={{ display: 'flex', gap: 12, alignItems: 'flex-start', opacity: item.status === 'resolved' ? 0.55 : 1 }}
        >
            <button
                onClick={() => toggleResolved(item)}
                style={{
                    flexShrink: 0, width: 24, height: 24, borderRadius: 6, marginTop: 2,
                    border: item.status === 'resolved' ? '2px solid var(--accent)' : '2px solid var(--border-light)',
                    background: item.status === 'resolved' ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.15s',
                }}
            >
                {item.status === 'resolved' && <Check size={14} color="#000" strokeWidth={3} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: 14, color: 'var(--text-primary)',
                    textDecoration: item.status === 'resolved' ? 'line-through' : 'none',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                    {item.message}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
                    @{item.username || 'anonim'} · {timeAgo(item.created_at)}
                </div>
            </div>
        </div>
    );

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex items-center gap-md">
                    <button className="back-btn" onClick={() => navigate('/settings')}>←</button>
                    <h1 className="page-title">Panel uwag</h1>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>Ładowanie...</div>
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>Brak zgłoszeń.</div>
            ) : (
                <>
                    <div className="section-label">Otwarte ({open.length})</div>
                    {open.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>Brak otwartych zgłoszeń 🎉</div>
                    ) : open.map(renderItem)}

                    {resolved.length > 0 && (
                        <>
                            <div className="section-label" style={{ marginTop: 'var(--space-xl)' }}>Naprawione ({resolved.length})</div>
                            {resolved.map(renderItem)}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
