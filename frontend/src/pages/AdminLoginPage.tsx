import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AdminLoginPage() {
  const { session, adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await adminLogin(email, password);
      toast.success('Signed in successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  if (session?.user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return (
    <main className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-logo">
          <div className="auth-logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className="auth-brand-name">SmartQueue</span>
        </div>
        <h1 className="auth-hero-title">Admin Portal</h1>
        <p className="auth-hero-sub">Restricted access — authorised staff only. All sessions are logged and monitored.</p>
      </div>

      <div className="auth-card-wrap">
        <form className="auth-panel" onSubmit={submit}>
          <div>
            <div className="auth-panel-title">Administrator sign in</div>
            <div className="auth-panel-sub" style={{ marginTop: 4 }}>Use your admin credentials to access the dashboard</div>
          </div>

          <div>
            <label>Email address</label>
            <input required type="email" placeholder="admin@institution.org" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div>
            <label>Password</label>
            <div className="password-field">
              <input required type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              <button aria-label={showPassword ? 'Hide password' : 'Show password'} className="icon-button" onClick={() => setShowPassword(v => !v)} type="button">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button className="btn-lg" disabled={loading} type="submit">
            <LogIn size={16} /> {loading ? 'Signing in…' : 'Sign in as admin'}
          </button>

          <div className="auth-footer-link">
            Not an admin? <a href="/login">User login →</a>
          </div>
        </form>
      </div>
    </main>
  );
}
