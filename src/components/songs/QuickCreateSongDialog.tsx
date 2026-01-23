import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSong } from '@/api/songApi';
import { Song } from '@/types/song';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface QuickCreateSongDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSongCreated?: (song: Song) => void;
}

export function QuickCreateSongDialog({
  open,
  onOpenChange,
  onSongCreated,
}: QuickCreateSongDialogProps) {
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState<number | null>(null);
  const [isrc, setIsrc] = useState('');
  const queryClient = useQueryClient();

  const createSongMutation = useMutation({
    mutationFn: async () => {
      return createSong({
        title,
        artist: artistId || undefined,
        isrc: isrc || undefined,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success('Song created successfully');
      onSongCreated?.(response.data);
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create song');
    },
  });

  const handleClose = () => {
    setTitle('');
    setArtistId(null);
    setIsrc('');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    createSongMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Song</DialogTitle>
            <DialogDescription>
              Quickly create a new song with basic information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter song title"
                required
                autoFocus
              />
            </div>

            {/* Artist */}
            <div className="space-y-2">
              <Label htmlFor="artist" className="text-sm font-medium">
                Artist
              </Label>
              <EntitySearchCombobox
                value={artistId}
                onValueChange={setArtistId}
                placeholder="Select artist (optional)"
                filter={{ classification: 'CREATIVE', entity_type: 'artist' }}
                allowAddEntity={true}
              />
              <p className="text-xs text-muted-foreground">
                Optional - can be added later
              </p>
            </div>

            {/* ISRC (optional) */}
            <div className="space-y-2">
              <Label htmlFor="isrc" className="text-sm font-medium">
                ISRC
              </Label>
              <Input
                id="isrc"
                value={isrc}
                onChange={(e) => setIsrc(e.target.value)}
                placeholder="US-XXX-YY-NNNNN (optional)"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">
                International Standard Recording Code
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createSongMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSongMutation.isPending || !title.trim()}
            >
              {createSongMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Song
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
