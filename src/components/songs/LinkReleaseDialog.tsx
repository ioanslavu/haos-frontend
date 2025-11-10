import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Disc3, Search, Loader2, Check, ChevronsUpDown, ExternalLink, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { addReleaseToSong } from '@/api/songApi';
import { cn } from '@/lib/utils';
import apiClient from '@/api/client';

interface LinkReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: number;
  onSuccess: () => void;
}

interface Release {
  id: number;
  title: string;
  upc?: string;
  release_type?: string;
  release_date?: string;
  label?: string;
}

export function LinkReleaseDialog({ open, onOpenChange, songId, onSuccess }: LinkReleaseDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [comboOpen, setComboOpen] = useState(false);

  // Search releases
  const { data: releasesData, isLoading: releasesLoading } = useQuery({
    queryKey: ['releases-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { data: { results: [] } };
      const response = await apiClient.get('/api/v1/releases/', {
        params: { search: searchQuery, page_size: 20 },
      });
      return response.data;
    },
    enabled: searchQuery.length >= 2,
  });

  const releases = releasesData?.results || [];

  // Link release mutation
  const linkMutation = useMutation({
    mutationFn: () => addReleaseToSong(songId, selectedRelease!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      toast({
        title: 'Release Linked',
        description: `"${selectedRelease?.title}" has been linked to this song.`,
      });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to link release. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setSelectedRelease(null);
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelease) {
      toast({
        title: 'Release Required',
        description: 'Please select a release to link.',
        variant: 'destructive',
      });
      return;
    }
    linkMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Disc3 className="h-5 w-5 text-primary" />
            Link Release
          </DialogTitle>
          <DialogDescription>
            Search for an existing release to link to this song.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Release Search */}
          <div className="space-y-2">
            <Label htmlFor="release">Release *</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between h-auto py-3 rounded-xl"
                >
                  {selectedRelease ? (
                    <div className="flex items-center gap-2">
                      <Disc3 className="h-4 w-4 text-primary" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">{selectedRelease.title}</p>
                        {selectedRelease.upc && (
                          <p className="text-xs text-muted-foreground font-mono">{selectedRelease.upc}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Search for a release...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[560px] p-0 rounded-xl" align="start">
                <Command>
                  <CommandInput
                    placeholder="Type to search releases by title or UPC..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandEmpty>
                    {searchQuery.length < 2 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        Type at least 2 characters to search
                      </div>
                    ) : releasesLoading ? (
                      <div className="py-6 text-center text-sm">
                        <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
                        Searching...
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        <Disc3 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p>No releases found for "{searchQuery}"</p>
                        <p className="text-xs mt-2">Try a different search term or create a new release</p>
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {releases.map((release: Release) => (
                      <CommandItem
                        key={release.id}
                        value={release.id.toString()}
                        onSelect={() => {
                          setSelectedRelease(release);
                          setComboOpen(false);
                        }}
                        className="flex items-start gap-3 py-4"
                      >
                        <Disc3 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{release.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {release.upc && (
                              <span className="text-xs text-muted-foreground font-mono">{release.upc}</span>
                            )}
                            {release.release_type && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {release.release_type.replace('_', ' ')}
                              </Badge>
                            )}
                            {release.release_date && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(release.release_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            selectedRelease?.id === release.id ? 'opacity-100 text-primary' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Search by release title or UPC code
            </p>
          </div>

          {/* Preview */}
          {selectedRelease && (
            <div className="space-y-3">
              <div className="p-4 bg-accent/50 border border-border/50 rounded-xl space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Selected Release:</p>
                  <p className="font-semibold">{selectedRelease.title}</p>
                </div>

                {selectedRelease.upc && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">UPC:</p>
                    <p className="font-mono text-sm">{selectedRelease.upc}</p>
                  </div>
                )}

                {(selectedRelease.release_type || selectedRelease.release_date || selectedRelease.label) && (
                  <div className="flex items-center gap-3 pt-2 border-t border-border/50 flex-wrap">
                    {selectedRelease.release_type && (
                      <Badge variant="secondary" className="capitalize">
                        {selectedRelease.release_type.replace('_', ' ')}
                      </Badge>
                    )}
                    {selectedRelease.release_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedRelease.release_date).toLocaleDateString()}
                      </span>
                    )}
                    {selectedRelease.label && (
                      <span className="text-xs text-muted-foreground">
                        {selectedRelease.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/catalog/releases/${selectedRelease.id}`, '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Release Details
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={linkMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedRelease || linkMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {linkMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Disc3 className="h-4 w-4 mr-2" />
                  Link Release
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
