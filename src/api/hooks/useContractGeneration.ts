import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../client';

// Query keys
export const contractGenerationKeys = {
  templates: ['contract-gen', 'templates'] as const,
  entity: (id: string) => ['contract-gen', 'entity', id] as const,
  draft: (entityId: string) => ['contract-gen', 'draft', entityId] as const,
};

// Hook to fetch contract templates
export const useContractTemplates = () => {
  return useQuery({
    queryKey: contractGenerationKeys.templates,
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/templates/');
      return response.data;
    },
  });
};

// Hook to fetch saved draft for an entity
export const useContractDraft = (entityId: string) => {
  return useQuery({
    queryKey: contractGenerationKeys.draft(entityId),
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/contracts/load-draft/', {
        params: { entity_id: entityId },
      });
      return response.data;
    },
    enabled: !!entityId,
  });
};

// Mutation to save contract draft
export const useSaveContractDraft = () => {
  return useMutation({
    mutationFn: async (data: { entity_id: string; draft_data: any }) => {
      const response = await apiClient.post('/api/v1/contracts/save-draft/', data);
      return response.data;
    },
  });
};

// Mutation to preview contract generation
export const usePreviewContractGeneration = () => {
  return useMutation({
    mutationFn: async (data: {
      entity_id: string;
      template_id: string;
      contract_terms: any;
    }) => {
      const response = await apiClient.post('/api/v1/contracts/preview-generation/', data);
      return response.data;
    },
  });
};

// Mutation to generate contract with terms
export const useGenerateContractWithTerms = () => {
  return useMutation({
    mutationFn: async (data: {
      entity_id: string;
      template_id: string;
      contract_terms: any;
    }) => {
      const response = await apiClient.post('/api/v1/contracts/generate-with-terms/', data);
      return response.data;
    },
  });
};
