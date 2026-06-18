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
  if (message.toLowerCase().includes('email rate limit')) return 'Email rate limit reached. Please wait before requesting another login email.';
  if (message.toLowerCase().includes('invalid login credentials')) return 'Invalid email or password.';
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
  const [showNoAccountHint, setShowNoAccountHint] = useState(false);

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
    setShowNoAccountHint(false);
    try {
      if (passwordIntent === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/otp-callback` }
        });
        if (error) throw error;
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
      if (error) throw error;
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error('No Supabase session found.');
      await syncAppSession(accessToken);
      toast.success('Signed in successfully.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(friendlySupabaseError(message));
      if (passwordIntent === 'login' && message.toLowerCase().includes('invalid login credentials')) {
        setShowNoAccountHint(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitForgotPassword() {
    if (!email) { toast.error('Enter your email first.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast.success('Check your email for a password reset link.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send reset email.');
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
    if (error) { toast.error(friendlySupabaseError(error.message)); return; }
    toast.success('Check your email for the login link or OTP.');
  }

  async function submitDevLogin() {
    if (!email) { toast.error('Enter an email first.'); return; }
    setLoading(true);
    try {
      await syncAppSession(`dev:${email}`);
      toast.success('Signed in with development auth.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Development login failed');
    } finally {
      setLoading(false);
    }
  }

  if (session?.user.role === 'USER') return <Navigate to="/dashboard" replace />;

  return (
    <main className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-logo">
          <div className="auth-logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            </svg>
          </div>
          <span className="auth-brand-name">SmartQueue</span>
        </div>
        <h1 className="auth-hero-title">Smart Queue Management System</h1>
        <p className="auth-hero-sub">Enterprise queue management for hospitals, clinics, government offices, and service centers.</p>
      </div>

      <div className="auth-card-wrap">
        <form className="auth-panel" onSubmit={mode === 'password' ? submitPassword : submitOtp}>
          <div>
            <div className="auth-panel-title">{passwordIntent === 'signup' ? 'Create your account' : 'Sign in to SmartQueue'}</div>
            <div className="auth-panel-sub" style={{ marginTop: 4 }}>{mode === 'otp' ? 'We\'ll email you a magic link' : 'Use your email and password'}</div>
          </div>

          <div className="segmented-control" role="tablist" aria-label="Login method">
            <button aria-selected={mode === 'password'} className={mode === 'password' ? 'active' : ''} onClick={() => setMode('password')} role="tab" type="button">Password</button>
            <button aria-selected={mode === 'otp'} className={mode === 'otp' ? 'active' : ''} onClick={() => setMode('otp')} role="tab" type="button">OTP / Link</button>
          </div>

          {mode === 'password' && (
            <div className="auth-switch">
              <button className={passwordIntent === 'login' ? 'active' : ''} onClick={() => { setPasswordIntent('login'); setShowNoAccountHint(false); }} type="button">Sign in</button>
              <button className={passwordIntent === 'signup' ? 'active' : ''} onClick={() => { setPasswordIntent('signup'); setShowNoAccountHint(false); }} type="button">Create account</button>
            </div>
          )}

          <div>
            <label>Email address</label>
            <input required type="email" placeholder="you@institution.org" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {devAuthEnabled && (
            <button className="btn-secondary" disabled={loading} onClick={submitDevLogin} type="button">Development login</button>
          )}

          {mode === 'password' && (
            <div>
              <label>Password</label>
              <div className="password-field">
                <input required minLength={6} type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <button aria-label={showPassword ? 'Hide password' : 'Show password'} className="icon-button" onClick={() => setShowPassword(v => !v)} type="button">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordIntent === 'login' && (
                <button className="auth-footer-link" disabled={loading} onClick={submitForgotPassword} style={{ marginTop: 8, padding: 0 }} type="button">
                  Forgot password?
                </button>
              )}
              {showNoAccountHint && (
                <div className="auth-panel-sub" style={{ marginTop: 8 }}>
                  Don&apos;t have an account yet?{' '}
                  <button className="auth-footer-link" onClick={() => { setPasswordIntent('signup'); setShowNoAccountHint(false); }} style={{ padding: 0 }} type="button">
                    Create one
                  </button>
                </div>
              )}
            </div>
          )}

          <button className="btn-lg" disabled={loading} type="submit">
            {mode === 'otp' ? <Send size={16} /> : passwordIntent === 'signup' ? <UserPlus size={16} /> : <LogIn size={16} />}
            {loading ? 'Working…' : mode === 'otp' ? 'Send magic link' : passwordIntent === 'signup' ? 'Create account' : 'Sign in'}
          </button>

          <div className="auth-footer-link">
            Staff admin? <a href="/admin/login">Admin portal →</a>
          </div>
        </form>
      </div>
    </main>
  );
}
