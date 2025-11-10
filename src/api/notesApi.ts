import apiClient from './client';
import {
  Note,
  NoteListItem,
  Tag,
  NoteCreateInput,
  NoteUpdateInput,
  NoteStatistics,
  SearchResults,
} from '@/types/notes';

const NOTES_BASE = '/api/v1/notes';
const TAGS_BASE = '/api/v1/tags';

// Notes CRUD
export const fetchNotes = (params?: {
  search?: string;
  tags?: string;
  is_archived?: boolean;
  is_pinned?: boolean;
}) => {
  return apiClient.get<NoteListItem[]>(NOTES_BASE + '/', { params });
};

export const fetchNoteDetail = (id: number) => {
  return apiClient.get<Note>(`${NOTES_BASE}/${id}/`);
};

export const createNote = (data: NoteCreateInput) => {
  return apiClient.post<Note>(`${NOTES_BASE}/`, data);
};

export const updateNote = (id: number, data: NoteUpdateInput) => {
  return apiClient.patch<Note>(`${NOTES_BASE}/${id}/`, data);
};

export const deleteNote = (id: number) => {
  return apiClient.delete(`${NOTES_BASE}/${id}/`);
};

// Note actions
export const togglePin = (id: number) => {
  return apiClient.post<Note>(`${NOTES_BASE}/${id}/pin/`);
};

export const toggleArchive = (id: number) => {
  return apiClient.post<Note>(`${NOTES_BASE}/${id}/archive/`);
};

// Statistics
export const fetchNoteStatistics = () => {
  return apiClient.get<NoteStatistics>(`${NOTES_BASE}/statistics/`);
};

// Search
export const searchNotes = (query: string, params?: { tags?: string; is_archived?: boolean }) => {
  return apiClient.get<SearchResults>(`${NOTES_BASE}/search/`, { params: { q: query, ...params } });
};

// Tags CRUD
export const fetchTags = (params?: { search?: string }) => {
  return apiClient.get<Tag[]>(TAGS_BASE + '/', { params });
};

export const fetchTagDetail = (id: number) => {
  return apiClient.get<Tag>(`${TAGS_BASE}/${id}/`);
};

export const createTag = (data: { name: string; color?: string }) => {
  return apiClient.post<Tag>(`${TAGS_BASE}/`, data);
};

export const updateTag = (id: number, data: { name?: string; color?: string }) => {
  return apiClient.patch<Tag>(`${TAGS_BASE}/${id}/`, data);
};

export const deleteTag = (id: number) => {
  return apiClient.delete(`${TAGS_BASE}/${id}/`);
};

// Tag actions
export const fetchTagNotes = (id: number) => {
  return apiClient.get<NoteListItem[]>(`${TAGS_BASE}/${id}/notes/`);
};

export const fetchTagSuggestions = () => {
  return apiClient.get<Tag[]>(`${TAGS_BASE}/suggestions/`);
};
