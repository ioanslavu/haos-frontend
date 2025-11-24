import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import type {
  TaskCustomField,
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
  ProjectCustomFieldDefinition,
  CreateProjectCustomFieldDefinitionDto,
  UpdateProjectCustomFieldDefinitionDto,
  TaskCustomFieldValue,
  UpdateTaskCustomFieldValueDto,
  BulkUpdateTaskCustomFieldValueDto,
  TaskFieldWithDefinition,
} from '../types/customFields';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/error-handler';

const CUSTOM_FIELDS_BASE_URL = '/api/v1';

// Fetch custom fields for a task
export const useTaskCustomFields = (taskId: number | undefined) => {
  return useQuery({
    queryKey: ['tasks', taskId, 'customFields'],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required');
      const response = await apiClient.get<TaskCustomField[] | { results: TaskCustomField[] }>(
        `${CUSTOM_FIELDS_BASE_URL}/tasks/${taskId}/custom-fields/`
      );
      // Handle both array and paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
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
    onSuccess: (newField, { taskId }) => {
      // Invalidate and refetch to ensure UI is in sync
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'customFields'] });
      toast.success('Custom field added');
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'adding custom field',
        showToast: true,
      });
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
      if (!taskId) {
        return {};
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId, 'customFields'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TaskCustomField[] | { results: TaskCustomField[] }>(['tasks', taskId, 'customFields']);

      // Handle both array and paginated response formats
      const previousFields = Array.isArray(previousData) ? previousData : previousData?.results;

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
    onError: (error, { taskId }, context) => {
      // Rollback on error
      if (context?.previousFields && context?.taskId) {
        queryClient.setQueryData(['tasks', context.taskId, 'customFields'], context.previousFields);
      }
      handleApiError(error, {
        context: 'updating custom field',
        showToast: true,
      });
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
    onError: (error, { taskId }, context) => {
      if (context?.previousFields) {
        queryClient.setQueryData(['tasks', taskId, 'customFields'], context.previousFields);
      }
      handleApiError(error, {
        context: 'deleting custom field',
        showToast: true,
      });
    },
    onSuccess: (_, { taskId }) => {
      // Invalidate to ensure cache is clean
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'customFields'] });
      toast.success('Custom field deleted');
    },
  });
};

// =============================================================================
// Project-Level Custom Field Definition Hooks
// =============================================================================

// Fetch custom field definitions for a project
export const useProjectCustomFieldDefinitions = (projectId: number | undefined) => {
  return useQuery({
    queryKey: ['projects', projectId, 'customFieldDefinitions'],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required');
      const response = await apiClient.get<ProjectCustomFieldDefinition[] | { results: ProjectCustomFieldDefinition[] }>(
        `${CUSTOM_FIELDS_BASE_URL}/projects/${projectId}/custom-field-definitions/`
      );
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
};

// Create custom field definition
export const useCreateProjectCustomFieldDefinition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: CreateProjectCustomFieldDefinitionDto }) => {
      const response = await apiClient.post<ProjectCustomFieldDefinition>(
        `${CUSTOM_FIELDS_BASE_URL}/projects/${projectId}/custom-field-definitions/`,
        data
      );
      return response.data;
    },
    onSuccess: (newDefinition, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'customFieldDefinitions'] });
      // Invalidate all task field values for this project
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Custom field "${newDefinition.field_name}" created`);
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'creating custom field',
        showToast: true,
      });
    },
  });
};

// Update custom field definition
export const useUpdateProjectCustomFieldDefinition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, id, data }: { projectId: number; id: number; data: UpdateProjectCustomFieldDefinitionDto }) => {
      const response = await apiClient.patch<ProjectCustomFieldDefinition>(
        `${CUSTOM_FIELDS_BASE_URL}/projects/${projectId}/custom-field-definitions/${id}/`,
        data
      );
      return response.data;
    },
    onMutate: async ({ projectId, id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'customFieldDefinitions'] });
      const previousDefinitions = queryClient.getQueryData<ProjectCustomFieldDefinition[]>(
        ['projects', projectId, 'customFieldDefinitions']
      );

      if (previousDefinitions) {
        queryClient.setQueryData<ProjectCustomFieldDefinition[]>(
          ['projects', projectId, 'customFieldDefinitions'],
          previousDefinitions.map(def =>
            def.id === id ? { ...def, ...data, updated_at: new Date().toISOString() } : def
          )
        );
      }

      return { previousDefinitions, projectId };
    },
    onError: (error, { projectId }, context) => {
      if (context?.previousDefinitions) {
        queryClient.setQueryData(['projects', projectId, 'customFieldDefinitions'], context.previousDefinitions);
      }
      handleApiError(error, {
        context: 'updating custom field definition',
        showToast: true,
      });
    },
    onSuccess: (updatedDefinition, { projectId }) => {
      queryClient.setQueryData<ProjectCustomFieldDefinition[]>(
        ['projects', projectId, 'customFieldDefinitions'],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map(def =>
            def.id === updatedDefinition.id ? updatedDefinition : def
          );
        }
      );
      // Invalidate task values to reflect any changes
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Delete (archive) custom field definition
export const useDeleteProjectCustomFieldDefinition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, id }: { projectId: number; id: number }) => {
      await apiClient.delete(
        `${CUSTOM_FIELDS_BASE_URL}/projects/${projectId}/custom-field-definitions/${id}/`
      );
      return { projectId, id };
    },
    onMutate: async ({ projectId, id }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'customFieldDefinitions'] });
      const previousDefinitions = queryClient.getQueryData<ProjectCustomFieldDefinition[]>(
        ['projects', projectId, 'customFieldDefinitions']
      );

      // Optimistically remove from cache (backend does soft delete)
      if (previousDefinitions) {
        queryClient.setQueryData<ProjectCustomFieldDefinition[]>(
          ['projects', projectId, 'customFieldDefinitions'],
          previousDefinitions.filter(def => def.id !== id)
        );
      }

      return { previousDefinitions, projectId };
    },
    onError: (error, { projectId }, context) => {
      if (context?.previousDefinitions) {
        queryClient.setQueryData(['projects', projectId, 'customFieldDefinitions'], context.previousDefinitions);
      }
      handleApiError(error, {
        context: 'deleting custom field definition',
        showToast: true,
      });
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'customFieldDefinitions'] });
      // Invalidate task values
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Custom field archived');
    },
  });
};

// Reorder custom field definitions
export const useReorderProjectCustomFieldDefinitions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, orderedIds }: { projectId: number; orderedIds: number[] }) => {
      const response = await apiClient.post<ProjectCustomFieldDefinition[]>(
        `${CUSTOM_FIELDS_BASE_URL}/projects/${projectId}/custom-field-definitions/reorder/`,
        { ordered_ids: orderedIds }
      );
      return response.data;
    },
    onSuccess: (updatedDefinitions, { projectId }) => {
      queryClient.setQueryData(['projects', projectId, 'customFieldDefinitions'], updatedDefinitions);
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'reordering custom fields',
        showToast: true,
      });
    },
  });
};

// =============================================================================
// Task Custom Field Value Hooks
// =============================================================================

// Fetch custom field values for a task
export const useTaskCustomFieldValues = (taskId: number | undefined) => {
  return useQuery({
    queryKey: ['tasks', taskId, 'customFieldValues'],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required');
      const response = await apiClient.get<TaskCustomFieldValue[] | { results: TaskCustomFieldValue[] }>(
        `${CUSTOM_FIELDS_BASE_URL}/tasks/${taskId}/custom-field-values/`
      );
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
};

// Fetch task fields with definitions (combined data)
export const useTaskFieldsWithDefinitions = (taskId: number | undefined) => {
  return useQuery({
    queryKey: ['tasks', taskId, 'fieldsWithDefinitions'],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required');
      const response = await apiClient.get<TaskFieldWithDefinition[]>(
        `${CUSTOM_FIELDS_BASE_URL}/tasks/${taskId}/custom-field-values/with-definitions/`
      );
      return response.data;
    },
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
};

// Update task custom field value
export const useUpdateTaskCustomFieldValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, valueId, data }: { taskId: number; valueId: number; data: UpdateTaskCustomFieldValueDto }) => {
      const response = await apiClient.patch<TaskCustomFieldValue>(
        `${CUSTOM_FIELDS_BASE_URL}/tasks/${taskId}/custom-field-values/${valueId}/`,
        data
      );
      return response.data;
    },
    onMutate: async ({ taskId, valueId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId, 'customFieldValues'] });
      await queryClient.cancelQueries({ queryKey: ['tasks', taskId, 'fieldsWithDefinitions'] });

      const previousValues = queryClient.getQueryData<TaskCustomFieldValue[]>(
        ['tasks', taskId, 'customFieldValues']
      );

      if (previousValues) {
        queryClient.setQueryData<TaskCustomFieldValue[]>(
          ['tasks', taskId, 'customFieldValues'],
          previousValues.map(val =>
            val.id === valueId ? { ...val, value: data.value, updated_at: new Date().toISOString() } : val
          )
        );
      }

      return { previousValues, taskId };
    },
    onError: (error, { taskId }, context) => {
      if (context?.previousValues) {
        queryClient.setQueryData(['tasks', taskId, 'customFieldValues'], context.previousValues);
      }
      handleApiError(error, {
        context: 'updating field value',
        showToast: true,
      });
    },
    onSuccess: (updatedValue, { taskId }) => {
      // Update caches with server response
      queryClient.setQueryData<TaskCustomFieldValue[]>(
        ['tasks', taskId, 'customFieldValues'],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map(val =>
            val.id === updatedValue.id ? updatedValue : val
          );
        }
      );
      // Invalidate fieldsWithDefinitions to refresh combined data
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'fieldsWithDefinitions'] });
    },
  });
};

// Bulk update task custom field values
export const useBulkUpdateTaskCustomFieldValues = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, values }: { taskId: number; values: BulkUpdateTaskCustomFieldValueDto[] }) => {
      const response = await apiClient.post<TaskCustomFieldValue[]>(
        `${CUSTOM_FIELDS_BASE_URL}/tasks/${taskId}/custom-field-values/bulk-update/`,
        { values }
      );
      return response.data;
    },
    onSuccess: (updatedValues, { taskId }) => {
      queryClient.setQueryData(['tasks', taskId, 'customFieldValues'], updatedValues);
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId, 'fieldsWithDefinitions'] });
    },
    onError: (error) => {
      handleApiError(error, {
        context: 'bulk updating field values',
        showToast: true,
      });
    },
  });
};
