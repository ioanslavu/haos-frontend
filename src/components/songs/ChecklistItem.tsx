import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, HelpCircle, UserPlus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SongChecklistItem } from '@/types/song';
import { cn } from '@/lib/utils';

interface ChecklistItemProps {
  item: SongChecklistItem;
  songId?: number;
  onToggle?: (itemId: number) => void;
  onAssign?: (itemId: number) => void;
  disabled?: boolean;
}

export const ChecklistItem = ({ item, songId, onToggle, onAssign, disabled = false }: ChecklistItemProps) => {
  // Check if item is manual based on validation_type
  const isManual = item.validation_type === 'manual';

  const handleToggle = () => {
    if (!disabled && isManual && onToggle) {
      onToggle(item.id);
    }
  };

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAssign) {
      onAssign(item.id);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-md border',
        item.is_complete ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200',
        isManual && !disabled && 'hover:bg-gray-50 cursor-pointer'
      )}
      onClick={handleToggle}
    >
      <div className="flex items-center pt-0.5">
        {!isManual ? (
          <CheckCircle2
            className={cn(
              'h-5 w-5',
              item.is_complete ? 'text-green-600' : 'text-gray-400'
            )}
          />
        ) : (
          <Checkbox
            checked={item.is_complete}
            disabled={disabled}
            onCheckedChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={cn(
              'text-sm font-medium',
              item.is_complete ? 'text-green-900 line-through' : 'text-gray-900'
            )}
          >
            {item.description}
          </p>
          {!isManual && (
            <Badge variant="outline" className="text-xs">
              Auto
            </Badge>
          )}
          {item.help_text && (
            <Tooltip>
              <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                <HelpCircle className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{item.help_text}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {item.assigned_to_name && !item.is_complete && (
          <p className="text-xs text-blue-600 mt-1 font-medium">
            Assigned to {item.assigned_to_name}
          </p>
        )}

        {item.completed_at && item.completed_by_name && (
          <p className="text-xs text-gray-500 mt-1">
            Completed by {item.completed_by_name} on{' '}
            {new Date(item.completed_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {onAssign && songId && !item.is_complete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAssignClick}
          className="ml-auto flex-shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span className="ml-1 text-xs">
            {item.assigned_to_name ? 'Reassign' : 'Assign'}
          </span>
        </Button>
      )}
    </div>
  );
};
