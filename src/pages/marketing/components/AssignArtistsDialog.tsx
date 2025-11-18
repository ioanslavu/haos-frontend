import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, UserCircle, Search } from 'lucide-react';
import {
  useAssignableArtists,
  useManagerAssignments,
  useBulkAssignments,
} from '@/api/hooks/useAssignments';
import { TeamMember } from '@/api/types/assignments';

interface AssignArtistsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
}

export const AssignArtistsDialog = ({
  open,
  onOpenChange,
  member,
}: AssignArtistsDialogProps) => {
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: artists, isLoading: isLoadingArtists } = useAssignableArtists();
  const { data: currentAssignments, isLoading: isLoadingAssignments } = useManagerAssignments(
    member?.id
  );
  const { assignArtists, unassignArtists, isLoading: isSaving } = useBulkAssignments();

  // Filter artists based on search query
  const filteredArtists = useMemo(() => {
    if (!artists) return [];

    const query = searchQuery.trim().toLowerCase();
    if (!query) return artists;

    return artists.filter(
      (artist) =>
        artist.display_name.toLowerCase().includes(query) ||
        artist.stage_name?.toLowerCase().includes(query)
    );
  }, [artists, searchQuery]);

  // Initialize selected artists based on current assignments
  useEffect(() => {
    if (currentAssignments && open) {
      const assignedArtistIds = currentAssignments
        .filter((assignment) => assignment.is_active)
        .map((assignment) => assignment.artist);
      setSelectedArtistIds(assignedArtistIds);
    }
  }, [currentAssignments, open]);

  const handleToggleArtist = (artistId: number) => {
    setSelectedArtistIds((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : [...prev, artistId]
    );
  };

  const handleSave = async () => {
    if (!member) return;

    try {
      // Get current assigned artist IDs
      const currentArtistIds =
        currentAssignments
          ?.filter((assignment) => assignment.is_active)
          .map((assignment) => assignment.artist) || [];

      // Calculate changes
      const toAdd = selectedArtistIds.filter((id) => !currentArtistIds.includes(id));
      const toRemove = currentArtistIds.filter((id) => !selectedArtistIds.includes(id));

      // Get assignment IDs to remove
      const assignmentIdsToRemove =
        currentAssignments
          ?.filter((assignment) => toRemove.includes(assignment.artist) && assignment.is_active)
          .map((assignment) => assignment.id) || [];

      // Execute changes sequentially to handle errors better
      if (assignmentIdsToRemove.length > 0) {
        await unassignArtists(assignmentIdsToRemove);
      }

      if (toAdd.length > 0) {
        await assignArtists(member.id, toAdd);
      }

      onOpenChange(false);
      setSearchQuery(''); // Reset search on close
    } catch (error) {
      console.error('Failed to save assignments:', error);
      // Error toasts are handled by the mutation hooks
    }
  };

  const isLoading = isLoadingArtists || isLoadingAssignments;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Creative People</DialogTitle>
          <DialogDescription>
            Select internal creative people (artists, producers, lyricists) to assign to {member?.full_name}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creative people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="max-h-96 pr-4">
              <div className="space-y-4">
                {filteredArtists && filteredArtists.length > 0 ? (
                  filteredArtists.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      id={`artist-${artist.id}`}
                      checked={selectedArtistIds.includes(artist.id)}
                      onCheckedChange={() => handleToggleArtist(artist.id)}
                    />
                    <Label
                      htmlFor={`artist-${artist.id}`}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      {artist.profile_photo ? (
                        <img
                          src={artist.profile_photo}
                          alt={artist.display_name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{artist.display_name}</p>
                        {artist.stage_name && (
                          <p className="text-xs text-muted-foreground">{artist.stage_name}</p>
                        )}
                      </div>
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  {searchQuery ? 'No creative people found matching your search' : 'No creative people available'}
                </p>
              )}
            </div>
          </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
