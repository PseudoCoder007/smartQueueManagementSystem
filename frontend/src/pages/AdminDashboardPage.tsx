import { Link } from 'react-router-dom';
import { adminApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { ErrorState, Loading } from '../components/State';
import { useAsync } from '../hooks/useAsync';

export function AdminDashboardPage() {
  const { session } = useAuth();
  const { data, loading, error } = useAsync(() => adminApi.overview(session!.token), [session?.token]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  return (
    <section>
      <div className="page-header"><h1>Admin Dashboard</h1><Link className="button" to="/admin/services">Manage Services</Link></div>
      <div className="metrics">
        <span>Total <strong>{data?.totalTokens}</strong></span>
        <span>Active queues <strong>{data?.activeQueues}</strong></span>
        <span>Completed <strong>{data?.completedTokens}</strong></span>
        <span>Skipped <strong>{data?.skippedTokens}</strong></span>
        <span>Cancelled <strong>{data?.cancelledTokens}</strong></span>
        <span>Avg wait <strong>{Math.round(data?.averageWaitMinutes ?? 0)} min</strong></span>
      </div>
    </section>
  );
}
