import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';

// Query keys
export const checklistTemplateKeys = {
  all: ['checklist-templates'] as const,
  detail: (id: number | string) => ['checklist-templates', 'detail', id] as const,
  items: (templateId: number | string) => ['checklist-templates', 'items', templateId] as const,
  byStage: (stage: string) => ['checklist-templates', 'stage', stage] as const,
};

// Interfaces
export interface ChecklistTemplate {
  id: number;
  name: string;
  description: string;
  entity_type: string;
  stage: string;
  is_active: boolean;
  is_default: boolean;
  items_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistTemplateItem {
  id?: number;
  template?: number;
  category: string;
  item_name: string;
  description: string;
  order: number;
  required: boolean;
  validation_type: string;
  quantity: number;
  has_task_inputs: boolean;
  task_type: string;
  requires_review: boolean;
}

// Templates
export const useChecklistTemplates = (params?: {
  stage?: string;
  is_active?: boolean;
  entity_type?: string;
}) => {
  return useQuery({
    queryKey: params ? [...checklistTemplateKeys.all, params] : checklistTemplateKeys.all,
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/checklist-templates/', { params });
      return response.data as ChecklistTemplate[];
    },
  });
};

export const useChecklistTemplate = (id: number | string) => {
  return useQuery({
    queryKey: checklistTemplateKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/checklist-templates/${id}/`);
      return response.data as ChecklistTemplate;
    },
    enabled: !!id,
  });
};

export const useChecklistTemplatesByStage = (stage: string) => {
  return useQuery({
    queryKey: checklistTemplateKeys.byStage(stage),
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/checklist-templates/', {
        params: { stage },
      });
      return response.data as ChecklistTemplate[];
    },
    enabled: !!stage,
  });
};

export const useCreateChecklistTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<ChecklistTemplate>) => {
      const response = await apiClient.post('/api/v1/checklist-templates/', payload);
      return response.data as ChecklistTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.all });
    },
  });
};

export const useUpdateChecklistTemplate = (id: number | string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<ChecklistTemplate>) => {
      const response = await apiClient.patch(`/api/v1/checklist-templates/${id}/`, payload);
      return response.data as ChecklistTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.all });
    },
  });
};

export const useDeleteChecklistTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      await apiClient.delete(`/api/v1/checklist-templates/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.all });
    },
  });
};

// Template Items
export const useChecklistTemplateItems = (templateId: number | string) => {
  return useQuery({
    queryKey: checklistTemplateKeys.items(templateId),
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/checklist-template-items/', {
        params: { template: templateId },
      });
      return response.data as ChecklistTemplateItem[];
    },
    enabled: !!templateId,
  });
};

export const useSaveChecklistTemplateItem = (templateId: number | string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: ChecklistTemplateItem) => {
      if (item.id) {
        // Update existing item
        const response = await apiClient.patch(`/api/v1/checklist-template-items/${item.id}/`, item);
        return response.data as ChecklistTemplateItem;
      } else {
        // Create new item
        const response = await apiClient.post('/api/v1/checklist-template-items/', item);
        return response.data as ChecklistTemplateItem;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.items(templateId) });
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.detail(templateId) });
    },
  });
};

export const useDeleteChecklistTemplateItem = (templateId: number | string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: number) => {
      await apiClient.delete(`/api/v1/checklist-template-items/${itemId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.items(templateId) });
      queryClient.invalidateQueries({ queryKey: checklistTemplateKeys.detail(templateId) });
    },
  });
};
