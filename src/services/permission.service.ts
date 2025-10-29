import apiClient from '@/api/client';
import { 
  PermissionCheckRequest, 
  PermissionCheckResponse,
  BatchPermissionCheck,
  BatchPermissionCheckResponse,
  DetailedPermissions,
  AllPermissionsResponse 
} from '@/types/permissions';

class PermissionService {
  /**
   * Check if the current user has specific permissions
   * Fail-closed approach: returns false on error for security
   */
  async checkPermissions(request: PermissionCheckRequest): Promise<PermissionCheckResponse> {
    try {
      const response = await apiClient.post<PermissionCheckResponse>(
        '/api/v1/permissions/check/',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Permission check failed:', error);
      // Fail closed - deny access on error
      return {
        has_all: false,
        has_any: false,
        results: {},
      };
    }
  }

  /**
   * Batch check multiple permission scenarios
   */
  async batchCheck(checks: BatchPermissionCheck[]): Promise<BatchPermissionCheckResponse | null> {
    try {
      const response = await apiClient.post<BatchPermissionCheckResponse>(
        '/api/v1/permissions/batch-check/',
        { checks }
      );
      return response.data;
    } catch (error) {
      console.error('Batch permission check failed:', error);
      return null;
    }
  }

  /**
   * Get detailed permissions for the current user
   */
  async getDetailedPermissions(): Promise<DetailedPermissions | null> {
    try {
      const response = await apiClient.get<DetailedPermissions>(
        '/api/v1/users/me/permissions/'
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch detailed permissions:', error);
      return null;
    }
  }

  /**
   * Get all available permissions in the system
   * Requires identity.manage_roles permission
   */
  async getAllPermissions(): Promise<AllPermissionsResponse | null> {
    try {
      const response = await apiClient.get<AllPermissionsResponse>(
        '/api/v1/permissions/all/'
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all permissions:', error);
      return null;
    }
  }

  /**
   * Check if user has permission for a specific module and action
   * This is a helper method that uses the checkPermissions endpoint
   */
  async canPerformAction(module: string, action: string): Promise<boolean> {
    try {
      const result = await this.checkPermissions({ module, action });
      return result.module_check?.[`${module}.${action}`] || false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false; // Fail closed
    }
  }

  /**
   * Check if user has all specified permissions
   */
  async hasAllPermissions(permissions: string[]): Promise<boolean> {
    if (permissions.length === 0) return true;
    
    try {
      const result = await this.checkPermissions({ permissions });
      return result.has_all;
    } catch (error) {
      console.error('Permission check error:', error);
      return false; // Fail closed
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(permissions: string[]): Promise<boolean> {
    if (permissions.length === 0) return true;
    
    try {
      const result = await this.checkPermissions({ permissions });
      return result.has_any;
    } catch (error) {
      console.error('Permission check error:', error);
      return false; // Fail closed
    }
  }
}

export default new PermissionService();
export const permissionService = new PermissionService();