import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, HelpCircle, UserPlus, Link as LinkIcon, Check } from 'lucide-react';
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
  disabled?: boolean;
}

export const ChecklistItem = ({
  item,
  songId,
  onToggle,
  onAssign,
  onUpdateAssetUrl,
  disabled = false
}: ChecklistItemProps) => {
  const [assetUrl, setAssetUrl] = useState(item.asset_url || '');
  const [isEditingUrl, setIsEditingUrl] = useState(false);

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

        {/* Asset URL Input - only show for manual items */}
        {isManual && onUpdateAssetUrl && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            {item.asset_url && !isEditingUrl ? (
              <div className="flex items-center gap-2">
                <a
                  href={item.asset_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
