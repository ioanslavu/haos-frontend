import { useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { permissionService } from '@/services/permission.service';
import { QUERY_KEYS, API_ENDPOINTS } from '@/lib/constants';
import { 
  ModuleName, 
  ModuleAction,
  PermissionCheckRequest,
  BatchPermissionCheck,
  DetailedPermissions 
} from '@/types/permissions';
import apiClient from '@/api/client';

/**
 * Hook for managing and checking user permissions
 */
export const usePermissions = () => {
  const { 
    user, 
    hasModulePermission, 
    canAccessModule,
    canManageFinances,
    canApprovePayments,
    canViewContracts,
    canManageCatalog,
    canManageUsers,
    hasRole,
    hasAnyRole,
    isAdmin 
  } = useAuthStore();

  // Check module permission synchronously from store
  const checkModulePermission = useCallback(
    (module: ModuleName, action: ModuleAction) => {
      return hasModulePermission(module, action);
    },
    [hasModulePermission]
  );

  // Check if user can access any part of a module
  const checkModuleAccess = useCallback(
    (module: ModuleName) => {
      return canAccessModule(module);
    },
    [canAccessModule]
  );

  // Common permission checks
  const permissions = useMemo(() => ({
    // Finance permissions
    canViewFinances: checkModulePermission('finance', 'view'),
    canManageFinances: canManageFinances(),
    canApprovePayments: canApprovePayments(),
    canExportFinances: checkModulePermission('finance', 'export'),
    
    // Contract permissions
    canViewContracts: canViewContracts(),
    canManageContracts: checkModulePermission('contracts', 'manage'),
    canCreateContracts: checkModulePermission('contracts', 'create'),
    canApproveContracts: checkModulePermission('contracts', 'approve'),
    
    // Catalog permissions
    canViewCatalog: checkModulePermission('catalog', 'view'),
    canManageCatalog: canManageCatalog(),
    canManageArtists: checkModulePermission('catalog', 'artists'),
    canManageTracks: checkModulePermission('catalog', 'tracks'),
    
    // Partner permissions
    canViewPartners: checkModulePermission('partners', 'view'),
    canManagePartners: checkModulePermission('partners', 'manage'),
    canManageDeals: checkModulePermission('partners', 'deals'),
    
    // System permissions
    canAdminSystem: checkModulePermission('system', 'admin'),
    canManageUsers: canManageUsers(),
    canManageRoles: checkModulePermission('system', 'roles'),
    canViewAuditLogs: checkModulePermission('system', 'audit'),
    
    // General
    isAdmin: isAdmin(),
    isSuperuser: user?.permissions_summary?.is_superuser || false,
  }), [
    checkModulePermission,
    canManageFinances,
    canApprovePayments,
    canViewContracts,
    canManageCatalog,
    canManageUsers,
    isAdmin,
    user
  ]);

  return {
    user,
    permissions,
    hasModulePermission: checkModulePermission,
    canAccessModule: checkModuleAccess,
    hasRole,
    hasAnyRole,
    isAdmin,
  };
};

/**
 * Hook for fetching detailed permissions from the API
 */
export const useDetailedPermissions = () => {
  return useQuery({
    queryKey: QUERY_KEYS.PERMISSIONS.MY_PERMISSIONS,
    queryFn: async () => {
      const response = await apiClient.get<DetailedPermissions>(
        API_ENDPOINTS.PERMISSIONS.MY_PERMISSIONS
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Helper hook for conditional rendering based on permissions
 */
export const usePermissionGate = (
  module?: ModuleName,
  action?: ModuleAction,
  role?: string
): boolean => {
  const { hasModulePermission, hasRole } = usePermissions();
  
  let hasAccess = true;
  
  if (module && action) {
    hasAccess = hasModulePermission(module, action);
  }
  
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }
  
  return hasAccess;
};