import type { Token } from '../types/models';
import type { ReactNode } from 'react';

export function TokenList({ tokens, actions }: { tokens: Token[]; actions?: (token: Token) => ReactNode }) {
  if (!tokens.length) {
    return <p className="muted">No tokens here.</p>;
  }
  return (
    <div className="table">
      {tokens.map(token => (
        <div className="row" key={token.id}>
          <strong>#{token.tokenNumber}</strong>
          <span>{token.serviceName}</span>
          <span className="badge">{token.status}</span>
          <span>{token.priorityType}</span>
          {actions?.(token)}
        </div>
      ))}
    </div>
  );
}
