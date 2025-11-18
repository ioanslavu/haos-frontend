import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, HelpCircle, UserPlus, Link as LinkIcon, Check, FileEdit, Eye } from 'lucide-react';
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
  onUpdateAssetUrl?: (itemId: number, assetUrl: string) => void;
  onOpenTaskModal?: (itemId: number) => void;
  disabled?: boolean;
}

export const ChecklistItem = ({
  item,
  songId,
  onToggle,
  onAssign,
  onUpdateAssetUrl,
  onOpenTaskModal,
  disabled = false
}: ChecklistItemProps) => {
  const [assetUrl, setAssetUrl] = useState(item.asset_url || '');
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  // Check if item is manual based on validation_type
  const isManual = item.validation_type === 'manual';
  const hasTaskInputs = item.template_item_detail?.has_task_inputs || false;
  const needsQuantityTasks = (item.template_item_detail?.quantity || 0) > 1;

  const handleToggle = () => {
    if (disabled) return;

    // If item has task inputs or needs multiple instances, open task modal
    if ((hasTaskInputs || needsQuantityTasks) && onOpenTaskModal) {
      onOpenTaskModal(item.id);
      return;
    }

    // Otherwise, simple checkbox toggle
    if (isManual && onToggle) {
      onToggle(item.id);
    }
  };

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAssign) {
      onAssign(item.id);
    }
  };

  const handleSaveUrl = () => {
    if (onUpdateAssetUrl && assetUrl.trim() && assetUrl !== item.asset_url) {
      onUpdateAssetUrl(item.id, assetUrl.trim());
    }
    setIsEditingUrl(false);
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveUrl();
    } else if (e.key === 'Escape') {
      setAssetUrl(item.asset_url || '');
      setIsEditingUrl(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-md border',
        item.is_complete
          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
        isManual && !disabled && 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
      )}
      onClick={handleToggle}
    >
      <div className="flex items-center pt-0.5">
        {!isManual ? (
          <CheckCircle2
            className={cn(
              'h-5 w-5',
              item.is_complete ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
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
              item.is_complete
                ? 'text-green-900 dark:text-green-100 line-through'
                : 'text-gray-900 dark:text-gray-100'
            )}
          >
            {item.description}
          </p>
          {!isManual && (
            <Badge variant="outline" className="text-xs">
              Auto
            </Badge>
          )}
          {item.template_item_detail?.has_task_inputs && (
            <Tooltip>
              <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                  <FileEdit className="h-3 w-3 mr-1" />
                  Inputs Required
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">This task requires filling in additional information</p>
              </TooltipContent>
            </Tooltip>
          )}
          {item.template_item_detail?.requires_review && (
            <Tooltip>
              <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                  <Eye className="h-3 w-3 mr-1" />
                  Requires Review
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Completion requires manager approval</p>
              </TooltipContent>
            </Tooltip>
          )}
          {item.template_item_detail?.quantity && item.template_item_detail.quantity > 1 && (
            <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
              {item.template_item_detail.completed_count}/{item.template_item_detail.quantity} completed
            </Badge>
          )}
          {item.template_item_detail?.pending_review_count > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
              {item.template_item_detail.pending_review_count} pending review
            </Badge>
          )}
          {item.help_text && (
            <Tooltip>
              <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                <HelpCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{item.help_text}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {item.assigned_to_name && !item.is_complete && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
            Assigned to {item.assigned_to_name}
          </p>
        )}

        {item.completed_at && item.completed_by_name && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Completed by {item.completed_by_name} on{' '}
            {new Date(item.completed_at).toLocaleDateString()}
          </p>
        )}

        {/* Asset URL Input - only show for manual items */}
        {isManual && onUpdateAssetUrl && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            {item.asset_url && !isEditingUrl ? (
              <div className="flex items-center gap-2">
                <a
                  href={item.asset_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  <LinkIcon className="h-3 w-3" />
                  View Asset
                </a>
                {!item.is_complete && !disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingUrl(true)}
                    className="h-6 px-2 text-xs"
                  >
                    Edit URL
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="Paste asset URL (Google Drive, Dropbox, etc.)"
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  onKeyDown={handleUrlKeyDown}
                  onFocus={() => setIsEditingUrl(true)}
                  className="h-8 text-xs"
                  disabled={disabled}
                />
                {isEditingUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveUrl}
                    disabled={!assetUrl.trim() || assetUrl === item.asset_url}
                    className="h-8 px-2"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        {/* Complete Task button for items with inputs or quantity requirements */}
        {(hasTaskInputs || needsQuantityTasks) && onOpenTaskModal && !item.is_complete && (
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTaskModal(item.id);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileEdit className="h-4 w-4" />
            <span className="ml-1 text-xs">
              {needsQuantityTasks ? 'Add Instance' : 'Complete Task'}
            </span>
          </Button>
        )}

        {onAssign && songId && !item.is_complete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAssignClick}
          >
            <UserPlus className="h-4 w-4" />
            <span className="ml-1 text-xs">
              {item.assigned_to_name ? 'Reassign' : 'Assign'}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};
