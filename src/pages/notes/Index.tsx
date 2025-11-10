import { useState, useEffect } from 'react';
import { useNotes, useNoteDetail, useCreateNote, useUpdateNote, useDeleteNote, useTogglePin, useToggleArchive, useTags } from '@/api/hooks/useNotes';
import { NoteCard } from './components/NoteCard';
import { NotesInsights } from './components/NotesInsights';
import { TiptapEditor } from './components/TiptapEditor';
import { TagInput } from './components/TagInput';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Archive, Grid, List, Loader2, Palette, Pin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Note, Tag, NoteListItem } from '@/types/notes';
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
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState<any>({ type: 'doc', content: [] });
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [noteColor, setNoteColor] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (editingNote && (noteTitle !== editingNote.title || JSON.stringify(noteContent) !== JSON.stringify(editingNote.content) || noteColor !== editingNote.color)) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      const timer = setTimeout(() => {
        if (editingNote && noteTitle.trim()) {
          updateNote.mutate({
            id: editingNote.id,
            data: { title: noteTitle, content: noteContent, tag_ids: noteTags.map(t => t.id), color: noteColor },
          });
        }
      }, 2000);
      setAutoSaveTimer(timer);
      return () => { if (timer) clearTimeout(timer); };
    }
  }, [noteTitle, noteContent, noteColor, editingNote]);

  const handleOpenNoteDialog = (noteId?: number) => {
    if (noteId) {
      setEditingNoteId(noteId);
      setIsNoteDialogOpen(true);
    } else {
      setEditingNoteId(null);
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent({ type: 'doc', content: [] });
      setNoteTags([]);
      setNoteColor(null);
      setIsNoteDialogOpen(true);
    }
  };

  useEffect(() => {
    if (noteDetail && editingNoteId) {
      setEditingNote(noteDetail);
      setNoteTitle(noteDetail.title);
      setNoteContent(noteDetail.content || { type: 'doc', content: [] });
      setNoteTags(noteDetail.tags);
      setNoteColor(noteDetail.color || null);
    }
  }, [noteDetail, editingNoteId]);

  const handleCloseNoteDialog = () => {
    setIsNoteDialogOpen(false);
    setTimeout(() => {
      setEditingNote(null);
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent({ type: 'doc', content: [] });
      setNoteTags([]);
      setNoteColor(null);
    }, 200);
  };

  const handleSaveNote = () => {
    if (!noteTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (editingNote) {
      updateNote.mutate({ id: editingNote.id, data: { title: noteTitle, content: noteContent, tag_ids: noteTags.map(t => t.id), color: noteColor } }, { onSuccess: handleCloseNoteDialog });
    } else {
      createNote.mutate({ title: noteTitle, content: noteContent, tag_ids: noteTags.map(t => t.id), color: noteColor }, { onSuccess: handleCloseNoteDialog });
    }
  };

  return (
    <AppLayout
      title="Notes"
      actions={
        <Button onClick={() => handleOpenNoteDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Tags</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTags(prev => prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id])}
                  className={`px-2 py-1 rounded text-xs transition-all ${selectedTags.includes(tag.id) ? 'font-semibold shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: tag.color + (selectedTags.includes(tag.id) ? '' : '40'), color: tag.color }}
                >
                  {tag.name}
                </button>
              ))}
              {allTags.length === 0 && (
                <p className="text-xs text-muted-foreground">No tags yet</p>
              )}
            </div>
          </div>
          <Button variant={showArchived ? 'default' : 'outline'} className="w-full justify-start" onClick={() => setShowArchived(!showArchived)}>
            <Archive className="h-4 w-4 mr-2" />{showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <NotesInsights />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            </div>
          </div>

        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12"><p className="text-muted-foreground">{searchQuery || selectedTags.length > 0 ? 'No notes found' : 'No notes yet. Create your first note!'}</p></div>
        ) : (
          <div className="space-y-6">
            {/* Pinned Notes Section */}
            {notes.filter(note => note.is_pinned).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="h-4 w-4 text-primary fill-primary" />
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Pinned</h3>
                </div>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                  {notes.filter(note => note.is_pinned).map((note) => (
                    <NoteCard key={note.id} note={note} onClick={() => handleOpenNoteDialog(note.id)} onPin={() => togglePin.mutate(note.id)} onArchive={() => toggleArchive.mutate(note.id)} onDelete={() => setDeleteNoteId(note.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            {notes.filter(note => note.is_pinned).length > 0 && notes.filter(note => !note.is_pinned).length > 0 && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                </div>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
              </div>
            )}

            {/* Unpinned Notes Section */}
            {notes.filter(note => !note.is_pinned).length > 0 && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                {notes.filter(note => !note.is_pinned).map((note) => (
                  <NoteCard key={note.id} note={note} onClick={() => handleOpenNoteDialog(note.id)} onPin={() => togglePin.mutate(note.id)} onArchive={() => toggleArchive.mutate(note.id)} onDelete={() => setDeleteNoteId(note.id)} />
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4 shrink-0">
            <DialogTitle className="truncate">
              {editingNote ? (
                <span>
                  <span className="text-muted-foreground text-sm font-normal">Editing:</span>{' '}
                  <span className="font-semibold">{noteTitle || 'Untitled'}</span>
                </span>
              ) : (
                'New Note'
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-4">
          {isLoadingDetail && editingNoteId ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <Input placeholder="Note title..." value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="text-lg font-semibold" />

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Note Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.value || 'none'}
                      type="button"
                      onClick={() => setNoteColor(color.value)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                        noteColor === color.value ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value || '#ffffff' }}
                      title={color.name}
                    >
                      {color.value === null && <span className="text-xs text-gray-400">None</span>}
                    </button>
                  ))}
                </div>
              </div>

              <TagInput selectedTags={noteTags} onTagsChange={setNoteTags} />
              <TiptapEditor content={noteContent} onChange={setNoteContent} placeholder="Start writing..." />
            </div>
          )}
          </div>
          <DialogFooter className="sticky bottom-0 z-10 bg-background border-t px-6 py-4 shrink-0">
            <Button variant="outline" onClick={handleCloseNoteDialog}>Cancel</Button>
            <Button onClick={handleSaveNote} disabled={createNote.isPending || updateNote.isPending || isLoadingDetail}>
              {editingNote ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
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
