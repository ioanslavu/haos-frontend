import apiClient from '../client';

// Types
export interface Work {
  id: number;
  title: string;
  alternate_titles?: string[];
  iswc?: string;
  language?: string;
  genre?: string;
  sub_genre?: string;
  year_composed?: number;
  translation_of?: number;
  translation_of_title?: string;
  adaptation_of?: number;
  adaptation_of_title?: string;
  lyrics?: string;
  notes?: string;
  recordings_count?: number;
  has_complete_publishing_splits: boolean;
  identifiers?: Identifier[];
  created_at: string;
  updated_at: string;
}

export interface Recording {
  id: number;
  title: string;
  type: 'audio_master' | 'music_video' | 'live_audio' | 'live_video' | 'remix' | 'radio_edit' | 'acoustic' | 'instrumental' | 'acapella' | 'extended' | 'demo';
  status: 'draft' | 'ready' | 'approved' | 'released' | 'archived';
  work?: number;
  work_title?: string;
  isrc?: string;
  duration_seconds?: number;
  formatted_duration?: string;
  bpm?: number;
  key?: string;
  recording_date?: string;
  studio?: string;
  version?: string;
  derived_from?: number;
  derived_from_title?: string;
  notes?: string;
  assets?: Asset[];
  has_complete_master_splits: boolean;
  release_count?: number;
  identifiers?: Identifier[];
  created_at: string;
  updated_at: string;
}

export interface Release {
  id: number;
  title: string;
  type: 'single' | 'ep' | 'album' | 'compilation' | 'live_album' | 'mixtape' | 'soundtrack';
  status: 'draft' | 'scheduled' | 'released' | 'cancelled';
  upc?: string;
  release_date?: string;
  catalog_number?: string;
  label_name?: string;
  artwork_url?: string;
  description?: string;
  notes?: string;
  tracks?: Track[];
  track_count?: number;
  total_duration?: number;
  formatted_total_duration?: string;
  identifiers?: Identifier[];
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: number;
  release: number;
  recording: number;
  recording_title?: string;
  recording_isrc?: string;
  track_number: number;
  disc_number?: number;
  version?: string;
  is_bonus?: boolean;
  is_hidden?: boolean;
  duration_seconds?: number;
  formatted_duration?: string;
  created_at: string;
}

export interface Asset {
  id: number;
  recording: number;
  kind: 'audio' | 'video' | 'stems' | 'lyrics' | 'artwork' | 'other';
  file_name: string;
  file_path?: string;
  file_size?: number;
  formatted_file_size?: string;
  mime_type?: string;
  checksum?: string;
  sample_rate?: number;
  bit_depth?: number;
  bitrate?: number;
  resolution?: string;
  frame_rate?: number;
  is_master: boolean;
  is_public: boolean;
  uploaded_by?: number;
  uploaded_by_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Identifier {
  id: number;
  scheme: string;
  value: string;
  owner_type?: string;
  owner_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CatalogSearchParams {
  search?: string;
  page?: number;
  page_size?: number;
}

export interface WorkSearchParams extends CatalogSearchParams {
  language?: string;
  genre?: string;
  year_composed?: number;
  year_composed_min?: number;
  year_composed_max?: number;
  has_recordings?: boolean;
  has_complete_splits?: boolean;
  entity_id?: number;  // Filter by entity (credits)
}

export interface RecordingSearchParams extends CatalogSearchParams {
  type?: Recording['type'];
  status?: Recording['status'];
  work?: number;
  has_assets?: boolean;
  has_complete_splits?: boolean;
  recording_date_after?: string;
  recording_date_before?: string;
  entity_id?: number;  // Filter by entity (credits)
}

export interface ReleaseSearchParams extends CatalogSearchParams {
  type?: Release['type'];
  status?: Release['status'];
  release_date_after?: string;
  release_date_before?: string;
  label_name?: string;
  entity_id?: number;  // Filter by entity (credits or label)
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Credit {
  id: number;
  entity_id: number;
  entity_name?: string;
  role: string;
  role_display?: string;
  credited_as?: string;
  share_kind?: string;
  share_value?: number;
}

export interface Split {
  id: number;
  entity_id: number;
  entity_name?: string;
  right_type: 'writer' | 'publisher' | 'master' | 'performance' | 'sync' | 'producer';
  right_type_display?: string;
  share: number;
  is_locked: boolean;
  source?: string;
}

// Aggregate endpoint responses
export interface WorkDetails {
  work: Work;
  credits: Credit[];
  splits: {
    writer: Split[];
    publisher: Split[];
  };
  recordings: Recording[];
  contracts: any[];
  statistics: {
    total_recordings: number;
    total_releases: number;
    total_publications: number;
    has_complete_writer_splits: boolean;
    has_complete_publisher_splits: boolean;
    platforms_covered: string[];
  };
}

export interface RecordingDetails {
  recording: Recording;
  work?: any;
  releases: any[];
  credits: Credit[];
  master_splits: Split[];
  publications: any[];
  assets: Asset[];
  contracts: any[];
  statistics: {
    total_releases: number;
    total_publications: number;
    total_assets: number;
    has_master_asset: boolean;
    platforms_covered: string[];
    territories_covered: string[];
    monetized_platforms: string[];
  };
}

class CatalogService {
  private readonly BASE_PATH = '/api/v1/catalog';

  // Works
  async getWorks(params?: WorkSearchParams): Promise<PaginatedResponse<Work>> {
    const { data } = await apiClient.get<PaginatedResponse<Work>>(
      `${this.BASE_PATH}/works/`,
      { params }
    );
    return data;
  }

  async getWork(id: number): Promise<Work> {
    const { data } = await apiClient.get<Work>(`${this.BASE_PATH}/works/${id}/`);
    return data;
  }

  async createWork(payload: Partial<Work>): Promise<Work> {
    const { data } = await apiClient.post<Work>(`${this.BASE_PATH}/works/`, payload);
    return data;
  }

  async updateWork(id: number, payload: Partial<Work>): Promise<Work> {
    const { data } = await apiClient.patch<Work>(
      `${this.BASE_PATH}/works/${id}/`,
      payload
    );
    return data;
  }

  async deleteWork(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/works/${id}/`);
  }

  async addISWC(workId: number, iswc: string): Promise<any> {
    const { data } = await apiClient.post(
      `${this.BASE_PATH}/works/${workId}/add_iswc/`,
      { iswc }
    );
    return data;
  }

  async getWorkDetails(workId: number): Promise<WorkDetails> {
    const { data } = await apiClient.get<WorkDetails>(
      `${this.BASE_PATH}/song-hub/${workId}/`
    );
    return data;
  }

  async getWorkCredits(workId: number): Promise<Credit[]> {
    const { data } = await apiClient.get<Credit[]>(
      `${this.BASE_PATH}/works/${workId}/credits/`
    );
    return data;
  }

  async getWorkSplits(workId: number): Promise<Split[]> {
    const { data } = await apiClient.get<Split[]>(
      `${this.BASE_PATH}/works/${workId}/splits/`
    );
    return data;
  }

  // Recordings
  async getRecordings(params?: RecordingSearchParams): Promise<PaginatedResponse<Recording>> {
    const { data } = await apiClient.get<PaginatedResponse<Recording>>(
      `${this.BASE_PATH}/recordings/`,
      { params }
    );
    return data;
  }

  async getRecording(id: number): Promise<Recording> {
    const { data } = await apiClient.get<Recording>(
      `${this.BASE_PATH}/recordings/${id}/`
    );
    return data;
  }

  async createRecording(payload: Partial<Recording>): Promise<Recording> {
    const { data } = await apiClient.post<Recording>(
      `${this.BASE_PATH}/recordings/`,
      payload
    );
    return data;
  }

  async updateRecording(id: number, payload: Partial<Recording>): Promise<Recording> {
    const { data } = await apiClient.patch<Recording>(
      `${this.BASE_PATH}/recordings/${id}/`,
      payload
    );
    return data;
  }

  async deleteRecording(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/recordings/${id}/`);
  }

  async addISRC(recordingId: number, isrc: string): Promise<any> {
    const { data } = await apiClient.post(
      `${this.BASE_PATH}/recordings/${recordingId}/add_isrc/`,
      { isrc }
    );
    return data;
  }

  async getRecordingDetails(recordingId: number): Promise<RecordingDetails> {
    const { data } = await apiClient.get<RecordingDetails>(
      `${this.BASE_PATH}/track-preview/${recordingId}/`
    );
    return data;
  }

  async getRecordingCredits(recordingId: number): Promise<Credit[]> {
    const { data } = await apiClient.get<Credit[]>(
      `${this.BASE_PATH}/recordings/${recordingId}/credits/`
    );
    return data;
  }

  async getRecordingSplits(recordingId: number): Promise<Split[]> {
    const { data } = await apiClient.get<Split[]>(
      `${this.BASE_PATH}/recordings/${recordingId}/splits/`
    );
    return data;
  }

  // Releases
  async getReleases(params?: ReleaseSearchParams): Promise<PaginatedResponse<Release>> {
    const { data } = await apiClient.get<PaginatedResponse<Release>>(
      `${this.BASE_PATH}/releases/`,
      { params }
    );
    return data;
  }

  async getRelease(id: number): Promise<Release> {
    const { data } = await apiClient.get<Release>(
      `${this.BASE_PATH}/releases/${id}/`
    );
    return data;
  }

  async createRelease(payload: Partial<Release>): Promise<Release> {
    const { data } = await apiClient.post<Release>(
      `${this.BASE_PATH}/releases/`,
      payload
    );
    return data;
  }

  async updateRelease(id: number, payload: Partial<Release>): Promise<Release> {
    const { data } = await apiClient.patch<Release>(
      `${this.BASE_PATH}/releases/${id}/`,
      payload
    );
    return data;
  }

  async deleteRelease(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/releases/${id}/`);
  }

  async addUPC(releaseId: number, upc: string): Promise<any> {
    const { data } = await apiClient.post(
      `${this.BASE_PATH}/releases/${releaseId}/add_upc/`,
      { upc }
    );
    return data;
  }

  async getUpcomingReleases(): Promise<Release[]> {
    const { data } = await apiClient.get<PaginatedResponse<Release>>(
      `${this.BASE_PATH}/releases/upcoming/`
    );
    return data.results;
  }

  async getRecentReleases(days = 30): Promise<Release[]> {
    const { data } = await apiClient.get<PaginatedResponse<Release>>(
      `${this.BASE_PATH}/releases/recent/`,
      { params: { days } }
    );
    return data.results;
  }

  // Assets
  async uploadAsset(recordingId: number, file: File, metadata: {
    kind: Asset['kind'];
    is_master?: boolean;
    is_public?: boolean;
    notes?: string;
  }): Promise<Asset> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recording', recordingId.toString());
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    const { data } = await apiClient.post<Asset>(
      `${this.BASE_PATH}/assets/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return data;
  }

  async deleteAsset(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/assets/${id}/`);
  }

  async getMasterAssets(): Promise<Asset[]> {
    const { data } = await apiClient.get<PaginatedResponse<Asset>>(
      `${this.BASE_PATH}/assets/masters/`
    );
    return data.results;
  }

  async getPublicAssets(): Promise<Asset[]> {
    const { data } = await apiClient.get<PaginatedResponse<Asset>>(
      `${this.BASE_PATH}/assets/public/`
    );
    return data.results;
  }
}

const catalogService = new CatalogService();
export default catalogService;
