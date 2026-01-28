import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { QUERY_KEYS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import type { CreateDepartmentRequestRequest, ReviewDepartmentRequestRequest } from '@/types/user';

/**
 * Hook to create a department request
 */
export const useCreateDepartmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateDepartmentRequestRequest) => {
      const response = await apiClient.post('/api/v1/department-requests/create/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-requests'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.USER });
      toast({
        title: 'Request submitted',
        description: 'Your department access request has been submitted for review.',
      });
    },
    onError: (error) => {
      handleApiError(error, { context: 'submitting department request', showToast: true });
    },
  });
};

/**
 * Hook to review (approve/reject) a department request
 */
export const useReviewDepartmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, data }: { requestId: number; data: ReviewDepartmentRequestRequest }) => {
      const response = await apiClient.patch(`/api/v1/department-requests/${requestId}/`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['department-requests'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.LIST });
      toast({
        title: variables.data.status === 'approved' ? 'Request approved' : 'Request rejected',
        description: `Department access request has been ${variables.data.status}.`,
      });
    },
    onError: (error) => {
      handleApiError(error, { context: 'reviewing department request', showToast: true });
    },
  });
};

/**
 * Hook to cancel/withdraw a pending department request
 */
export const useCancelDepartmentRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiClient.delete(`/api/v1/department-requests/${requestId}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-requests'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AUTH.USER });
      toast({
        title: 'Request canceled',
        description: 'Your department request has been canceled. You can now select a different department.',
      });
    },
    onError: (error) => {
      handleApiError(error, { context: 'canceling department request', showToast: true });
    },
  });
};
