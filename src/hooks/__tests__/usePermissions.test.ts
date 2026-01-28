import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions, usePermissionGate } from '../usePermissions';
import { useAuthStore } from '@/stores/authStore';

// Mock the authStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin user', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: {
          id: '1',
          email: 'admin@test.com',
          full_name: 'Admin User',
          department: 'Engineering',
          roles: ['SUPER_ADMIN'],
          permissions_summary: {
            is_authenticated: true,
            is_superuser: true,
            roles: ['SUPER_ADMIN'],
            module_permissions: {
              finance: { view: true, manage: true, approve: true, export: true },
              contracts: { view: true, manage: true, create: true, approve: true },
              catalog: { view: true, manage: true, artists: true, tracks: true },
              partners: { view: true, manage: true, deals: true },
              system: { view: true, manage: true, admin: true, users: true, roles: true, audit: true },
            },
            total_permissions: 100,
          },
        },
        hasModulePermission: (module: string, action: string) => true,
        canAccessModule: (module: string) => true,
        canManageFinances: () => true,
        canApprovePayments: () => true,
        canViewContracts: () => true,
        canManageCatalog: () => true,
        canManageUsers: () => true,
        hasRole: (role: string) => role === 'SUPER_ADMIN',
        hasAnyRole: (roles: string[]) => roles.includes('SUPER_ADMIN'),
        isAdmin: () => true,
      });
    });

    it('should return admin permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.permissions.isAdmin).toBe(true);
      expect(result.current.permissions.isSuperuser).toBe(true);
      expect(result.current.permissions.canManageFinances).toBe(true);
      expect(result.current.permissions.canManageUsers).toBe(true);
    });

    it('should grant all module permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasModulePermission('finance', 'view')).toBe(true);
      expect(result.current.hasModulePermission('finance', 'manage')).toBe(true);
      expect(result.current.hasModulePermission('contracts', 'approve')).toBe(true);
      expect(result.current.hasModulePermission('catalog', 'manage')).toBe(true);
      expect(result.current.hasModulePermission('system', 'admin')).toBe(true);
    });

    it('should allow access to all modules', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.canAccessModule('finance')).toBe(true);
      expect(result.current.canAccessModule('contracts')).toBe(true);
      expect(result.current.canAccessModule('catalog')).toBe(true);
      expect(result.current.canAccessModule('partners')).toBe(true);
      expect(result.current.canAccessModule('system')).toBe(true);
    });
  });

  describe('Manager user', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: {
          id: '2',
          email: 'manager@test.com',
          full_name: 'Manager User',
          department: 'Digital',
          roles: ['DIGITAL_MANAGER'],
          permissions_summary: {
            is_authenticated: true,
            is_superuser: false,
            roles: ['DIGITAL_MANAGER'],
            module_permissions: {
              finance: { view: true, manage: false, approve: false, export: false },
              contracts: { view: true, manage: true, create: true, approve: false },
              catalog: { view: true, manage: true, artists: true, tracks: true },
              partners: { view: true, manage: false, deals: false },
              system: { view: false, manage: false, admin: false, users: false, roles: false, audit: false },
            },
            total_permissions: 50,
          },
        },
        hasModulePermission: (module: string, action: string) => {
          if (module === 'finance') return action === 'view';
          if (module === 'contracts') return ['view', 'manage', 'create'].includes(action);
          if (module === 'catalog') return true;
          if (module === 'partners') return action === 'view';
          if (module === 'system') return false;
          return false;
        },
        canAccessModule: (module: string) => ['finance', 'contracts', 'catalog', 'partners'].includes(module),
        canManageFinances: () => false,
        canApprovePayments: () => false,
        canViewContracts: () => true,
        canManageCatalog: () => true,
        canManageUsers: () => false,
        hasRole: (role: string) => role === 'DIGITAL_MANAGER',
        hasAnyRole: (roles: string[]) => roles.includes('DIGITAL_MANAGER'),
        isAdmin: () => false,
      });
    });

    it('should return manager permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.permissions.isAdmin).toBe(false);
      expect(result.current.permissions.isSuperuser).toBe(false);
      expect(result.current.permissions.canViewContracts).toBe(true);
      expect(result.current.permissions.canManageCatalog).toBe(true);
    });

    it('should grant limited finance permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasModulePermission('finance', 'view')).toBe(true);
      expect(result.current.hasModulePermission('finance', 'manage')).toBe(false);
      expect(result.current.hasModulePermission('finance', 'approve')).toBe(false);
      expect(result.current.permissions.canManageFinances).toBe(false);
      expect(result.current.permissions.canApprovePayments).toBe(false);
    });

    it('should grant full catalog permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasModulePermission('catalog', 'view')).toBe(true);
      expect(result.current.hasModulePermission('catalog', 'manage')).toBe(true);
      expect(result.current.hasModulePermission('catalog', 'artists')).toBe(true);
      expect(result.current.hasModulePermission('catalog', 'tracks')).toBe(true);
    });

    it('should deny system admin permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasModulePermission('system', 'admin')).toBe(false);
      expect(result.current.hasModulePermission('system', 'users')).toBe(false);
      expect(result.current.permissions.canManageUsers).toBe(false);
    });
  });

  describe('Employee user', () => {
    beforeEach(() => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: {
          id: '3',
          email: 'employee@test.com',
          full_name: 'Employee User',
          department: 'Digital',
          roles: ['DIGITAL_EMPLOYEE'],
          permissions_summary: {
            is_authenticated: true,
            is_superuser: false,
            roles: ['DIGITAL_EMPLOYEE'],
            module_permissions: {
              finance: { view: true, manage: false, approve: false, export: false },
              contracts: { view: true, manage: false, create: false, approve: false },
              catalog: { view: true, manage: false, artists: false, tracks: false },
              partners: { view: true, manage: false, deals: false },
              system: { view: false, manage: false, admin: false, users: false, roles: false, audit: false },
            },
            total_permissions: 20,
          },
        },
        hasModulePermission: (module: string, action: string) => {
          if (module === 'finance') return action === 'view';
          if (module === 'contracts') return action === 'view';
          if (module === 'catalog') return action === 'view';
          if (module === 'partners') return action === 'view';
          return false;
        },
        canAccessModule: (module: string) => ['finance', 'contracts', 'catalog', 'partners'].includes(module),
        canManageFinances: () => false,
        canApprovePayments: () => false,
        canViewContracts: () => true,
        canManageCatalog: () => false,
        canManageUsers: () => false,
        hasRole: (role: string) => role === 'DIGITAL_EMPLOYEE',
        hasAnyRole: (roles: string[]) => roles.includes('DIGITAL_EMPLOYEE'),
        isAdmin: () => false,
      });
    });

    it('should return employee permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.permissions.isAdmin).toBe(false);
      expect(result.current.permissions.canViewContracts).toBe(true);
      expect(result.current.permissions.canManageCatalog).toBe(false);
    });

    it('should grant view-only permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.hasModulePermission('finance', 'view')).toBe(true);
      expect(result.current.hasModulePermission('finance', 'manage')).toBe(false);
      expect(result.current.hasModulePermission('contracts', 'view')).toBe(true);
      expect(result.current.hasModulePermission('contracts', 'manage')).toBe(false);
      expect(result.current.hasModulePermission('catalog', 'view')).toBe(true);
      expect(result.current.hasModulePermission('catalog', 'manage')).toBe(false);
    });

    it('should deny all management permissions', () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.permissions.canManageFinances).toBe(false);
      expect(result.current.permissions.canApprovePayments).toBe(false);
      expect(result.current.permissions.canManageCatalog).toBe(false);
      expect(result.current.permissions.canManageUsers).toBe(false);
    });
  });

  describe('Department matching', () => {
    it('should check department access for user in department', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: {
          id: '4',
          email: 'digital@test.com',
          full_name: 'Digital User',
          department: 'Digital',
          roles: ['DIGITAL_EMPLOYEE'],
          permissions_summary: {
            is_authenticated: true,
            is_superuser: false,
            roles: ['DIGITAL_EMPLOYEE'],
            module_permissions: {},
            total_permissions: 10,
          },
        },
        hasModulePermission: () => false,
        canAccessModule: () => false,
        canManageFinances: () => false,
        canApprovePayments: () => false,
        canViewContracts: () => false,
        canManageCatalog: () => false,
        canManageUsers: () => false,
        hasRole: (role: string) => role === 'DIGITAL_EMPLOYEE',
        hasAnyRole: (roles: string[]) => roles.includes('DIGITAL_EMPLOYEE'),
        isAdmin: () => false,
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.user?.department).toBe('Digital');
      expect(result.current.hasRole('DIGITAL_EMPLOYEE')).toBe(true);
    });
  });
});

describe('usePermissionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should grant access when user has module permission', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', email: 'test@test.com', full_name: 'Test User' },
      hasModulePermission: (module: string, action: string) =>
        module === 'finance' && action === 'view',
      canAccessModule: () => true,
      canManageFinances: () => false,
      canApprovePayments: () => false,
      canViewContracts: () => false,
      canManageCatalog: () => false,
      canManageUsers: () => false,
      hasRole: (role: string) => role === 'EMPLOYEE',
      hasAnyRole: () => false,
      isAdmin: () => false,
    });

    const { result } = renderHook(() => usePermissionGate('finance', 'view'));
    expect(result.current).toBe(true);
  });

  it('should deny access when user lacks module permission', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', email: 'test@test.com', full_name: 'Test User' },
      hasModulePermission: () => false,
      canAccessModule: () => false,
      canManageFinances: () => false,
      canApprovePayments: () => false,
      canViewContracts: () => false,
      canManageCatalog: () => false,
      canManageUsers: () => false,
      hasRole: () => false,
      hasAnyRole: () => false,
      isAdmin: () => false,
    });

    const { result } = renderHook(() => usePermissionGate('finance', 'manage'));
    expect(result.current).toBe(false);
  });

  it('should grant access when user has required role', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', email: 'test@test.com', full_name: 'Test User' },
      hasModulePermission: () => true,
      canAccessModule: () => true,
      canManageFinances: () => false,
      canApprovePayments: () => false,
      canViewContracts: () => false,
      canManageCatalog: () => false,
      canManageUsers: () => false,
      hasRole: (role: string) => role === 'ADMIN',
      hasAnyRole: () => false,
      isAdmin: () => true,
    });

    const { result } = renderHook(() => usePermissionGate(undefined, undefined, 'ADMIN'));
    expect(result.current).toBe(true);
  });

  it('should require both module permission and role when both specified', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', email: 'test@test.com', full_name: 'Test User' },
      hasModulePermission: (module: string, action: string) =>
        module === 'finance' && action === 'manage',
      canAccessModule: () => true,
      canManageFinances: () => true,
      canApprovePayments: () => false,
      canViewContracts: () => false,
      canManageCatalog: () => false,
      canManageUsers: () => false,
      hasRole: (role: string) => role === 'MANAGER',
      hasAnyRole: () => false,
      isAdmin: () => false,
    });

    const { result } = renderHook(() => usePermissionGate('finance', 'manage', 'MANAGER'));
    expect(result.current).toBe(true);
  });

  it('should deny access when user has permission but not role', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: '1', email: 'test@test.com', full_name: 'Test User' },
      hasModulePermission: () => true,
      canAccessModule: () => true,
      canManageFinances: () => false,
      canApprovePayments: () => false,
      canViewContracts: () => false,
      canManageCatalog: () => false,
      canManageUsers: () => false,
      hasRole: () => false,
      hasAnyRole: () => false,
      isAdmin: () => false,
    });

    const { result } = renderHook(() => usePermissionGate('finance', 'view', 'ADMIN'));
    expect(result.current).toBe(false);
  });
});
