import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import contractsService, {
  Contract,
  ContractListItem,
  ContractTemplate,
  ContractTemplateVersion,
  ImportTemplatePayload,
  GenerateContractPayload,
  SendForSignaturePayload,
  CreateVersionPayload,
  RegenerateContractPayload,
  ContractAuditTrail,
} from '@/api/services/contracts.service';
import { useUIStore } from '@/stores/uiStore';

const QUERY_KEYS = {
  TEMPLATES: ['contracts', 'templates'],
  TEMPLATE: (id: number) => ['contracts', 'templates', id],
  TEMPLATE_VERSIONS: (id: number) => ['contracts', 'templates', id, 'versions'],
  CONTRACTS: ['contracts', 'list'],
  CONTRACT: (id: number) => ['contracts', 'detail', id],
  CONTRACT_ANNEXES: (id: number) => ['contracts', id, 'annexes'],
  SIGNATURE_STATUS: (id: number) => ['contracts', id, 'signature-status'],
  AUDIT_TRAIL: (id: number) => ['contracts', id, 'audit-trail'],
};

// Templates
export const useTemplates = () => {
  return useQuery({
    queryKey: QUERY_KEYS.TEMPLATES,
    queryFn: () => contractsService.getTemplates(),
  });
};

export const useTemplate = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.TEMPLATE(id),
    queryFn: () => contractsService.getTemplate(id),
    enabled: !!id,
  });
};

export const useTemplateVersions = (templateId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.TEMPLATE_VERSIONS(templateId),
    queryFn: () => contractsService.getTemplateVersions(templateId),
    enabled: !!templateId,
  });
};

export const useImportTemplate = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (payload: ImportTemplatePayload) =>
      contractsService.importTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATES });
      addNotification({
        type: 'success',
        title: 'Template Imported',
        description: 'Template has been successfully imported from Google Drive.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Import Failed',
        description: error.response?.data?.error || 'Failed to import template.',
      });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ContractTemplate> }) =>
      contractsService.updateTemplate(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATE(variables.id) });
      addNotification({
        type: 'success',
        title: 'Template Updated',
        description: 'Template has been successfully updated.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update template.',
      });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (id: number) => contractsService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATES });
      addNotification({
        type: 'success',
        title: 'Template Deleted',
        description: 'Template has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        description: error.response?.data?.error || 'Failed to delete template.',
      });
    },
  });
};

export const useCreateTemplateVersion = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: number; payload: CreateVersionPayload }) =>
      contractsService.createTemplateVersion(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATE(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATE_VERSIONS(variables.templateId) });
      addNotification({
        type: 'success',
        title: 'Version Created',
        description: 'New template version has been created.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Version Creation Failed',
        description: error.response?.data?.error || 'Failed to create version.',
      });
    },
  });
};

// Contracts
export const useContracts = (params?: {
  status?: string;
  template?: number;
  counterparty_entity?: number;
  is_annex?: boolean;
  ordering?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTRACTS, params],
    queryFn: () => contractsService.getContracts(params),
  });
};

export const useContract = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.CONTRACT(id),
    queryFn: () => contractsService.getContract(id),
    enabled: !!id,
  });
};

export const useGenerateContract = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (payload: GenerateContractPayload) =>
      contractsService.generateContract(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      addNotification({
        type: 'success',
        title: 'Contract Generated',
        description: 'Contract has been successfully generated from template.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        description: error.response?.data?.error || 'Failed to generate contract.',
      });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Contract> }) =>
      contractsService.updateContract(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(variables.id) });
      addNotification({
        type: 'success',
        title: 'Contract Updated',
        description: 'Contract has been successfully updated.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        description: error.response?.data?.error || 'Failed to update contract.',
      });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (id: number) => contractsService.deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      addNotification({
        type: 'success',
        title: 'Contract Deleted',
        description: 'Contract has been successfully deleted.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        description: error.response?.data?.error || 'Failed to delete contract.',
      });
    },
  });
};

export const useRegenerateContract = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RegenerateContractPayload }) =>
      contractsService.regenerateContract(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(variables.id) });
      addNotification({
        type: 'success',
        title: 'Contract Regenerated',
        description: 'Contract has been regenerated with updated values.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Regeneration Failed',
        description: error.response?.data?.error || 'Failed to regenerate contract.',
      });
    },
  });
};

export const useMakeContractPublic = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (id: number) => contractsService.makeContractPublic(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(variables) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      addNotification({
        type: 'success',
        title: 'Contract Made Public',
        description: 'Contract is now publicly accessible.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Make Public',
        description: error.response?.data?.error || 'Failed to make contract public.',
      });
    },
  });
};

export const useSendForSignature = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SendForSignaturePayload }) =>
      contractsService.sendForSignature(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      addNotification({
        type: 'success',
        title: 'Sent for Signature',
        description: 'Contract has been sent for electronic signature.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Send Failed',
        description: error.response?.data?.error || 'Failed to send contract for signature.',
      });
    },
  });
};

export const useSignatureStatus = (id: number, enabled: boolean = false) => {
  return useQuery({
    queryKey: QUERY_KEYS.SIGNATURE_STATUS(id),
    queryFn: () => contractsService.getSignatureStatus(id),
    enabled: enabled && !!id,
    refetchInterval: 30000, // Refetch every 30 seconds when enabled
  });
};

/**
 * Hook to manually refresh signature status from Dropbox Sign
 */
export const useRefreshSignatureStatus = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (contractId: number) => contractsService.getSignatureStatus(contractId),
    onSuccess: (data, contractId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(contractId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SIGNATURE_STATUS(contractId) });

      if (data.is_complete) {
        addNotification({
          type: 'success',
          title: 'All Signatures Complete',
          description: 'The contract has been fully signed.',
        });
      } else {
        addNotification({
          type: 'info',
          title: 'Status Updated',
          description: 'Signature status has been refreshed from Dropbox Sign.',
        });
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        description: error.response?.data?.error || 'Failed to refresh signature status.',
      });
    },
  });
};

export const useCheckContractStatus = (id: number | null, enabled: boolean = false) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['contracts', 'check-status', id],
    queryFn: async () => {
      if (!id) return null;
      const statusData = await contractsService.checkContractStatus(id);

      // If status is no longer processing, invalidate the contract queries
      if (statusData.status !== 'processing') {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(id) });
      }

      return statusData;
    },
    enabled: enabled && !!id,
    refetchInterval: (data) => {
      // Only keep polling if we're still processing
      // Stop polling once status changes or query is disabled
      if (!enabled || !data) return false;
      return data.status === 'processing' ? 2000 : false;
    },
    refetchIntervalInBackground: false, // Don't poll when tab is not focused
    retry: false, // Don't retry on error
    staleTime: 0, // Always consider data stale
  });
};

/**
 * Hook to manually refresh contract generation status (for processing contracts).
 * Use this when user clicks a refresh button to check if generation is complete.
 */
export const useRefreshContractGeneration = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: (contractId: number) => contractsService.checkContractStatus(contractId),
    onSuccess: (data, contractId) => {
      // Always invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(contractId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      // Also invalidate campaign contracts queries (they contain contract data)
      queryClient.invalidateQueries({ queryKey: ['campaigns'], exact: false });

      // Show appropriate notification based on new status
      if (data.status === 'draft') {
        addNotification({
          type: 'success',
          title: 'Contract Generated',
          description: 'The contract has been successfully generated and is ready.',
        });
      } else if (data.status === 'failed') {
        addNotification({
          type: 'error',
          title: 'Generation Failed',
          description: data.error_message || 'Contract generation failed. Please try again.',
        });
      } else if (data.status === 'processing') {
        addNotification({
          type: 'info',
          title: 'Still Processing',
          description: 'Contract generation is still in progress. Please wait.',
        });
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        description: error.response?.data?.error || 'Failed to check contract status.',
      });
    },
  });
};

export const useContractAuditTrail = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.AUDIT_TRAIL(id),
    queryFn: () => contractsService.getContractAuditTrail(id),
    enabled: !!id,
  });
};

// Annexes
export const useContractAnnexes = (contractId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.CONTRACT_ANNEXES(contractId),
    queryFn: () => contractsService.getContractAnnexes(contractId),
    enabled: !!contractId,
  });
};

export const useCreateAnnex = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: ({
      parentContractId,
      payload,
    }: {
      parentContractId: number;
      payload: Omit<GenerateContractPayload, 'parent_contract_id'>;
    }) => contractsService.createAnnex(parentContractId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT(variables.parentContractId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONTRACT_ANNEXES(variables.parentContractId) });
      addNotification({
        type: 'success',
        title: 'Annex Created',
        description: 'Contract annex has been successfully created.',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Annex Creation Failed',
        description: error.response?.data?.error || 'Failed to create annex.',
      });
    },
  });
};
