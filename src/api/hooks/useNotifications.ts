import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import { Notification } from '@/stores/notificationStore';
import { toast } from 'sonner';

// API endpoints
const NOTIFICATIONS_BASE_URL = '/api/v1/notifications';

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Fetch notifications with filters
export const useNotifications = (params?: {
  is_read?: boolean;
  notification_type?: string;
  page?: number;
  page_size?: number;
}) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Notification>>(
        `${NOTIFICATIONS_BASE_URL}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      // Return just the results array for easier consumption
      return response.data.results;
    },
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });
};

// Get single notification
export const useNotification = (notificationId: number) => {
  return useQuery({
    queryKey: ['notification', notificationId],
    queryFn: async () => {
      const response = await apiClient.get<Notification>(
        `${NOTIFICATIONS_BASE_URL}/${notificationId}/`
      );
      return response.data;
    },
    enabled: !!notificationId,
  });
};

// Get unread count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>(
        `${NOTIFICATIONS_BASE_URL}/unread_count/`
      );
      return response.data.count;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Mark notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiClient.patch(
        `${NOTIFICATIONS_BASE_URL}/${notificationId}/mark_read/`,
        { is_read: true }
      );
      return response.data;
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Update notification list
      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        return old?.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        );
      });

      // Update unread count
      queryClient.setQueryData<number>(['notifications', 'unread-count'], (old) => {
        return old ? Math.max(0, old - 1) : 0;
      });

      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      queryClient.setQueryData(['notifications'], context?.previousNotifications);
      toast.error('Failed to mark notification as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

// Mark all notifications as read
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(
        `${NOTIFICATIONS_BASE_URL}/mark_all_read/`
      );
      return response.data;
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Mark all as read
      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        return old?.map(n => ({ ...n, is_read: true }));
      });

      // Set unread count to 0
      queryClient.setQueryData<number>(['notifications', 'unread-count'], 0);

      return { previousNotifications };
    },
    onError: (err, _, context) => {
      // Rollback on error
      queryClient.setQueryData(['notifications'], context?.previousNotifications);
      toast.error('Failed to mark all notifications as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('All notifications marked as read');
    },
  });
};

// Delete notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      await apiClient.delete(`${NOTIFICATIONS_BASE_URL}/${notificationId}/`);
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Remove from list
      queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
        const notification = old?.find(n => n.id === notificationId);
        const unreadCountDelta = notification && !notification.is_read ? 1 : 0;

        // Update unread count if notification was unread
        if (unreadCountDelta > 0) {
          queryClient.setQueryData<number>(['notifications', 'unread-count'], (count) => {
            return count ? Math.max(0, count - 1) : 0;
          });
        }

        return old?.filter(n => n.id !== notificationId);
      });

      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // Rollback on error
      queryClient.setQueryData(['notifications'], context?.previousNotifications);
      toast.error('Failed to delete notification');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

// Notification preferences types
export interface NotificationPreferences {
  deadline_tomorrow_enabled: boolean;
  deadline_urgent_enabled: boolean;
  task_inactivity_enabled: boolean;
  task_overdue_enabled: boolean;
  campaign_ending_enabled: boolean;
  urgent_deadline_hours: number;
  inactivity_days: number;
  campaign_ending_days: number;
  quiet_hours: 'none' | 'evening' | 'night' | 'weekend' | 'custom';
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  enable_daily_digest: boolean;
  digest_time: string;
  mute_all_alerts: boolean;
}

// Get notification preferences
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.get<NotificationPreferences>(
        `${NOTIFICATIONS_BASE_URL}/preferences/`
      );
      return response.data;
    },
  });
};

// Update notification preferences
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      const response = await apiClient.patch<NotificationPreferences>(
        `${NOTIFICATIONS_BASE_URL}/preferences/`,
        preferences
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences'], data);
      toast.success('Notification preferences updated');
    },
    onError: () => {
      toast.error('Failed to update notification preferences');
    },
  });
};
