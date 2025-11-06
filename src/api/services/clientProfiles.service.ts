import apiClient from '../client';

export interface ClientProfile {
  id: number;
  entity: number;
  entity_name: string;
  department: number;
  department_name: string;
  health_score: number | null;
  collaboration_frequency_score: number | null;
  feedback_score: number | null;
  payment_latency_score: number | null;
  notes: string;
  updated_by: number | null;
  updated_by_name: string | null;
  score_trend: 'up' | 'down' | 'stable';
  recent_history: ClientProfileHistory[];
  created_at: string;
  updated_at: string;
}

export interface ClientProfileHistory {
  id: number;
  client_profile: number;
  health_score: number | null;
  collaboration_frequency_score: number | null;
  feedback_score: number | null;
  payment_latency_score: number | null;
  notes: string;
  changed_by: number | null;
  changed_by_name: string | null;
  change_reason: string;
  changed_at: string;
  score_change: number | null;
}

export interface CreateClientProfilePayload {
  entity: number;
  health_score?: number;
  collaboration_frequency_score?: number;
  feedback_score?: number;
  payment_latency_score?: number;
  notes?: string;
}

export interface UpdateClientProfilePayload {
  health_score?: number;
  collaboration_frequency_score?: number;
  feedback_score?: number;
  payment_latency_score?: number;
  notes?: string;
}

const clientProfilesService = {
  /**
   * Get client profiles for the current user's department
   */
  async getClientProfiles(params?: {
    entity?: number;
    department?: number;
    min_health_score?: number;
    max_health_score?: number;
  }): Promise<ClientProfile[]> {
    const response = await apiClient.get<ClientProfile[]>('/api/v1/identity/entity-scores/', {
      params,
    });
    return response.data;
  },

  /**
   * Get client profile by ID
   */
  async getClientProfile(id: number): Promise<ClientProfile> {
    const response = await apiClient.get<ClientProfile>(`/api/v1/identity/entity-scores/${id}/`);
    return response.data;
  },

  /**
   * Get client profile for a specific entity (for current user's department)
   */
  async getClientProfileByEntity(entityId: number): Promise<ClientProfile | null> {
    const response = await apiClient.get<ClientProfile[]>('/api/v1/identity/entity-scores/by_entity/', {
      params: { entity_id: entityId },
    });
    // Returns array, but should only have one for current department
    return response.data[0] || null;
  },

  /**
   * Create a new client profile
   */
  async createClientProfile(data: CreateClientProfilePayload): Promise<ClientProfile> {
    const response = await apiClient.post<ClientProfile>('/api/v1/identity/entity-scores/', data);
    return response.data;
  },

  /**
   * Update a client profile
   */
  async updateClientProfile(
    id: number,
    data: UpdateClientProfilePayload
  ): Promise<ClientProfile> {
    const response = await apiClient.patch<ClientProfile>(`/api/v1/identity/entity-scores/${id}/`, data);
    return response.data;
  },

  /**
   * Get full history for a client profile
   */
  async getClientProfileHistory(profileId: number): Promise<ClientProfileHistory[]> {
    const response = await apiClient.get<ClientProfileHistory[]>(
      `/api/v1/identity/entity-scores/${profileId}/history/`
    );
    return response.data;
  },

  /**
   * Get client profile statistics for current department
   */
  async getClientProfileStats(departmentId?: number): Promise<{
    total_profiles: number;
    profiles_with_scores: number;
    average_health_score: number | null;
    score_distribution: {
      poor: number;
      fair: number;
      good: number;
    };
    trend_distribution: {
      up: number;
      down: number;
      stable: number;
    };
  }> {
    const response = await apiClient.get('/api/v1/identity/entity-scores/stats/', {
      params: departmentId ? { department_id: departmentId } : undefined,
    });
    return response.data;
  },
};

export default clientProfilesService;
