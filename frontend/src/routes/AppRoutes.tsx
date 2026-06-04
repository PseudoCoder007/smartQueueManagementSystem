import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { AdminQueuePage } from '../pages/AdminQueuePage';
import { AdminServicesPage } from '../pages/AdminServicesPage';
import { AdminStatsPage } from '../pages/AdminStatsPage';
import { LoginPage } from '../pages/LoginPage';
import { MyTokensPage } from '../pages/MyTokensPage';
import { OtpCallbackPage } from '../pages/OtpCallbackPage';
import { ServiceDetailPage } from '../pages/ServiceDetailPage';
import { ServicesPage } from '../pages/ServicesPage';
import { TokenTrackingPage } from '../pages/TokenTrackingPage';
import { UserDashboardPage } from '../pages/UserDashboardPage';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp-callback" element={<OtpCallbackPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<ProtectedRoute role="USER" />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="/tokens/:tokenId" element={<TokenTrackingPage />} />
          <Route path="/my-tokens" element={<MyTokensPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute role="ADMIN" />}>
        <Route element={<AppLayout admin />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/services" element={<AdminServicesPage />} />
          <Route path="/admin/queues/:serviceId" element={<AdminQueuePage />} />
          <Route path="/admin/stats" element={<AdminStatsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
