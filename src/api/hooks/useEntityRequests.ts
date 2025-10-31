import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import {
  EntityChangeRequest,
  EntityChangeRequestCreateInput,
  EntityRequestType,
  EntityRequestStatus,
  PaginatedResponse,
} from '../types/entityRequests';
import { toast } from 'sonner';

// API endpoints
const ENTITY_REQUESTS_BASE_URL = '/api/v1/crm/entity-change-requests';

// Fetch entity change requests with filters
export const useEntityRequests = (params?: {
  status?: EntityRequestStatus | EntityRequestStatus[];
  request_type?: EntityRequestType;
  entity?: number;
  requested_by?: number;
  page?: number;
  page_size?: number;
}) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(`${key}__in`, v));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  return useQuery({
    queryKey: ['entityRequests', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<EntityChangeRequest>>(
        `${ENTITY_REQUESTS_BASE_URL}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      return response.data;
    },
  });
};

// Get single entity change request
export const useEntityRequest = (requestId: number | string) => {
  return useQuery({
    queryKey: ['entityRequests', requestId],
    queryFn: async () => {
      const response = await apiClient.get<EntityChangeRequest>(
        `${ENTITY_REQUESTS_BASE_URL}/${requestId}/`
      );
      return response.data;
    },
    enabled: !!requestId,
  });
};

// Create entity change request
export const useCreateEntityRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EntityChangeRequestCreateInput) => {
      const response = await apiClient.post<EntityChangeRequest>(
        `${ENTITY_REQUESTS_BASE_URL}/`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityRequests'] });
      toast.success('Request submitted successfully. Admins will be notified.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    },
  });
};

// Approve entity change request (admin only)
export const useApproveEntityRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, admin_notes }: { id: number; admin_notes?: string }) => {
      const response = await apiClient.post<EntityChangeRequest>(
        `${ENTITY_REQUESTS_BASE_URL}/${id}/approve/`,
        { admin_notes: admin_notes || '' }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entityRequests'] });
      queryClient.invalidateQueries({ queryKey: ['entityRequests', data.id] });
      toast.success('Request approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve request');
    },
  });
};

// Reject entity change request (admin only)
export const useRejectEntityRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, admin_notes }: { id: number; admin_notes?: string }) => {
      const response = await apiClient.post<EntityChangeRequest>(
        `${ENTITY_REQUESTS_BASE_URL}/${id}/reject/`,
        { admin_notes: admin_notes || '' }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entityRequests'] });
      queryClient.invalidateQueries({ queryKey: ['entityRequests', data.id] });
      toast.success('Request rejected');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject request');
    },
  });
};

// Shorthand: Get pending requests
export const usePendingEntityRequests = (additionalParams?: any) => {
  return useEntityRequests({ status: 'pending', ...additionalParams });
};

// Shorthand: Get my requests (non-admin users)
export const useMyEntityRequests = (userId: number, additionalParams?: any) => {
  return useEntityRequests({ requested_by: userId, ...additionalParams });
};
