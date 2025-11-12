import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Link as LinkIcon,
  Copy,
  Archive,
  Trash2,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface FloatingToolbarProps {
  onCopyLink?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onOpenInNew?: () => void;
  className?: string;
}

export function FloatingToolbar({
  onCopyLink,
  onDuplicate,
  onArchive,
  onDelete,
  onOpenInNew,
  className,
}: FloatingToolbarProps) {
  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1 p-1 bg-background/95 backdrop-blur-sm',
          'border rounded-lg shadow-lg',
          'animate-in fade-in slide-in-from-top-2 duration-200',
          className
        )}
      >
        {onCopyLink && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopyLink}
                className="h-8 w-8 p-0"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy link</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onDuplicate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDuplicate}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Duplicate task</p>
            </TooltipContent>
          </Tooltip>
        )}

        {onOpenInNew && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenInNew}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in new window</p>
            </TooltipContent>
          </Tooltip>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onArchive && (
              <>
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete task
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
