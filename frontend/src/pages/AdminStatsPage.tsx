import { adminApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorState, Loading } from '../components/State';
import { useAsync } from '../hooks/useAsync';

export function AdminStatsPage() {
  const { session } = useAuth();
  const { data, loading, error } = useAsync(() => adminApi.daily(session!.token), [session?.token]);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  return (
    <section>
      <h1>Daily Statistics</h1>
      {!data?.services.length && <Empty>No daily data yet.</Empty>}
      <div className="table">
        {data?.services.map(service => (
          <div className="row" key={service.serviceId}>
            <strong>{service.serviceName}</strong>
            <span>{service.tokenCount} tokens today</span>
            <span className={service.queueOpen ? 'badge ok' : 'badge warn'}>{service.queueOpen ? 'Open' : 'Closed'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
