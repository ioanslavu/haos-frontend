import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import type { User, UserRole } from '../authStore';

// Mock the auth service
vi.mock('@/services/auth.service', () => ({
  default: {
    checkSession: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock the API client
vi.mock('@/api/client', () => ({
  default: {},
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useAuthStore.getState();
    store.setUser(null);
    store.setLoading(false);
    store.setError(null);
    store.stopImpersonation();
  });

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.permissions).toEqual([]);
    });
  });

  describe('setUser', () => {
    it('should set user and mark as authenticated', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        roles: ['EMPLOYEE'],
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      const store = useAuthStore.getState();
      store.setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should clear authentication when user is null', () => {
      const store = useAuthStore.getState();
      store.setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Permission checks', () => {
    const createUserWithPermissions = (isSuperuser = false, modulePermissions = {}) => ({
      id: '1',
      email: 'test@test.com',
      first_name: 'Test',
      last_name: 'User',
      full_name: 'Test User',
      roles: isSuperuser ? ['SUPER_ADMIN'] : ['EMPLOYEE'],
      is_active: true,
      is_locked: false,
      timezone: 'UTC',
      language: 'en',
      date_joined: '2024-01-01',
      permissions_summary: {
        is_authenticated: true,
        is_superuser: isSuperuser,
        roles: isSuperuser ? ['SUPER_ADMIN'] : ['EMPLOYEE'],
        module_permissions: modulePermissions,
        total_permissions: 10,
      },
    });

    describe('hasModulePermission', () => {
      it('should return true for superuser', () => {
        const user = createUserWithPermissions(true);
        useAuthStore.getState().setUser(user as User);

        const { hasModulePermission } = useAuthStore.getState();
        expect(hasModulePermission('finance', 'view')).toBe(true);
        expect(hasModulePermission('finance', 'manage')).toBe(true);
      });

      it('should check specific module permissions', () => {
        const user = createUserWithPermissions(false, {
          finance: { view: true, manage: false },
        });
        useAuthStore.getState().setUser(user as User);

        const { hasModulePermission } = useAuthStore.getState();
        expect(hasModulePermission('finance', 'view')).toBe(true);
        expect(hasModulePermission('finance', 'manage')).toBe(false);
      });

      it('should return false for missing module', () => {
        const user = createUserWithPermissions(false, {});
        useAuthStore.getState().setUser(user as User);

        const { hasModulePermission } = useAuthStore.getState();
        expect(hasModulePermission('finance', 'view')).toBe(false);
      });

      it('should return false when no user', () => {
        const { hasModulePermission } = useAuthStore.getState();
        expect(hasModulePermission('finance', 'view')).toBe(false);
      });
    });

    describe('canAccessModule', () => {
      it('should return true if user has any permission in module', () => {
        const user = createUserWithPermissions(false, {
          finance: { view: true, manage: false, approve: false },
        });
        useAuthStore.getState().setUser(user as User);

        const { canAccessModule } = useAuthStore.getState();
        expect(canAccessModule('finance')).toBe(true);
      });

      it('should return false if user has no permissions in module', () => {
        const user = createUserWithPermissions(false, {
          finance: { view: false, manage: false, approve: false },
        });
        useAuthStore.getState().setUser(user as User);

        const { canAccessModule } = useAuthStore.getState();
        expect(canAccessModule('finance')).toBe(false);
      });

      it('should return true for superuser', () => {
        const user = createUserWithPermissions(true);
        useAuthStore.getState().setUser(user as User);

        const { canAccessModule } = useAuthStore.getState();
        expect(canAccessModule('finance')).toBe(true);
      });
    });

    describe('Specific permission checks', () => {
      it('should check canManageFinances', () => {
        const user = createUserWithPermissions(false, {
          finance: { manage: true },
        });
        useAuthStore.getState().setUser(user as User);

        const { canManageFinances } = useAuthStore.getState();
        expect(canManageFinances()).toBe(true);
      });

      it('should check canApprovePayments', () => {
        const user = createUserWithPermissions(false, {
          finance: { approve: true },
        });
        useAuthStore.getState().setUser(user as User);

        const { canApprovePayments } = useAuthStore.getState();
        expect(canApprovePayments()).toBe(true);
      });

      it('should check canViewContracts', () => {
        const user = createUserWithPermissions(false, {
          contracts: { view: true },
        });
        useAuthStore.getState().setUser(user as User);

        const { canViewContracts } = useAuthStore.getState();
        expect(canViewContracts()).toBe(true);
      });

      it('should check canManageCatalog', () => {
        const user = createUserWithPermissions(false, {
          catalog: { manage: true },
        });
        useAuthStore.getState().setUser(user as User);

        const { canManageCatalog } = useAuthStore.getState();
        expect(canManageCatalog()).toBe(true);
      });

      it('should check canManageUsers', () => {
        const user = createUserWithPermissions(false, {
          system: { users: true },
        });
        useAuthStore.getState().setUser(user as User);

        const { canManageUsers } = useAuthStore.getState();
        expect(canManageUsers()).toBe(true);
      });
    });
  });

  describe('Role checks', () => {
    it('should check if user has specific role', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        roles: ['EMPLOYEE', 'MANAGER'],
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(user);

      const { hasRole } = useAuthStore.getState();
      expect(hasRole('EMPLOYEE')).toBe(true);
      expect(hasRole('MANAGER')).toBe(true);
      expect(hasRole('ADMIN')).toBe(false);
    });

    it('should check if user has any of the specified roles', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        roles: ['EMPLOYEE'],
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(user);

      const { hasAnyRole } = useAuthStore.getState();
      expect(hasAnyRole(['EMPLOYEE', 'MANAGER'])).toBe(true);
      expect(hasAnyRole(['MANAGER', 'ADMIN'])).toBe(false);
    });

    it('should identify admin users', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        full_name: 'Admin User',
        roles: ['SUPER_ADMIN'],
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
        permissions_summary: {
          is_authenticated: true,
          is_superuser: true,
          roles: ['SUPER_ADMIN'],
          module_permissions: {},
          total_permissions: 100,
        },
      };

      useAuthStore.getState().setUser(adminUser);

      const { isAdmin } = useAuthStore.getState();
      expect(isAdmin()).toBe(true);
    });

    it('should identify non-admin users', () => {
      const regularUser: User = {
        id: '1',
        email: 'user@test.com',
        first_name: 'Regular',
        last_name: 'User',
        full_name: 'Regular User',
        roles: ['EMPLOYEE'],
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(regularUser);

      const { isAdmin } = useAuthStore.getState();
      expect(isAdmin()).toBe(false);
    });
  });

  describe('Role-based methods', () => {
    it('should identify guest users', () => {
      const guestUser: User = {
        id: '1',
        email: 'guest@test.com',
        first_name: 'Guest',
        last_name: 'User',
        full_name: 'Guest User',
        roles: [],
        role: 'guest',
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(guestUser);

      const { isGuest } = useAuthStore.getState();
      expect(isGuest()).toBe(true);
    });

    it('should identify users needing setup', () => {
      const newUser: User = {
        id: '1',
        email: 'new@test.com',
        first_name: 'New',
        last_name: 'User',
        full_name: 'New User',
        roles: ['EMPLOYEE'],
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
        setup_completed: false,
      };

      useAuthStore.getState().setUser(newUser);

      const { needsSetup } = useAuthStore.getState();
      expect(needsSetup()).toBe(true);
    });

    it('should check CRM access for admin', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        full_name: 'Admin User',
        roles: ['SUPER_ADMIN'],
        role: 'administrator',
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(adminUser);

      const { canAccessCRM } = useAuthStore.getState();
      expect(canAccessCRM()).toBe(true);
    });

    it('should check CRM access for employee with department', () => {
      const employeeUser: User = {
        id: '1',
        email: 'employee@test.com',
        first_name: 'Employee',
        last_name: 'User',
        full_name: 'Employee User',
        roles: ['EMPLOYEE'],
        role: 'digital_employee',
        department: 'Digital',
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(employeeUser);

      const { canAccessCRM } = useAuthStore.getState();
      expect(canAccessCRM()).toBe(true);
    });

    it('should deny CRM access for guest', () => {
      const guestUser: User = {
        id: '1',
        email: 'guest@test.com',
        first_name: 'Guest',
        last_name: 'User',
        full_name: 'Guest User',
        roles: [],
        role: 'guest',
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(guestUser);

      const { canAccessCRM } = useAuthStore.getState();
      expect(canAccessCRM()).toBe(false);
    });

    it('should identify admin or manager roles', () => {
      const managerUser: User = {
        id: '1',
        email: 'manager@test.com',
        first_name: 'Manager',
        last_name: 'User',
        full_name: 'Manager User',
        roles: ['MANAGER'],
        role: 'digital_manager',
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(managerUser);

      const { isAdminOrManager } = useAuthStore.getState();
      expect(isAdminOrManager()).toBe(true);
    });
  });

  describe('Role impersonation', () => {
    it('should start impersonation', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        full_name: 'Admin User',
        roles: ['SUPER_ADMIN'],
        role: 'administrator',
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(adminUser);

      const store = useAuthStore.getState();
      store.startImpersonation('digital_employee', 'Digital');

      const state = useAuthStore.getState();
      expect(state.impersonatedRole).toBe('digital_employee');
      expect(state.impersonatedDepartment).toBe('Digital');
      expect(state.realUser).toEqual(adminUser);
      expect(state.isImpersonating()).toBe(true);
    });

    it('should stop impersonation', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        full_name: 'Admin User',
        roles: ['SUPER_ADMIN'],
        role: 'administrator',
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(adminUser);

      const store = useAuthStore.getState();
      store.startImpersonation('digital_employee', 'Digital');
      store.stopImpersonation();

      const state = useAuthStore.getState();
      expect(state.impersonatedRole).toBe(null);
      expect(state.impersonatedDepartment).toBe(null);
      expect(state.realUser).toBe(null);
      expect(state.isImpersonating()).toBe(false);
    });

    it('should get real role when impersonating', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        full_name: 'Admin User',
        roles: ['SUPER_ADMIN'],
        role: 'administrator',
        is_active: true,
        is_locked: false,
        timezone: 'UTC',
        language: 'en',
        date_joined: '2024-01-01',
      };

      useAuthStore.getState().setUser(adminUser);

      const store = useAuthStore.getState();
      store.startImpersonation('digital_employee', 'Digital');

      expect(store.getRealRole()).toBe('administrator');
    });
  });
});
