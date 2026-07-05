import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearAllData } from '../data/store';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, info.componentStack);
    }

    handleReload = () => {
        this.setState({ error: null });
        window.location.reload();
    };

    handleReset = () => {
        if (!window.confirm('To usunie wszystkie lokalne dane (treningi, dieta, ustawienia) z tego urządzenia. Kontynuować?')) return;
        clearAllData(true);
        window.location.href = '/';
    };

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div style={{
                minHeight: '100dvh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                padding: 'var(--space-xl, 24px)', gap: 16, background: 'var(--bg, #000)', color: 'var(--text-primary, #fff)',
            }}>
                <div style={{ fontSize: 40 }}>⚠️</div>
                <h1 style={{ font: 'var(--heading-2)', margin: 0, fontSize: 22 }}>Coś poszło nie tak</h1>
                <p style={{ font: 'var(--body)', color: 'var(--text-secondary)', maxWidth: 360, margin: 0 }}>
                    Aplikacja napotkała nieoczekiwany błąd. Twoje dane są bezpieczne — spróbuj odświeżyć stronę.
                </p>
                <details style={{ maxWidth: 360, width: '100%', textAlign: 'left', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Szczegóły techniczne</summary>
                    {this.state.error.message}
                </details>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button className="btn btn-primary" onClick={this.handleReload}>Odśwież stronę</button>
                    <button className="btn btn-secondary" onClick={this.handleReset}>Wyczyść dane i zacznij od nowa</button>
                </div>
            </div>
        );
    }
}
