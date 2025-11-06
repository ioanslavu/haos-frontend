import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SongChecklistItem } from '@/types/song';
import { cn } from '@/lib/utils';

interface ChecklistItemProps {
  item: SongChecklistItem;
  onToggle?: (itemId: number) => void;
  disabled?: boolean;
}

export const ChecklistItem = ({ item, onToggle, disabled = false }: ChecklistItemProps) => {
  const handleToggle = () => {
    if (!disabled && !item.is_automatic && onToggle) {
      onToggle(item.id);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-md border',
        item.is_completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200',
        !item.is_automatic && !disabled && 'hover:bg-gray-50 cursor-pointer'
      )}
      onClick={handleToggle}
    >
      <div className="flex items-center pt-0.5">
        {item.is_automatic ? (
          <CheckCircle2
            className={cn(
              'h-5 w-5',
              item.is_completed ? 'text-green-600' : 'text-gray-400'
            )}
          />
        ) : (
          <Checkbox
            checked={item.is_completed}
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
              item.is_completed ? 'text-green-900 line-through' : 'text-gray-900'
            )}
          >
            {item.description}
          </p>
          {item.is_automatic && (
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

        {item.completed_at && item.completed_by && (
          <p className="text-xs text-gray-500 mt-1">
            Completed by {item.completed_by.full_name} on{' '}
            {new Date(item.completed_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};
