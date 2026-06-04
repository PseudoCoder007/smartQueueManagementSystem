import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { UserRole } from '../types/models';

export function ProtectedRoute({ role }: { role: UserRole }) {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to={role === 'ADMIN' ? '/admin/login' : '/login'} replace />;
  }
  if (session.user.role !== role) {
    return <Navigate to={session.user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }
  return <Outlet />;
}
