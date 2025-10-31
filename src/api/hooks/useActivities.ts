import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import { Activity, ActivityCreateInput, ActivityUpdateInput } from '../types/activities';
import { toast } from 'sonner';

// API endpoints
const ACTIVITIES_BASE_URL = '/api/v1/crm/activities';

// Fetch activities with filters
export const useActivities = (params?: {
  type?: string | string[];
  sentiment?: string | string[];
  direction?: string;
  follow_up_required?: boolean;
  follow_up_completed?: boolean;
  created_by?: number;
  department?: number;
  entity?: number;
  campaign?: number;
  contact_person?: number;
  needs_follow_up?: boolean;
  my_activities?: boolean;
  activity_date_gte?: string;
  activity_date_lte?: string;
}) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(`${key}__in`, v));
        } else if (typeof value === 'boolean') {
          queryParams.append(key, value.toString());
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  return useQuery({
    queryKey: ['activities', params],
    queryFn: async () => {
      const response = await apiClient.get<Activity[]>(
        `${ACTIVITIES_BASE_URL}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      return response.data;
    },
    refetchOnMount: 'always',
  });
};

// Get single activity
export const useActivity = (activityId: number | string) => {
  return useQuery({
    queryKey: ['activities', activityId],
    queryFn: async () => {
      const response = await apiClient.get<Activity>(`${ACTIVITIES_BASE_URL}/${activityId}/`);
      return response.data;
    },
    enabled: !!activityId,
  });
};

// Get activity timeline for entity or campaign
export const useActivityTimeline = (params: {
  entity?: number;
  campaign?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params.entity) queryParams.append('entity', params.entity.toString());
  if (params.campaign) queryParams.append('campaign', params.campaign.toString());

  return useQuery({
    queryKey: ['activities', 'timeline', params],
    queryFn: async () => {
      const response = await apiClient.get<Activity[]>(
        `${ACTIVITIES_BASE_URL}/timeline/?${queryParams.toString()}`
      );
      return response.data;
    },
    enabled: !!(params.entity || params.campaign),
  });
};

// Create activity
export const useCreateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ActivityCreateInput) => {
      const response = await apiClient.post<Activity>(`${ACTIVITIES_BASE_URL}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity logged successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to log activity');
    },
  });
};

// Update activity
export const useUpdateActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ActivityUpdateInput }) => {
      const response = await apiClient.patch<Activity>(`${ACTIVITIES_BASE_URL}/${id}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities', data.id] });
      toast.success('Activity updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update activity');
    },
  });
};

// Delete activity
export const useDeleteActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`${ACTIVITIES_BASE_URL}/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete activity');
    },
  });
};

// Create follow-up task from activity
export const useCreateFollowUpTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: number) => {
      const response = await apiClient.post(
        `${ACTIVITIES_BASE_URL}/${activityId}/create_follow_up_task/`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Follow-up task created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create follow-up task');
    },
  });
};

// My activities shorthand
export const useMyActivities = (additionalParams?: any) => {
  return useActivities({ my_activities: true, ...additionalParams });
};

// Activities needing follow-up
export const useActivitiesNeedingFollowUp = (additionalParams?: any) => {
  return useActivities({ needs_follow_up: true, ...additionalParams });
};

// Log a quick note
export const useLogQuickNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subject,
      content,
      entity,
      campaign,
    }: {
      subject: string;
      content: string;
      entity?: number;
      campaign?: number;
    }) => {
      const data: ActivityCreateInput = {
        type: 'note',
        subject,
        content,
        entity,
        campaign,
        direction: 'internal',
      };
      const response = await apiClient.post<Activity>(`${ACTIVITIES_BASE_URL}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Note added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add note');
    },
  });
};