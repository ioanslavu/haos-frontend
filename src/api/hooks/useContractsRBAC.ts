import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { API_BASE_URL } from '@/lib/constants';

export type ContractVerb = 'view' | 'publish' | 'send' | 'update' | 'delete' | 'regenerate';

export interface ContractsVerbsResponse {
  module: 'contracts';
  verbs: ContractVerb[];
  types: string[];
}

export interface ContractPolicyRow {
  role: string;
  department: string;
  contract_type: string;
  can_view: boolean;
  can_publish: boolean;
  can_send: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_regenerate: boolean;
}

export interface UserContractsMatrixResponse {
  role: string | null;
  department: string | null;
  policies: Array<Omit<ContractPolicyRow, 'role' | 'department'>>;
}

const VERBS_URL = `${API_BASE_URL}/api/v1/rbac/contracts/verbs/`;
const POLICY_URL = `${API_BASE_URL}/api/v1/rbac/contracts/policy/`;
const USER_MATRIX_URL = (userId: string | number) => `${API_BASE_URL}/api/v1/rbac/contracts/users/${userId}/matrix/`;

export const useContractsVerbs = () => {
  return useQuery({
    queryKey: ['contracts', 'verbs'],
    queryFn: async () => {
      const res = await apiClient.get<ContractsVerbsResponse>(VERBS_URL);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUserContractsMatrix = (userId: string | number) => {
  return useQuery({
    queryKey: ['contracts', 'user-matrix', userId],
    queryFn: async () => {
      const res = await apiClient.get<UserContractsMatrixResponse>(USER_MATRIX_URL(userId));
      return res.data;
    },
    enabled: !!userId,
  });
};

export const useUpsertContractPolicies = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (items: ContractPolicyRow[]) => {
      const res = await apiClient.put(POLICY_URL, { items });
      return res.data;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['contracts', 'user-matrix'] });
      client.invalidateQueries({ queryKey: ['contracts', 'policy'] });
    },
  });
};

export const useRoleDeptPolicies = (role?: string, department?: string) => {
  return useQuery({
    queryKey: ['contracts', 'policy', role, department],
    queryFn: async () => {
      const res = await apiClient.get<{ results: ContractPolicyRow[] }>(POLICY_URL, {
        params: { role, department },
      });
      return res.data.results;
    },
    enabled: !!role && !!department,
  });
};

export const useMyContractsMatrix = (userId?: string | number) => {
  return useQuery({
    queryKey: ['contracts', 'my-matrix', userId],
    queryFn: async () => {
      if (!userId) return null;
      const res = await apiClient.get<UserContractsMatrixResponse>(`${API_BASE_URL}/api/v1/rbac/contracts/users/${userId}/matrix/`);
      return res.data;
    },
    enabled: !!userId,
  });
};
