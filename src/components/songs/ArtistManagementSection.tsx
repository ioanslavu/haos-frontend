import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Plus, X, Music2, Star, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { removeFeaturedArtist, reorderFeaturedArtists } from '@/api/songApi';
import { Song, SongArtist } from '@/types/song';
import { AddArtistDialog } from './AddArtistDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ArtistManagementSectionProps {
  song: Song;
}

interface SortableArtistItemProps {
  artist: SongArtist;
  onRemove: (id: number) => void;
}

function SortableArtistItem({ artist, onRemove }: SortableArtistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: artist.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center gap-3 p-4 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded-lg transition-colors"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* Artist Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Music2 className="h-4 w-4 text-primary shrink-0" />
          <p className="font-semibold text-sm truncate">{artist.artist_display_name}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{artist.role_display}</p>
      </div>

      {/* Role Badge */}
      <Badge variant="secondary" className="shrink-0 capitalize">
        {artist.role}
      </Badge>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onRemove(artist.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ArtistManagementSection({ song }: ArtistManagementSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [artistToRemove, setArtistToRemove] = useState<number | null>(null);
  const [localArtists, setLocalArtists] = useState<SongArtist[]>(song.featured_artists || []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (artistCredits: Array<{ id: number; order: number }>) =>
      reorderFeaturedArtists(song.id, artistCredits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song', song.id] });
      toast({
        title: 'Artists Reordered',
        description: 'Featured artist order updated successfully.',
      });
    },
    onError: () => {
      // Revert on error
      setLocalArtists(song.featured_artists || []);
      toast({
        title: 'Error',
        description: 'Failed to reorder artists. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: (creditId: number) => removeFeaturedArtist(song.id, creditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song', song.id] });
      toast({
        title: 'Artist Removed',
        description: 'Featured artist removed successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove artist. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localArtists.findIndex((a) => a.id === active.id);
      const newIndex = localArtists.findIndex((a) => a.id === over.id);

      const newOrder = arrayMove(localArtists, oldIndex, newIndex);
      setLocalArtists(newOrder);

      // Update order values and send to backend
      const artistCredits = newOrder.map((artist, index) => ({
        id: artist.id,
        order: index,
      }));

      reorderMutation.mutate(artistCredits);
    }
  };

  const handleRemove = (creditId: number) => {
    setArtistToRemove(creditId);
  };

  const confirmRemove = () => {
    if (artistToRemove) {
      removeMutation.mutate(artistToRemove);
      setArtistToRemove(null);
    }
  };

  // Sync local state with props when data updates
  useState(() => {
    setLocalArtists(song.featured_artists || []);
  });

  return (
    <>
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Music2 className="h-5 w-5 text-primary" />
                Artists
              </CardTitle>
              <CardDescription>
                Manage primary and featured artists for this song
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Artist
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Primary Artist */}
          {song.artist && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Star className="h-5 w-5 text-primary fill-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{song.artist.display_name}</p>
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    Primary Artist
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Main artist for this song</p>
              </div>
            </div>
          )}

          {/* Featured Artists */}
          {localArtists.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Music2 className="h-4 w-4" />
                <span>Featured Artists ({localArtists.length})</span>
                <span className="text-xs">• Drag to reorder</span>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localArtists.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {localArtists.map((artist) => (
                      <SortableArtistItem
                        key={artist.id}
                        artist={artist}
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl">
              <Music2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-2">No featured artists yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add featured artists, remixers, or producers to this song
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Artist
              </Button>
            </div>
          )}

          {/* Display Format Preview */}
          {song.display_artists && (
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Display Format:</p>
              <p className="text-sm font-medium text-foreground/80 italic">
                "{song.display_artists}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Artist Dialog */}
      <AddArtistDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        songId={song.id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['song', song.id] });
          setShowAddDialog(false);
        }}
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!artistToRemove} onOpenChange={() => setArtistToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Featured Artist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the artist credit from this song. This action can be undone by adding the artist again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Artist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
