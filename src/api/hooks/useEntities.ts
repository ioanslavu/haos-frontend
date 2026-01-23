import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  latestShares: (id: number, contractType?: string) =>
    [...entityKeys.all, 'latestShares', id, contractType] as const,
  creatives: (params?: EntitySearchParams) => [...entityKeys.all, 'creatives', params] as const,
  clients: (params?: EntitySearchParams) => [...entityKeys.all, 'clients', params] as const,
  stats: (params?: EntitySearchParams) => [...entityKeys.all, 'stats', params] as const,
  searchGlobal: (query: string) => [...entityKeys.all, 'searchGlobal', query] as const,
  sensitiveIdentity: (entityId: number) => ['sensitiveIdentity', entityId] as const,
  contactPersons: (entityId?: number) => ['contactPersons', entityId] as const,
  contactPerson: (id: number) => ['contactPerson', id] as const,
};

// Hooks
export const useEntities = (params?: EntitySearchParams, enabled = true) => {
  return useQuery({
    queryKey: entityKeys.list(params),
    queryFn: () => entitiesService.getEntities(params),
    refetchOnMount: 'always',
    enabled,
  });
};

// Infinite scrolling hook for entities
export const useInfiniteEntities = (params?: Omit<EntitySearchParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: [...entityKeys.lists(), 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      return entitiesService.getEntities({ ...params, page: pageParam });
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

// Get creative entities (classification=CREATIVE)
export const useCreatives = (params?: Omit<EntitySearchParams, 'classification'>, enabled = true) => {
  const fullParams = { ...params, classification: 'CREATIVE' as const };
  return useQuery({
    queryKey: entityKeys.creatives(fullParams),
    queryFn: () => entitiesService.getCreatives(params),
    enabled,
  });
};

// Get client entities (classification=CLIENT)
export const useClients = (params?: Omit<EntitySearchParams, 'classification'>, enabled = true) => {
  const fullParams = { ...params, classification: 'CLIENT' as const };
  return useQuery({
    queryKey: entityKeys.clients(fullParams),
    queryFn: () => entitiesService.getClients(params),
    enabled,
  });
};

export const useEntityStats = (params?: EntitySearchParams) => {
  return useQuery({
    queryKey: entityKeys.stats(params),
    queryFn: () => entitiesService.getEntityStats(params),
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

// Alias for better clarity in detail pages
export const useEntityDetail = useEntity;

// Global search hook (bypasses department filtering)
export const useSearchGlobal = (query: string, enabled = true) => {
  return useQuery({
    queryKey: entityKeys.searchGlobal(query),
    queryFn: () => entitiesService.searchGlobal(query),
    enabled: enabled && query.length >= 2,
  });
};

// Add entity to department mutation
export const useAddToMyDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entityId: number) => entitiesService.addToMyDepartment(entityId),
    onSuccess: () => {
      // Invalidate entity lists to show the newly added entity
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
};

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