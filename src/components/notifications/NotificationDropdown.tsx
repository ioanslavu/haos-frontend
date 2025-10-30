import { CheckCheck, Loader2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NotificationItem } from './NotificationItem';
import useNotificationStore from '@/stores/notificationStore';
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from '@/api/hooks/useNotifications';

export function NotificationDropdown() {
  const { isConnected } = useNotificationStore();
  const { data: notifications = [], isLoading } = useNotifications({ page_size: 20 });
  const markAllAsRead = useMarkAllNotificationsRead();

  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-4 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Notifications</h3>
          <div className="flex items-center gap-2">
            {/* Connection status indicator */}
            {!isConnected && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
              </div>
            )}
            {isConnected && (
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Connected" />
            )}
          </div>
        </div>

        {/* Actions */}
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start text-xs"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Separator />

      {/* Notifications list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              You'll be notified when something important happens
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
