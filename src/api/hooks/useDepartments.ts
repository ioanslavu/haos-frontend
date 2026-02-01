import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DepartmentsResponse {
  results: Department[];
  count: number;
  next: string | null;
  previous: string | null;
}

/**
 * Get list of departments
 */
export const useDepartments = (params?: { is_active?: boolean }) => {
  const queryParams = new URLSearchParams();

  if (params?.is_active !== undefined) {
    queryParams.append('is_active', params.is_active.toString());
  }

  return useQuery({
    queryKey: ['departments', params],
    queryFn: async () => {
      const url = `/api/v1/departments/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<DepartmentsResponse>(url);
      return response.data.results || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - departments don't change often
  });
};
