import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SongStageTransition, SongNote, SongChecklistItem, SongAsset } from '@/types/song';
import { ArrowRight, MessageSquare, CheckCircle2, FileImage, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StageBadge } from './StageBadge';

export type ActivityType = 'transition' | 'note' | 'checklist' | 'asset';

interface ActivityLogItemProps {
  activity: SongStageTransition | SongNote | SongChecklistItem | SongAsset;
  type: ActivityType;
}

export const ActivityLogItem = ({ activity, type }: ActivityLogItemProps) => {
  // Safely parse date
  const getTimeAgo = () => {
    try {
      const date = new Date(activity.created_at);
      if (isNaN(date.getTime())) {
        return 'recently';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const timeAgo = getTimeAgo();

  // Get user initials for avatar
  const getUserInitials = (fullName: string) => {
    if (!fullName) return '??';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getIconConfig = () => {
    switch (type) {
      case 'transition':
        return { icon: ArrowRight, bgColor: 'bg-blue-100 dark:bg-blue-900', iconColor: 'text-blue-600 dark:text-blue-400' };
      case 'note':
        const note = activity as SongNote;
        return note.is_important
          ? { icon: AlertCircle, bgColor: 'bg-red-100 dark:bg-red-900', iconColor: 'text-red-600 dark:text-red-400' }
          : { icon: MessageSquare, bgColor: 'bg-purple-100 dark:bg-purple-900', iconColor: 'text-purple-600 dark:text-purple-400' };
      case 'checklist':
        return { icon: CheckCircle2, bgColor: 'bg-green-100 dark:bg-green-900', iconColor: 'text-green-600 dark:text-green-400' };
      case 'asset':
        return { icon: FileImage, bgColor: 'bg-orange-100 dark:bg-orange-900', iconColor: 'text-orange-600 dark:text-orange-400' };
      default:
        return { icon: MessageSquare, bgColor: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-600 dark:text-gray-400' };
    }
  };

  const { icon: Icon, bgColor, iconColor } = getIconConfig();

  if (type === 'transition') {
    const transition = activity as SongStageTransition;
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-sm font-medium">Stage Transition</span>
              <div className="flex items-center gap-2">
                <StageBadge stage={transition.from_stage} />
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <StageBadge stage={transition.to_stage} />
              </div>
            </div>
            {transition.notes && (
              <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{transition.notes}</p>
            )}
            {transition.created_by && (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {getUserInitials(transition.created_by.full_name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">
                  {transition.created_by.full_name} • {timeAgo}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (type === 'checklist') {
    const item = activity as SongChecklistItem;
    if (!item.completed_by) return null;
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Checklist Item Completed</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
            {item.completed_by && (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {getUserInitials(item.completed_by.full_name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">
                  {item.completed_by.full_name} • {timeAgo}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (type === 'asset') {
    const asset = activity as SongAsset;
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Asset Uploaded</span>
              <Badge variant="outline" className="text-xs">
                {asset.asset_type.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm font-medium mb-1">{asset.title}</p>
            {asset.description && (
              <p className="text-sm text-muted-foreground mb-2">{asset.description}</p>
            )}
            {asset.created_by && (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {getUserInitials(asset.created_by.full_name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">
                  {asset.created_by.full_name} • {timeAgo}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // type === 'note'
  const note = activity as SongNote;
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Note</span>
            {note.is_important && (
              <Badge variant="destructive" className="text-xs">
                Important
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{note.content}</p>
          {note.created_by && (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {getUserInitials(note.created_by.full_name)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground">
                {note.created_by.full_name} • {timeAgo}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
