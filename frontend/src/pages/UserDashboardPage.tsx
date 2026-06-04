import { Link } from 'react-router-dom';
import { userApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorState, Loading } from '../components/State';
import { TokenList } from '../components/TokenList';
import { useAsync } from '../hooks/useAsync';

export function UserDashboardPage() {
  const { session } = useAuth();
  const { data, loading, error } = useAsync(() => userApi.myTokens(session!.token), [session?.token]);
  const active = data?.filter(token => ['WAITING', 'CALLED', 'SERVING'].includes(token.status)) ?? [];

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  return (
    <section>
      <div className="page-header">
        <h1>User Dashboard</h1>
        <Link className="button" to="/services">Join a Queue</Link>
      </div>
      <h2>Active Tokens</h2>
      {active.length ? <TokenList tokens={active} /> : <Empty>No active tokens.</Empty>}
    </section>
  );
}
