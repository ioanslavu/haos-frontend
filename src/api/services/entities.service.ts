import apiClient from '../client';
import { EntityLatestShares } from './contracts.service';

// Types
export interface SensitiveIdentity {
  id: number;
  entity: number;
  entity_name: string;
  identification_type: 'ID_CARD' | 'PASSPORT';
  identification_type_display?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  // ID Card fields
  cnp?: string; // Masked by default
  id_series?: string;
  id_number?: string;
  // Passport fields
  passport_number?: string; // Masked by default
  passport_country?: string;
  // Shared fields
  id_issued_by?: string;
  id_issued_date?: string;
  id_expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactPerson {
  id: number;
  entity: number;
  name: string;
  role?: string;
  role_display?: string;
  engagement_stage?: string;
  engagement_stage_display?: string;
  sentiment?: string;
  sentiment_display?: string;
  notes?: string;
  emails: ContactEmail[];
  phones: ContactPhone[];
  created_at: string;
  updated_at: string;
}

export interface ContactEmail {
  id?: number;
  email: string;
  label?: string;
  is_primary: boolean;
}

export interface ContactPhone {
  id?: number;
  phone: string;
  label?: string;
  is_primary: boolean;
}

// Classification types
export type EntityClassification = 'CREATIVE' | 'CLIENT';

// Entity type options
export type CreativeType = 'artist' | 'producer' | 'composer' | 'lyricist' | 'audio_editor' | 'writer' | 'creative_other';
export type ClientType = 'brand' | 'agency' | 'label' | 'publisher' | 'distributor' | 'client_other';
export type EntityType = CreativeType | ClientType;

export interface Entity {
  id: number;
  kind: 'PF' | 'PJ'; // Physical Person or Legal Entity
  kind_display?: string;
  // New classification fields
  classification: EntityClassification;
  classification_display: string;
  is_internal: boolean;
  entity_type: EntityType | null;
  type_display: string | null;
  // Basic info
  display_name: string;
  alias_name?: string;
  first_name?: string; // For PF
  last_name?: string; // For PF
  stage_name?: string; // For PF
  nationality?: string; // For PF
  gender?: 'M' | 'F' | 'O'; // For PF
  image?: string;
  image_url?: string;
  profile_photo?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  company_registration_number?: string; // For PJ
  vat_number?: string; // For PJ
  iban?: string;
  bank_name?: string;
  bank_branch?: string;
  notes?: string;
  identifiers?: Identifier[];
  sensitive_identity?: SensitiveIdentity; // For PF
  social_media_accounts?: SocialMediaAccount[];
  contact_persons?: ContactPerson[];
  has_sensitive_data?: boolean; // For PF
  placeholders?: Record<string, string>; // For contract generation
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface SocialMediaAccount {
  id: number;
  entity: number;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'spotify' | 'apple_music' | 'soundcloud' | 'bandcamp' | 'linkedin' | 'website' | 'other';
  platform_display: string;
  platform_icon: string;
  handle?: string;
  url: string;
  display_name?: string;
  follower_count?: number;
  is_verified: boolean;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Identifier {
  id: number;
  scheme: 'ISNI' | 'IPI' | 'ISRC' | 'ISWC' | 'UPC' | 'EAN' | 'VAT' | 'TAX' | 'OTHER';
  value: string;
  pii_flag: boolean;
  issued_by?: string;
  issued_date?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface EntityListItem {
  id: number;
  kind: 'PF' | 'PJ';
  kind_display?: string;
  // Classification fields
  classification: EntityClassification;
  classification_display: string;
  is_internal: boolean;
  entity_type: EntityType | null;
  type_display: string | null;
  // Basic info
  display_name: string;
  alias_name?: string;
  first_name?: string;
  last_name?: string;
  stage_name?: string;
  nationality?: string;
  gender?: 'M' | 'F' | 'O';
  image?: string;
  image_url?: string;
  profile_photo?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface CreateEntityPayload {
  kind: 'PF' | 'PJ';
  display_name: string;
  // Classification fields
  classification: EntityClassification;
  is_internal?: boolean;
  entity_type?: EntityType | null;
  // Personal info (PF)
  first_name?: string;
  last_name?: string;
  stage_name?: string;
  nationality?: string;
  gender?: 'M' | 'F' | 'O';
  // Sensitive (PF)
  identification_type?: 'ID_CARD' | 'PASSPORT';
  cnp?: string;
  id_series?: string;
  id_number?: string;
  passport_number?: string;
  passport_country?: string;
  id_issued_by?: string;
  id_issued_date?: string;
  id_expiry_date?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  // Contact
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  // Business (PJ)
  company_registration_number?: string;
  vat_number?: string;
  // Banking
  iban?: string;
  bank_name?: string;
  bank_branch?: string;
  notes?: string;
}

export type UpdateEntityPayload = Partial<CreateEntityPayload>;

export interface EntitySearchParams {
  kind?: 'PF' | 'PJ';
  classification?: EntityClassification;
  is_internal?: boolean;
  entity_type?: EntityType;
  search?: string;
  created_after?: string;
  created_before?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Note: SensitiveIdentity is defined above (lines 4-26) - this duplicate is removed

export interface RevealCNPResponse {
  cnp: string;
  masked_cnp: string;
  audit_logged: boolean;
  viewer: string;
  timestamp: string;
}

export interface EntityStats {
  total: number;
  by_classification: {
    creative: number;
    client: number;
  };
  by_internal: {
    internal: number;
    external: number;
  };
  by_kind: {
    physical: number;
    legal: number;
  };
  by_type: Record<string, number>;
  recent_entities: EntityListItem[];
  // Legacy fields for backward compatibility
  total_entities?: number;
  physical_persons?: number;
  legal_entities?: number;
  creative?: number;
  physical?: number;
  legal?: number;
}

class EntitiesService {
  private readonly BASE_PATH = '/api/v1/entities';

  // List all entities (paginated)
  async getEntities(params?: EntitySearchParams): Promise<PaginatedResponse<EntityListItem>> {
    const { data } = await apiClient.get<PaginatedResponse<EntityListItem>>(
      `${this.BASE_PATH}/`,
      { params }
    );
    return data;
  }

  // Search entities (autocomplete)
  async searchEntities(query: string): Promise<EntityListItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<EntityListItem>>(
      `${this.BASE_PATH}/`,
      {
        params: { search: query, page_size: 20 },
      }
    );
    return data.results;
  }

  // Get entity details
  async getEntity(id: number): Promise<Entity> {
    const { data } = await apiClient.get<Entity>(`${this.BASE_PATH}/${id}/`);
    return data;
  }

  // Create entity
  async createEntity(payload: CreateEntityPayload): Promise<Entity> {
    const { data } = await apiClient.post<Entity>(
      `${this.BASE_PATH}/`,
      payload
    );
    return data;
  }

  // Update entity (full update)
  async updateEntity(id: number, payload: CreateEntityPayload): Promise<Entity> {
    const { data } = await apiClient.put<Entity>(
      `${this.BASE_PATH}/${id}/`,
      payload
    );
    return data;
  }

  // Partial update entity
  async patchEntity(id: number, payload: UpdateEntityPayload): Promise<Entity> {
    const { data } = await apiClient.patch<Entity>(
      `${this.BASE_PATH}/${id}/`,
      payload
    );
    return data;
  }

  // Delete entity
  async deleteEntity(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${id}/`);
  }

  // Upload entity image
  async uploadEntityImage(id: number, file: File): Promise<Entity> {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.patch<Entity>(
      `${this.BASE_PATH}/${id}/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  }

  // Delete entity image
  async deleteEntityImage(id: number): Promise<Entity> {
    const { data } = await apiClient.patch<Entity>(
      `${this.BASE_PATH}/${id}/`,
      { image: null }
    );
    return data;
  }

  // Get creatives (convenience method)
  async getCreatives(params?: Omit<EntitySearchParams, 'classification'>): Promise<PaginatedResponse<EntityListItem>> {
    return this.getEntities({ ...params, classification: 'CREATIVE' });
  }

  // Get clients (convenience method)
  async getClients(params?: Omit<EntitySearchParams, 'classification'>): Promise<PaginatedResponse<EntityListItem>> {
    return this.getEntities({ ...params, classification: 'CLIENT' });
  }

  // Get entity stats
  async getEntityStats(params?: EntitySearchParams): Promise<EntityStats> {
    const { data } = await apiClient.get<EntityStats>(`${this.BASE_PATH}/stats/`, { params });
    return data;
  }

  // Get sensitive identity
  async getSensitiveIdentity(entityId: number): Promise<SensitiveIdentity> {
    const { data } = await apiClient.get<SensitiveIdentity>(
      `${this.BASE_PATH}/sensitive/`,
      { params: { entity: entityId } }
    );
    return data;
  }

  // Reveal CNP with audit logging
  async revealCNP(sensitiveIdentityId: number, reason: string): Promise<RevealCNPResponse> {
    const { data } = await apiClient.post<RevealCNPResponse>(
      `${this.BASE_PATH}/sensitive/${sensitiveIdentityId}/reveal/`,
      { reason }
    );
    return data;
  }

  // Get latest contract shares for auto-populating contract generation forms
  async getLatestContractShares(
    entityId: number,
    contractType?: string
  ): Promise<EntityLatestShares> {
    const params = contractType ? { contract_type: contractType } : {};
    const { data } = await apiClient.get<EntityLatestShares>(
      `${this.BASE_PATH}/${entityId}/contract-shares/`,
      { params }
    );
    return data;
  }

  // Social Media Account methods
  async getSocialMediaAccounts(entityId: number): Promise<SocialMediaAccount[]> {
    const { data } = await apiClient.get<SocialMediaAccount[]>(
      `${this.BASE_PATH}/social/`,
      { params: { entity: entityId } }
    );
    return data;
  }

  async createSocialMediaAccount(payload: Partial<SocialMediaAccount>): Promise<SocialMediaAccount> {
    const { data } = await apiClient.post<SocialMediaAccount>(
      `${this.BASE_PATH}/social/`,
      payload
    );
    return data;
  }

  async updateSocialMediaAccount(id: number, payload: Partial<SocialMediaAccount>): Promise<SocialMediaAccount> {
    const { data } = await apiClient.patch<SocialMediaAccount>(
      `${this.BASE_PATH}/social/${id}/`,
      payload
    );
    return data;
  }

  async deleteSocialMediaAccount(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/social/${id}/`);
  }

  // Contact Person methods
  async getContactPersons(entityId?: number): Promise<ContactPerson[]> {
    const params = entityId ? { entity: entityId } : {};
    const { data } = await apiClient.get<{ results: ContactPerson[] }>(
      `${this.BASE_PATH}/contacts/`,
      { params }
    );
    return data.results || [];
  }

  async getContactPerson(id: number): Promise<ContactPerson> {
    const { data } = await apiClient.get<ContactPerson>(
      `${this.BASE_PATH}/contacts/${id}/`
    );
    return data;
  }

  async createContactPerson(payload: Partial<ContactPerson>): Promise<ContactPerson> {
    const { data } = await apiClient.post<ContactPerson>(
      `${this.BASE_PATH}/contacts/`,
      payload
    );
    return data;
  }

  async updateContactPerson(id: number, payload: Partial<ContactPerson>): Promise<ContactPerson> {
    const { data } = await apiClient.patch<ContactPerson>(
      `${this.BASE_PATH}/contacts/${id}/`,
      payload
    );
    return data;
  }

  async deleteContactPerson(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/contacts/${id}/`);
  }

  // Global search (bypasses department filtering)
  async searchGlobal(query: string): Promise<EntityListItem[]> {
    const { data } = await apiClient.get<EntityListItem[]>(
      `${this.BASE_PATH}/search/`,
      { params: { q: query } }
    );
    return data;
  }

  // Add entity to user's department
  async addToMyDepartment(entityId: number): Promise<{ status: string; message?: string }> {
    const { data } = await apiClient.post<{ status: string; message?: string }>(
      `${this.BASE_PATH}/${entityId}/add-to-department/`
    );
    return data;
  }
}

const entitiesService = new EntitiesService();
export default entitiesService;

// Constants for entity classification and types
export const CLASSIFICATION_OPTIONS = [
  { value: 'CREATIVE', label: 'Creative' },
  { value: 'CLIENT', label: 'Client' },
] as const;

export const CREATIVE_TYPE_OPTIONS = [
  { value: 'artist', label: 'Artist' },
  { value: 'producer', label: 'Producer' },
  { value: 'composer', label: 'Composer' },
  { value: 'lyricist', label: 'Lyricist' },
  { value: 'audio_editor', label: 'Audio Editor' },
  { value: 'writer', label: 'Writer' },
  { value: 'creative_other', label: 'Other Creative' },
] as const;

export const CLIENT_TYPE_OPTIONS = [
  { value: 'brand', label: 'Brand' },
  { value: 'agency', label: 'Agency' },
  { value: 'label', label: 'Label' },
  { value: 'publisher', label: 'Publisher' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'client_other', label: 'Other Client' },
] as const;

export const ALL_TYPE_OPTIONS = [...CREATIVE_TYPE_OPTIONS, ...CLIENT_TYPE_OPTIONS];

// Type colors for badges
export const TYPE_COLORS: Record<string, string> = {
  // Creative types
  artist: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  producer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  composer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  lyricist: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  audio_editor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  writer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  creative_other: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  // Client types
  brand: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  agency: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  label: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  publisher: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  distributor: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
  client_other: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
};

export const CLASSIFICATION_COLORS: Record<string, string> = {
  CREATIVE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  CLIENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};