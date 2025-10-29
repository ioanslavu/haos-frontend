import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import catalogService, {
  Work,
  Recording,
  Release,
  Track,
  Asset,
  WorkSearchParams,
  RecordingSearchParams,
  ReleaseSearchParams,
  WorkDetails,
  RecordingDetails,
} from '@/api/services/catalog.service';

// Query keys factory
export const catalogKeys = {
  all: ['catalog'] as const,
  works: () => [...catalogKeys.all, 'works'] as const,
  workList: (params?: WorkSearchParams) => [...catalogKeys.works(), params] as const,
  workDetail: (id: number) => [...catalogKeys.works(), 'detail', id] as const,
  workDetails: (id: number) => [...catalogKeys.works(), 'details', id] as const,
  workCredits: (id: number) => [...catalogKeys.works(), 'credits', id] as const,
  workSplits: (id: number) => [...catalogKeys.works(), 'splits', id] as const,
  recordings: () => [...catalogKeys.all, 'recordings'] as const,
  recordingList: (params?: RecordingSearchParams) => [...catalogKeys.recordings(), params] as const,
  recordingDetail: (id: number) => [...catalogKeys.recordings(), 'detail', id] as const,
  recordingDetails: (id: number) => [...catalogKeys.recordings(), 'details', id] as const,
  recordingCredits: (id: number) => [...catalogKeys.recordings(), 'credits', id] as const,
  recordingSplits: (id: number) => [...catalogKeys.recordings(), 'splits', id] as const,
  releases: () => [...catalogKeys.all, 'releases'] as const,
  releaseList: (params?: ReleaseSearchParams) => [...catalogKeys.releases(), params] as const,
  releaseDetail: (id: number) => [...catalogKeys.releases(), 'detail', id] as const,
  upcomingReleases: () => [...catalogKeys.releases(), 'upcoming'] as const,
  recentReleases: (days?: number) => [...catalogKeys.releases(), 'recent', days] as const,
  assets: () => [...catalogKeys.all, 'assets'] as const,
  masterAssets: () => [...catalogKeys.assets(), 'masters'] as const,
  publicAssets: () => [...catalogKeys.assets(), 'public'] as const,
};

// Works hooks
export const useWorks = (params?: WorkSearchParams) => {
  return useQuery({
    queryKey: catalogKeys.workList(params),
    queryFn: () => catalogService.getWorks(params),
  });
};

export const useWork = (id: number, enabled = true) => {
  return useQuery({
    queryKey: catalogKeys.workDetail(id),
    queryFn: () => catalogService.getWork(id),
    enabled: enabled && id > 0,
  });
};

export const useWorkDetails = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: catalogKeys.workDetails(id),
    queryFn: () => catalogService.getWorkDetails(id),
    enabled: (options?.enabled !== false) && id > 0,
  });
};

export const useWorkCredits = (id: number, enabled = true) => {
  return useQuery({
    queryKey: catalogKeys.workCredits(id),
    queryFn: () => catalogService.getWorkCredits(id),
    enabled: enabled && id > 0,
  });
};

export const useWorkSplits = (id: number, enabled = true) => {
  return useQuery({
    queryKey: catalogKeys.workSplits(id),
    queryFn: () => catalogService.getWorkSplits(id),
    enabled: enabled && id > 0,
  });
};

export const useCreateWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Work>) => catalogService.createWork(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.works() });
    },
  });
};

export const useUpdateWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Work> }) =>
      catalogService.updateWork(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.works() });
      queryClient.invalidateQueries({ queryKey: catalogKeys.workDetail(data.id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.workDetails(data.id) });
    },
  });
};

export const useDeleteWork = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => catalogService.deleteWork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.works() });
    },
  });
};

export const useAddISWC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workId, iswc }: { workId: number; iswc: string }) =>
      catalogService.addISWC(workId, iswc),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.workDetail(variables.workId) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.workDetails(variables.workId) });
    },
  });
};

// Recordings hooks
export const useRecordings = (params?: RecordingSearchParams) => {
  return useQuery({
    queryKey: catalogKeys.recordingList(params),
    queryFn: () => catalogService.getRecordings(params),
  });
};

export const useRecording = (id: number, enabled = true) => {
  return useQuery({
    queryKey: catalogKeys.recordingDetail(id),
    queryFn: () => catalogService.getRecording(id),
    enabled: enabled && id > 0,
  });
};

export const useRecordingDetails = (id: number, enabled = true) => {
  return useQuery({
    queryKey: catalogKeys.recordingDetails(id),
    queryFn: () => catalogService.getRecordingDetails(id),
    enabled: enabled && id > 0,
  });
};

export const useRecordingCredits = (id: number, enabled = true) => {
  return useQuery({
    queryKey: catalogKeys.recordingCredits(id),
    queryFn: () => catalogService.getRecordingCredits(id),
    enabled: enabled && id > 0,
  });
};

export const useRecordingSplits = (id: number, enabled = true) => {
  return useQuery({
    queryKey: catalogKeys.recordingSplits(id),
    queryFn: () => catalogService.getRecordingSplits(id),
    enabled: enabled && id > 0,
  });
};

export const useCreateRecording = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Recording>) => catalogService.createRecording(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.recordings() });
    },
  });
};

export const useUpdateRecording = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Recording> }) =>
      catalogService.updateRecording(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.recordings() });
      queryClient.invalidateQueries({ queryKey: catalogKeys.recordingDetail(data.id) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.recordingDetails(data.id) });
    },
  });
};

export const useDeleteRecording = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => catalogService.deleteRecording(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.recordings() });
    },
  });
};

export const useAddISRC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordingId, isrc }: { recordingId: number; isrc: string }) =>
      catalogService.addISRC(recordingId, isrc),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.recordingDetail(variables.recordingId) });
      queryClient.invalidateQueries({ queryKey: catalogKeys.recordingDetails(variables.recordingId) });
    },
  });
};

// Releases hooks
export const useReleases = (params?: ReleaseSearchParams) => {
  return useQuery({
    queryKey: catalogKeys.releaseList(params),
    queryFn: () => catalogService.getReleases(params),
  });
};

export const useRelease = (id: number, enabled = true) => {
  return useQuery({
    queryKey: catalogKeys.releaseDetail(id),
    queryFn: () => catalogService.getRelease(id),
    enabled: enabled && id > 0,
  });
};

export const useUpcomingReleases = () => {
  return useQuery({
    queryKey: catalogKeys.upcomingReleases(),
    queryFn: () => catalogService.getUpcomingReleases(),
  });
};

export const useRecentReleases = (days = 30) => {
  return useQuery({
    queryKey: catalogKeys.recentReleases(days),
    queryFn: () => catalogService.getRecentReleases(days),
  });
};

export const useCreateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Release>) => catalogService.createRelease(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.releases() });
    },
  });
};

export const useUpdateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Release> }) =>
      catalogService.updateRelease(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.releases() });
      queryClient.invalidateQueries({ queryKey: catalogKeys.releaseDetail(data.id) });
    },
  });
};

export const useDeleteRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => catalogService.deleteRelease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.releases() });
    },
  });
};

export const useAddUPC = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ releaseId, upc }: { releaseId: number; upc: string }) =>
      catalogService.addUPC(releaseId, upc),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.releaseDetail(variables.releaseId) });
    },
  });
};

// Assets hooks
export const useUploadAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recordingId,
      file,
      metadata,
    }: {
      recordingId: number;
      file: File;
      metadata: {
        kind: Asset['kind'];
        is_master?: boolean;
        is_public?: boolean;
        notes?: string;
      };
    }) => catalogService.uploadAsset(recordingId, file, metadata),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.assets() });
      queryClient.invalidateQueries({ queryKey: catalogKeys.recordingDetails(variables.recordingId) });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => catalogService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.assets() });
    },
  });
};

export const useMasterAssets = () => {
  return useQuery({
    queryKey: catalogKeys.masterAssets(),
    queryFn: () => catalogService.getMasterAssets(),
  });
};

export const usePublicAssets = () => {
  return useQuery({
    queryKey: catalogKeys.publicAssets(),
    queryFn: () => catalogService.getPublicAssets(),
  });
};