import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function Loading() {
  return <div className="state"><Loader2 size={16} className="spin" /> Loading…</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="state muted">{children}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="state error">{message}</div>;
}

export function SocketBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`socket-badge${connected ? '' : ' offline'}`}>
      {connected && <span className="live-dot" />}
      {connected ? 'Live' : 'Reconnecting'}
    </span>
  );
}
