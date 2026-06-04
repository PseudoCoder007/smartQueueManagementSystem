import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../auth/supabase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/otp-callback` }
    });
    setLoading(false);
    setMessage(error ? error.message : 'Check your email for the login link or OTP.');
  }

  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={submit}>
        <h1>SmartQueue</h1>
        <label>Email</label>
        <input required type="email" value={email} onChange={event => setEmail(event.target.value)} />
        <button disabled={loading} type="submit"><Send size={18} /> {loading ? 'Sending' : 'Send OTP'}</button>
        {message && <p className="muted">{message}</p>}
        <a href="/admin/login">Admin login</a>
      </form>
    </main>
  );
}
