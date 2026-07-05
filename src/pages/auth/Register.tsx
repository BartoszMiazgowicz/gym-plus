import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { saveUser } from '../../data/store';
import { defaultUser } from '../../types/user';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username.replace('@', '') }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data.user) {
        saveUser({
          ...defaultUser,
          id: data.user.id,
          email: email,
          username: username.replace('@', ''),
        });
      }
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="card" style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-2xl)',
            backdropFilter: 'blur(40px)',
            textAlign: 'center',
          }}>
            <CheckCircle size={64} strokeWidth={1.5} style={{ marginBottom: 'var(--space-lg)', opacity: 0.8 }} />
            <h2 style={{ font: 'var(--heading-2)', marginBottom: 'var(--space-sm)' }}>Konto utworzone!</h2>
            <p style={{ font: 'var(--body)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
              Możesz się teraz zalogować do aplikacji Gym-plus.
            </p>
            <button className="btn btn-primary btn-lg btn-full" onClick={() => navigate('/login')}>
              Przejdź do logowania
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div
        className="gradient-blob"
        style={{
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          top: -100, left: -100
        }}
      />

      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="card" style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-2xl)',
          backdropFilter: 'blur(40px)',
        }}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <img src="/logo.png" alt="GYM+" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 12 }} />
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 12 }}>GYM+</h1>
            <h2 style={{ font: 'var(--heading-3)', marginBottom: 8 }}>Zarejestruj się</h2>
            <p style={{ font: 'var(--body)', color: 'var(--text-secondary)' }}>Dołącz do Gym-plus</p>
          </div>

          {error && <div className="badge badge-warning" style={{ width: '100%', padding: 12, whiteSpace: 'normal', height: 'auto', fontSize: 14, marginBottom: 'var(--space-md)' }}>{error}</div>}

          <form onSubmit={handleRegister} style={{ marginTop: 'var(--space-xl)' }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>E-mail</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ borderRadius: 'var(--radius-full)' }} />
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Identyfikator (@)</label>
              <input type="text" className="input" placeholder="np. janek_dzik" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} style={{ borderRadius: 'var(--radius-full)' }} />
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Hasło (min. 6 znaków)</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ borderRadius: 'var(--radius-full)', paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                  {showPassword ? <EyeOff size={18} color="rgba(255, 255, 255, 0.5)" strokeWidth={1.5} /> : <Eye size={18} color="rgba(255, 255, 255, 0.5)" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label style={{ font: 'var(--caption)', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Potwierdź hasło</label>
              <input type="password" className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} style={{ borderRadius: 'var(--radius-full)' }} />
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginBottom: 'var(--space-md)' }}>
              {loading ? 'Tworzenie konta...' : 'Załóż darmowe konto'}
            </button>
          </form>

          <p style={{ fontSize: 14, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Masz już konto?{' '}
            <button style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', padding: 0 }} onClick={() => navigate('/login')}>
              Zaloguj się
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
