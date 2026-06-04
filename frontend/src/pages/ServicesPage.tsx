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
  if (!data?.length) return <Empty>No active services are available.</Empty>;
  return (
    <section>
      <h1>Services</h1>
      <div className="grid">
        {data.map(service => (
          <Link className="card" key={service.id} to={`/services/${service.id}`}>
            <h2>{service.name}</h2>
            <p>{service.description || 'Queue service'}</p>
            <span className={service.queueOpen ? 'badge ok' : 'badge warn'}>
              {service.queueOpen ? `${service.queueLength} waiting` : 'Closed'}
            </span>
            <strong>{service.estimatedWaitMinutes} min wait</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
