import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as notesApi from '../notesApi';
import { NoteCreateInput, NoteUpdateInput } from '@/types/notes';

// Query keys
export const notesKeys = {
  all: ['notes'] as const,
  lists: () => [...notesKeys.all, 'list'] as const,
  list: (filters: string) => [...notesKeys.lists(), { filters }] as const,
  details: () => [...notesKeys.all, 'detail'] as const,
  detail: (id: number) => [...notesKeys.details(), id] as const,
  statistics: () => [...notesKeys.all, 'statistics'] as const,
  search: (query: string) => [...notesKeys.all, 'search', query] as const,
};

export const tagsKeys = {
  all: ['tags'] as const,
  lists: () => [...tagsKeys.all, 'list'] as const,
  list: (filters: string) => [...tagsKeys.lists(), { filters }] as const,
  details: () => [...tagsKeys.all, 'detail'] as const,
  detail: (id: number) => [...tagsKeys.details(), id] as const,
  suggestions: () => [...tagsKeys.all, 'suggestions'] as const,
};

// Notes hooks
export const useNotes = (params?: {
  search?: string;
  tags?: string;
  is_archived?: boolean;
  is_pinned?: boolean;
}) => {
  return useQuery({
    queryKey: notesKeys.list(JSON.stringify(params || {})),
    queryFn: async () => {
      const response = await notesApi.fetchNotes(params);
      return response.data;
    },
  });
};

export const useNoteDetail = (id: number) => {
  return useQuery({
    queryKey: notesKeys.detail(id),
    queryFn: async () => {
      const response = await notesApi.fetchNoteDetail(id);
      return response.data;
    },
    enabled: !!id,
    refetchOnMount: 'always', // Always fetch fresh data when opening a note
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NoteCreateInput) => notesApi.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.statistics() });
      toast.success('Note created successfully');
    },
    onError: () => {
      toast.error('Failed to create note');
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: NoteUpdateInput }) =>
      notesApi.updateNote(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: notesKeys.statistics() });
    },
    onError: () => {
      toast.error('Failed to update note');
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notesApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.statistics() });
      toast.success('Note deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete note');
    },
  });
};

export const useTogglePin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notesApi.togglePin(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.detail(id) });
      const isPinned = response.data.is_pinned;
      toast.success(isPinned ? 'Note pinned' : 'Note unpinned');
    },
    onError: () => {
      toast.error('Failed to toggle pin');
    },
  });
};

export const useToggleArchive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notesApi.toggleArchive(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: notesKeys.statistics() });
      const isArchived = response.data.is_archived;
      toast.success(isArchived ? 'Note archived' : 'Note restored');
    },
    onError: () => {
      toast.error('Failed to toggle archive');
    },
  });
};

export const useNoteStatistics = () => {
  return useQuery({
    queryKey: notesKeys.statistics(),
    queryFn: async () => {
      const response = await notesApi.fetchNoteStatistics();
      return response.data;
    },
  });
};

export const useSearchNotes = (query: string, enabled = false) => {
  return useQuery({
    queryKey: notesKeys.search(query),
    queryFn: async () => {
      const response = await notesApi.searchNotes(query);
      return response.data;
    },
    enabled: enabled && query.length > 0,
  });
};

// Tags hooks
export const useTags = (params?: { search?: string }) => {
  return useQuery({
    queryKey: tagsKeys.list(JSON.stringify(params || {})),
    queryFn: async () => {
      const response = await notesApi.fetchTags(params);
      return response.data;
    },
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => notesApi.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.lists() });
      toast.success('Tag created successfully');
    },
    onError: () => {
      toast.error('Failed to create tag');
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; color?: string } }) =>
      notesApi.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      toast.success('Tag updated successfully');
    },
    onError: () => {
      toast.error('Failed to update tag');
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notesApi.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() });
      toast.success('Tag deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete tag');
    },
  });
};

export const useTagSuggestions = () => {
  return useQuery({
    queryKey: tagsKeys.suggestions(),
    queryFn: async () => {
      const response = await notesApi.fetchTagSuggestions();
      return response.data;
    },
  });
};
