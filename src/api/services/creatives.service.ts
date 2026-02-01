import apiClient from '../client';
import { PaginatedResponse, EntityListItem, Entity, EntitySearchParams } from './entities.service';

// Creative-specific fields (from backend Creative model)
export interface Creative extends Entity {
  // Creative-specific fields
  creative_type: 'artist' | 'producer' | 'composer' | 'lyricist' | 'audio_editor' | 'writer' | 'creative_other';
  stage_name?: string;
  rate_tier?: 'standard' | 'premium' | 'exclusive';
  rate_tier_display?: string;
  exclusivities_active?: number;
  // Convenience properties from backend
  is_artist?: boolean;
  is_producer?: boolean;
  is_composer?: boolean;
  is_lyricist?: boolean;
}

export interface CreativeListItem extends EntityListItem {
  creative_type: string;
  stage_name?: string;
  rate_tier?: string;
  rate_tier_display?: string;
}

export interface CreateCreativePayload {
  kind: 'PF' | 'PJ';
  display_name: string;
  creative_type: string;
  is_internal?: boolean;
  first_name?: string;
  last_name?: string;
  stage_name?: string;
  nationality?: string;
  gender?: 'M' | 'F' | 'O';
  rate_tier?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  company_registration_number?: string;
  vat_number?: string;
  iban?: string;
  bank_name?: string;
  bank_branch?: string;
  notes?: string;
}

export type UpdateCreativePayload = Partial<CreateCreativePayload>;

export interface CreativeSearchParams extends Omit<EntitySearchParams, 'classification'> {
  creative_type?: string;
  rate_tier?: string;
}

class CreativesService {
  private readonly BASE_PATH = '/api/v1/creatives';

  // List all creatives (paginated)
  async getCreatives(params?: CreativeSearchParams): Promise<PaginatedResponse<CreativeListItem>> {
    const { data } = await apiClient.get<PaginatedResponse<CreativeListItem>>(
      `${this.BASE_PATH}/`,
      { params }
    );
    return data;
  }

  // Get creative details
  async getCreative(id: number): Promise<Creative> {
    const { data } = await apiClient.get<Creative>(`${this.BASE_PATH}/${id}/`);
    return data;
  }

  // Create creative
  async createCreative(payload: CreateCreativePayload): Promise<Creative> {
    const { data } = await apiClient.post<Creative>(
      `${this.BASE_PATH}/`,
      payload
    );
    return data;
  }

  // Update creative (full update)
  async updateCreative(id: number, payload: CreateCreativePayload): Promise<Creative> {
    const { data } = await apiClient.put<Creative>(
      `${this.BASE_PATH}/${id}/`,
      payload
    );
    return data;
  }

  // Partial update creative
  async patchCreative(id: number, payload: UpdateCreativePayload): Promise<Creative> {
    const { data } = await apiClient.patch<Creative>(
      `${this.BASE_PATH}/${id}/`,
      payload
    );
    return data;
  }

  // Delete creative
  async deleteCreative(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${id}/`);
  }

  // Get creative stats
  async getCreativeStats(params?: CreativeSearchParams): Promise<any> {
    const { data } = await apiClient.get(`${this.BASE_PATH}/stats/`, { params });
    return data;
  }

  // Search creatives (autocomplete)
  async searchCreatives(query: string): Promise<CreativeListItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<CreativeListItem>>(
      `${this.BASE_PATH}/`,
      {
        params: { search: query, page_size: 20 },
      }
    );
    return data.results;
  }
}

const creativesService = new CreativesService();
export default creativesService;

// Constants for creative types
export const CREATIVE_TYPE_OPTIONS = [
  { value: 'artist', label: 'Artist' },
  { value: 'producer', label: 'Producer' },
  { value: 'composer', label: 'Composer' },
  { value: 'lyricist', label: 'Lyricist' },
  { value: 'audio_editor', label: 'Audio Editor' },
  { value: 'writer', label: 'Writer' },
  { value: 'creative_other', label: 'Other Creative' },
] as const;
