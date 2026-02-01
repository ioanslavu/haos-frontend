import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import {
  WorkWithSplits,
  Song,
  Recording,
  Publication,
  ReleaseDetails,
  SongChecklistItem,
} from '@/types/song';
import {
  fetchSongDetail,
  fetchSongWork,
  fetchSongRecordings,
  fetchReleasePublications,
  updateRecording,
  addRecordingCredit,
  addRecordingSplit,
  updateRecordingSplit,
  deleteRecordingSplit,
  uploadRecordingAsset,
  addReleaseToSong,
  addFeaturedArtist,
  fetchChecklist,
  fetchSongContracts,
} from '../songApi';

// Query keys
export const songKeys = {
  all: ['songs'] as const,
  detail: (songId: number) => [...songKeys.all, 'detail', songId] as const,
  work: (workId: number) => [...songKeys.all, 'work', workId] as const,
  songWork: (songId: number) => [...songKeys.all, 'song-work', songId] as const,
  recordings: (songId: number) => [...songKeys.all, 'recordings', songId] as const,
  releases: (songId: number) => [...songKeys.all, 'releases', songId] as const,
  checklist: (songId: number) => [...songKeys.all, 'checklist', songId] as const,
  contracts: (songId: number) => [...songKeys.all, 'contracts', songId] as const,
};

// Top-level catalog keys for non-song-scoped queries
export const catalogKeys = {
  releases: ['releases'] as const,
  releasesSearch: (query: string) => ['releases', 'search', query] as const,
  entitiesSearch: (query: string) => ['entities', 'search', query] as const,
  publications: (releaseId: number) => ['publications', releaseId] as const,
  checklistTemplates: (stage?: string) => ['checklist-templates', stage] as const,
};

// Recording detail hook
export const useRecordingDetail = (recordingId: number, enabled = true) => {
  return useQuery({
    queryKey: [...songKeys.recordings(0), 'detail', recordingId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/recordings/${recordingId}/`);
      return response.data as Recording;
    },
    enabled: enabled && recordingId > 0,
  });
};

// Release detail hook
export const useReleaseDetail = (releaseId: number, enabled = true) => {
  return useQuery({
    queryKey: [...catalogKeys.releases, 'detail', releaseId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/releases/${releaseId}/`);
      return response.data as ReleaseDetails;
    },
    enabled: enabled && releaseId > 0,
  });
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

// Song Work hook (fetch work from song context)
export const useFetchSongWork = (songId: number, enabled = true) => {
  return useQuery({
    queryKey: songKeys.songWork(songId),
    queryFn: () => fetchSongWork(songId).then(res => res.data),
    enabled: enabled && songId > 0,
  });
};

// Work mutation hooks
export const useAddISWC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workId, iswc }: { workId: number; iswc: string }) => {
      const response = await apiClient.post(`/api/v1/works/${workId}/add_iswc/`, { iswc });
      return response.data as WorkWithSplits;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: songKeys.work(variables.workId) });
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

// Recording hooks
export const useSongRecordings = (songId: number, enabled = true) => {
  return useQuery({
    queryKey: songKeys.recordings(songId),
    queryFn: () => fetchSongRecordings(songId).then(res => res.data),
    enabled: enabled && songId > 0,
  });
};

export const useUpdateRecording = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Recording> }) =>
      updateRecording(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

export const useAddISRC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordingId, isrc }: { recordingId: number; isrc: string }) => {
      const response = await apiClient.post(`/api/v1/recordings/${recordingId}/add_isrc/`, { isrc });
      return response.data as Recording;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

// Recording credits and splits
export const useAddRecordingCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { recording_id: number; entity_id: number; role: string }) =>
      addRecordingCredit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

export const useAddRecordingSplit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      recording_id: number;
      entity_id: number;
      share: number;
      territory?: string;
    }) => addRecordingSplit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

export const useUpdateRecordingSplit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ splitId, data }: { splitId: number; data: { share?: number; territory?: string } }) =>
      updateRecordingSplit(splitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

export const useDeleteRecordingSplit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (splitId: number) => deleteRecordingSplit(splitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

// Recording assets
export const useUploadRecordingAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordingId, file, metadata }: {
      recordingId: number;
      file: File;
      metadata: {
        kind: string;
        is_master: boolean;
        is_public: boolean;
        notes?: string;
      };
    }) => uploadRecordingAsset(recordingId, file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

// Release hooks
export const useReleasePublications = (releaseId: number, enabled = true) => {
  return useQuery({
    queryKey: catalogKeys.publications(releaseId),
    queryFn: () => fetchReleasePublications(releaseId).then(res => res.data),
    enabled: enabled && releaseId > 0,
  });
};

export const useUpdateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ReleaseDetails> }) => {
      const response = await apiClient.patch(`/api/v1/releases/${id}/`, data);
      return response.data as ReleaseDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.releases });
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

export const useCreateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ReleaseDetails>) => {
      const response = await apiClient.post('/api/v1/releases/', data);
      return response.data as ReleaseDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.releases });
    },
  });
};

export const useLinkRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ songId, releaseId }: { songId: number; releaseId: number }) =>
      addReleaseToSong(songId, releaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

// Publication hooks
export const useUpdatePublication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Publication> }) => {
      const response = await apiClient.patch(`/api/v1/publications/${id}/`, data);
      return response.data as Publication;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.publications(data.id) });
    },
  });
};

export const useCreatePublication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Publication> & { release: number }) => {
      const response = await apiClient.post('/api/v1/publications/', data);
      return response.data as Publication;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.publications(data.id) });
    },
  });
};

// Search hooks
export const useSearchReleases = (query: string) => {
  return useQuery({
    queryKey: catalogKeys.releasesSearch(query),
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/releases/', {
        params: { search: query },
      });
      return response.data.results as ReleaseDetails[];
    },
    enabled: query.length >= 2,
  });
};

export const useSearchEntities = (query: string) => {
  return useQuery({
    queryKey: catalogKeys.entitiesSearch(query),
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/entities/', {
        params: { search: query },
      });
      return response.data.results;
    },
    enabled: query.length > 1,
  });
};

// Featured artists
export const useAddFeaturedArtist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ songId, data }: {
      songId: number;
      data: {
        artist_id: number;
        role?: string;
        order?: number;
      };
    }) => addFeaturedArtist(songId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
};

// Checklist hooks
export const useSongChecklist = (songId: number, enabled = true) => {
  return useQuery({
    queryKey: songKeys.checklist(songId),
    queryFn: () => fetchChecklist(songId).then(res => res.data),
    enabled: enabled && songId > 0,
  });
};

// Contract hooks
export const useSongContracts = (songId: number, enabled = true) => {
  return useQuery({
    queryKey: songKeys.contracts(songId),
    queryFn: () => fetchSongContracts(songId).then(res => res.data),
    enabled: enabled && songId > 0,
  });
};
