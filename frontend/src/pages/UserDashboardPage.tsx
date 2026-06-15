import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { userApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorState, Loading } from '../components/State';
import { TokenList } from '../components/TokenList';
import { useAsync } from '../hooks/useAsync';

export function UserDashboardPage() {
  const { session } = useAuth();
  const { data, loading, error } = useAsync(() => userApi.myTokens(session!.token), [session?.token]);
  const active = data?.filter(t => ['WAITING', 'CALLED', 'SERVING'].includes(t.status)) ?? [];

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link className="button" to="/services"><Plus size={15} /> Join a Queue</Link>
      </div>

      <div className="section-title">Active Tokens</div>
      {active.length
        ? <TokenList tokens={active} />
        : <Empty>No active tokens. <Link to="/services" style={{ color: 'var(--primary)' }}>Browse services →</Link></Empty>}
    </div>
  );
}
