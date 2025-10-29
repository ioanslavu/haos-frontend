import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import apiClient from '@/api/client';
import authService from '@/services/auth.service';
import { API_ENDPOINTS, API_BASE_URL, ENABLE_MOCK_AUTH } from '@/lib/constants';
import { AuthError } from '@/lib/errors';
import { PermissionSummary, ModuleName, ModuleAction } from '@/types/permissions';

export interface Group {
  id: number;
  name: string;
}

export type UserRole =
  | 'guest'
  | 'administrator'
  | 'digital_manager'
  | 'digital_employee'
  | 'sales_manager'
  | 'sales_employee';

export interface User {
  id: string | number; // Support both string and number for compatibility
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  department?: string | null; // Updated to support null
  employee_id?: string | null;
  groups?: Group[];
  roles: string[];
  is_active: boolean;
  is_locked: boolean;
  timezone: string;
  language: string;
  notification_preferences?: Record<string, unknown>;
  last_login?: string;
  date_joined: string;
  permissions_summary?: PermissionSummary;
  // New fields for role-based access
  role?: UserRole;
  profile_picture?: string | null;
  setup_completed?: boolean;
  // Legacy fields for backward compatibility - will be removed
  can_manage_finances?: boolean;
  can_manage_contracts?: boolean;
  can_manage_catalog?: boolean;
  name?: string;
  avatar?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  csrfToken: string | null;
  // Role impersonation (admin testing)
  impersonatedRole: UserRole | null;
  impersonatedDepartment: string | null;
  realUser: User | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCsrfToken: (token: string | null) => void;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  // Role impersonation methods
  startImpersonation: (role: UserRole, department?: string | null) => void;
  stopImpersonation: () => void;
  isImpersonating: () => boolean;
  getRealRole: () => UserRole | undefined;
  // New permission methods
  hasModulePermission: (module: ModuleName, action: ModuleAction) => boolean;
  canAccessModule: (module: ModuleName) => boolean;
  canManageFinances: () => boolean;
  canApprovePayments: () => boolean;
  canViewContracts: () => boolean;
  canManageCatalog: () => boolean;
  canManageUsers: () => boolean;
  // Legacy permission methods for backward compatibility
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  // New role-based methods
  isGuest: () => boolean;
  needsSetup: () => boolean;
  canAccessCRM: () => boolean;
  isAdminOrManager: () => boolean;
}

const mockUser: User = {
  id: 'mock-user-1',
  email: 'dev@hahahaproduction.com',
  first_name: 'Development',
  last_name: 'User',
  full_name: 'Development User',
  name: 'Development User',
  department: 'Engineering',
  employee_id: 'EMP001',
  groups: [{ id: 1, name: 'Admins' }],
  roles: ['SUPER_ADMIN'],
  is_active: true,
  is_locked: false,
  timezone: 'America/Los_Angeles',
  language: 'en',
  notification_preferences: {},
  last_login: new Date().toISOString(),
  date_joined: new Date().toISOString(),
  permissions_summary: {
    is_authenticated: true,
    is_superuser: true,
    roles: ['SUPER_ADMIN'],
    module_permissions: {
      finance: {
        view: true,
        manage: true,
        approve: true,
        export: true,
      },
      contracts: {
        view: true,
        manage: true,
        create: true,
        approve: true,
      },
      catalog: {
        view: true,
        manage: true,
        artists: true,
        tracks: true,
      },
      partners: {
        view: true,
        manage: true,
        deals: true,
      },
      system: {
        view: true,
        manage: true,
        admin: true,
        users: true,
        roles: true,
        audit: true,
      },
    },
    total_permissions: 100,
  },
  // Legacy fields for compatibility
  can_manage_finances: true,
  can_manage_contracts: true,
  can_manage_catalog: true,
  permissions: ['*'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        permissions: [],
        csrfToken: null,

        setUser: (user) => {
          set({
            user,
            isAuthenticated: !!user,
            permissions: user?.permissions || [],
            error: null,
          });
        },

        setLoading: (loading) => set({ isLoading: loading }),
        
        setError: (error) => set({ error }),
        
        setCsrfToken: (token) => set({ csrfToken: token }),

        login: () => {
          if (ENABLE_MOCK_AUTH) {
            set({
              user: mockUser,
              isAuthenticated: true,
              permissions: mockUser.permissions || [],
              isLoading: false,
              error: null,
            });
            return;
          }

          // Direct redirect to backend Google OAuth
          window.location.href = API_ENDPOINTS.AUTH.LOGIN;
        },

        logout: async () => {
          try {
            if (!ENABLE_MOCK_AUTH) {
              await authService.logout();
            }
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            set({
              user: null,
              isAuthenticated: false,
              permissions: [],
              error: null,
              csrfToken: null,
            });
            window.location.href = '/login';
          }
        },

        checkAuth: async () => {
          set({ isLoading: true, error: null });

          if (ENABLE_MOCK_AUTH) {
            set({
              user: mockUser,
              isAuthenticated: true,
              permissions: mockUser.permissions || [],
              isLoading: false,
            });
            return;
          }

          try {
            // Check session status with new backend
            const sessionData = await authService.checkSession();

            if (sessionData.authenticated && sessionData.user) {
              set({
                user: sessionData.user,
                isAuthenticated: true,
                permissions: sessionData.user.permissions || [],
                csrfToken: sessionData.csrf_token,
                isLoading: false,
                error: null,
              });
            } else {
              throw new AuthError('Not authenticated');
            }
          } catch (error) {
            set({
              user: null,
              isAuthenticated: false,
              permissions: [],
              isLoading: false,
              error: error instanceof AuthError ? error.message : 'Authentication failed',
            });
            throw error;
          }
        },

        // New permission methods
        hasModulePermission: (module: ModuleName, action: ModuleAction) => {
          const { user } = get();
          if (!user?.permissions_summary) return false;
          if (user.permissions_summary.is_superuser) return true;
          
          const modulePerms = user.permissions_summary.module_permissions[module];
          return modulePerms?.[action] === true;
        },

        canAccessModule: (module: ModuleName) => {
          const { user } = get();
          if (!user?.permissions_summary) return false;
          if (user.permissions_summary.is_superuser) return true;
          
          const modulePerms = user.permissions_summary.module_permissions[module];
          return modulePerms && Object.values(modulePerms).some(v => v === true);
        },

        canManageFinances: () => {
          const { hasModulePermission } = get();
          return hasModulePermission('finance', 'manage');
        },

        canApprovePayments: () => {
          const { hasModulePermission } = get();
          return hasModulePermission('finance', 'approve');
        },

        canViewContracts: () => {
          const { hasModulePermission } = get();
          return hasModulePermission('contracts', 'view');
        },

        canManageCatalog: () => {
          const { hasModulePermission } = get();
          return hasModulePermission('catalog', 'manage');
        },

        canManageUsers: () => {
          const { hasModulePermission } = get();
          return hasModulePermission('system', 'users');
        },

        hasPermission: (permission: string) => {
          const { permissions } = get();
          if (permissions.includes('*')) return true;
          return permissions.includes(permission);
        },
        hasAnyPermission: (requiredPermissions: string[]) => {
          const { permissions } = get();
          if (permissions.includes('*')) return true;
          return requiredPermissions.some(permission => permissions.includes(permission));
        },

        hasAllPermissions: (requiredPermissions: string[]) => {
          const { permissions } = get();
          if (permissions.includes('*')) return true;
          return requiredPermissions.every(permission => permissions.includes(permission));
        },

        isAdmin: () => {
          const { user } = get();
          // Check new permission structure first
          if (user?.permissions_summary?.is_superuser) return true;
          // Check new role-based system
          if (user?.role === 'administrator') return true;
          // Fall back to legacy role check
          if (!user?.roles) return false;
          return user.roles.some(role =>
            role.includes('ADMIN') || role === 'LABEL_EXECUTIVE'
          );
        },

        hasRole: (role: string) => {
          const { user } = get();
          if (!user?.roles) return false;
          return user.roles.includes(role);
        },

        hasAnyRole: (roles: string[]) => {
          const { user } = get();
          if (!user?.roles) return false;
          return roles.some(role => user.roles.includes(role));
        },

        // New role-based methods
        isGuest: () => {
          const { user } = get();
          return user?.role === 'guest';
        },

        needsSetup: () => {
          const { user } = get();
          return user ? !user.setup_completed : false;
        },

        canAccessCRM: () => {
          const { user } = get();
          // Guest users cannot access CRM
          // Admins can access all CRM (no department required)
          // Others need a department
          if (user?.role === 'guest') return false;
          if (user?.role === 'administrator') return true;
          return user?.department !== null && user?.department !== undefined;
        },

        isAdminOrManager: () => {
          const { user } = get();
          if (!user?.role) return false;
          return ['administrator', 'digital_manager', 'sales_manager'].includes(user.role);
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          permissions: state.permissions,
        }),
      }
    )
  )
);