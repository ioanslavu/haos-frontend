import { useState, useEffect, useRef } from 'react';
import { useNotes, useNoteDetail, useCreateNote, useUpdateNote, useDeleteNote, useTogglePin, useToggleArchive, useTags } from '@/api/hooks/useNotes';
import { NoteCard } from './components/NoteCard';
import { NotesInsights } from './components/NotesInsights';
import { TiptapEditor } from './components/TiptapEditor';
import { TagInput } from './components/TagInput';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Archive, Grid, List, Loader2, Palette, Pin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag, NoteListItem } from '@/types/notes';
import { toast } from 'sonner';

const NOTE_COLORS = [
  { name: 'None', value: null },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Gray', value: '#6b7280' },
];

const NotesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState<any>({ type: 'doc', content: [] });
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [noteColor, setNoteColor] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving'>('idle');
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const justLoadedRef = useRef(false);
  const loadedDataRef = useRef<{
    title: string;
    content: string;
    tags: string;
    color: string | null;
  } | null>(null); // Track original loaded data to detect real changes
  const isCreatingRef = useRef(false); // Track if a creation request is in-flight
  const editingNoteIdRef = useRef<number | null>(null); // Mirror editingNoteId for sync access in closures
  const pendingChangesRef = useRef<{
    title: string;
    content: any;
    tags: Tag[];
    color: string | null;
  } | null>(null); // Buffer changes made during creation

  const { data: noteDetail, isLoading: isLoadingDetail } = useNoteDetail(editingNoteId || 0);

  const { data: notes = [], isLoading } = useNotes({
    search: searchQuery,
    tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    is_archived: showArchived,
  });

  const { data: allTags = [] } = useTags();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const togglePin = useTogglePin();
  const toggleArchive = useToggleArchive();

  // Populate form when note detail is loaded
  useEffect(() => {
    if (noteDetail && editingNoteId && noteDetail.id === editingNoteId) {
      justLoadedRef.current = true;
      const loadedContent = noteDetail.content || { type: 'doc', content: [] };
      const loadedTitle = noteDetail.title || '';
      const loadedTags = noteDetail.tags || [];
      const loadedColor = noteDetail.color || null;

      setNoteTitle(loadedTitle);
      setNoteContent(loadedContent);
      setNoteTags(loadedTags);
      setNoteColor(loadedColor);
      setSaveState('idle');
      setEditorKey(prev => prev + 1); // Fresh editor with loaded content
      // Store all loaded data so we can detect real changes
      loadedDataRef.current = {
        title: loadedTitle,
        content: JSON.stringify(loadedContent),
        tags: JSON.stringify(loadedTags.map(t => t.id).sort()),
        color: loadedColor
      };
      // NOW open the dialog with the loaded data
      setIsNoteDialogOpen(true);
    }
  }, [noteDetail, editingNoteId]);

  // Auto-save with debounce
  useEffect(() => {
    // Don't auto-save if no note is open or if loading
    if (!isNoteDialogOpen || isLoadingDetail) return;

    // Skip auto-save if we just loaded data from server
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }

    // Don't save if no title (prevents saving empty notes)
    if (!noteTitle.trim()) return;

    // CRITICAL: Only save if something actually changed from what was loaded
    // This prevents unnecessary saves and overwriting with stale data
    if (editingNoteId && loadedDataRef.current) {
      const currentData = {
        title: noteTitle,
        content: JSON.stringify(noteContent),
        tags: JSON.stringify(noteTags.map(t => t.id).sort()),
        color: noteColor
      };
      const hasChanges =
        currentData.title !== loadedDataRef.current.title ||
        currentData.content !== loadedDataRef.current.content ||
        currentData.tags !== loadedDataRef.current.tags ||
        currentData.color !== loadedDataRef.current.color;

      if (!hasChanges) {
        // Nothing changed, don't save
        return;
      }
    }

    // Mark as dirty when user makes changes
    setSaveState('dirty');

    // Debounce: wait 2 seconds after last change
    const timer = setTimeout(() => {
      // Double-check before saving (in case state changed during timeout)
      if (!noteTitle.trim() || !isNoteDialogOpen) return;

      setSaveState('saving');

      // Use ref for sync access - the closure might have stale editingNoteId
      const currentNoteId = editingNoteIdRef.current;

      if (currentNoteId) {
        // Update existing note
        updateNote.mutate(
          { id: currentNoteId, data: { title: noteTitle, content: noteContent, tag_ids: noteTags.map(t => t.id), color: noteColor } },
          {
            onSuccess: () => {
              setSaveState('idle');
              setShowSavedIndicator(true);
              setTimeout(() => setShowSavedIndicator(false), 2000);
            },
            onError: () => {
              setSaveState('dirty');
              toast.error('Failed to save note');
            }
          }
        );
      } else {
        // Create new note - but prevent duplicate creations
        if (isCreatingRef.current) {
          // Creation already in progress - buffer the current changes
          pendingChangesRef.current = {
            title: noteTitle,
            content: noteContent,
            tags: noteTags,
            color: noteColor
          };
          return;
        }

        // Mark creation as in-progress
        isCreatingRef.current = true;

        createNote.mutate(
          { title: noteTitle, content: noteContent, tag_ids: noteTags.map(t => t.id), color: noteColor },
          {
            onSuccess: (response) => {
              // Switch to editing mode with the new note ID
              // IMPORTANT: Set ref BEFORE clearing isCreatingRef to prevent race conditions
              const newNote = response.data;

              if (!newNote?.id) {
                isCreatingRef.current = false;
                setSaveState('dirty');
                toast.error('Failed to create note: no ID returned');
                return;
              }

              editingNoteIdRef.current = newNote.id;
              setEditingNoteId(newNote.id);
              isCreatingRef.current = false;

              // Check if there are pending changes to flush
              if (pendingChangesRef.current) {
                const pending = pendingChangesRef.current;
                pendingChangesRef.current = null;

                // Immediately update with buffered changes
                updateNote.mutate(
                  {
                    id: newNote.id,
                    data: {
                      title: pending.title,
                      content: pending.content,
                      tag_ids: pending.tags.map(t => t.id),
                      color: pending.color
                    }
                  },
                  {
                    onSuccess: () => {
                      setSaveState('idle');
                      setShowSavedIndicator(true);
                      setTimeout(() => setShowSavedIndicator(false), 2000);
                    },
                    onError: () => {
                      setSaveState('dirty');
                      toast.error('Failed to save note');
                    }
                  }
                );
              } else {
                setSaveState('idle');
                setShowSavedIndicator(true);
                setTimeout(() => setShowSavedIndicator(false), 2000);
              }
            },
            onError: () => {
              isCreatingRef.current = false;
              setSaveState('dirty');
              toast.error('Failed to create note');
            }
          }
        );
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [noteTitle, noteContent, noteTags, noteColor]);

  const handleOpenNoteDialog = (noteId?: number) => {
    if (noteId) {
      // For existing notes, set ID first, dialog opens after data loads
      editingNoteIdRef.current = noteId;
      setEditingNoteId(noteId);
      justLoadedRef.current = true;
      loadedDataRef.current = null;
    } else {
      // For new notes, clear and open immediately
      setNoteTitle('');
      setNoteContent({ type: 'doc', content: [] });
      setNoteTags([]);
      setNoteColor(null);
      setSaveState('idle');
      setShowSavedIndicator(false);
      setEditorKey(prev => prev + 1);
      justLoadedRef.current = true;
      loadedDataRef.current = null;
      editingNoteIdRef.current = null;
      setEditingNoteId(null);
      setIsNoteDialogOpen(true);
    }
  };

  const handleCloseNoteDialog = () => {
    // Prevent closing if currently saving or creating
    if (saveState === 'saving' || isCreatingRef.current) {
      toast.info('Saving in progress, please wait...');
      return;
    }

    // Use ref for sync access - state might be stale
    const currentNoteId = editingNoteIdRef.current;

    // If creating a new note with no content, don't save it
    if (!currentNoteId && !noteTitle.trim()) {
      setIsNoteDialogOpen(false);
      editingNoteIdRef.current = null;
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent({ type: 'doc', content: [] });
      setNoteTags([]);
      setNoteColor(null);
      setSaveState('idle');
      loadedDataRef.current = null;
      return;
    }

    // Save changes before closing if any field changed
    let hasChanges = false;
    if (currentNoteId && loadedDataRef.current) {
      const currentData = {
        title: noteTitle,
        content: JSON.stringify(noteContent),
        tags: JSON.stringify(noteTags.map(t => t.id).sort()),
        color: noteColor
      };
      hasChanges =
        currentData.title !== loadedDataRef.current.title ||
        currentData.content !== loadedDataRef.current.content ||
        currentData.tags !== loadedDataRef.current.tags ||
        currentData.color !== loadedDataRef.current.color;
    }

    if (hasChanges || (!currentNoteId && noteTitle.trim())) {
      // Save changes
      if (currentNoteId) {
        updateNote.mutate(
          { id: currentNoteId, data: { title: noteTitle, content: noteContent, tag_ids: noteTags.map(t => t.id), color: noteColor } },
          {
            onSettled: () => {
              // Close after save completes (success or error)
              closeDialog();
            }
          }
        );
      } else {
        createNote.mutate(
          { title: noteTitle, content: noteContent, tag_ids: noteTags.map(t => t.id), color: noteColor },
          {
            onSettled: () => {
              closeDialog();
            }
          }
        );
      }
    } else {
      // No changes, close immediately
      closeDialog();
    }
  };

  const closeDialog = () => {
    setIsNoteDialogOpen(false);
    editingNoteIdRef.current = null;
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent({ type: 'doc', content: [] });
    setNoteTags([]);
    setNoteColor(null);
    setSaveState('idle');
    setShowSavedIndicator(false);
    loadedDataRef.current = null;
    isCreatingRef.current = false;
    pendingChangesRef.current = null;
  };

  return (
    <AppLayout>
      <div className="space-y-4 pb-8">
        {/* Compact Control Bar */}
        <div className="relative overflow-hidden rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

          <div className="relative z-10 p-6">
            {/* Header: Title + Button */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
              <Button
                onClick={() => handleOpenNoteDialog()}
                size="lg"
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>

            {/* Search Row */}
            <div className="flex gap-3 flex-wrap mb-5">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-background/50 border-white/10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-11 w-11 rounded-xl"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="h-11 w-11 rounded-xl"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={showArchived ? 'default' : 'outline'}
                  onClick={() => setShowArchived(!showArchived)}
                  className="h-11 px-4 rounded-xl"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {showArchived ? 'Hide Archived' : 'Show Archived'}
                </Button>
              </div>
            </div>

            {/* Stats + Tag Filters Row */}
            <div className="flex items-center justify-between gap-6 flex-wrap pt-5 border-t border-white/10">
              <NotesInsights />

              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Tags:</span>
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedTags.includes(tag.id) ? 'shadow-md scale-105' : 'opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: tag.color + (selectedTags.includes(tag.id) ? '' : '40'), color: tag.color }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes Grid/List */}
        <div>

          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl bg-background/30 backdrop-blur-sm border border-white/10">
              <p className="text-muted-foreground text-lg">{searchQuery || selectedTags.length > 0 ? 'No notes found' : 'No notes yet. Create your first note!'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pinned Notes Section */}
              {notes.filter(note => note.is_pinned).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <Pin className="h-4 w-4 text-violet-600 dark:text-violet-400 fill-violet-600 dark:fill-violet-400" />
                    <h3 className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Pinned</h3>
                  </div>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                    {notes.filter(note => note.is_pinned).map((note) => (
                      <NoteCard key={note.id} note={note} onClick={() => handleOpenNoteDialog(note.id)} onPin={() => togglePin.mutate(note.id)} onArchive={() => toggleArchive.mutate(note.id)} onDelete={() => setDeleteNoteId(note.id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Separator */}
              {notes.filter(note => note.is_pinned).length > 0 && notes.filter(note => !note.is_pinned).length > 0 && (
                <div className="flex items-center gap-3 py-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"></div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"></div>
                </div>
              )}

              {/* Unpinned Notes Section */}
              {notes.filter(note => !note.is_pinned).length > 0 && (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                  {notes.filter(note => !note.is_pinned).map((note) => (
                    <NoteCard key={note.id} note={note} onClick={() => handleOpenNoteDialog(note.id)} onPin={() => togglePin.mutate(note.id)} onArchive={() => toggleArchive.mutate(note.id)} onDelete={() => setDeleteNoteId(note.id)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isNoteDialogOpen} onOpenChange={(open) => !open && handleCloseNoteDialog()}>
        <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0 [&>button]:top-6 [&>button]:right-6 [&>button]:h-8 [&>button]:w-8 [&>button]:rounded-full [&>button]:hover:bg-accent [&>button]:opacity-60 [&>button]:hover:opacity-100">
          <DialogHeader className="sticky top-0 z-10 px-6 pt-3 pb-0 shrink-0 border-0">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3 flex-1">
                {saveState === 'saving' && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
                {showSavedIndicator && saveState === 'idle' && (
                  <span className="text-xs text-green-600 dark:text-green-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-500"></span>
                    Saved
                  </span>
                )}
              </div>
            </div>
            <DialogTitle className="sr-only">{editingNoteId ? 'Edit Note' : 'New Note'}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 pb-4">
          {(isLoadingDetail && editingNoteId) || (editingNoteId && !noteDetail) ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Title Section */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-1">Title</label>
                <input
                  type="text"
                  placeholder="Untitled"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full text-3xl font-bold bg-transparent px-1 py-2 placeholder:text-muted-foreground/30"
                  style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                  onFocus={(e) => e.target.style.outline = 'none'}
                />
              </div>

              {/* Meta Section - Tags and Color */}
              <div className="space-y-4 pb-4 border-b">
                {/* Tags */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tags</label>
                  <TagInput selectedTags={noteTags} onTagsChange={setNoteTags} />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {NOTE_COLORS.map((color) => (
                      <button
                        key={color.value || 'none'}
                        type="button"
                        onClick={() => setNoteColor(color.value)}
                        className={`w-8 h-8 rounded-md transition-all hover:scale-110 ${
                          noteColor === color.value ? 'ring-2 ring-primary ring-offset-1' : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: color.value || 'transparent',
                          border: color.value ? 'none' : '1px dashed rgba(128, 128, 128, 0.3)'
                        }}
                        title={color.name}
                      >
                        {color.value === null && <span className="text-[10px] text-muted-foreground">✕</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Content</label>
                <TiptapEditor
                  key={editorKey}
                  content={noteContent}
                  onChange={setNoteContent}
                  placeholder="Start writing..."
                />
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Note?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteNoteId) deleteNote.mutate(deleteNoteId, { onSuccess: () => setDeleteNoteId(null) }); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default NotesPage;
