// Types
export type {
  UserListParams,
  UserListResponse,
  UserPermission,
  UserPermissionsResponse,
  AuditLogEntry,
  AuditLogResponse,
} from './types';

// Query keys
export { userKeys } from './keys';

// List queries
export {
  useCurrentUserProfile,
  useUsersList,
  useDepartmentUsers,
  useUserPermissions,
  useUserAuditLog,
  useDepartmentRequests,
  usePendingRequestsCount,
} from './useUsers';

// Single user queries
export { useUserDetail, useUser } from './useUser';

// User mutations
export {
  useUpdateCurrentUser,
  useUpdateUser,
  useAssignRole,
  useRemoveRoles,
  useAssignPermission,
  useRemovePermission,
  useLockUser,
  useUnlockUser,
  useUpdateProfileWithImage,
  useUpdateUserRole,
} from './useUserMutations';

// Department request mutations
export {
  useCreateDepartmentRequest,
  useReviewDepartmentRequest,
  useCancelDepartmentRequest,
} from './useDepartmentRequests';
