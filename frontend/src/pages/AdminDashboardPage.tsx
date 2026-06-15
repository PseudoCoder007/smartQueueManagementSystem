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

  const stats = [
    { label: 'Total Tokens', value: data?.totalTokens ?? 0, color: 'var(--text)' },
    { label: 'Active Queues', value: data?.activeQueues ?? 0, color: 'var(--primary)' },
    { label: 'Completed', value: data?.completedTokens ?? 0, color: 'var(--info)' },
    { label: 'Skipped', value: data?.skippedTokens ?? 0, color: 'var(--warning)' },
    { label: 'Cancelled', value: data?.cancelledTokens ?? 0, color: 'var(--danger)' },
    { label: 'Avg Wait', value: `${Math.round(data?.averageWaitMinutes ?? 0)}m`, color: 'var(--text)' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Overview</h1>
        <div className="toolbar">
          <span className="badge live"><span className="live-dot" />Live</span>
          <Link className="button" to="/admin/services">Manage Services</Link>
        </div>
      </div>

      <div className="metrics">
        {stats.map(stat => (
          <div className="metric-card" key={stat.label}>
            <div className="metric-label">{stat.label}</div>
            <div className="metric-value" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
