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
    <div className="page">
      <div className="page-header">
        <h1>Daily Statistics</h1>
      </div>

      {!data?.services.length
        ? <Empty>No daily data yet.</Empty>
        : (
          <div className="table">
            <div className="admin-row" style={{ background: 'var(--surface-raised)' }}>
              <span className="admin-row-name" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Service</span>
              <span className="admin-row-meta" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Tokens Today</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>Status</span>
            </div>
            {data.services.map(service => (
              <div className="admin-row" key={service.serviceId}>
                <span className="admin-row-name">{service.serviceName}</span>
                <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700 }}>{service.tokenCount}</span>
                <span className={`badge ${service.queueOpen ? 'ok' : 'warn'}`}>{service.queueOpen ? 'Open' : 'Closed'}</span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
