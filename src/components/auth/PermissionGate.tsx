import React from 'react';
import { usePermissionGate } from '@/hooks/usePermissions';
import { ModuleName, ModuleAction } from '@/types/permissions';

interface PermissionGateProps {
  children: React.ReactNode;
  module?: ModuleName;
  action?: ModuleAction;
  role?: string;
  fallback?: React.ReactNode;
  showError?: boolean;
}

/**
 * Component for conditional rendering based on permissions
 * 
 * @example
 * // Check module permission
 * <PermissionGate module="finance" action="approve">
 *   <ApprovalButton />
 * </PermissionGate>
 * 
 * @example
 * // Check role
 * <PermissionGate role="FINANCE_MANAGER">
 *   <FinanceManagerDashboard />
 * </PermissionGate>
 * 
 * @example
 * // With custom fallback
 * <PermissionGate 
 *   module="system" 
 *   action="admin"
 *   fallback={<div>You need admin access to view this content</div>}
 * >
 *   <AdminPanel />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  module,
  action,
  role,
  fallback = null,
  showError = false,
}) => {
  const hasAccess = usePermissionGate(module, action, role);

  if (!hasAccess) {
    if (showError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            You don't have permission to view this content.
          </p>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Higher-order component for wrapping components with permission checks
 * 
 * @example
 * const ProtectedFinancePanel = withPermissionGate(FinancePanel, {
 *   module: 'finance',
 *   action: 'manage'
 * });
 */
export function withPermissionGate<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    module?: ModuleName;
    action?: ModuleAction;
    role?: string;
    fallback?: React.ReactNode;
  }
) {
  return (props: P) => (
    <PermissionGate {...options}>
      <Component {...props} />
    </PermissionGate>
  );
}