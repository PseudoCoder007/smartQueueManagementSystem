import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { api, jsonBody } from '../api/client';
import { supabase } from '../auth/supabase';
import { useAuth } from '../auth/AuthContext';
import type { AuthResponse } from '../types/models';

export function OtpCallbackPage() {
  const { session, setUserSession } = useAuth();
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function sync() {
      const code = new URLSearchParams(window.location.search).get('code');
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.getSession();
      const accessToken = result.data.session?.access_token;
      const sessionError = result.error;
      if (sessionError || !accessToken) {
        const message = sessionError?.message ?? 'No Supabase session found.';
        setError(message);
        toast.error(message);
        return;
      }
      const response = await api<AuthResponse>('/auth/user/supabase-sync', {
        method: 'POST',
        ...jsonBody({ supabaseAccessToken: accessToken })
      });
      setUserSession(response);
      toast.success('Signed in successfully.');
      setCompleted(true);
    }
    void sync().catch(err => {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      toast.error(message);
    });
  }, [setUserSession]);

  if (session || completed) {
    return <Navigate to="/dashboard" replace />;
  }
  return <main className="auth-page"><div className="auth-panel">{error || 'Completing login...'}</div></main>;
}
