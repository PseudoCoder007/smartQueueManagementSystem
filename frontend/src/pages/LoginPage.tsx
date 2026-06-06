import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, Send, UserPlus } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, jsonBody } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../auth/supabase';
import type { AuthResponse } from '../types/models';

type LoginMode = 'password' | 'otp';
type PasswordIntent = 'login' | 'signup';
const devAuthEnabled = import.meta.env.VITE_DEV_AUTH_ENABLED === 'true';

function friendlySupabaseError(message: string) {
  if (message.toLowerCase().includes('email rate limit')) {
    return 'Email rate limit reached. Please wait before requesting another login email.';
  }
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  return message;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { session, setUserSession } = useAuth();
  const [mode, setMode] = useState<LoginMode>('password');
  const [passwordIntent, setPasswordIntent] = useState<PasswordIntent>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function syncAppSession(accessToken: string) {
    const response = await api<AuthResponse>('/auth/user/supabase-sync', {
      method: 'POST',
      ...jsonBody({ supabaseAccessToken: accessToken })
    });
    setUserSession(response);
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (passwordIntent === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/otp-callback` }
        });
        if (error) {
          throw error;
        }
        if (data.session?.access_token) {
          await syncAppSession(data.session.access_token);
          toast.success('Account created successfully.');
          navigate('/dashboard', { replace: true });
          return;
        }
        toast.success('Account created. Please verify your email before signing in.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        throw new Error('No Supabase session found.');
      }
      await syncAppSession(accessToken);
      toast.success('Signed in successfully.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(friendlySupabaseError(message));
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/otp-callback` }
    });
    setLoading(false);
    if (error) {
      toast.error(friendlySupabaseError(error.message));
      return;
    }
    toast.success('Check your email for the login link or OTP.');
  }

  async function submitDevLogin() {
    if (!email) {
      toast.error('Enter an email first.');
      return;
    }
    setLoading(true);
    try {
      await syncAppSession(`dev:${email}`);
      toast.success('Signed in with development auth.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Development login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (session?.user.role === 'USER') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={mode === 'password' ? submitPassword : submitOtp}>
        <h1>SmartQueue</h1>
        <div className="segmented-control" role="tablist" aria-label="Login method">
          <button
            aria-selected={mode === 'password'}
            className={mode === 'password' ? 'active' : ''}
            onClick={() => setMode('password')}
            role="tab"
            type="button"
          >
            Password
          </button>
          <button
            aria-selected={mode === 'otp'}
            className={mode === 'otp' ? 'active' : ''}
            onClick={() => setMode('otp')}
            role="tab"
            type="button"
          >
            OTP
          </button>
        </div>
        {mode === 'password' && (
          <div className="auth-switch">
            <button
              className={passwordIntent === 'login' ? 'active' : ''}
              onClick={() => setPasswordIntent('login')}
              type="button"
            >
              Sign in
            </button>
            <button
              className={passwordIntent === 'signup' ? 'active' : ''}
              onClick={() => setPasswordIntent('signup')}
              type="button"
            >
              Create account
            </button>
          </div>
        )}
        <label>Email</label>
        <input required type="email" value={email} onChange={event => setEmail(event.target.value)} />
        {devAuthEnabled && (
          <button className="button subtle" disabled={loading} onClick={submitDevLogin} type="button">
            Development login
          </button>
        )}
        {mode === 'password' && (
          <>
            <label>Password</label>
            <div className="password-field">
              <input
                required
                minLength={6}
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
          </>
        )}
        <button disabled={loading} type="submit">
          {mode === 'otp' ? <Send size={18} /> : passwordIntent === 'signup' ? <UserPlus size={18} /> : <LogIn size={18} />}
          {loading ? 'Working' : mode === 'otp' ? 'Send OTP' : passwordIntent === 'signup' ? 'Create account' : 'Sign in'}
        </button>
        <a href="/admin/login">Admin login</a>
      </form>
    </main>
  );
}
