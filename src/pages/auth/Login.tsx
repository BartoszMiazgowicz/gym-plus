import { useState } from 'react';
import { supabase, setRememberMe } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMeState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setRememberMe(rememberMe);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      {/* Gradient blob background */}
      <div
        className="gradient-blob"
        style={{
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          top: -100, right: -100
        }}
      />

      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="card" style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-2xl)',
          backdropFilter: 'blur(40px)',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <img src="/logo.png" alt="GYM+" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 12 }} />
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 12 }}>
              GYM+
            </h1>
            <h2 style={{ font: 'var(--heading-3)', marginBottom: 8 }}>Zaloguj się</h2>
            <p style={{ font: 'var(--body)', color: 'var(--text-secondary)' }}>Wpisz dane aby kontynuować</p>
          </div>

          {error && <div className="badge badge-warning" style={{ width: '100%', padding: 12, fontSize: 14, marginBottom: 'var(--space-md)' }}>{error}</div>}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ marginTop: 'var(--space-xl)' }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ borderRadius: 'var(--radius-full)' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Hasło</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ borderRadius: 'var(--radius-full)', paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword
                    ? <EyeOff size={18} color="rgba(255, 255, 255, 0.5)" strokeWidth={1.5} />
                    : <Eye size={18} color="rgba(255, 255, 255, 0.5)" strokeWidth={1.5} />
                  }
                </button>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 'var(--space-xl)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMeState(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ font: 'var(--caption)', color: 'var(--text-secondary)' }}>Zapamiętaj mnie</span>
            </label>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              style={{ marginBottom: 'var(--space-md)' }}
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <p style={{ fontSize: 14, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nie masz konta?{' '}
            <button
              style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              onClick={() => navigate('/register')}
            >
              Zarejestruj się
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
