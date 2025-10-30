import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import entitiesService, {
  Entity,
  EntityListItem,
  CreateEntityPayload,
  UpdateEntityPayload,
  EntitySearchParams,
  RevealCNPResponse,
  ContactPerson,
} from '@/api/services/entities.service';

// Query keys factory
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (params?: EntitySearchParams) => [...entityKeys.lists(), params] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: number) => [...entityKeys.details(), id] as const,
  placeholders: (id: number) => [...entityKeys.all, 'placeholders', id] as const,
  latestShares: (id: number, contractType?: string) =>
    [...entityKeys.all, 'latestShares', id, contractType] as const,
  artists: () => [...entityKeys.all, 'artists'] as const,
  writers: () => [...entityKeys.all, 'writers'] as const,
  producers: () => [...entityKeys.all, 'producers'] as const,
  business: (params?: EntitySearchParams) => [...entityKeys.all, 'business', params] as const,
  stats: () => [...entityKeys.all, 'stats'] as const,
  sensitiveIdentity: (entityId: number) => ['sensitiveIdentity', entityId] as const,
  contactPersons: (entityId?: number) => ['contactPersons', entityId] as const,
  contactPerson: (id: number) => ['contactPerson', id] as const,
};

// Hooks
export const useEntities = (params?: EntitySearchParams) => {
  return useQuery({
    queryKey: entityKeys.list(params),
    queryFn: () => entitiesService.getEntities(params),
  });
};

export const useSearchEntities = (query: string, enabled = true) => {
  return useQuery({
    queryKey: ['entities', 'search', query],
    queryFn: () => entitiesService.searchEntities(query),
    enabled: enabled && query.length > 0,
  });
};

export const useEntity = (id: number, enabled = true) => {
  return useQuery({
    queryKey: entityKeys.detail(id),
    queryFn: () => entitiesService.getEntity(id),
    enabled: enabled && id > 0,
  });
};

export const useEntityPlaceholders = (id: number, enabled = true) => {
  return useQuery({
    queryKey: entityKeys.placeholders(id),
    queryFn: () => entitiesService.getEntityPlaceholders(id),
    enabled: enabled && id > 0,
  });
};

export const useEntityLatestShares = (
  entityId: number | null,
  contractType?: string,
  enabled = true
) => {
  return useQuery({
    queryKey: entityKeys.latestShares(entityId || 0, contractType),
    queryFn: () => entitiesService.getLatestContractShares(entityId!, contractType),
    enabled: enabled && !!entityId && entityId > 0,
  });
};

export const useArtists = () => {
  return useQuery({
    queryKey: entityKeys.artists(),
    queryFn: () => entitiesService.getArtists(),
  });
};

export const useWriters = () => {
  return useQuery({
    queryKey: entityKeys.writers(),
    queryFn: () => entitiesService.getWriters(),
  });
};

export const useProducers = () => {
  return useQuery({
    queryKey: entityKeys.producers(),
    queryFn: () => entitiesService.getProducers(),
  });
};

export const useBusinessEntities = (params?: EntitySearchParams, enabled = true) => {
  return useQuery({
    queryKey: entityKeys.business(params),
    queryFn: () => entitiesService.getBusinessEntities(params),
    enabled: enabled && (params?.search ? params.search.length > 0 : true),
  });
};

export const useEntityStats = () => {
  return useQuery({
    queryKey: entityKeys.stats(),
    queryFn: () => entitiesService.getEntityStats(),
  });
};

// Mutations
export const useCreateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEntityPayload) => entitiesService.createEntity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
};

export const useUpdateEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateEntityPayload }) =>
      entitiesService.patchEntity(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(data.id) });
    },
  });
};

export const useDeleteEntity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => entitiesService.deleteEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
};

// Sensitive Identity hooks
export const useSensitiveIdentity = (entityId: number, enabled = true) => {
  return useQuery({
    queryKey: entityKeys.sensitiveIdentity(entityId),
    queryFn: () => entitiesService.getSensitiveIdentity(entityId),
    enabled: enabled && entityId > 0,
  });
};

export const useRevealCNP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      entitiesService.revealCNP(id, reason),
    onSuccess: (data, variables) => {
      // Optionally refresh sensitive identity data
      // queryClient.invalidateQueries({ queryKey: entityKeys.sensitiveIdentity(variables.entityId) });
    },
  });
};

// Backward compatibility aliases for client hooks
export const useClients = () => {
  const query = useEntities({ has_role: 'client' });
  return {
    ...query,
    data: query.data?.results || [],
  };
};

export const useClient = useEntity;
export const useClientPlaceholders = useEntityPlaceholders;

export const useCreateClient = () => {
  const createEntity = useCreateEntity();
  return {
    ...createEntity,
    mutate: (payload: any) => {
      const entityPayload: CreateEntityPayload = {
        ...payload,
        kind: 'PF' as const,
        display_name: payload.full_name,
        roles: ['client'],
        primary_role: 'client',
      };
      return createEntity.mutate(entityPayload);
    },
  };
};

export const useUpdateClient = () => {
  const updateEntity = useUpdateEntity();
  return {
    ...updateEntity,
    mutate: ({ id, payload }: { id: number; payload: any }) => {
      const entityPayload: UpdateEntityPayload = {
        ...payload,
        display_name: payload.full_name || payload.display_name,
      };
      return updateEntity.mutate({ id, payload: entityPayload });
    },
  };
};

export const useDeleteClient = useDeleteEntity;

// Alias for better clarity in detail pages
export const useEntityDetail = useEntity;

// Contact Person hooks
export const useContactPersons = (entityId?: number, enabled = true) => {
  return useQuery({
    queryKey: entityKeys.contactPersons(entityId),
    queryFn: () => entitiesService.getContactPersons(entityId),
    enabled: enabled && (entityId === undefined || entityId > 0),
  });
};

export const useContactPerson = (id: number, enabled = true) => {
  return useQuery({
    queryKey: entityKeys.contactPerson(id),
    queryFn: () => entitiesService.getContactPerson(id),
    enabled: enabled && id > 0,
  });
};

export const useCreateContactPerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<ContactPerson>) =>
      entitiesService.createContactPerson(payload),
    onSuccess: (data) => {
      // Invalidate contact persons list for the entity
      queryClient.invalidateQueries({ queryKey: entityKeys.contactPersons(data.entity) });
      // Also invalidate the entity detail to refresh contact_persons array
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(data.entity) });
    },
  });
};

export const useUpdateContactPerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ContactPerson> }) =>
      entitiesService.updateContactPerson(id, payload),
    onSuccess: (data) => {
      // Invalidate the specific contact person
      queryClient.invalidateQueries({ queryKey: entityKeys.contactPerson(data.id) });
      // Invalidate contact persons list for the entity
      queryClient.invalidateQueries({ queryKey: entityKeys.contactPersons(data.entity) });
      // Also invalidate the entity detail
      queryClient.invalidateQueries({ queryKey: entityKeys.detail(data.entity) });
    },
  });
};

export const useDeleteContactPerson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => entitiesService.deleteContactPerson(id),
    onSuccess: (_, id) => {
      // Invalidate all contact persons lists
      queryClient.invalidateQueries({ queryKey: ['contactPersons'] });
      // Invalidate all entity details (to refresh contact_persons array)
      queryClient.invalidateQueries({ queryKey: entityKeys.details() });
    },
  });
};