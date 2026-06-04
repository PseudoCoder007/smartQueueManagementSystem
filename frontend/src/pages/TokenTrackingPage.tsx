import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { userApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { ErrorState, Loading, SocketBadge } from '../components/State';
import { useAsync } from '../hooks/useAsync';
import { useQueueSocket } from '../hooks/useQueueSocket';

export function TokenTrackingPage() {
  const { tokenId = '' } = useParams();
  const { session } = useAuth();
  const { data, loading, error, reload } = useAsync(() => userApi.token(tokenId, session!.token), [tokenId, session?.token]);
  const refresh = useCallback(() => void reload(), [reload]);
  const connected = useQueueSocket(data ? [`/topic/queues/${data.serviceId}`, `/topic/users/${session!.user.id}/tokens`] : [], refresh);

  async function cancel() {
    await userApi.cancel(tokenId, session!.token);
    await reload();
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;
  return (
    <section className="detail">
      <div className="page-header"><h1>Token #{data.tokenNumber}</h1><SocketBadge connected={connected} /></div>
      <div className="panel metrics">
        <span>Status <strong>{data.status}</strong></span>
        <span>Position <strong>{data.position ?? '-'}</strong></span>
        <span>Wait <strong>{data.estimatedWaitMinutes ?? 0} min</strong></span>
        <span>Service <strong>{data.serviceName}</strong></span>
      </div>
      <button disabled={data.status !== 'WAITING'} onClick={cancel}>Cancel Token</button>
    </section>
  );
}
