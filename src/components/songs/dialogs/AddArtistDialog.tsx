import { useState } from 'react';
import { Check, ChevronsUpDown, Music2, Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSearchEntities, useAddFeaturedArtist } from '@/api/hooks/useSongs';

interface AddArtistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: number;
  onSuccess: () => void;
}

interface Entity {
  id: number;
  name: string;
  display_name: string;
  type: string;
}

const ARTIST_ROLES = [
  { value: 'featured', label: 'Featured Artist' },
  { value: 'remixer', label: 'Remixer' },
  { value: 'producer', label: 'Producer' },
  { value: 'composer', label: 'Composer' },
  { value: 'featuring', label: 'Featuring' },
];

export function AddArtistDialog({ open, onOpenChange, songId, onSuccess }: AddArtistDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<Entity | null>(null);
  const [role, setRole] = useState('featured');
  const [comboOpen, setComboOpen] = useState(false);

  // Search entities
  const { data: entitiesData, isLoading: entitiesLoading } = useSearchEntities(searchQuery);

  const entities = entitiesData || [];

  // Add artist mutation
  const addMutation = useAddFeaturedArtist();

  const handleClose = () => {
    setSelectedArtist(null);
    setRole('featured');
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtist) {
      toast({
        title: 'Artist Required',
        description: 'Please select an artist to add.',
        variant: 'destructive',
      });
      return;
    }
    addMutation.mutate(
      { songId, data: { artist_id: selectedArtist.id, role } },
      {
        onSuccess: () => {
          toast({
            title: 'Artist Added',
            description: `${selectedArtist?.display_name} added as ${ARTIST_ROLES.find(r => r.value === role)?.label}`,
          });
          onSuccess();
          handleClose();
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.response?.data?.error || 'Failed to add artist. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Music2 className="h-5 w-5 text-primary" />
            Add Featured Artist
          </DialogTitle>
          <DialogDescription>
            Search for an artist and select their role on this song.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Artist Search */}
          <div className="space-y-2">
            <Label htmlFor="artist">Artist *</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between h-auto py-3 rounded-xl"
                >
                  {selectedArtist ? (
                    <div className="flex items-center gap-2">
                      <Music2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{selectedArtist.display_name}</span>
                      <span className="text-xs text-muted-foreground">({selectedArtist.type})</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search for an artist...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-0 rounded-xl" align="start">
                <Command>
                  <CommandInput
                    placeholder="Type to search artists..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandEmpty>
                    {searchQuery.length < 2 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        Type at least 2 characters to search
                      </div>
                    ) : entitiesLoading ? (
                      <div className="py-6 text-center text-sm">
                        <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
                        Searching...
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No artists found for "{searchQuery}"
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {entities.map((entity: Entity) => (
                      <CommandItem
                        key={entity.id}
                        value={entity.id.toString()}
                        onSelect={() => {
                          setSelectedArtist(entity);
                          setComboOpen(false);
                        }}
                        className="flex items-center gap-3 py-3"
                      >
                        <Music2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{entity.display_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{entity.type}</p>
                        </div>
                        <Check
                          className={cn(
                            'h-4 w-4',
                            selectedArtist?.id === entity.id ? 'opacity-100 text-primary' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Search by artist name to add them to this song
            </p>
          </div>

          {/* Role Selector */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select artist role" />
              </SelectTrigger>
              <SelectContent>
                {ARTIST_ROLES.map((roleOption) => (
                  <SelectItem key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Specify the artist's role on this song
            </p>
          </div>

          {/* Preview */}
          {selectedArtist && (
            <div className="p-4 bg-accent/50 border border-border/50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <p className="text-sm font-medium">
                {selectedArtist.display_name} • {ARTIST_ROLES.find(r => r.value === role)?.label}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedArtist || addMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Music2 className="h-4 w-4 mr-2" />
                  Add Artist
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
