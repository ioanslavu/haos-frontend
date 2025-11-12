import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Artist } from '@/types/camps';

interface ArtistMultiSelectProps {
  artists: Artist[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ArtistMultiSelect({
  artists = [],
  selectedIds,
  onSelectionChange,
  disabled,
  placeholder = 'Select artists...',
}: ArtistMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Ensure artists is always an array
  const artistsList = Array.isArray(artists) ? artists : [];

  const selectedArtists = artistsList.filter((artist) =>
    selectedIds.includes(artist.id)
  );

  const toggleArtist = (artistId: number) => {
    if (selectedIds.includes(artistId)) {
      onSelectionChange(selectedIds.filter((id) => id !== artistId));
    } else {
      onSelectionChange([...selectedIds, artistId]);
    }
  };

  const removeArtist = (artistId: number) => {
    onSelectionChange(selectedIds.filter((id) => id !== artistId));
  };

  return (
    <div className="w-full space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedArtists.length > 0
                ? `${selectedArtists.length} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search artists..." />
            <CommandList>
              <CommandEmpty>No artist found.</CommandEmpty>
              <CommandGroup>
                {artistsList.map((artist) => {
                  const isSelected = selectedIds.includes(artist.id);
                  return (
                    <CommandItem
                      key={artist.id}
                      value={artist.display_name}
                      onSelect={() => toggleArtist(artist.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Check
                          className={cn(
                            'h-4 w-4',
                            isSelected ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={artist.profile_picture || undefined} />
                          <AvatarFallback className="text-xs">
                            {artist.display_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{artist.display_name}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected artists badges */}
      {selectedArtists.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedArtists.map((artist) => (
            <Badge
              key={artist.id}
              variant="secondary"
              className="pl-2 pr-1 py-1"
            >
              <Avatar className="h-4 w-4 mr-1.5">
                <AvatarImage src={artist.profile_picture || undefined} />
                <AvatarFallback className="text-[10px]">
                  {artist.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{artist.display_name}</span>
              <button
                type="button"
                className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => removeArtist(artist.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
