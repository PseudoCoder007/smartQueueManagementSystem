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
    async function finishLogin(accessToken: string) {
      const response = await api<AuthResponse>('/auth/user/supabase-sync', {
        method: 'POST',
        ...jsonBody({ supabaseAccessToken: accessToken })
      });
      setUserSession(response);
      toast.success('Signed in successfully.');
      setCompleted(true);
    }

    async function sync() {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);
        const accessToken = result.data.session?.access_token;
        if (result.error || !accessToken) {
          throw new Error(result.error?.message ?? 'Login link is invalid or has expired.');
        }
        await finishLogin(accessToken);
        return;
      }
      // Implicit-flow links carry the session in the URL hash, which the
      // Supabase client parses asynchronously on load — a single getSession()
      // call here can race that parsing, so poll briefly instead.
      for (let attempt = 0; attempt < 10; attempt++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          await finishLogin(data.session.access_token);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      throw new Error('No Supabase session found. The link may have expired — request a new one.');
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
