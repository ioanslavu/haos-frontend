import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import type { TaskCustomField, CreateCustomFieldDto, UpdateCustomFieldDto } from '../types/customFields';
import { toast } from 'sonner';

const CUSTOM_FIELDS_BASE_URL = '/api/v1';

// Fetch custom fields for a task
export const useTaskCustomFields = (taskId: number | undefined) => {
  return useQuery({
    queryKey: ['tasks', taskId, 'customFields'],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required');
      const response = await apiClient.get<TaskCustomField[]>(
        `${CUSTOM_FIELDS_BASE_URL}/tasks/${taskId}/custom-fields/`
      );
      return response.data;
    },
    enabled: !!taskId,
    staleTime: 30 * 1000, // Data considered fresh for 30 seconds
  });
};

// Create custom field
export const useCreateCustomField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: CreateCustomFieldDto }) => {
      const response = await apiClient.post<TaskCustomField>(
        `${CUSTOM_FIELDS_BASE_URL}/tasks/${taskId}/custom-fields/`,
        data
      );
      return response.data;
    },
    onSuccess: (newField) => {
      // Add the new field to cache directly
      queryClient.setQueryData<TaskCustomField[]>(
        ['tasks', newField.task, 'customFields'],
        (oldData) => {
          if (!oldData) return [newField];
          return [...oldData, newField];
        }
      );
      toast.success('Custom field added');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.field_name?.[0] ||
                          'Failed to add custom field';
      toast.error(errorMessage);
    },
  });
};

// Update custom field
export const useUpdateCustomField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, taskId }: { id: number; data: UpdateCustomFieldDto; taskId?: number }) => {
      const response = await apiClient.patch<TaskCustomField>(
        `${CUSTOM_FIELDS_BASE_URL}/custom-fields/${id}/`,
        data
      );
      return response.data;
    },
    onMutate: async ({ id, data, taskId }) => {
      if (!taskId) return {};

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId, 'customFields'] });

      // Snapshot previous value
      const previousFields = queryClient.getQueryData<TaskCustomField[]>(['tasks', taskId, 'customFields']);

      // Optimistically update the cache
      if (previousFields) {
        queryClient.setQueryData<TaskCustomField[]>(
          ['tasks', taskId, 'customFields'],
          previousFields.map(field =>
            field.id === id
              ? { ...field, ...data, display_value: data.value ?? field.display_value, updated_at: new Date().toISOString() }
              : field
          )
        );
      }

      return { previousFields, taskId };
    },
    onError: (error: any, { taskId }, context) => {
      // Rollback on error
      if (context?.previousFields && context?.taskId) {
        queryClient.setQueryData(['tasks', context.taskId, 'customFields'], context.previousFields);
      }
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.value?.[0] ||
                          'Failed to update custom field';
      toast.error(errorMessage);
    },
    onSuccess: (updatedField) => {
      // Update cache with server response (no full refetch needed)
      queryClient.setQueryData<TaskCustomField[]>(
        ['tasks', updatedField.task, 'customFields'],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map(field =>
            field.id === updatedField.id ? updatedField : field
          );
        }
      );
      // No toast on success - too noisy for frequent updates
    },
  });
};

// Delete custom field
export const useDeleteCustomField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: number; taskId: number }) => {
      await apiClient.delete(`${CUSTOM_FIELDS_BASE_URL}/custom-fields/${id}/`);
      return { id, taskId };
    },
    onMutate: async ({ id, taskId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId, 'customFields'] });
      const previousFields = queryClient.getQueryData<TaskCustomField[]>(['tasks', taskId, 'customFields']);

      // Optimistically remove from cache
      if (previousFields) {
        queryClient.setQueryData<TaskCustomField[]>(
          ['tasks', taskId, 'customFields'],
          previousFields.filter(field => field.id !== id)
        );
      }

      return { previousFields, taskId };
    },
    onError: (error: any, { taskId }, context) => {
      if (context?.previousFields) {
        queryClient.setQueryData(['tasks', taskId, 'customFields'], context.previousFields);
      }
      const errorMessage = error?.response?.data?.error || 'Failed to delete custom field';
      toast.error(errorMessage);
    },
    onSuccess: () => {
      toast.success('Custom field deleted');
    },
  });
};
