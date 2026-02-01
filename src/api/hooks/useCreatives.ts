import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import creativesService, {
  CreativeSearchParams,
  CreateCreativePayload,
  UpdateCreativePayload,
} from '@/api/services/creatives.service';
import { entityKeys } from './useEntities';

// Query keys factory
export const creativeKeys = {
  all: ['creatives'] as const,
  lists: () => [...creativeKeys.all, 'list'] as const,
  list: (params?: CreativeSearchParams) => [...creativeKeys.lists(), params] as const,
  details: () => [...creativeKeys.all, 'detail'] as const,
  detail: (id: number) => [...creativeKeys.details(), id] as const,
  stats: (params?: CreativeSearchParams) => [...creativeKeys.all, 'stats', params] as const,
};

// Hooks
export const useCreatives = (params?: CreativeSearchParams, enabled = true) => {
  return useQuery({
    queryKey: creativeKeys.list(params),
    queryFn: () => creativesService.getCreatives(params),
    refetchOnMount: 'always',
    enabled,
  });
};

// Infinite scrolling hook for creatives
export const useInfiniteCreatives = (params?: Omit<CreativeSearchParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: [...creativeKeys.lists(), 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      return creativesService.getCreatives({ ...params, page: pageParam });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        const nextPage = url.searchParams.get('page');
        return nextPage ? parseInt(nextPage) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useCreative = (id: number, enabled = true) => {
  return useQuery({
    queryKey: creativeKeys.detail(id),
    queryFn: () => creativesService.getCreative(id),
    enabled: enabled && id > 0,
  });
};

export const useSearchCreatives = (query: string, enabled = true) => {
  return useQuery({
    queryKey: ['creatives', 'search', query],
    queryFn: () => creativesService.searchCreatives(query),
    enabled: enabled && query.length > 0,
  });
};

export const useCreativeStats = (params?: CreativeSearchParams) => {
  return useQuery({
    queryKey: creativeKeys.stats(params),
    queryFn: () => creativesService.getCreativeStats(params),
  });
};

// Mutations
export const useCreateCreative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCreativePayload) => creativesService.createCreative(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creativeKeys.all });
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
    },
  });
};

export const useUpdateCreative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCreativePayload }) =>
      creativesService.patchCreative(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: creativeKeys.all });
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
      queryClient.invalidateQueries({ queryKey: creativeKeys.detail(data.id) });
    },
  });
};

export const useDeleteCreative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => creativesService.deleteCreative(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creativeKeys.all });
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
    },
  });
};

// Alias for better clarity in detail pages
export const useCreativeDetail = useCreative;
