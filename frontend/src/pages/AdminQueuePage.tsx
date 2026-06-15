import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight, ChevronRight, RotateCcw, SkipForward } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { adminApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { ErrorState, Loading, SocketBadge } from '../components/State';
import { useAsync } from '../hooks/useAsync';
import { useQueueSocket } from '../hooks/useQueueSocket';
import type { PriorityType, Token } from '../types/models';

type PriorityDialogState = { token: Token; type: PriorityType; reason: string } | null;

const PRIORITY_CLASS: Record<string, string> = {
  EMERGENCY:    'p-emergency',
  VIP:          'p-vip',
  SENIOR_CITIZEN: 'p-senior_citizen',
  ADMIN_MARKED: 'p-admin_marked',
  NORMAL:       'p-normal',
};

const PRIORITY_BADGE: Record<string, string> = {
  EMERGENCY:    'badge p-emergency',
  VIP:          'badge p-vip',
  SENIOR_CITIZEN: 'badge p-senior',
  ADMIN_MARKED: 'badge ok',
  NORMAL:       '',
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return mins < 1 ? 'just now' : `${mins}m ago`;
}

export function AdminQueuePage() {
  const { serviceId = '' } = useParams();
  const { session } = useAuth();
  const [pending, setPending] = useState('');
  const [priorityDialog, setPriorityDialog] = useState<PriorityDialogState>(null);
  const { data, loading, error, reload } = useAsync(() => adminApi.queue(serviceId, session!.token), [serviceId, session?.token]);
  const refresh = useCallback(() => void reload(), [reload]);
  const connected = useQueueSocket([`/topic/queues/${serviceId}`, '/topic/admin/queues'], refresh);

  const SUCCESS: Record<string, string> = {
    open: 'Queue opened', close: 'Queue closed',
    next: 'Next token called', complete: 'Token completed',
    skip: 'Token skipped', recall: 'Token recalled',
    call: 'Token called', priority: 'Priority updated',
  };

  async function run(label: string, action: () => Promise<unknown>) {
    setPending(label);
    try {
      await action();
      await reload();
      if (SUCCESS[label]) toast.success(SUCCESS[label]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setPending('');
    }
  }

  async function confirmPriority() {
    if (!priorityDialog?.reason.trim()) { toast.error('Reason is required'); return; }
    await run('priority', () => adminApi.priority(priorityDialog.token.id, priorityDialog.type, priorityDialog.reason, session!.token));
    setPriorityDialog(null);
  }

  if (loading && !data) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div className="kanban-layout">
      {/* Top bar */}
      <div className="kanban-topbar">
        <h1 style={{ fontSize: 16, fontWeight: 700, marginRight: 4 }}>{data.serviceName}</h1>
        <span className={`badge ${data.open ? 'ok' : 'warn'}`}>{data.open ? 'Open' : 'Closed'}</span>
        <SocketBadge connected={connected} />
        <div className="toolbar kanban-toolbar">
          <button className="btn-secondary btn-sm" disabled={!!pending || data.open} onClick={() => run('open', () => adminApi.open(serviceId, session!.token))}>Open Queue</button>
          <button className="btn-danger btn-sm" disabled={!!pending || !data.open} onClick={() => run('close', () => adminApi.close(serviceId, session!.token))}>Close Queue</button>
          <button disabled={!!pending || !data.waiting.length} onClick={() => run('next', () => adminApi.next(serviceId, session!.token))}>
            <ChevronRight size={15} /> Call Next
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="kanban-cols">
        {/* WAITING */}
        <div className="kanban-col">
          <div className="kanban-col-header">
            <span style={{ color: 'var(--warning)' }}>●</span>
            Waiting
            <span className="kanban-count">{data.waiting.length}</span>
          </div>
          <div className="kanban-list">
            {data.waiting.map(token => (
              <div className={`token-card ${PRIORITY_CLASS[token.priorityType] ?? 'p-normal'}`} key={token.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span className="token-num-lg">#{token.tokenNumber}</span>
                  {PRIORITY_BADGE[token.priorityType] && (
                    <span className={PRIORITY_BADGE[token.priorityType]}>{token.priorityType.replace('_', ' ')}</span>
                  )}
                </div>
                <div className="token-meta">{timeAgo(token.createdAt)} · pos {token.position ?? '—'}</div>
                <div className="token-actions">
                  <button className="btn-secondary btn-sm" onClick={() => run('call', () => adminApi.action(token.id, 'call', session!.token))}>
                    <ArrowRight size={13} /> Call
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => setPriorityDialog({ token, type: token.priorityType, reason: '' })}>
                    Priority
                  </button>
                </div>
              </div>
            ))}
            {!data.waiting.length && <p className="token-meta" style={{ padding: 8 }}>Queue is empty</p>}
          </div>
        </div>

        {/* SERVING */}
        <div className="kanban-col">
          <div className="kanban-col-header">
            <span className="live-dot" />
            Serving
            <span className="kanban-count">{data.serving.length}</span>
          </div>
          <div className="kanban-list">
            {data.serving.map(token => (
              <div className={`token-card serving ${PRIORITY_CLASS[token.priorityType] ?? 'p-normal'}`} key={token.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span className="token-num-lg" style={{ fontSize: 22 }}>#{token.tokenNumber}</span>
                  <span className="badge status-serving">Serving</span>
                </div>
                {token.calledAt && <div className="token-meta">Called {timeAgo(token.calledAt)}</div>}
                <div className="token-actions">
                  <button onClick={() => run('complete', () => adminApi.action(token.id, 'complete', session!.token))}>
                    ✓ Complete
                  </button>
                  <button className="btn-warning btn-sm" onClick={() => run('skip', () => adminApi.action(token.id, 'skip', session!.token))}>
                    <SkipForward size={13} /> Skip
                  </button>
                </div>
              </div>
            ))}
            {!data.serving.length && (
              <div style={{ border: '2px dashed var(--border-strong)', borderRadius: 'var(--radius)', padding: '20px 16px', textAlign: 'center' }}>
                <p className="token-meta" style={{ marginBottom: 10 }}>No one serving yet</p>
                <button disabled={!!pending || !data.waiting.length} onClick={() => run('next', () => adminApi.next(serviceId, session!.token))}>
                  <ChevronRight size={15} /> Call Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SKIPPED */}
        <div className="kanban-col">
          <div className="kanban-col-header">
            <span style={{ color: '#f97316' }}>●</span>
            Skipped
            <span className="kanban-count">{data.skipped.length}</span>
          </div>
          <div className="kanban-list">
            {data.skipped.map(token => (
              <div className={`token-card ${PRIORITY_CLASS[token.priorityType] ?? 'p-normal'}`} key={token.id} style={{ opacity: 0.75 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span className="token-num-lg" style={{ color: 'var(--text-muted)' }}>#{token.tokenNumber}</span>
                  <span className="badge status-skipped">Skipped</span>
                </div>
                <div className="token-meta">{timeAgo(token.createdAt)}</div>
                <div className="token-actions">
                  <button className="btn-secondary btn-sm" onClick={() => run('recall', () => adminApi.action(token.id, 'recall', session!.token))}>
                    <RotateCcw size={13} /> Recall
                  </button>
                </div>
              </div>
            ))}
            {!data.skipped.length && <p className="token-meta" style={{ padding: 8 }}>No skipped tokens</p>}
          </div>
        </div>
      </div>

      {/* Priority modal */}
      {priorityDialog && (
        <div className="modal-overlay" onClick={() => setPriorityDialog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Set Priority — #{priorityDialog.token.tokenNumber}</div>
            <div>
              <label>Priority type</label>
              <select value={priorityDialog.type} onChange={e => setPriorityDialog({ ...priorityDialog, type: e.target.value as PriorityType })}>
                <option value="NORMAL">NORMAL</option>
                <option value="SENIOR_CITIZEN">SENIOR_CITIZEN</option>
                <option value="EMERGENCY">EMERGENCY</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            <div>
              <label>Reason</label>
              <input
                autoFocus
                placeholder="Reason for priority change"
                value={priorityDialog.reason}
                onChange={e => setPriorityDialog({ ...priorityDialog, reason: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary btn-sm" onClick={() => setPriorityDialog(null)}>Cancel</button>
              <button className="btn-sm" disabled={!!pending} onClick={confirmPriority}>Confirm Priority</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
