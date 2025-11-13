import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, X, Music, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchSongs, fetchSongDetail } from '@/api/songApi';
import { Song } from '@/types/song';

interface SongSearchComboboxProps {
  value?: number | null;
  onValueChange: (songId: number | null) => void;
  onSongSelect?: (song: Song | null) => void;
  placeholder?: string;
  className?: string;
  onCreateNew?: () => void;
}

export function SongSearchCombobox({
  value,
  onValueChange,
  onSongSelect,
  placeholder = 'Search songs...',
  className,
  onCreateNew,
}: SongSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  // Fetch selected song if value is provided (for edit mode)
  const { data: initialSong } = useQuery({
    queryKey: ['song', value],
    queryFn: () => fetchSongDetail(value!).then(res => res.data),
    enabled: !!value && value > 0 && !selectedSong,
  });

  // Update selected song when initial song is fetched
  useEffect(() => {
    if (initialSong && value && !selectedSong) {
      setSelectedSong(initialSong);
    }
  }, [initialSong, value, selectedSong]);

  // Clear selected song when value is cleared from outside
  useEffect(() => {
    if (!value && selectedSong) {
      setSelectedSong(null);
    }
  }, [value, selectedSong]);

  // Search songs
  const { data: songsData, isLoading } = useQuery({
    queryKey: ['songs', 'search', searchQuery],
    queryFn: () => fetchSongs({ search: searchQuery, page_size: 50 }).then(res => res.data),
    enabled: searchQuery.length >= 2,
  });

  const songs = songsData?.results || [];

  const handleSelect = (song: Song) => {
    setSelectedSong(song);
    onValueChange(song.id);
    onSongSelect?.(song);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    setSelectedSong(null);
    onValueChange(null);
    onSongSelect?.(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && !(event.target as Element).closest('.song-search-combobox')) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={cn('song-search-combobox relative', className)}>
      {/* Selected Song Display or Search Button */}
      {selectedSong ? (
        <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-md">
          <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedSong.title}</p>
            {selectedSong.artist?.display_name && (
              <p className="text-xs text-muted-foreground truncate">
                {selectedSong.artist.display_name}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 hover:bg-destructive/10"
          >
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="w-full justify-between"
        >
          <span className="text-muted-foreground">{placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      )}

      {/* Dropdown */}
      {open && !selectedSong && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, artist, ISRC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}

            {!isLoading && searchQuery.length >= 2 && songs.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No songs found</p>
                {onCreateNew && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                    className="text-xs"
                  >
                    + Create New Song
                  </Button>
                )}
              </div>
            )}

            {!isLoading && searchQuery.length < 2 && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            )}

            {!isLoading && songs.length > 0 && (
              <div className="py-1">
                {songs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => handleSelect(song)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {song.artist?.display_name && (
                          <span className="truncate">{song.artist.display_name}</span>
                        )}
                        {song.isrc && (
                          <span className="flex-shrink-0">• ISRC: {song.isrc}</span>
                        )}
                      </div>
                    </div>
                    <Check className="h-4 w-4 opacity-0" />
                  </button>
                ))}
              </div>
            )}

            {onCreateNew && songs.length > 0 && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onCreateNew();
                  }}
                  className="w-full justify-start text-xs"
                >
                  + Create New Song
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
