import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { adminApi } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorState, Loading } from '../components/State';
import { useAsync } from '../hooks/useAsync';
import type { ServiceStatus } from '../types/models';

export function AdminServicesPage() {
  const { session } = useAuth();
  const { data, loading, error, reload } = useAsync(() => adminApi.services(session!.token), [session?.token]);
  const [form, setForm] = useState({ name: '', description: '', averageServiceMinutes: 5, status: 'ACTIVE' as ServiceStatus });
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await adminApi.saveService(form, session!.token);
      setForm({ name: '', description: '', averageServiceMinutes: 5, status: 'ACTIVE' });
      await reload();
      toast.success('Service created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setPending(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    try {
      active ? await adminApi.deactivate(id, session!.token) : await adminApi.activate(id, session!.token);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update service');
    }
  }

  async function toggleQueue(id: string, open: boolean) {
    try {
      open ? await adminApi.close(id, session!.token) : await adminApi.open(id, session!.token);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update queue');
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Service Management</h1>
      </div>

      <form className="form-grid" onSubmit={submit} style={{ gridTemplateColumns: '1fr 2fr 100px auto', alignItems: 'end', gap: 10, marginBottom: 24 }}>
        <div>
          <label>Service name</label>
          <input required placeholder="e.g. General OPD" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label>Description</label>
          <input placeholder="Optional description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label>Avg minutes</label>
          <input required min={1} type="number" value={form.averageServiceMinutes} onChange={e => setForm({ ...form, averageServiceMinutes: Number(e.target.value) })} />
        </div>
        <button disabled={pending} type="submit"><Plus size={15} /> Create</button>
      </form>

      {!data?.length
        ? <Empty>No services yet. Create one above.</Empty>
        : (
          <div className="table">
            {data.map(service => (
              <div className="admin-row" key={service.id}>
                <span className="admin-row-name">{service.name}</span>
                <span className="admin-row-meta">{service.averageServiceMinutes} min avg</span>
                <span className={`badge ${service.status === 'ACTIVE' ? 'ok' : 'warn'}`}>{service.status}</span>
                <span className={`badge ${service.queueOpen ? 'ok' : 'warn'}`}>{service.queueOpen ? 'Queue Open' : 'Queue Closed'}</span>
                <div className="admin-row-actions">
                  <Link className="button btn-secondary btn-sm" to={`/admin/queues/${service.id}`}>Manage Queue</Link>
                  <button
                    className="btn-secondary btn-sm"
                    disabled={service.status !== 'ACTIVE'}
                    onClick={() => toggleQueue(service.id, service.queueOpen)}
                  >
                    {service.queueOpen ? 'Close Queue' : 'Open Queue'}
                  </button>
                  <button
                    className={`btn-sm ${service.status === 'ACTIVE' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => toggle(service.id, service.status === 'ACTIVE')}
                  >
                    {service.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
