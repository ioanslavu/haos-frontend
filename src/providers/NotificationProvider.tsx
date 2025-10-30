import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import useNotificationStore from '@/stores/notificationStore';
import { useUnreadCount } from '@/api/hooks/useNotifications';

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * NotificationProvider
 *
 * Initializes the notification system when user is authenticated:
 * - Connects WebSocket for real-time notifications
 * - Fetches initial unread count
 * - Disconnects WebSocket on logout
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { initializeWebSocket, disconnectWebSocket, setUnreadCount } = useNotificationStore();
  const { data: unreadCount } = useUnreadCount();

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[Notifications] Initializing for user:', user.email);

      // Initialize WebSocket connection
      initializeWebSocket();

      // Cleanup on unmount or logout
      return () => {
        console.log('[Notifications] Disconnecting');
        disconnectWebSocket();
      };
    } else {
      // Disconnect if logged out
      disconnectWebSocket();
    }
  }, [isAuthenticated, user, initializeWebSocket, disconnectWebSocket]);

  // Update unread count from API
  useEffect(() => {
    if (unreadCount !== undefined) {
      setUnreadCount(unreadCount);
    }
  }, [unreadCount, setUnreadCount]);

  return <>{children}</>;
};
