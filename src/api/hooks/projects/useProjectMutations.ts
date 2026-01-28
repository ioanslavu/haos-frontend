import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import type { ProjectDetail, ProjectCreatePayload, ProjectUpdatePayload, AddMemberPayload, CreateFromTemplatePayload } from '@/types/projects';
import { toast } from 'sonner';

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
    onError: (error: Error) => toast.error(error.message || 'Failed to create project'),
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
        queryClient.setQueryData<ProjectDetail>(['projects', id], { ...previousProject, ...data, updated_at: new Date().toISOString() });
      }
      return { previousProject };
    },
    onError: (error: Error, { id }, context) => {
      if (context?.previousProject) queryClient.setQueryData(['projects', id], context.previousProject);
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
    onError: (error: Error) => toast.error(error.message || 'Failed to delete project'),
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
    onError: (error: Error) => toast.error(error.message || 'Failed to archive project'),
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
    onError: (error: Error) => toast.error(error.message || 'Failed to activate project'),
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
    onError: (error: Error) => toast.error(error.message || 'Failed to add member'),
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: number; userId: number }) => {
      await apiClient.delete(`/api/v1/projects/${projectId}/remove_member/`, { data: { user_id: userId } });
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      toast.success('Member removed successfully');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to remove member'),
  });
};

export const useCreateProjectFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, data }: { templateId: number; data: CreateFromTemplatePayload }) => {
      const response = await apiClient.post<ProjectDetail>(`/api/v1/templates/${templateId}/create_project/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project "${data.name}" created from template`);
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create project from template'),
  });
};
