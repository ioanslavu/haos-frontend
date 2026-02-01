import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import businessesService, {
  BusinessSearchParams,
  CreateBusinessPayload,
  UpdateBusinessPayload,
} from '@/api/services/businesses.service';
import { entityKeys } from './useEntities';

// Query keys factory
export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (params?: BusinessSearchParams) => [...businessKeys.lists(), params] as const,
  details: () => [...businessKeys.all, 'detail'] as const,
  detail: (id: number) => [...businessKeys.details(), id] as const,
  stats: (params?: BusinessSearchParams) => [...businessKeys.all, 'stats', params] as const,
};

// Hooks
export const useBusinesses = (params?: BusinessSearchParams, enabled = true) => {
  return useQuery({
    queryKey: businessKeys.list(params),
    queryFn: () => businessesService.getBusinesses(params),
    refetchOnMount: 'always',
    enabled,
  });
};

// Infinite scrolling hook for businesses
export const useInfiniteBusinesses = (params?: Omit<BusinessSearchParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: [...businessKeys.lists(), 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      return businessesService.getBusinesses({ ...params, page: pageParam });
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

export const useBusiness = (id: number, enabled = true) => {
  return useQuery({
    queryKey: businessKeys.detail(id),
    queryFn: () => businessesService.getBusiness(id),
    enabled: enabled && id > 0,
  });
};

export const useSearchBusinesses = (query: string, enabled = true) => {
  return useQuery({
    queryKey: ['businesses', 'search', query],
    queryFn: () => businessesService.searchBusinesses(query),
    enabled: enabled && query.length > 0,
  });
};

export const useBusinessStats = (params?: BusinessSearchParams) => {
  return useQuery({
    queryKey: businessKeys.stats(params),
    queryFn: () => businessesService.getBusinessStats(params),
  });
};

// Mutations
export const useCreateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBusinessPayload) => businessesService.createBusiness(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
    },
  });
};

export const useUpdateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateBusinessPayload }) =>
      businessesService.patchBusiness(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
      queryClient.invalidateQueries({ queryKey: businessKeys.detail(data.id) });
    },
  });
};

export const useDeleteBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => businessesService.deleteBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.all });
      queryClient.invalidateQueries({ queryKey: entityKeys.all });
    },
  });
};

// Alias for better clarity in detail pages
export const useBusinessDetail = useBusiness;
