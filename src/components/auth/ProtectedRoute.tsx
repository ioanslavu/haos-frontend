import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import { ModuleName, ModuleAction } from '@/types/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // New permission structure
  module?: ModuleName;
  action?: ModuleAction;
  // Legacy permission support
  requiredPermissions?: string[];
  requireAll?: boolean;
  requireAdmin?: boolean;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  module,
  action,
  requiredPermissions = [],
  requireAll = false,
  requireAdmin = false,
  requiredRoles = [],
}) => {
  const location = useLocation();
  const {
    isAuthenticated,
    isLoading,
    hasAllPermissions,
    hasAnyPermission,
    hasModulePermission,
    isAdmin,
    hasAnyRole,
    checkAuth,
    user,
    isGuest,
    needsSetup
  } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth().catch(() => {
        // Error handled in store
      });
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Onboarding flow - only for guest users, admins can skip
  const isOnboardingRoute = location.pathname === '/onboarding' || location.pathname === '/department-selection';

  if (!isOnboardingRoute && user?.role !== 'administrator') {
    // If user hasn't completed setup, redirect to onboarding
    if (needsSetup()) {
      return <Navigate to="/onboarding" replace />;
    }

    // If user is guest and setup is completed, redirect to department selection
    if (isGuest()) {
      return <Navigate to="/department-selection" replace />;
    }
  }

  // Restrict digital_employee from accessing certain digital pages
  const restrictedDigitalPaths = ['/digital/services', '/digital/financial', '/digital/reporting'];
  const isRestrictedDigitalPath = restrictedDigitalPaths.some(path =>
    location.pathname.startsWith(path)
  );

  if (user?.role === 'digital_employee' && isRestrictedDigitalPath) {
    return <Navigate to="/digital/overview" replace />;
  }

  // Check for admin requirement
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-600">
            This page is restricted to administrators only.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Check for specific roles
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-600">
            You don't have the required role to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Check for module-based permissions (new structure)
  if (module && action) {
    if (!hasModulePermission(module, action)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
            <p className="text-slate-600">
              You don't have the required permissions to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="text-primary hover:underline"
            >
              Go back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check for permissions (legacy support)
  if (requiredPermissions.length > 0) {
    const hasPermission = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
            <p className="text-slate-600">
              You don't have the required permissions to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="text-primary hover:underline"
            >
              Go back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};