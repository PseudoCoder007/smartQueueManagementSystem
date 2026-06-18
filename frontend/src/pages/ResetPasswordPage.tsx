import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { api, jsonBody } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../auth/supabase';
import type { AuthResponse } from '../types/models';

export function ResetPasswordPage() {
  const { setUserSession } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function waitForRecoverySession() {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        setReady(true);
        return;
      }
      // Recovery links carry the session in the URL hash, parsed asynchronously
      // by the Supabase client, so poll briefly instead of checking once.
      for (let attempt = 0; attempt < 10; attempt++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setReady(true);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      throw new Error('Reset link is invalid or has expired. Please request a new one.');
    }
    void waitForRecoverySession().catch(err => {
      setError(err instanceof Error ? err.message : 'Reset link is invalid or has expired.');
    });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (accessToken) {
        const response = await api<AuthResponse>('/auth/user/supabase-sync', {
          method: 'POST',
          ...jsonBody({ supabaseAccessToken: accessToken })
        });
        setUserSession(response);
      }
      toast.success('Password updated.');
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="auth-page">
      <div className="auth-card-wrap">
        {error ? (
          <div className="auth-panel">{error}</div>
        ) : !ready ? (
          <div className="auth-panel">Verifying reset link…</div>
        ) : (
          <form className="auth-panel" onSubmit={submit}>
            <div className="auth-panel-title">Set a new password</div>
            <div>
              <label>New password</label>
              <input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button className="btn-lg" disabled={loading} type="submit">
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
