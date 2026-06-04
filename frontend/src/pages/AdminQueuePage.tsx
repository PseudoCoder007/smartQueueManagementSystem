import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { ErrorState, Loading, SocketBadge } from '../components/State';
import { TokenList } from '../components/TokenList';
import { useAsync } from '../hooks/useAsync';
import { useQueueSocket } from '../hooks/useQueueSocket';
import type { PriorityType, Token } from '../types/models';

export function AdminQueuePage() {
  const { serviceId = '' } = useParams();
  const { session } = useAuth();
  const [pending, setPending] = useState('');
  const { data, loading, error, reload } = useAsync(() => adminApi.queue(serviceId, session!.token), [serviceId, session?.token]);
  const refresh = useCallback(() => void reload(), [reload]);
  const connected = useQueueSocket([`/topic/queues/${serviceId}`, '/topic/admin/queues'], refresh);

  async function run(label: string, action: () => Promise<unknown>) {
    setPending(label);
    try {
      await action();
      await reload();
    } finally {
      setPending('');
    }
  }

  async function priority(token: Token) {
    const priorityType = window.prompt('Priority type', token.priorityType) as PriorityType | null;
    const reason = priorityType ? window.prompt('Reason') : null;
    if (priorityType && reason) {
      await run('priority', () => adminApi.priority(token.id, priorityType, reason, session!.token));
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;
  return (
    <section>
      <div className="page-header"><h1>{data.serviceName}</h1><SocketBadge connected={connected} /></div>
      <div className="toolbar">
        <button disabled={!!pending || data.open} onClick={() => run('open', () => adminApi.open(serviceId, session!.token))}>Open</button>
        <button disabled={!!pending || !data.open} onClick={() => run('close', () => adminApi.close(serviceId, session!.token))}>Close</button>
        <button disabled={!!pending || !data.waiting.length} onClick={() => run('next', () => adminApi.next(serviceId, session!.token))}>Call Next</button>
      </div>
      <h2>Serving</h2>
      <TokenList tokens={data.serving} actions={token => (
        <div className="actions">
          <button onClick={() => run('complete', () => adminApi.action(token.id, 'complete', session!.token))}>Complete</button>
          <button onClick={() => run('skip', () => adminApi.action(token.id, 'skip', session!.token))}>Skip</button>
        </div>
      )} />
      <h2>Waiting</h2>
      <TokenList tokens={data.waiting} actions={token => (
        <div className="actions">
          <button onClick={() => run('call', () => adminApi.action(token.id, 'call', session!.token))}>Call</button>
          <button onClick={() => priority(token)}>Priority</button>
        </div>
      )} />
      <h2>Skipped</h2>
      <TokenList tokens={data.skipped} actions={token => (
        <button onClick={() => run('recall', () => adminApi.action(token.id, 'recall', session!.token))}>Recall</button>
      )} />
    </section>
  );
}
