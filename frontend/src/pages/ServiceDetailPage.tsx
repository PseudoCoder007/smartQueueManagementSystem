import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Ticket } from 'lucide-react';
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

  async function createToken() {
    setPending(true);
    try {
      setCreated(await userApi.createToken(serviceId, priorityType, session!.token));
    } finally {
      setPending(false);
    }
  }

  if (created) return <Navigate to={`/tokens/${created.id}`} replace />;
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;
  return (
    <section className="detail">
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <div className="panel">
        <span className={data.queueOpen ? 'badge ok' : 'badge warn'}>{data.queueOpen ? 'Open' : 'Closed'}</span>
        <strong>{data.queueLength} waiting</strong>
        <strong>{data.estimatedWaitMinutes} min estimated wait</strong>
      </div>
      <label>Priority</label>
      <select value={priorityType} onChange={event => setPriorityType(event.target.value as PriorityType)}>
        <option>NORMAL</option><option>SENIOR_CITIZEN</option><option>EMERGENCY</option><option>VIP</option>
      </select>
      <button disabled={!data.queueOpen || pending} onClick={createToken}><Ticket size={18} /> Generate Token</button>
    </section>
  );
}
