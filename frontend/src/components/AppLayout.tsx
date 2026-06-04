import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function AppLayout({ admin = false }: { admin?: boolean }) {
  const { session, logout } = useAuth();
  const links = admin
    ? [['/admin', 'Dashboard'], ['/admin/services', 'Services'], ['/admin/stats', 'Stats']]
    : [['/dashboard', 'Dashboard'], ['/services', 'Services'], ['/my-tokens', 'My Tokens']];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to={admin ? '/admin' : '/dashboard'}>SmartQueue</Link>
        <nav>{links.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>
        <div className="sidebar-footer">
          <span>{session?.user.email}</span>
          <button className="icon-button" onClick={logout} title="Logout"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
