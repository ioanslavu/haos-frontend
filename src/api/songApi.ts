import apiClient from './client';
import {
  Song,
  SongCreate,
  SongUpdate,
  SongFilters,
  SongChecklistItem,
  SongAsset,
  AssetCreate,
  AssetReviewRequest,
  SongNote,
  NoteCreate,
  SongAlert,
  SongStats,
  SongStageTransition,
  TransitionRequest,
  ArchiveRequest,
  PaginatedResponse,
  Recording,
  Publication,
} from '@/types/song';
import { WorkWithSplits } from '@/types/catalog';

const SONGS_BASE = '/api/v1/songs';

// Song CRUD
export const fetchSongs = (filters?: SongFilters) => {
  return apiClient.get<PaginatedResponse<Song>>(`${SONGS_BASE}/`, { params: filters });
};

export const fetchSongDetail = (id: number) => {
  return apiClient.get<Song>(`${SONGS_BASE}/${id}/`);
};

export const createSong = (data: SongCreate) => {
  return apiClient.post<Song>(`${SONGS_BASE}/`, data);
};

export const updateSong = (id: number, data: SongUpdate) => {
  return apiClient.patch<Song>(`${SONGS_BASE}/${id}/`, data);
};

export const deleteSong = (id: number) => {
  return apiClient.delete(`${SONGS_BASE}/${id}/`);
};

// Workflow actions
export const transitionSong = (id: number, data: TransitionRequest) => {
  return apiClient.post<Song>(`${SONGS_BASE}/${id}/transition/`, data);
};

export const sendToMarketing = (id: number) => {
  return apiClient.post<Song>(`${SONGS_BASE}/${id}/send_to_marketing/`);
};

export const sendToDigital = (id: number) => {
  return apiClient.post<Song>(`${SONGS_BASE}/${id}/send_to_digital/`);
};

export const archiveSong = (id: number, data: ArchiveRequest) => {
  return apiClient.post<Song>(`${SONGS_BASE}/${id}/archive/`, data);
};

// Queues & Stats
export const fetchMyQueue = () => {
  return apiClient.get<Song[]>(`${SONGS_BASE}/my_queue/`);
};

export const fetchOverdueSongs = () => {
  return apiClient.get<Song[]>(`${SONGS_BASE}/overdue/`);
};

export const fetchSongStats = () => {
  return apiClient.get<SongStats>(`${SONGS_BASE}/stats/`);
};

// Checklist
export const fetchChecklist = (songId: number) => {
  return apiClient.get<SongChecklistItem[]>(`${SONGS_BASE}/${songId}/checklist/`);
};

export const toggleChecklistItem = (songId: number, itemId: number) => {
  return apiClient.post<SongChecklistItem>(
    `${SONGS_BASE}/${songId}/checklist/${itemId}/toggle/`
  );
};

export const validateAllChecklist = (songId: number) => {
  return apiClient.post<{ validated_count: number; errors: string[] }>(
    `${SONGS_BASE}/${songId}/checklist/validate_all/`
  );
};

// Assets
export const fetchAssets = (songId: number) => {
  return apiClient.get<SongAsset[]>(`${SONGS_BASE}/${songId}/assets/`);
};

export const createAsset = (songId: number, data: AssetCreate) => {
  return apiClient.post<SongAsset>(`${SONGS_BASE}/${songId}/assets/`, data);
};

export const reviewAsset = (songId: number, assetId: number, data: AssetReviewRequest) => {
  return apiClient.post<SongAsset>(
    `${SONGS_BASE}/${songId}/assets/${assetId}/review/`,
    data
  );
};

export const updateAsset = (songId: number, assetId: number, data: Partial<AssetCreate>) => {
  return apiClient.patch<SongAsset>(
    `${SONGS_BASE}/${songId}/assets/${assetId}/`,
    data
  );
};

export const deleteAsset = (songId: number, assetId: number) => {
  return apiClient.delete(`${SONGS_BASE}/${songId}/assets/${assetId}/`);
};

// Notes
export const fetchNotes = (songId: number) => {
  return apiClient.get<SongNote[]>(`${SONGS_BASE}/${songId}/notes/`);
};

export const createNote = (songId: number, data: NoteCreate) => {
  return apiClient.post<SongNote>(`${SONGS_BASE}/${songId}/notes/`, data);
};

// Stage Transitions
export const fetchStageTransitions = (songId: number) => {
  return apiClient.get<SongStageTransition[]>(`${SONGS_BASE}/${songId}/transitions/`);
};

// Alerts
export const fetchAlerts = () => {
  return apiClient.get<PaginatedResponse<SongAlert>>('/api/v1/alerts/');
};

export const getUnreadCount = () => {
  return apiClient.get<{ unread_count: number }>('/api/v1/alerts/unread_count/');
};

export const markAlertRead = (alertId: number) => {
  return apiClient.post<SongAlert>(`/api/v1/alerts/${alertId}/mark_read/`);
};

export const markAllAlertsRead = () => {
  return apiClient.post('/api/v1/alerts/mark_all_read/');
};

// Recordings
export const fetchSongRecordings = (songId: number) => {
  return apiClient.get<Recording[]>(`${SONGS_BASE}/${songId}/recordings/`);
};

export const updateRecording = (recordingId: number, data: Partial<Recording>) => {
  return apiClient.patch<Recording>(`/api/v1/catalog/recordings/${recordingId}/`, data);
};

export const deleteRecording = (recordingId: number) => {
  return apiClient.delete(`/api/v1/catalog/recordings/${recordingId}/`);
};

// Recording Credits
export const addRecordingCredit = (data: {
  recording_id: number;
  entity_id: number;
  role: string;
}) => {
  return apiClient.post('/api/v1/rights/credits/', {
    ...data,
    scope: 'recording',
    object_id: data.recording_id,
  });
};

export const deleteRecordingCredit = (creditId: number) => {
  return apiClient.delete(`/api/v1/rights/credits/${creditId}/`);
};

// Recording Splits
export const addRecordingSplit = (data: {
  recording_id: number;
  entity_id: number;
  share: number;
  territory?: string;
}) => {
  return apiClient.post('/api/v1/rights/splits/', {
    ...data,
    scope: 'recording',
    object_id: data.recording_id,
    right_type: 'master',
  });
};

export const updateRecordingSplit = (splitId: number, data: { share?: number; territory?: string }) => {
  return apiClient.patch(`/api/v1/rights/splits/${splitId}/`, data);
};

export const deleteRecordingSplit = (splitId: number) => {
  return apiClient.delete(`/api/v1/rights/splits/${splitId}/`);
};

// Recording Assets
export const uploadRecordingAsset = (recordingId: number, file: File, metadata: {
  kind: string;
  is_master: boolean;
  is_public: boolean;
  notes?: string;
}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('recording', recordingId.toString());
  formData.append('kind', metadata.kind);
  formData.append('is_master', metadata.is_master.toString());
  formData.append('is_public', metadata.is_public.toString());
  if (metadata.notes) {
    formData.append('notes', metadata.notes);
  }

  return apiClient.post('/api/v1/catalog/recording-assets/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteRecordingAsset = (assetId: number) => {
  return apiClient.delete(`/api/v1/catalog/recording-assets/${assetId}/`);
};

// Work details
export const fetchSongWork = (songId: number) => {
  return apiClient.get<WorkWithSplits>(`${SONGS_BASE}/${songId}/work/`);
};

// Release and Publications
export const fetchReleasePublications = (releaseId: number) => {
  return apiClient.get<Publication[]>(`/api/v1/catalog/releases/${releaseId}/publications/`);
};

// Contracts
export const fetchSongContracts = (songId: number) => {
  return apiClient.get<any[]>(`${SONGS_BASE}/${songId}/contracts/`);
};
