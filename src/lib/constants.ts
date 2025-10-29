const isLocal =
  typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)(:\\d+)?$/.test(window.location.host);
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isLocal ? 'http://localhost:8000' : '');
export const AUTH_LOGIN_URL = import.meta.env.VITE_AUTH_LOGIN_URL || '/auth/google/login/';
export const AUTH_CALLBACK_URL = import.meta.env.VITE_AUTH_CALLBACK_URL || '/auth/callback';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'HaOS';
export const ENABLE_MOCK_AUTH = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';
export const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export const API_ENDPOINTS = {
  AUTH: {
    // New backend endpoints
    LOGIN: `${API_BASE_URL}/accounts/google/login/`,
    SESSION: `${API_BASE_URL}/api/auth/status/`,
    LOGOUT: `${API_BASE_URL}/accounts/logout/`,
    ME: `${API_BASE_URL}/api/users/me/`,
    // Legacy endpoints (deprecated)
    GOOGLE_INIT: `${API_BASE_URL}/api/v1/auth/google/init/`,
    GOOGLE_CALLBACK: `${API_BASE_URL}/api/v1/auth/google/callback/`,
    SESSIONS: `${API_BASE_URL}/api/v1/auth/sessions/`,
    SESSION_DETAIL: (sessionKey: string) => `${API_BASE_URL}/api/v1/auth/sessions/${sessionKey}/`,
    CSRF: `${API_BASE_URL}/api/v1/csrf/`,
  },
  USERS: {
    LIST: `${API_BASE_URL}/api/v1/users/`,
    DETAIL: (id: string) => `${API_BASE_URL}/api/v1/users/${id}/`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/v1/users/${id}/`,
    UPDATE_ME: `${API_BASE_URL}/api/users/me/`,
    PERMISSIONS: (id: string) => `${API_BASE_URL}/api/v1/users/${id}/permissions/`,
    ROLE: (id: string) => `${API_BASE_URL}/api/v1/users/${id}/role/`,
    LOCK: (id: string) => `${API_BASE_URL}/api/v1/users/${id}/lock/`,
    AUDIT: (id: string) => `${API_BASE_URL}/api/v1/users/${id}/audit/`,
    SESSIONS: (id: string) => `${API_BASE_URL}/api/v1/users/${id}/sessions/`,
    SESSION_DETAIL: (id: string, sessionKey: string) => `${API_BASE_URL}/api/v1/users/${id}/sessions/${sessionKey}/`,
  },
  ROLES: {
    LIST: `${API_BASE_URL}/api/v1/roles/`,
    DETAIL: (id: number) => `${API_BASE_URL}/api/v1/roles/${id}/`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/v1/roles/${id}/`,
    DELETE: (id: number) => `${API_BASE_URL}/api/v1/roles/${id}/`,
    USERS: (id: number) => `${API_BASE_URL}/api/v1/roles/${id}/users/`,
    PERMISSIONS: (id: number) => `${API_BASE_URL}/api/v1/roles/${id}/permissions/`,
    BULK_ASSIGN: `${API_BASE_URL}/api/v1/roles/bulk-assign/`,
  },
  PERMISSIONS: {
    LIST: `${API_BASE_URL}/api/v1/permissions/`,
    ALL: `${API_BASE_URL}/api/v1/permissions/all/`,
    CHECK: `${API_BASE_URL}/api/v1/permissions/check/`,
    BATCH_CHECK: `${API_BASE_URL}/api/v1/permissions/batch-check/`,
    MY_PERMISSIONS: `${API_BASE_URL}/api/v1/users/me/permissions/`,
  },
} as const;

export const QUERY_KEYS = {
  AUTH: {
    USER: ['auth', 'user'] as const,
    PERMISSIONS: ['auth', 'permissions'] as const,
    SESSION: ['auth', 'session'] as const,
  },
  USERS: {
    LIST: ['users', 'list'] as const,
    DETAIL: (id: string) => ['users', 'detail', id] as const,
    PERMISSIONS: (id: string) => ['users', 'permissions', id] as const,
    AUDIT: (id: string) => ['users', 'audit', id] as const,
  },
  ROLES: {
    LIST: ['roles', 'list'] as const,
    DETAIL: (id: number) => ['roles', 'detail', id] as const,
    USERS: (id: number) => ['roles', 'users', id] as const,
    PERMISSIONS: (id: number) => ['roles', 'permissions', id] as const,
  },
  PERMISSIONS: {
    LIST: ['permissions', 'list'] as const,
    ALL: ['permissions', 'all'] as const,
    CHECK: ['permissions', 'check'] as const,
    MY_PERMISSIONS: ['permissions', 'my'] as const,
  },
} as const;

export const USER_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'System administration' },
  { value: 'SYSTEM_ADMIN', label: 'System Admin', description: 'Technical administration' },
  { value: 'LABEL_EXECUTIVE', label: 'Label Executive', description: 'Executive oversight' },
  { value: 'FINANCE_MANAGER', label: 'Finance Manager', description: 'Finance department head' },
  { value: 'ROYALTY_ACCOUNTANT', label: 'Royalty Accountant', description: 'Royalty processing' },
  { value: 'REVENUE_ANALYST', label: 'Revenue Analyst', description: 'Revenue analysis' },
  { value: 'LEGAL_MANAGER', label: 'Legal Manager', description: 'Legal department head' },
  { value: 'CONTRACT_SPECIALIST', label: 'Contract Specialist', description: 'Contract management' },
  { value: 'A&R_MANAGER', label: 'A&R Manager', description: 'Artist & Repertoire head' },
  { value: 'A&R_COORDINATOR', label: 'A&R Coordinator', description: 'A&R support' },
  { value: 'EXTERNAL_USER', label: 'External User', description: 'Basic external access' },
  { value: 'ARTIST', label: 'Artist', description: 'Artist account' },
  { value: 'MANAGER', label: 'Manager', description: 'Artist manager' },
  { value: 'PUBLISHER', label: 'Publisher', description: 'Publishing partner' },
] as const;

export const STORAGE_KEYS = {
  THEME: 'haos-theme',
  SIDEBAR_COLLAPSED: 'haos-sidebar-collapsed',
  LANGUAGE: 'haos-language',
} as const;
