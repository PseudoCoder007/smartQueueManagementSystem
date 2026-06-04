import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function AdminLoginPage() {
  const { session, adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin login failed');
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
        <input required type="password" value={password} onChange={event => setPassword(event.target.value)} />
        <button disabled={loading} type="submit"><LogIn size={18} /> {loading ? 'Signing in' : 'Sign in'}</button>
        {error && <p className="error-text">{error}</p>}
      </form>
    </main>
  );
}
