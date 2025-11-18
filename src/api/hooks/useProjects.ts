import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '../client';
import type {
  Project,
  ProjectDetail,
  ProjectCreatePayload,
  ProjectUpdatePayload,
  ProjectFilterParams,
  ProjectTask,
  ProjectTaskDetail,
  ProjectTaskCreatePayload,
  ProjectTaskFilterParams,
  RecurringTaskTemplate,
  RecurringTaskTemplateCreatePayload,
  ProjectTemplate,
  AddMemberPayload,
  CreateFromTemplatePayload,
  ProjectStats,
} from '@/types/projects';
import { toast } from 'sonner';

// ============ Project Hooks ============

export const useProjects = (params?: ProjectFilterParams) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: Project[]; count: number }>('/api/v1/projects/', { params });
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 30 * 1000,
  });
};

export const useInfiniteProjects = (params?: ProjectFilterParams) => {
  return useInfiniteQuery({
    queryKey: ['projects', 'infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{
        results: Project[];
        count: number;
        next: string | null;
      }>('/api/v1/projects/', {
        params: { ...params, page: pageParam, page_size: 50 },
      });
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.next) {
        return pages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
};

export const useProject = (projectId: number) => {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const response = await apiClient.get<ProjectDetail>(`/api/v1/projects/${projectId}/`);
      return response.data;
    },
    enabled: !!projectId,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectCreatePayload) => {
      const response = await apiClient.post<ProjectDetail>('/api/v1/projects/', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project "${data.name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProjectUpdatePayload }) => {
      const response = await apiClient.patch<ProjectDetail>(`/api/v1/projects/${id}/`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', id] });
      const previousProject = queryClient.getQueryData<ProjectDetail>(['projects', id]);

      if (previousProject) {
        queryClient.setQueryData<ProjectDetail>(['projects', id], {
          ...previousProject,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousProject };
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(['projects', id], context.previousProject);
      }
      toast.error(error.message || 'Failed to update project');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['projects', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/v1/projects/${id}/`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });
};

export const useArchiveProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/projects/${id}/archive/`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project archived successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive project');
    },
  });
};

export const useActivateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/projects/${id}/activate/`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project activated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate project');
    },
  });
};

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: AddMemberPayload }) => {
      const response = await apiClient.post(`/api/v1/projects/${projectId}/add_member/`, data);
      return response.data;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Member added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member');
    },
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: number; userId: number }) => {
      await apiClient.delete(`/api/v1/projects/${projectId}/remove_member/`, {
        data: { user_id: userId },
      });
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Member removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });
};

// ============ Project Task Hooks ============

export const useProjectTasks = (params?: ProjectTaskFilterParams) => {
  return useQuery({
    queryKey: ['project-tasks', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: ProjectTask[]; count: number }>('/api/v1/tasks/', { params });
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 30 * 1000,
  });
};

export const useProjectTask = (taskId: number) => {
  return useQuery({
    queryKey: ['project-tasks', taskId],
    queryFn: async () => {
      const response = await apiClient.get<ProjectTaskDetail>(`/api/v1/tasks/${taskId}/`);
      return response.data;
    },
    enabled: !!taskId,
  });
};

export const useCreateProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProjectTaskCreatePayload) => {
      const response = await apiClient.post<ProjectTaskDetail>('/api/v1/tasks/', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.project] });
      toast.success('Task created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create task');
    },
  });
};

export const useUpdateProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProjectTaskCreatePayload> }) => {
      const response = await apiClient.patch<ProjectTaskDetail>(`/api/v1/tasks/${id}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['project-tasks', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.project] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
};

export const useStartProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/tasks/${id}/start/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    },
  });
};

export const useCompleteProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/tasks/${id}/complete/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Task completed');
    },
  });
};

export const useReopenProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/tasks/${id}/reopen/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Task reopened');
    },
  });
};

export const useMyProjectTasks = () => {
  return useQuery({
    queryKey: ['project-tasks', 'my-tasks'],
    queryFn: async () => {
      const response = await apiClient.get<ProjectTask[] | { results: ProjectTask[] }>('/api/v1/tasks/my_tasks/');
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });
};

export const useOverdueProjectTasks = () => {
  return useQuery({
    queryKey: ['project-tasks', 'overdue'],
    queryFn: async () => {
      const response = await apiClient.get<ProjectTask[] | { results: ProjectTask[] }>('/api/v1/tasks/overdue/');
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });
};

// ============ Recurring Task Template Hooks ============

export const useRecurringTaskTemplates = (params?: { project?: number; is_active?: boolean; department?: number }) => {
  return useQuery({
    queryKey: ['recurring-tasks', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: RecurringTaskTemplate[]; count: number }>('/api/v1/recurring-tasks/', { params });
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 60 * 1000,
  });
};

export const useRecurringTaskTemplate = (id: number) => {
  return useQuery({
    queryKey: ['recurring-tasks', id],
    queryFn: async () => {
      const response = await apiClient.get<RecurringTaskTemplate>(`/api/v1/recurring-tasks/${id}/`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateRecurringTaskTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecurringTaskTemplateCreatePayload) => {
      const response = await apiClient.post<RecurringTaskTemplate>('/api/v1/recurring-tasks/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      toast.success('Recurring task template created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create recurring task template');
    },
  });
};

export const useUpdateRecurringTaskTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RecurringTaskTemplateCreatePayload> }) => {
      const response = await apiClient.patch<RecurringTaskTemplate>(`/api/v1/recurring-tasks/${id}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['recurring-tasks', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update recurring task template');
    },
  });
};

export const useDeleteRecurringTaskTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/v1/recurring-tasks/${id}/`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      toast.success('Recurring task template deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete recurring task template');
    },
  });
};

export const useActivateRecurringTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/recurring-tasks/${id}/activate/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      toast.success('Recurring task activated');
    },
  });
};

export const useDeactivateRecurringTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/api/v1/recurring-tasks/${id}/deactivate/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      toast.success('Recurring task deactivated');
    },
  });
};

export const useGenerateRecurringTaskNow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post<ProjectTaskDetail>(`/api/v1/recurring-tasks/${id}/generate_now/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      toast.success('Task generated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate task');
    },
  });
};

// ============ Project Template Hooks ============

export const useProjectTemplates = (params?: { project_type?: string; department?: number; is_active?: boolean }) => {
  return useQuery({
    queryKey: ['project-templates', params],
    queryFn: async () => {
      const response = await apiClient.get<{ results: ProjectTemplate[]; count: number }>('/api/v1/templates/', { params });
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
    staleTime: 60 * 1000,
  });
};

export const useCreateProjectFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, data }: { templateId: number; data: CreateFromTemplatePayload }) => {
      const response = await apiClient.post<ProjectDetail>(
        `/api/v1/templates/${templateId}/create_project/`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project "${data.name}" created from template`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project from template');
    },
  });
};

// ============ Computed Stats Hook ============

export const useProjectStats = () => {
  const { data: projects } = useProjects();

  if (!projects) {
    return {
      total: 0,
      active: 0,
      on_hold: 0,
      completed: 0,
      archived: 0,
      overdue_tasks: 0,
    };
  }

  return {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    on_hold: projects.filter((p) => p.status === 'on_hold').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    archived: projects.filter((p) => p.status === 'archived').length,
    overdue_tasks: 0, // Would need separate endpoint
  };
};
