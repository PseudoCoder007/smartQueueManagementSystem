import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
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
    } finally {
      setPending(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    active ? await adminApi.deactivate(id, session!.token) : await adminApi.activate(id, session!.token);
    await reload();
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  return (
    <section>
      <h1>Service Management</h1>
      <form className="form-grid" onSubmit={submit}>
        <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <input required min={1} type="number" value={form.averageServiceMinutes}
          onChange={e => setForm({ ...form, averageServiceMinutes: Number(e.target.value) })} />
        <button disabled={pending} type="submit"><Save size={18} /> Create</button>
      </form>
      {!data?.length && <Empty>No services yet.</Empty>}
      <div className="table">
        {data?.map(service => (
          <div className="row" key={service.id}>
            <strong>{service.name}</strong>
            <span>{service.averageServiceMinutes} min</span>
            <span className={service.status === 'ACTIVE' ? 'badge ok' : 'badge warn'}>{service.status}</span>
            <Link className="button subtle" to={`/admin/queues/${service.id}`}>Queue</Link>
            <button onClick={() => toggle(service.id, service.status === 'ACTIVE')}>
              {service.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
