import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { userApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorState, Loading } from '../components/State';
import { TokenList } from '../components/TokenList';
import { useAsync } from '../hooks/useAsync';
import { useQueueSocket } from '../hooks/useQueueSocket';
import type { Token } from '../types/models';

export function MyTokensPage() {
  const { session } = useAuth();
  const { data, loading, error, reload } = useAsync(() => userApi.myTokens(session!.token), [session?.token]);
  const refresh = useCallback(() => void reload(), [reload]);
  useQueueSocket(session ? [`/topic/users/${session.user.id}/tokens`] : [], refresh);

  async function cancel(token: Token) {
    try {
      await userApi.cancel(token.id, session!.token);
      await reload();
      toast.success('Token cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel token');
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-header"><h1>My Tokens</h1></div>
      {data?.length
        ? <TokenList tokens={data} actions={token => token.status === 'WAITING' && (
            <button className="btn-danger btn-sm" onClick={() => cancel(token)}>Cancel</button>
          )} />
        : <Empty>No tokens yet. Join a queue from Services.</Empty>}
    </div>
  );
}
