import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2, X, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useRecordings, useRecording } from '@/api/hooks/useCatalog';
import type { Recording } from '@/api/services/catalog.service';

interface RecordingSearchComboboxProps {
  value?: number | null;
  onValueChange: (recordingId: number | null) => void;
  onRecordingSelect?: (recording: Recording | null) => void;
  placeholder?: string;
  className?: string;
  filter?: {
    type?: Recording['type'];
    status?: Recording['status'];
  };
}

export function RecordingSearchCombobox({
  value,
  onValueChange,
  onRecordingSelect,
  placeholder = 'Select song...',
  className,
  filter,
}: RecordingSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch selected recording if value is provided (for edit mode)
  const { data: initialRecording } = useRecording(value || 0, !!value && value > 0 && !selectedRecording);

  // Update selected recording when initial recording is fetched
  useEffect(() => {
    if (initialRecording && value && !selectedRecording) {
      setSelectedRecording(initialRecording);
    }
  }, [initialRecording, value, selectedRecording]);

  // Clear selected recording when value is cleared from outside
  useEffect(() => {
    if (!value && selectedRecording) {
      setSelectedRecording(null);
    }
  }, [value, selectedRecording]);

  const { data: recordingsData, isLoading } = useRecordings(
    {
      search: searchQuery,
      page_size: 50,
      ...filter,
    }
  );

  const recordings = recordingsData?.results || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSelect = (recording: Recording) => {
    setSelectedRecording(recording);
    onValueChange(recording.id);
    onRecordingSelect?.(recording);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRecording(null);
    onValueChange(null);
    onRecordingSelect?.(null);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-auto min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <div className="flex items-center justify-between w-full">
          {selectedRecording ? (
            <div className="flex items-center gap-2">
              <Music className="h-3 w-3 text-muted-foreground" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedRecording.title}</span>
                {selectedRecording.work_title && (
                  <span className="text-xs text-muted-foreground">
                    {selectedRecording.work_title}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 ml-2">
            {selectedRecording && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </div>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95"
        >
          <div className="flex flex-col">
            {/* Search Input */}
            <div className="flex items-center border-b px-3 py-2">
              <Input
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : searchQuery.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Start typing to search songs...
                </div>
              ) : recordings.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No songs found.
                </div>
              ) : (
                <div className="p-1">
                  {recordings.map((recording) => (
                    <button
                      key={recording.id}
                      type="button"
                      className={cn(
                        'w-full relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left',
                        value === recording.id && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => handleSelect(recording)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 flex-shrink-0',
                          value === recording.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Music className="h-3 w-3 text-muted-foreground" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{recording.title}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                            {recording.work_title && (
                              <span className="truncate">{recording.work_title}</span>
                            )}
                            {recording.isrc && (
                              <>
                                {recording.work_title && <span>•</span>}
                                <span className="truncate">{recording.isrc}</span>
                              </>
                            )}
                            {recording.formatted_duration && (
                              <>
                                <span>•</span>
                                <span>{recording.formatted_duration}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
