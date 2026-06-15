import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Token } from '../types/models';

const STATUS_CLASS: Record<string, string> = {
  WAITING:   'status-waiting',
  CALLED:    'status-calling',
  SERVING:   'status-serving',
  COMPLETED: 'status-completed',
  SKIPPED:   'status-skipped',
  CANCELLED: 'status-cancelled',
};

export function TokenList({ tokens, actions }: { tokens: Token[]; actions?: (token: Token) => ReactNode }) {
  if (!tokens.length) return <p className="muted" style={{ padding: '12px 0' }}>No tokens here.</p>;
  return (
    <div className="table">
      {tokens.map(token => (
        <div className="token-row" key={token.id}>
          <Link to={`/tokens/${token.id}`} style={{ color: 'var(--primary)', fontFamily: 'var(--mono)', fontWeight: 700 }}>
            #{token.tokenNumber}
          </Link>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{token.serviceName}</span>
          <span className={`badge ${STATUS_CLASS[token.status] ?? ''}`}>{token.status}</span>
          <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>{token.priorityType}</span>
          {actions?.(token)}
        </div>
      ))}
    </div>
  );
}
