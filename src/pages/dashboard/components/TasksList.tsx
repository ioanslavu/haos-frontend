
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, User, Calendar, FileText, Bell, Music, AlertCircle } from 'lucide-react';
import apiClient from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { useTaskInbox } from '@/api/hooks/useTasks';

interface Task {
  id: number;
  title: string;
  status: string;
  priority: number;
  task_type: string;
  due_date?: string;
  project?: number;
  song_detail?: { id: number; title: string };
  opportunity_detail?: { id: number; title: string };
  deliverable_detail?: {
    id: number;
    deliverable_type: string;
    opportunity?: { id: number; title: string }
  };
  contract_detail?: { id: number };
  department?: { name: string };
  assignments?: { user: number; user_name?: string }[];
  assigned_user_ids?: number[];
}

interface Notification {
  id: number;
  message: string;
  notification_type: string;
  action_url: string;
  created_at: string;
  is_read: boolean;
}

interface InboxResponse {
  tasks: Task[];
  notifications: Notification[];
  summary: {
    total_tasks: number;
    active_tasks: number;
    blocked_tasks: number;
    unread_notifications: number;
    overdue_tasks: number;
  };
}

export const TasksList: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useTaskInbox();

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 4: return 'urgent';
      case 3: return 'high';
      case 2: return 'normal';
      default: return 'low';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'bg-red-50 text-red-700 border-red-200';
      case 3: return 'bg-orange-50 text-orange-700 border-orange-200';
      case 2: return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract_prep':
      case 'approval':
        return FileText;
      case 'content_creation':
      case 'campaign_setup':
        return Music;
      case 'platform_setup':
        return CheckSquare;
      default:
        return User;
    }
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';
    if (diffDays <= 7) return `${diffDays} days`;
    return date.toLocaleDateString();
  };

  const handleTaskClick = (task: Task) => {
    // Navigate to the workboard project page with task modal open
    if (task.project) {
      navigate(`/workboard/${task.project}?taskId=${task.id}`);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    try {
      await apiClient.patch(`/api/v1/notifications/${notification.id}/mark-read/`);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    // Navigate to action URL
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-white/20 dark:border-white/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-transparent" />
        <CardHeader className="pb-3 relative">
          <CardTitle className="text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            My Inbox
          </CardTitle>
        </CardHeader>
        <CardContent className="relative space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border-white/20 dark:border-white/10 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-transparent" />
        <CardHeader className="pb-3 relative">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Error Loading Inbox
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <p className="text-sm text-muted-foreground">
            Failed to load your tasks and notifications. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { tasks = [], notifications = [], summary } = data || {};
  const hasItems = tasks.length > 0 || notifications.length > 0;

  return (
    <Card className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-transparent" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            My Inbox
            {summary && (
              <Badge variant="secondary" className="ml-2 rounded-full">
                {summary.active_tasks + summary.unread_notifications}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {!hasItems ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">All caught up! No pending tasks or notifications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tasks Section */}
            {tasks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Tasks ({tasks.length})
                </h3>
                {tasks.map((task) => {
                  const TypeIcon = getTypeIcon(task.task_type);
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="flex items-start gap-3 p-3 rounded-xl border border-white/20 dark:border-white/10 backdrop-blur-sm transition-all duration-300 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 hover:scale-[1.01] cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                            <TypeIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <Badge
                            variant="outline"
                            className={`rounded-full backdrop-blur-sm border font-semibold ${getPriorityColor(task.priority)}`}
                          >
                            {getPriorityLabel(task.priority)}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive" className="rounded-full text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-sm mb-1">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                          {task.department && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.department.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDueDate(task.due_date)}
                          </span>
                          {task.song_detail && (
                            <span className="flex items-center gap-1">
                              <Music className="h-3 w-3" />
                              {task.song_detail.title}
                            </span>
                          )}
                          {task.opportunity_detail && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {task.opportunity_detail.title}
                            </span>
                          )}
                          {task.deliverable_detail?.opportunity && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {task.deliverable_detail.opportunity.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notifications Section */}
            {notifications.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Notifications ({notifications.length})
                </h3>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="flex items-start gap-3 p-3 rounded-xl border border-white/20 dark:border-white/10 backdrop-blur-sm transition-all duration-300 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 hover:scale-[1.01] cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()} at{' '}
                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
