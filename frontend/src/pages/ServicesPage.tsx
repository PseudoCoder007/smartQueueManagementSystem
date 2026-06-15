import { Link } from 'react-router-dom';
import { userApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorState, Loading } from '../components/State';
import { useAsync } from '../hooks/useAsync';

export function ServicesPage() {
  const { session } = useAuth();
  const { data, loading, error } = useAsync(() => userApi.services(session!.token), [session?.token]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data?.length) return <Empty>No active services are available right now.</Empty>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Available Services</h1>
        <span className="badge live"><span className="live-dot" /> Live</span>
      </div>
      <div className="grid">
        {data.map(service => (
          <Link className="service-card" key={service.id} to={`/services/${service.id}`}>
            <div className="service-name">{service.name}</div>
            <div className="service-desc">{service.description || 'Queue service'}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span className={`badge ${service.queueOpen ? 'ok' : 'warn'}`}>
                {service.queueOpen ? 'Open' : 'Closed'}
              </span>
              {service.queueOpen && (
                <span className="service-stat">{service.queueLength} waiting</span>
              )}
            </div>
            <div className="service-stat" style={{ color: 'var(--text-muted)' }}>
              {service.queueOpen
                ? `~${service.estimatedWaitMinutes} min wait`
                : 'Queue currently closed'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
