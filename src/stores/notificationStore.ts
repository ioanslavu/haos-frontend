import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getWebSocketService } from '@/services/websocket';
import { toast } from 'sonner';

export type NotificationType =
  | 'assignment'
  | 'mention'
  | 'status_change'
  | 'contract_signed'
  | 'contract_created'
  | 'comment'
  | 'system';

export interface Notification {
  id: number;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  user?: number;
  content_type?: number;
  content_type_name?: string;
  object_id?: number;
  metadata?: Record<string, any>;
  updated_at?: string;
}

interface NotificationState {
  // Real-time notifications from WebSocket
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  connectionError: string | null;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  clearNotifications: () => void;

  // WebSocket management
  initializeWebSocket: () => void;
  disconnectWebSocket: () => void;
}

const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isConnected: false,
      connectionError: null,

      // Add new notification (from WebSocket)
      addNotification: (notification) => {
        set((state) => {
          // Check if notification already exists
          const exists = state.notifications.some(n => n.id === notification.id);
          if (exists) return state;

          return {
            notifications: [notification, ...state.notifications],
            unreadCount: notification.is_read ? state.unreadCount : state.unreadCount + 1,
          };
        });

        // Show toast for new notification
        if (!notification.is_read) {
          toast(notification.message, {
            description: new Date(notification.created_at).toLocaleString(),
            action: notification.action_url ? {
              label: 'View',
              onClick: () => {
                if (notification.action_url) {
                  window.location.href = notification.action_url;
                }
              }
            } : undefined,
            duration: 5000,
          });
        }
      },

      // Mark notification as read
      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          if (!notification || notification.is_read) return state;

          return {
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, is_read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      // Mark all as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, is_read: true })),
          unreadCount: 0,
        }));
      },

      // Remove notification
      removeNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          const unreadCountDelta = notification && !notification.is_read ? 1 : 0;

          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: Math.max(0, state.unreadCount - unreadCountDelta),
          };
        });
      },

      // Set notifications (from API fetch)
      setNotifications: (notifications) => {
        set({ notifications });
      },

      // Set unread count
      setUnreadCount: (count) => {
        set({ unreadCount: count });
      },

      // Set connection state
      setConnected: (connected) => {
        set({ isConnected: connected, connectionError: connected ? null : get().connectionError });
      },

      // Set connection error
      setConnectionError: (error) => {
        set({ connectionError: error, isConnected: false });
      },

      // Clear all notifications
      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      // Initialize WebSocket connection
      initializeWebSocket: () => {
        const wsService = getWebSocketService();

        // Subscribe to WebSocket messages
        wsService.subscribe((message) => {
          const state = get();

          switch (message.type) {
            case 'connection_established':
              console.log('[Notifications] WebSocket connected');
              state.setConnected(true);
              break;

            case 'notification':
              // New notification received
              if (message.notification) {
                state.addNotification(message.notification);
              }
              break;

            case 'pong':
              // Heartbeat response - connection is alive
              break;

            case 'error':
              console.error('[Notifications] WebSocket error:', message.message);
              state.setConnectionError(message.message);
              break;

            default:
              console.log('[Notifications] Unknown message type:', message.type);
          }
        });

        // Connect to WebSocket
        wsService.connect();

        // Update connection state
        setTimeout(() => {
          get().setConnected(wsService.isConnected());
        }, 1000);
      },

      // Disconnect WebSocket
      disconnectWebSocket: () => {
        const wsService = getWebSocketService();
        wsService.disconnect();
        set({ isConnected: false });
      },
    }),
    { name: 'NotificationStore' }
  )
);

export default useNotificationStore;
