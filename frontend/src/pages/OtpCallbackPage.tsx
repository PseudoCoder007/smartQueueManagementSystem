import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, jsonBody } from '../api/client';
import { supabase } from '../auth/supabase';
import { useAuth } from '../auth/AuthContext';
import type { AuthResponse } from '../types/models';

export function OtpCallbackPage() {
  const { session, setUserSession } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    async function sync() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (sessionError || !accessToken) {
        setError(sessionError?.message ?? 'No Supabase session found.');
        return;
      }
      const response = await api<AuthResponse>('/auth/user/supabase-sync', {
        method: 'POST',
        ...jsonBody({ supabaseAccessToken: accessToken })
      });
      setUserSession(response);
    }
    void sync().catch(err => setError(err instanceof Error ? err.message : 'Login failed'));
  }, [setUserSession]);

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  return <main className="auth-page"><div className="auth-panel">{error || 'Completing login...'}</div></main>;
}
