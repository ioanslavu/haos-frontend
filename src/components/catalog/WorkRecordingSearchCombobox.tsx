import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2, X, Music, Disc, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWorks, useRecordings, useRecording } from '@/api/hooks/useCatalog';
import type { Recording } from '@/api/services/catalog.service';

interface WorkRecordingSearchComboboxProps {
  value?: number | null;
  onValueChange: (recordingId: number | null) => void;
  onRecordingSelect?: (recording: Recording | null) => void;
  placeholder?: string;
  className?: string;
}

const RECORDING_TYPE_LABELS: Record<Recording['type'], string> = {
  audio_master: 'Master',
  music_video: 'Video',
  live_audio: 'Live',
  live_video: 'Live Video',
  remix: 'Remix',
  radio_edit: 'Radio Edit',
  acoustic: 'Acoustic',
  instrumental: 'Instrumental',
  acapella: 'A Cappella',
  extended: 'Extended',
  demo: 'Demo',
};

export function WorkRecordingSearchCombobox({
  value,
  onValueChange,
  onRecordingSelect,
  placeholder = 'Search for song or recording...',
  className,
}: WorkRecordingSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [expandedWorks, setExpandedWorks] = useState<Set<number>>(new Set());
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

  // Search both works and recordings
  const { data: worksData, isLoading: worksLoading } = useWorks({
    search: searchQuery,
    page_size: 20,
  });

  const { data: recordingsData, isLoading: recordingsLoading } = useRecordings({
    search: searchQuery,
    page_size: 50,
  });

  const works = worksData?.results || [];
  const recordings = recordingsData?.results || [];

  const isLoading = worksLoading || recordingsLoading;

  // Group recordings by work
  const recordingsByWork = recordings.reduce((acc, recording) => {
    const workId = recording.work || null;
    if (!acc[String(workId)]) {
      acc[String(workId)] = [];
    }
    acc[String(workId)].push(recording);
    return acc;
  }, {} as Record<string, Recording[]>);

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
    setExpandedWorks(new Set());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRecording(null);
    onValueChange(null);
    onRecordingSelect?.(null);
  };

  const toggleWorkExpanded = (workId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedWorks);
    if (newExpanded.has(workId)) {
      newExpanded.delete(workId);
    } else {
      newExpanded.add(workId);
    }
    setExpandedWorks(newExpanded);
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
              <Disc className="h-3 w-3 text-muted-foreground" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedRecording.title}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {selectedRecording.work_title && (
                    <span>{selectedRecording.work_title}</span>
                  )}
                  {selectedRecording.type && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {RECORDING_TYPE_LABELS[selectedRecording.type]}
                      </Badge>
                    </>
                  )}
                  {selectedRecording.isrc && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{selectedRecording.isrc}</span>
                    </>
                  )}
                </div>
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
                placeholder="Search songs or recordings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : searchQuery.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Start typing to search works and recordings...
                </div>
              ) : works.length === 0 && recordings.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No works or recordings found.
                </div>
              ) : (
                <div className="p-1 space-y-1">
                  {/* Display works with their recordings */}
                  {works.map((work) => {
                    const workRecordings = recordingsByWork[String(work.id)] || [];
                    const isExpanded = expandedWorks.has(work.id);

                    return (
                      <div key={`work-${work.id}`} className="space-y-1">
                        {/* Work header */}
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left"
                          onClick={(e) => workRecordings.length > 0 && toggleWorkExpanded(work.id, e)}
                        >
                          {workRecordings.length > 0 && (
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          )}
                          <Music className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{work.title}</span>
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                Work
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {work.iswc && (
                                <span className="font-mono">{work.iswc}</span>
                              )}
                              {workRecordings.length > 0 && (
                                <>
                                  {work.iswc && <span>•</span>}
                                  <span>{workRecordings.length} recording{workRecordings.length !== 1 ? 's' : ''}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Recordings under this work */}
                        {isExpanded && workRecordings.length > 0 && (
                          <div className="ml-6 space-y-0.5 border-l pl-2">
                            {workRecordings.map((recording) => (
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
                                <Disc className="h-3 w-3 text-muted-foreground flex-shrink-0 mr-2" />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-medium truncate">{recording.title}</span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                    <Badge variant="secondary" className="text-xs px-1 py-0">
                                      {RECORDING_TYPE_LABELS[recording.type]}
                                    </Badge>
                                    {recording.isrc && (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono">{recording.isrc}</span>
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
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Orphan recordings (no work) */}
                  {recordingsByWork['null'] && recordingsByWork['null'].length > 0 && (
                    <div className="space-y-0.5">
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                        Standalone Recordings
                      </div>
                      {recordingsByWork['null'].map((recording) => (
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
                          <Disc className="h-3 w-3 text-muted-foreground flex-shrink-0 mr-2" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate">{recording.title}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {RECORDING_TYPE_LABELS[recording.type]}
                              </Badge>
                              {recording.isrc && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{recording.isrc}</span>
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
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
