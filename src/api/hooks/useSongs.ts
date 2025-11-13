import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import { WorkWithSplits, Song } from '@/types/song';
import { fetchSongDetail } from '../songApi';

// Query keys
export const songKeys = {
  all: ['songs'] as const,
  detail: (songId: number) => [...songKeys.all, 'detail', songId] as const,
  work: (workId: number) => [...songKeys.all, 'work', workId] as const,
  songWork: (songId: number) => [...songKeys.all, 'song-work', songId] as const,
};

// Song detail hook
export const useSong = (songId: number, enabled = true) => {
  return useQuery({
    queryKey: songKeys.detail(songId),
    queryFn: () => fetchSongDetail(songId).then(res => res.data),
    enabled: enabled && songId > 0,
  });
};

// Work hooks for songs
export const useWork = (workId: number, enabled = true) => {
  return useQuery({
    queryKey: songKeys.work(workId),
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/works/${workId}/`);
      return response.data as WorkWithSplits;
    },
    enabled: enabled && workId > 0,
  });
};

export const useUpdateWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<WorkWithSplits> }) => {
      const response = await apiClient.patch(`/api/v1/works/${id}/`, payload);
      return response.data as WorkWithSplits;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: songKeys.work(data.id) });
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

export const useWorkDetails = (workId: number, enabled = true) => {
  return useQuery({
    queryKey: [...songKeys.work(workId), 'details'],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/song-hub/${workId}/`);
      return response.data as WorkWithSplits;
    },
    enabled: enabled && workId > 0,
  });
};
