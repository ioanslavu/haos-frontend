import { NoteListItem } from '@/types/notes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pin, Archive, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: NoteListItem;
  onClick: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export const NoteCard = ({ note, onClick, onPin, onArchive, onDelete }: NoteCardProps) => {
  const gradientStyle = note.color
    ? {
        background: `linear-gradient(135deg, ${note.color}15 0%, hsl(var(--background)) 50%)`,
        borderColor: `${note.color}40`,
      }
    : {};

  return (
    <Card
      className={cn(
        'cursor-pointer group relative overflow-hidden',
        'rounded-2xl border-0 bg-background/50 backdrop-blur-xl shadow-lg',
        'transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1'
      )}
      style={gradientStyle}
      onClick={onClick}
    >
      {/* Color accent bar on left */}
      {note.color && (
        <div className="absolute left-0 top-0 bottom-0 w-1 opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: note.color }} />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">{note.title}</CardTitle>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-xl", note.is_pinned && "text-violet-600 dark:text-violet-400 opacity-100")}
              onClick={(e) => { e.stopPropagation(); onPin(); }}
              title={note.is_pinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className={cn("h-4 w-4", note.is_pinned && "fill-violet-600 dark:fill-violet-400")} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                  <Archive className="h-4 w-4 mr-2" />
                  {note.is_archived ? 'Restore' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {note.preview || 'No content'}
        </p>
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {note.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="rounded-lg px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '30' }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground/70">
          Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
};
