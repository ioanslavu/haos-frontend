import apiClient from '../client';
import type {
  User,
  UpdateProfileRequest,
  UpdateRoleRequest,
  DepartmentRequest,
  CreateDepartmentRequestRequest,
  ReviewDepartmentRequestRequest,
} from '@/types/user';

const BASE_URL = '/api/v1';

export const usersService = {
  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get(`${BASE_URL}/users/me/`);
    return response.data;
  },

  /**
   * Update current user profile (name, picture, setup status)
   */
  updateCurrentUserProfile: async (
    data: UpdateProfileRequest
  ): Promise<User> => {
    const formData = new FormData();
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.profile_picture) formData.append('profile_picture', data.profile_picture);
    if (data.setup_completed !== undefined)
      formData.append('setup_completed', String(data.setup_completed));

    const response = await apiClient.patch(
      `${BASE_URL}/users/me/profile/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * List all users (admin only)
   */
  listUsers: async (): Promise<User[]> => {
    const response = await apiClient.get(`${BASE_URL}/users/`);
    return response.data.results || response.data;
  },

  /**
   * Get user by ID (admin only)
   */
  getUser: async (userId: number): Promise<User> => {
    const response = await apiClient.get(`${BASE_URL}/users/${userId}/`);
    return response.data;
  },

  /**
   * Update user role and department (admin only)
   */
  updateUserRole: async (
    userId: number,
    data: UpdateRoleRequest
  ): Promise<User> => {
    const response = await apiClient.patch(`${BASE_URL}/users/${userId}/`, data);
    return response.data;
  },

  /**
   * List department requests
   * - Users see their own requests
   * - Admins/Managers see all requests
   */
  listDepartmentRequests: async (
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<DepartmentRequest[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get(`${BASE_URL}/department-requests/`, {
      params,
    });
    return response.data.results || response.data;
  },

  /**
   * Create a department request
   */
  createDepartmentRequest: async (
    data: CreateDepartmentRequestRequest
  ): Promise<DepartmentRequest> => {
    const response = await apiClient.post(
      `${BASE_URL}/department-requests/create/`,
      data
    );
    return response.data;
  },

  /**
   * Get department request by ID
   */
  getDepartmentRequest: async (requestId: number): Promise<DepartmentRequest> => {
    const response = await apiClient.get(
      `${BASE_URL}/department-requests/${requestId}/`
    );
    return response.data;
  },

  /**
   * Review (approve/reject) department request (admin/manager only)
   */
  reviewDepartmentRequest: async (
    requestId: number,
    data: ReviewDepartmentRequestRequest
  ): Promise<DepartmentRequest> => {
    const response = await apiClient.patch(
      `${BASE_URL}/department-requests/${requestId}/`,
      data
    );
    return response.data;
  },

  /**
   * Get count of pending department requests (admin/manager only)
   */
  getPendingRequestsCount: async (): Promise<number> => {
    const response = await apiClient.get(
      `${BASE_URL}/department-requests/pending/count/`
    );
    return response.data.count;
  },
};

export default usersService;
