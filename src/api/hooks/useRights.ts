import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import rightsService, {
  Credit,
  Split,
  CreditSearchParams,
  SplitSearchParams,
  BulkCreditPayload,
  BulkSplitPayload,
  AutoCalculatePayload,
  SplitValidation,
  RightsValidationReport,
} from '@/api/services/rights.service';

// Query keys factory
export const rightsKeys = {
  all: ['rights'] as const,
  credits: () => [...rightsKeys.all, 'credits'] as const,
  creditList: (params?: CreditSearchParams) => [...rightsKeys.credits(), params] as const,
  creditDetail: (id: number) => [...rightsKeys.credits(), 'detail', id] as const,
  creditsByObject: (scope: 'work' | 'recording', objectId: number) =>
    [...rightsKeys.credits(), 'byObject', scope, objectId] as const,
  creditsByEntity: (entityId: number) => [...rightsKeys.credits(), 'byEntity', entityId] as const,
  splits: () => [...rightsKeys.all, 'splits'] as const,
  splitList: (params?: SplitSearchParams) => [...rightsKeys.splits(), params] as const,
  splitDetail: (id: number) => [...rightsKeys.splits(), 'detail', id] as const,
  splitsByObject: (scope: 'work' | 'recording', objectId: number, rightType?: string) =>
    [...rightsKeys.splits(), 'byObject', scope, objectId, rightType] as const,
  splitValidation: (scope: 'work' | 'recording', objectId: number, rightType: string) =>
    [...rightsKeys.splits(), 'validate', scope, objectId, rightType] as const,
  rightsReport: (scope: 'work' | 'recording', objectId: number) =>
    [...rightsKeys.all, 'report', scope, objectId] as const,
};

// Credits hooks
export const useCredits = (params?: CreditSearchParams) => {
  return useQuery({
    queryKey: rightsKeys.creditList(params),
    queryFn: () => rightsService.getCredits(params),
  });
};

export const useCredit = (id: number, enabled = true) => {
  return useQuery({
    queryKey: rightsKeys.creditDetail(id),
    queryFn: () => rightsService.getCredit(id),
    enabled: enabled && id > 0,
  });
};

export const useCreditsByObject = (
  scope: 'work' | 'recording',
  objectId: number,
  enabled = true
) => {
  return useQuery({
    queryKey: rightsKeys.creditsByObject(scope, objectId),
    queryFn: () => rightsService.getCreditsByObject(scope, objectId),
    enabled: enabled && objectId > 0,
  });
};

export const useCreditsByEntity = (entityId: number, enabled = true) => {
  return useQuery({
    queryKey: rightsKeys.creditsByEntity(entityId),
    queryFn: () => rightsService.getCreditsByEntity(entityId),
    enabled: enabled && entityId > 0,
  });
};

export const useCreateCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Credit>) => rightsService.createCredit(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rightsKeys.credits() });
      if (data.scope && data.object_id) {
        queryClient.invalidateQueries({
          queryKey: rightsKeys.creditsByObject(data.scope, data.object_id)
        });
      }
      if (data.entity) {
        queryClient.invalidateQueries({
          queryKey: rightsKeys.creditsByEntity(data.entity)
        });
      }
    },
  });
};

export const useUpdateCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Credit> }) =>
      rightsService.updateCredit(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rightsKeys.credits() });
      queryClient.invalidateQueries({ queryKey: rightsKeys.creditDetail(data.id) });
      if (data.scope && data.object_id) {
        queryClient.invalidateQueries({
          queryKey: rightsKeys.creditsByObject(data.scope, data.object_id)
        });
      }
      if (data.entity) {
        queryClient.invalidateQueries({
          queryKey: rightsKeys.creditsByEntity(data.entity)
        });
      }
    },
  });
};

export const useDeleteCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rightsService.deleteCredit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rightsKeys.credits() });
    },
  });
};

export const useBulkCreateCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkCreditPayload) => rightsService.bulkCreateCredits(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: rightsKeys.credits() });
      queryClient.invalidateQueries({
        queryKey: rightsKeys.creditsByObject(variables.scope, variables.object_id)
      });
    },
  });
};

// Splits hooks
export const useSplits = (params?: SplitSearchParams) => {
  return useQuery({
    queryKey: rightsKeys.splitList(params),
    queryFn: () => rightsService.getSplits(params),
  });
};

export const useSplit = (id: number, enabled = true) => {
  return useQuery({
    queryKey: rightsKeys.splitDetail(id),
    queryFn: () => rightsService.getSplit(id),
    enabled: enabled && id > 0,
  });
};

export const useSplitsByObject = (
  scope: 'work' | 'recording',
  objectId: number,
  rightType?: string,
  enabled = true
) => {
  return useQuery({
    queryKey: rightsKeys.splitsByObject(scope, objectId, rightType),
    queryFn: () => rightsService.getSplitsByObject(scope, objectId, rightType),
    enabled: enabled && objectId > 0,
  });
};

export const useValidateSplits = (
  scope: 'work' | 'recording',
  objectId: number,
  rightType: string,
  enabled = true
) => {
  return useQuery({
    queryKey: rightsKeys.splitValidation(scope, objectId, rightType),
    queryFn: () => rightsService.validateSplits(scope, objectId, rightType),
    enabled: enabled && objectId > 0 && !!rightType,
  });
};

export const useRightsReport = (
  scope: 'work' | 'recording',
  objectId: number,
  enabled = true
) => {
  return useQuery({
    queryKey: rightsKeys.rightsReport(scope, objectId),
    queryFn: () => rightsService.getRightsReport(scope, objectId),
    enabled: enabled && objectId > 0,
  });
};

export const useCreateSplit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Split>) => rightsService.createSplit(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rightsKeys.splits() });
      if (data.scope && data.object_id) {
        queryClient.invalidateQueries({
          queryKey: rightsKeys.splitsByObject(data.scope, data.object_id)
        });
        queryClient.invalidateQueries({
          queryKey: rightsKeys.rightsReport(data.scope, data.object_id)
        });
      }
    },
  });
};

export const useUpdateSplit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Split> }) =>
      rightsService.updateSplit(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: rightsKeys.splits() });
      queryClient.invalidateQueries({ queryKey: rightsKeys.splitDetail(data.id) });
      if (data.scope && data.object_id) {
        queryClient.invalidateQueries({
          queryKey: rightsKeys.splitsByObject(data.scope, data.object_id)
        });
        queryClient.invalidateQueries({
          queryKey: rightsKeys.rightsReport(data.scope, data.object_id)
        });
      }
    },
  });
};

export const useDeleteSplit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => rightsService.deleteSplit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rightsKeys.splits() });
    },
  });
};

export const useBulkCreateSplits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkSplitPayload) => rightsService.bulkCreateSplits(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: rightsKeys.splits() });
      queryClient.invalidateQueries({
        queryKey: rightsKeys.splitsByObject(variables.scope, variables.object_id)
      });
      queryClient.invalidateQueries({
        queryKey: rightsKeys.rightsReport(variables.scope, variables.object_id)
      });
    },
  });
};

