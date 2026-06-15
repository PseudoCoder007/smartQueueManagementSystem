import { LogOut, Moon, Sun } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../hooks/useTheme';

export function AppLayout({ admin = false }: { admin?: boolean }) {
  const { session, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const links = admin
    ? [['/admin', 'Overview'], ['/admin/services', 'Services'], ['/admin/stats', 'Stats']] as const
    : [['/dashboard', 'Dashboard'], ['/services', 'Services'], ['/my-tokens', 'My Tokens']] as const;
  const home = admin ? '/admin' : '/dashboard';

  return (
    <div className="app-shell">
      <header className="topnav">
        <Link className="topnav-brand" to={home}>smartqueue</Link>
        <nav className="topnav-links">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              className={({ isActive }) => `topnav-link${isActive ? ' active' : ''}`}
              to={to}
              end={to === '/admin' || to === '/dashboard'}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="topnav-end">
          <span className="topnav-email">{session?.user.email}</span>
          <button className="icon-button" onClick={toggle} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button className="icon-button" onClick={logout} title="Sign out"><LogOut size={15} /></button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
