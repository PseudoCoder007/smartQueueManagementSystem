import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Ticket, X } from 'lucide-react';
import { userApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { ErrorState, Loading } from '../components/State';
import { useAsync } from '../hooks/useAsync';
import type { PriorityType, Token } from '../types/models';

export function ServiceDetailPage() {
  const { serviceId = '' } = useParams();
  const { session } = useAuth();
  const [priorityType, setPriorityType] = useState<PriorityType>('NORMAL');
  const [created, setCreated] = useState<Token | null>(null);
  const [pending, setPending] = useState(false);
  const { data, loading, error } = useAsync(() => userApi.service(serviceId, session!.token), [serviceId, session?.token]);
  const { data: activeToken, loading: activeLoading, reload: reloadActive } = useAsync(
    () => userApi.activeToken(serviceId, session!.token),
    [serviceId, session?.token]
  );

  async function createToken() {
    setPending(true);
    try {
      const token = await userApi.createToken(serviceId, priorityType, session!.token);
      toast.success(`Token #${token.tokenNumber} generated!`);
      setCreated(token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate token');
    } finally {
      setPending(false);
    }
  }

  async function cancelActiveToken() {
    if (!activeToken) return;
    setPending(true);
    try {
      await userApi.cancel(activeToken.id, session!.token);
      await reloadActive();
      toast.success('Token cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel token');
    } finally {
      setPending(false);
    }
  }

  if (created) return <Navigate to={`/tokens/${created.id}`} replace />;
  if (loading || activeLoading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div className="page">
      <div className="detail">
        <div>
          <h1>{data.name}</h1>
          {data.description && <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>{data.description}</p>}
        </div>

        <div className="panel" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${data.queueOpen ? 'ok' : 'warn'}`}>{data.queueOpen ? 'Open' : 'Closed'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            <strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{data.queueLength}</strong> waiting
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            ~<strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{data.estimatedWaitMinutes}</strong> min wait
          </span>
        </div>

        {!data.queueOpen && (
          <div className="hint">This queue is currently closed. Token generation will be available once the queue is opened.</div>
        )}

        {activeToken ? (
          <div className="active-token-panel">
            <div className="info-box">
              You already have token <strong style={{ fontFamily: 'var(--mono)' }}>#{activeToken.tokenNumber}</strong> in this queue
              {activeToken.status === 'SERVING'
                ? ' — you are currently being served!'
                : ` (position ${activeToken.position ?? '—'})`}.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link className="button" to={`/tokens/${activeToken.id}`}><Ticket size={16} /> Track Token</Link>
              {activeToken.status === 'WAITING' && (
                <button className="btn-danger" disabled={pending} onClick={cancelActiveToken}>
                  <X size={16} /> Cancel Token
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div>
              <label>Priority</label>
              <select value={priorityType} onChange={e => setPriorityType(e.target.value as PriorityType)}>
                <option value="NORMAL">Normal</option>
                <option value="SENIOR_CITIZEN">Senior Citizen</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            <button className="btn-lg" disabled={!data.queueOpen || pending} onClick={createToken}>
              <Ticket size={16} /> Generate Token
            </button>
          </>
        )}
      </div>
    </div>
  );
}
