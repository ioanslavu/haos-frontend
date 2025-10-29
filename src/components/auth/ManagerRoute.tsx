import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * Route guard for admin and manager routes
 * Redirects regular users to dashboard
 */
export default function ManagerRoute() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdminOrManager = useAuthStore((state) => state.isAdminOrManager);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminOrManager()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
