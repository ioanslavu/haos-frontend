import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Music,
  Edit,
  CheckCircle,
  UserPlus,
  MessageSquare,
  Upload,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface Activity {
  id: string;
  type: 'create' | 'edit' | 'comment' | 'sign' | 'upload' | 'assign';
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  action: string;
  target?: string;
  timestamp: Date;
  metadata?: {
    category?: string;
    status?: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  maxHeight?: string;
}

const activityIcons = {
  create: FileText,
  edit: Edit,
  comment: MessageSquare,
  sign: CheckCircle,
  upload: Upload,
  assign: UserPlus,
};

const activityColors = {
  create: 'text-green-600 bg-green-100 dark:bg-green-900/20',
  edit: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
  comment: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  sign: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
  upload: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
  assign: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
};

export function ActivityFeed({ activities, maxHeight = '400px' }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type];
              const colorClasses = activityColors[activity.type];

              return (
                <div key={activity.id} className="flex gap-3 relative">
                  {/* Timeline line */}
                  {index < activities.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                  )}

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 border-2 border-background">
                    {activity.user.avatar ? (
                      <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    ) : (
                      <AvatarFallback>{activity.user.initials}</AvatarFallback>
                    )}
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user.name}</span>{' '}
                          <span className="text-muted-foreground">{activity.action}</span>
                          {activity.target && (
                            <span className="font-medium"> {activity.target}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </p>
                      </div>

                      {/* Activity type icon */}
                      <div className={`p-1.5 rounded-full ${colorClasses}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                    </div>

                    {/* Metadata */}
                    {activity.metadata && (
                      <div className="flex gap-2 pt-1">
                        {activity.metadata.category && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.category}
                          </Badge>
                        )}
                        {activity.metadata.status && (
                          <Badge variant="secondary" className="text-xs">
                            {activity.metadata.status}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Presence indicator component
export function PresenceIndicator({ users }: { users: Array<{ name: string; avatar?: string; initials: string }> }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user, index) => (
          <Avatar
            key={index}
            className="h-8 w-8 border-2 border-background hover:z-10 transition-transform hover:scale-110"
          >
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : (
              <AvatarFallback>{user.initials}</AvatarFallback>
            )}
          </Avatar>
        ))}
        {users.length > 3 && (
          <Avatar className="h-8 w-8 border-2 border-background">
            <AvatarFallback className="text-xs">+{users.length - 3}</AvatarFallback>
          </Avatar>
        )}
      </div>
      <span className="text-sm text-muted-foreground">
        {users.length} {users.length === 1 ? 'person' : 'people'} active
      </span>
    </div>
  );
}
