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
        background: `linear-gradient(to right, ${note.color}25 0%, ${note.color}12 15%, ${note.color}06 35%, hsl(var(--card)) 70%)`,
        borderLeft: `3px solid ${note.color}`,
      }
    : {};

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] duration-200',
        note.color && 'border-l-[3px]',
      )}
      style={gradientStyle}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", note.is_pinned && "text-primary")}
              onClick={(e) => { e.stopPropagation(); onPin(); }}
              title={note.is_pinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className={cn("h-4 w-4", note.is_pinned && "fill-primary")} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map((tag) => (
            <Badge 
              key={tag.id} 
              variant="secondary"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
};
