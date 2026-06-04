import { userApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorState, Loading } from '../components/State';
import { TokenList } from '../components/TokenList';
import { useAsync } from '../hooks/useAsync';

export function MyTokensPage() {
  const { session } = useAuth();
  const { data, loading, error } = useAsync(() => userApi.myTokens(session!.token), [session?.token]);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  return <section><h1>My Tokens</h1>{data?.length ? <TokenList tokens={data} /> : <Empty>No tokens yet.</Empty>}</section>;
}
