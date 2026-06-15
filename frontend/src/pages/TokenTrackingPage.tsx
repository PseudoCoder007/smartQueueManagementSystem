import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { userApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { ErrorState, Loading, SocketBadge } from '../components/State';
import { useAsync } from '../hooks/useAsync';
import { useQueueSocket } from '../hooks/useQueueSocket';

const STATUS_COLOR: Record<string, string> = {
  WAITING:   'var(--warning)',
  CALLED:    'var(--warning)',
  SERVING:   'var(--primary)',
  COMPLETED: 'var(--info)',
  SKIPPED:   '#f97316',
  CANCELLED: 'var(--text-subtle)',
};

const STATUS_CLASS: Record<string, string> = {
  WAITING:   'status-waiting',
  CALLED:    'status-calling',
  SERVING:   'status-serving',
  COMPLETED: 'status-completed',
  SKIPPED:   'status-skipped',
  CANCELLED: 'status-cancelled',
};

export function TokenTrackingPage() {
  const { tokenId = '' } = useParams();
  const { session } = useAuth();
  const { data, loading, error, reload } = useAsync(() => userApi.token(tokenId, session!.token), [tokenId, session?.token]);
  const refresh = useCallback(() => void reload(), [reload]);
  const connected = useQueueSocket(
    data ? [`/topic/queues/${data.serviceId}`, `/topic/users/${session!.user.id}/tokens`] : [],
    refresh
  );

  async function cancel() {
    try {
      await userApi.cancel(tokenId, session!.token);
      await reload();
      toast.success('Token cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel token');
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const isServing = data.status === 'SERVING';
  const statusColor = STATUS_COLOR[data.status] ?? 'var(--text-muted)';

  return (
    <div className="page">
      <div className="detail">
        <div className="page-header">
          <h1>Token #{data.tokenNumber}</h1>
          <SocketBadge connected={connected} />
        </div>

        {/* Status spotlight */}
        <div className="panel" style={{ textAlign: 'center', padding: '32px 20px', borderColor: isServing ? 'var(--primary)' : undefined, background: isServing ? 'var(--primary-dim)' : undefined }}>
          <div className="tracking-token-num" style={{ color: statusColor }}>
            #{data.tokenNumber}
          </div>
          <div className="tracking-status-label" style={{ color: statusColor, marginTop: 8 }}>
            {data.status}
          </div>
          {isServing && (
            <div style={{ color: 'var(--primary)', fontSize: 14, marginTop: 6 }}>
              You are currently being served!
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="metrics">
          <div className="metric-card">
            <div className="metric-label">Status</div>
            <span className={`badge ${STATUS_CLASS[data.status] ?? ''}`}>{data.status}</span>
          </div>
          <div className="metric-card">
            <div className="metric-label">Position</div>
            <div className="metric-value">{data.position ?? '—'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Est. Wait</div>
            <div className="metric-value">{data.estimatedWaitMinutes ?? 0}<span style={{ fontSize: 14 }}>m</span></div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Service</div>
            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600, marginTop: 6 }}>{data.serviceName}</div>
          </div>
        </div>

        {data.status === 'WAITING' && (
          <button className="btn-danger" onClick={cancel}>Cancel Token</button>
        )}
      </div>
    </div>
  );
}
