import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as campsApi from '../campsApi';
import { CampCreateInput, CampUpdateInput, CampFilters } from '@/types/camps';

// Query keys
export const campsKeys = {
  all: ['camps'] as const,
  lists: () => [...campsKeys.all, 'list'] as const,
  list: (filters: CampFilters) => [...campsKeys.lists(), filters] as const,
  details: () => [...campsKeys.all, 'detail'] as const,
  detail: (id: number) => [...campsKeys.details(), id] as const,
};

export const artistsKeys = {
  all: ['artists'] as const,
  creative: () => [...artistsKeys.all, 'creative'] as const,
  creativeSearch: (search: string) => [...artistsKeys.creative(), { search }] as const,
};

// Camps hooks
export const useCamps = (filters?: CampFilters) => {
  return useQuery({
    queryKey: campsKeys.list(filters || {}),
    queryFn: async () => {
      const response = await campsApi.fetchCamps(filters);
      return response.data;
    },
  });
};

export const useCampDetail = (id: number) => {
  return useQuery({
    queryKey: campsKeys.detail(id),
    queryFn: async () => {
      const response = await campsApi.fetchCampDetail(id);
      return response.data;
    },
    enabled: !!id,
    refetchOnMount: true,
  });
};

export const useCreateCamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CampCreateInput) => campsApi.createCamp(data),
    onSuccess: async () => {
      // Clear cache completely to ensure new camp appears
      await queryClient.resetQueries({ queryKey: campsKeys.lists() });
      toast.success('Camp created successfully');
    },
    onError: () => {
      toast.error('Failed to create camp');
    },
  });
};

export const useUpdateCamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CampUpdateInput }) =>
      campsApi.updateCamp(id, data),
    onSuccess: async (response, variables) => {
      // Force refetch for both list and detail
      await Promise.all([
        queryClient.refetchQueries({ queryKey: campsKeys.lists() }),
        queryClient.refetchQueries({ queryKey: campsKeys.detail(variables.id) })
      ]);
      toast.success('Camp updated successfully');
    },
    onError: () => {
      toast.error('Failed to update camp');
    },
  });
};

export const useDeleteCamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => campsApi.deleteCamp(id),
    onSuccess: async () => {
      // Clear cache completely to ensure deleted camp is removed
      await queryClient.resetQueries({ queryKey: campsKeys.lists() });
      toast.success('Camp deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete camp');
    },
  });
};

export const useDuplicateCamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await campsApi.duplicateCamp(id);
      return response;
    },
    onSuccess: async () => {
      // Clear cache completely and refetch active queries
      await queryClient.resetQueries({ queryKey: campsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campsKeys.details() });
      toast.success('Camp duplicated successfully');
    },
    onError: () => {
      toast.error('Failed to duplicate camp');
    },
  });
};

export const useExportCampPDF = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await campsApi.exportCampPDF(id);
      return response.data;
    },
    onSuccess: (blob, campId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `camp_${campId}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
    },
    onError: () => {
      toast.error('Failed to export PDF');
    },
  });
};

// Creative artists hooks (for artist selection)
export const useCreativeArtists = (search?: string) => {
  return useQuery({
    queryKey: artistsKeys.creativeSearch(search || ''),
    queryFn: async () => {
      const response = await campsApi.fetchCreativeArtists({ search });
      return response.data;
    },
  });
};
