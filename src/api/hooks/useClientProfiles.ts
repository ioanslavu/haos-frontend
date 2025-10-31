import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import clientProfilesService, {
  ClientProfile,
  CreateClientProfilePayload,
  UpdateClientProfilePayload,
} from '@/api/services/clientProfiles.service';

// Query keys factory
export const clientProfileKeys = {
  all: ['clientProfiles'] as const,
  lists: () => [...clientProfileKeys.all, 'list'] as const,
  list: (params?: any) => [...clientProfileKeys.lists(), params] as const,
  details: () => [...clientProfileKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientProfileKeys.details(), id] as const,
  byEntity: (entityId: number) => [...clientProfileKeys.all, 'byEntity', entityId] as const,
  history: (profileId: number) => [...clientProfileKeys.all, 'history', profileId] as const,
  stats: (departmentId?: number) => [...clientProfileKeys.all, 'stats', departmentId] as const,
};

// Hooks

/**
 * Get client profiles list
 */
export const useClientProfiles = (params?: {
  entity?: number;
  department?: number;
  min_health_score?: number;
  max_health_score?: number;
}) => {
  return useQuery({
    queryKey: clientProfileKeys.list(params),
    queryFn: () => clientProfilesService.getClientProfiles(params),
  });
};

/**
 * Get a single client profile by ID
 */
export const useClientProfile = (id: number, enabled = true) => {
  return useQuery({
    queryKey: clientProfileKeys.detail(id),
    queryFn: () => clientProfilesService.getClientProfile(id),
    enabled: enabled && id > 0,
  });
};

/**
 * Get client profile for a specific entity (current user's department)
 */
export const useClientProfileByEntity = (entityId: number | undefined | null, enabled = true) => {
  return useQuery({
    queryKey: clientProfileKeys.byEntity(entityId || 0),
    queryFn: () => clientProfilesService.getClientProfileByEntity(entityId!),
    enabled: enabled && !!entityId && entityId > 0,
  });
};

/**
 * Get client profile history
 */
export const useClientProfileHistory = (profileId: number, enabled = true) => {
  return useQuery({
    queryKey: clientProfileKeys.history(profileId),
    queryFn: () => clientProfilesService.getClientProfileHistory(profileId),
    enabled: enabled && profileId > 0,
  });
};

/**
 * Get client profile statistics
 */
export const useClientProfileStats = (departmentId?: number) => {
  return useQuery({
    queryKey: clientProfileKeys.stats(departmentId),
    queryFn: () => clientProfilesService.getClientProfileStats(departmentId),
  });
};

/**
 * Create a new client profile
 */
export const useCreateClientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientProfilePayload) =>
      clientProfilesService.createClientProfile(data),
    onSuccess: (newProfile) => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: clientProfileKeys.lists() });
      // Invalidate the byEntity query for this entity
      queryClient.invalidateQueries({ queryKey: clientProfileKeys.byEntity(newProfile.entity) });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: clientProfileKeys.all });
    },
  });
};

/**
 * Update a client profile
 */
export const useUpdateClientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientProfilePayload }) =>
      clientProfilesService.updateClientProfile(id, data),
    onSuccess: (updatedProfile, variables) => {
      // Update the specific profile in cache
      queryClient.setQueryData(clientProfileKeys.detail(variables.id), updatedProfile);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientProfileKeys.lists() });
      // Invalidate the byEntity query
      queryClient.invalidateQueries({
        queryKey: clientProfileKeys.byEntity(updatedProfile.entity),
      });
      // Invalidate history
      queryClient.invalidateQueries({ queryKey: clientProfileKeys.history(variables.id) });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: clientProfileKeys.all });
    },
  });
};
