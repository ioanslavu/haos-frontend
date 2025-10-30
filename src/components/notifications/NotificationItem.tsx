import { formatDistanceToNow } from 'date-fns';
import { X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/stores/notificationStore';
import { useMarkNotificationRead, useDeleteNotification } from '@/api/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
}

const notificationTypeColors: Record<string, string> = {
  assignment: 'bg-blue-500',
  mention: 'bg-purple-500',
  status_change: 'bg-yellow-500',
  contract_signed: 'bg-green-500',
  contract_created: 'bg-cyan-500',
  comment: 'bg-pink-500',
  system: 'bg-gray-500',
};

const notificationTypeLabels: Record<string, string> = {
  assignment: 'Assignment',
  mention: 'Mention',
  status_change: 'Status Change',
  contract_signed: 'Contract Signed',
  contract_created: 'Contract Created',
  comment: 'Comment',
  system: 'System',
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate();
  const markAsRead = useMarkNotificationRead();
  const deleteNotification = useDeleteNotification();

  const handleClick = () => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate if action URL exists
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification.mutate(notification.id);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0',
        !notification.is_read && 'bg-muted/30'
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
        </div>
      )}

      {/* Type indicator */}
      <div
        className={cn(
          'h-2 w-2 rounded-full mt-2 flex-shrink-0',
          notificationTypeColors[notification.notification_type] || 'bg-gray-500'
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{notification.message}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={handleDelete}
            aria-label="Delete notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {notificationTypeLabels[notification.notification_type] || notification.notification_type}
          </Badge>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
