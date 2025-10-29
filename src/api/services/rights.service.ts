import apiClient from '../client';

// Types
export interface Credit {
  id: number;
  scope: 'work' | 'recording';
  scope_display?: string;
  object_id: number;
  object_title?: string;
  entity: number;
  entity_name?: string;
  entity_details?: any;
  role: 'writer' | 'composer' | 'lyricist' | 'producer' | 'artist' | 'featured_artist' | 'performer' | 'engineer' | 'mixer' | 'mastering' | 'arranger' | 'conductor' | 'director' | 'publisher' | 'label';
  role_display?: string;
  credited_as?: string;
  share_kind?: 'percentage' | 'points' | 'fixed' | 'none';
  share_kind_display?: string;
  share_value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Split {
  id: number;
  scope: 'work' | 'recording';
  scope_display?: string;
  object_id: number;
  object_title?: string;
  entity: number;
  entity_name?: string;
  entity_details?: any;
  right_type: 'writer' | 'publisher' | 'master' | 'performance' | 'sync' | 'producer';
  right_type_display?: string;
  share: number;
  source?: string;
  is_locked: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SplitValidation {
  scope: string;
  object_id: number;
  object_title: string;
  right_type: string;
  right_type_display: string;
  total: number;
  is_complete: boolean;
  missing: number;
  splits: Array<{
    entity_id: number;
    entity__display_name: string;
    share: number;
    source?: string;
  }>;
}

export interface RightsValidationReport {
  work_validation?: any;
  recording_validation?: any;
  errors: string[];
  warnings: string[];
  is_valid: boolean;
}

export interface CreditSearchParams {
  scope?: 'work' | 'recording';
  role?: string;
  entity?: number;
  share_kind?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface SplitSearchParams {
  scope?: 'work' | 'recording';
  right_type?: string;
  entity?: number;
  is_locked?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface BulkCreditPayload {
  scope: 'work' | 'recording';
  object_id: number;
  credits: Array<{
    entity_id: number;
    role: string;
    credited_as?: string;
    share_kind?: string;
    share_value?: number;
  }>;
}

export interface BulkSplitPayload {
  scope: 'work' | 'recording';
  object_id: number;
  right_type: string;
  splits: Array<{
    entity_id: number;
    share: number;
    source?: string;
  }>;
}

export interface AutoCalculatePayload {
  scope: 'work' | 'recording';
  object_id: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class RightsService {
  private readonly BASE_PATH = '/api/v1/rights';

  // Credits
  async getCredits(params?: CreditSearchParams): Promise<PaginatedResponse<Credit>> {
    const { data } = await apiClient.get<PaginatedResponse<Credit>>(
      `${this.BASE_PATH}/credits/`,
      { params }
    );
    return data;
  }

  async getCredit(id: number): Promise<Credit> {
    const { data } = await apiClient.get<Credit>(`${this.BASE_PATH}/credits/${id}/`);
    return data;
  }

  async createCredit(payload: Partial<Credit>): Promise<Credit> {
    const { data } = await apiClient.post<Credit>(
      `${this.BASE_PATH}/credits/`,
      payload
    );
    return data;
  }

  async updateCredit(id: number, payload: Partial<Credit>): Promise<Credit> {
    const { data } = await apiClient.patch<Credit>(
      `${this.BASE_PATH}/credits/${id}/`,
      payload
    );
    return data;
  }

  async deleteCredit(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/credits/${id}/`);
  }

  async getCreditsByObject(scope: 'work' | 'recording', objectId: number): Promise<Credit[]> {
    const { data } = await apiClient.get<Credit[]>(
      `${this.BASE_PATH}/credits/by_object/`,
      { params: { scope, object_id: objectId } }
    );
    return data;
  }

  async getCreditsByEntity(entityId: number): Promise<Credit[]> {
    const { data } = await apiClient.get<PaginatedResponse<Credit>>(
      `${this.BASE_PATH}/credits/by_entity/`,
      { params: { entity_id: entityId } }
    );
    return data.results;
  }

  async bulkCreateCredits(payload: BulkCreditPayload): Promise<Credit[]> {
    const { data } = await apiClient.post<Credit[]>(
      `${this.BASE_PATH}/credits/bulk_create/`,
      payload
    );
    return data;
  }

  async getWriterCredits(): Promise<Credit[]> {
    const { data } = await apiClient.get<PaginatedResponse<Credit>>(
      `${this.BASE_PATH}/credits/writers/`
    );
    return data.results;
  }

  async getPerformerCredits(): Promise<Credit[]> {
    const { data } = await apiClient.get<PaginatedResponse<Credit>>(
      `${this.BASE_PATH}/credits/performers/`
    );
    return data.results;
  }

  // Splits
  async getSplits(params?: SplitSearchParams): Promise<PaginatedResponse<Split>> {
    const { data } = await apiClient.get<PaginatedResponse<Split>>(
      `${this.BASE_PATH}/splits/`,
      { params }
    );
    return data;
  }

  async getSplit(id: number): Promise<Split> {
    const { data } = await apiClient.get<Split>(`${this.BASE_PATH}/splits/${id}/`);
    return data;
  }

  async createSplit(payload: Partial<Split>): Promise<Split> {
    const { data } = await apiClient.post<Split>(
      `${this.BASE_PATH}/splits/`,
      payload
    );
    return data;
  }

  async updateSplit(id: number, payload: Partial<Split>): Promise<Split> {
    const { data } = await apiClient.patch<Split>(
      `${this.BASE_PATH}/splits/${id}/`,
      payload
    );
    return data;
  }

  async deleteSplit(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/splits/${id}/`);
  }

  async getSplitsByObject(
    scope: 'work' | 'recording',
    objectId: number,
    rightType?: string
  ): Promise<Split[]> {
    const { data } = await apiClient.get<Split[]>(
      `${this.BASE_PATH}/splits/by_object/`,
      { params: { scope, object_id: objectId, right_type: rightType } }
    );
    return data;
  }

  async validateSplits(
    scope: 'work' | 'recording',
    objectId: number,
    rightType: string
  ): Promise<SplitValidation> {
    const { data } = await apiClient.get<SplitValidation>(
      `${this.BASE_PATH}/splits/validate/`,
      { params: { scope, object_id: objectId, right_type: rightType } }
    );
    return data;
  }

  async bulkCreateSplits(payload: BulkSplitPayload): Promise<Split[]> {
    const { data } = await apiClient.post<Split[]>(
      `${this.BASE_PATH}/splits/bulk_create/`,
      payload
    );
    return data;
  }

  async autoCalculateSplits(payload: AutoCalculatePayload): Promise<Split[]> {
    const { data } = await apiClient.post<Split[]>(
      `${this.BASE_PATH}/splits/auto_calculate/`,
      payload
    );
    return data;
  }

  async lockSplit(id: number): Promise<Split> {
    const { data } = await apiClient.post<Split>(
      `${this.BASE_PATH}/splits/${id}/lock/`
    );
    return data;
  }

  async unlockSplit(id: number): Promise<Split> {
    const { data } = await apiClient.post<Split>(
      `${this.BASE_PATH}/splits/${id}/unlock/`
    );
    return data;
  }

  async lockAllSplits(
    scope: 'work' | 'recording',
    objectId: number,
    rightType?: string
  ): Promise<{ success: boolean; locked_count: number }> {
    const { data } = await apiClient.post(
      `${this.BASE_PATH}/splits/lock_all/`,
      { scope, object_id: objectId, right_type: rightType }
    );
    return data;
  }

  async getRightsReport(
    scope: 'work' | 'recording',
    objectId: number
  ): Promise<RightsValidationReport> {
    const { data } = await apiClient.get<RightsValidationReport>(
      `${this.BASE_PATH}/splits/report/`,
      { params: { scope, object_id: objectId } }
    );
    return data;
  }

  async getSplitStats(): Promise<any> {
    const { data } = await apiClient.get(`${this.BASE_PATH}/splits/stats/`);
    return data;
  }
}

const rightsService = new RightsService();
export default rightsService;