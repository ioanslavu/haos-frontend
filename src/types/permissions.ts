export interface ModulePermissions {
  view: boolean;
  manage: boolean;
  approve?: boolean;
  create?: boolean;
  export?: boolean;
  artists?: boolean;
  tracks?: boolean;
  deals?: boolean;
  admin?: boolean;
  users?: boolean;
  roles?: boolean;
  audit?: boolean;
}

export interface PermissionSummary {
  is_authenticated: boolean;
  is_superuser: boolean;
  roles: string[];
  module_permissions: {
    finance: ModulePermissions;
    contracts: ModulePermissions;
    catalog: ModulePermissions;
    partners: ModulePermissions;
    system: ModulePermissions;
  };
  total_permissions: number;
}

export interface DetailedPermissions {
  roles: string[];
  permissions: {
    finance: ModulePermissions;
    contracts: ModulePermissions;
    catalog: ModulePermissions;
    partners: ModulePermissions;
    system: ModulePermissions;
  };
  is_superuser: boolean;
  is_authenticated: boolean;
  specific_permissions: string[];
  total_permissions: number;
}

export interface PermissionCheckRequest {
  permissions?: string[];
  module?: string;
  action?: string;
}

export interface PermissionCheckResponse {
  has_all: boolean;
  has_any: boolean;
  results: Record<string, boolean>;
  module_check?: Record<string, boolean>;
}

export interface BatchPermissionCheck {
  id: string;
  permissions?: string[];
  module?: string;
  action?: string;
}

export interface BatchPermissionCheckResult {
  id: string;
  permissions: Record<string, boolean>;
  has_all: boolean;
  has_any: boolean;
  module_permission: boolean;
}

export interface BatchPermissionCheckResponse {
  results: BatchPermissionCheckResult[];
  user: string;
}

export interface SystemPermission {
  id: number;
  app: string;
  model: string;
  codename: string;
  name: string;
  full_codename: string;
}

export interface AllPermissionsResponse {
  organized: Record<string, Record<string, SystemPermission[]>>;
  flat: SystemPermission[];
  total: number;
}

export type ModuleName = 'finance' | 'contracts' | 'catalog' | 'partners' | 'system';
export type ModuleAction = keyof ModulePermissions;