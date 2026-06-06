import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
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
      toast.error('Access denied for this user');
    } finally {
      setLoading(false);
    }
  }

  if (session?.user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={submit}>
        <h1>Admin Login</h1>
        <label>Email</label>
        <input required type="email" value={email} onChange={event => setEmail(event.target.value)} />
        <label>Password</label>
        <div className="password-field">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
          <button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="icon-button"
            onClick={() => setShowPassword(value => !value)}
            type="button"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button disabled={loading} type="submit"><LogIn size={18} /> {loading ? 'Signing in' : 'Sign in'}</button>
      </form>
    </main>
  );
}
