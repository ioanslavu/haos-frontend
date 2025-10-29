import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * Route guard for administrator-only routes
 * Redirects non-admin users to dashboard
 */
export default function AdminRoute() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'administrator') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
