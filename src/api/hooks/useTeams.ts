import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import {
  Team,
  TeamCreateInput,
  TeamUpdateInput,
  TeamMemberActionInput,
  TeamFilters,
  TeamListResponse,
} from '../types/team';
import { toast } from 'sonner';

// API endpoints
const TEAMS_BASE_URL = '/api/v1/teams';

// Query keys
export const teamsKeys = {
  all: ['teams'] as const,
  lists: () => [...teamsKeys.all, 'list'] as const,
  list: (filters: TeamFilters) => [...teamsKeys.lists(), filters] as const,
  details: () => [...teamsKeys.all, 'detail'] as const,
  detail: (id: number) => [...teamsKeys.details(), id] as const,
  assignable: () => [...teamsKeys.all, 'assignable'] as const,
};

// Fetch all teams with optional filters
export const useTeams = (filters?: TeamFilters) => {
  const queryParams = new URLSearchParams();

  if (filters?.include_inactive) {
    queryParams.append('include_inactive', 'true');
  }

  return useQuery({
    queryKey: teamsKeys.list(filters || {}),
    queryFn: async () => {
      const url = queryParams.toString()
        ? `${TEAMS_BASE_URL}/?${queryParams.toString()}`
        : `${TEAMS_BASE_URL}/`;
      const response = await apiClient.get<TeamListResponse>(url);
      return response.data.results;
    },
  });
};

// Fetch single team by ID
export const useTeam = (id: number) => {
  return useQuery({
    queryKey: teamsKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Team>(`${TEAMS_BASE_URL}/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Fetch assignable teams (active teams with members)
export const useAssignableTeams = () => {
  return useQuery({
    queryKey: teamsKeys.assignable(),
    queryFn: async () => {
      const response = await apiClient.get<Team[]>(
        `${TEAMS_BASE_URL}/assignable/`
      );
      return response.data;
    },
  });
};

// Create team mutation
export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TeamCreateInput) => {
      const response = await apiClient.post<Team>(`${TEAMS_BASE_URL}/`, data);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: teamsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamsKeys.assignable() });
      toast.success('Team created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.name?.[0]
        || error.response?.data?.detail
        || 'Failed to create team';
      toast.error(message);
    },
  });
};

// Update team mutation
export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TeamUpdateInput }) => {
      const response = await apiClient.patch<Team>(
        `${TEAMS_BASE_URL}/${id}/`,
        data
      );
      return response.data;
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: teamsKeys.lists() }),
        queryClient.refetchQueries({ queryKey: teamsKeys.detail(variables.id) }),
      ]);
      queryClient.invalidateQueries({ queryKey: teamsKeys.assignable() });
      toast.success('Team updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.name?.[0]
        || error.response?.data?.detail
        || 'Failed to update team';
      toast.error(message);
    },
  });
};

// Delete team mutation (soft delete)
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`${TEAMS_BASE_URL}/${id}/`);
    },
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: teamsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamsKeys.assignable() });
      toast.success('Team deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to delete team';
      toast.error(message);
    },
  });
};

// Add members to team mutation
export const useAddTeamMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TeamMemberActionInput }) => {
      const response = await apiClient.post<Team>(
        `${TEAMS_BASE_URL}/${id}/add_members/`,
        data
      );
      return response.data;
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: teamsKeys.lists() }),
        queryClient.refetchQueries({ queryKey: teamsKeys.detail(variables.id) }),
      ]);
      queryClient.invalidateQueries({ queryKey: teamsKeys.assignable() });
      toast.success('Members added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to add members';
      toast.error(message);
    },
  });
};

// Remove members from team mutation
export const useRemoveTeamMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TeamMemberActionInput }) => {
      const response = await apiClient.post<Team>(
        `${TEAMS_BASE_URL}/${id}/remove_members/`,
        data
      );
      return response.data;
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: teamsKeys.lists() }),
        queryClient.refetchQueries({ queryKey: teamsKeys.detail(variables.id) }),
      ]);
      queryClient.invalidateQueries({ queryKey: teamsKeys.assignable() });
      toast.success('Members removed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to remove members';
      toast.error(message);
    },
  });
};

// Hook for fetching department users for member selection
export const useDepartmentUsersForTeam = () => {
  return useQuery({
    queryKey: ['users', 'department-members'],
    queryFn: async () => {
      // Fetch users from current user's department
      const response = await apiClient.get<{ results: any[] }>(
        '/api/v1/users/department/?page_size=1000'
      );
      return response.data.results;
    },
  });
};
