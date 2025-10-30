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

export interface Entity {
  id: number;
  kind: 'PF' | 'PJ'; // Physical Person or Legal Entity
  display_name: string;
  first_name?: string; // For PF
  last_name?: string; // For PF
  stage_name?: string; // For PF
  nationality?: string; // For PF
  gender?: 'M' | 'F' | 'O'; // For PF
  image?: string; // Image file path
  image_url?: string; // Full URL to image
  profile_photo?: string; // Profile photo path
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  company_registration_number?: string; // For PJ
  vat_number?: string; // For PJ
  iban?: string; // Banking
  bank_name?: string; // Banking
  bank_branch?: string; // Banking
  notes?: string;
  entity_roles?: EntityRole[];
  identifiers?: Identifier[];
  sensitive_identity?: SensitiveIdentity; // For PF
  social_media_accounts?: SocialMediaAccount[];
  contact_persons?: ContactPerson[]; // Contact persons for this entity
  has_sensitive_data?: boolean; // For PF
  placeholders?: Record<string, string>; // For contract generation
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface EntityRole {
  id: number;
  role: 'artist' | 'writer' | 'producer' | 'label' | 'publisher' | 'performer' | 'engineer' | 'client' | 'vendor' | 'employee';
  role_display?: string;
  primary_role: boolean;
  is_internal: boolean;
  created_at: string;
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
  display_name: string;
  first_name?: string;
  last_name?: string;
  stage_name?: string;
  image?: string;
  image_url?: string;
  profile_photo?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  created_at: string;
}

export interface RoleData {
  role: string;
  is_internal?: boolean;
}

export interface CreateEntityPayload {
  kind: 'PF' | 'PJ';
  display_name: string;
  first_name?: string;
  last_name?: string;
  cnp?: string; // For PF - will be encrypted
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
  roles?: (string | RoleData)[]; // Can be simple strings or objects with is_internal
  primary_role?: string;
}

export type UpdateEntityPayload = Partial<CreateEntityPayload>;

export interface EntitySearchParams {
  kind?: 'PF' | 'PJ';
  has_role?: string;
  is_internal?: boolean;
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

export interface SensitiveIdentity {
  id: number;
  entity: number;
  entity_name?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  cnp?: string; // Masked by default
  id_series?: string;
  id_number?: string;
  id_issued_by?: string;
  id_issued_date?: string;
  id_expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RevealCNPResponse {
  cnp: string;
  masked_cnp: string;
  audit_logged: boolean;
  viewer: string;
  timestamp: string;
}

class EntitiesService {
  private readonly BASE_PATH = '/api/v1/identity';

  // List all entities (paginated)
  async getEntities(params?: EntitySearchParams): Promise<PaginatedResponse<EntityListItem>> {
    const { data } = await apiClient.get<PaginatedResponse<EntityListItem>>(
      `${this.BASE_PATH}/entities/`,
      { params }
    );
    return data;
  }

  // Search entities (autocomplete)
  async searchEntities(query: string): Promise<EntityListItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<EntityListItem>>(
      `${this.BASE_PATH}/entities/`,
      {
        params: { search: query, page_size: 20 },
      }
    );
    return data.results;
  }

  // Get entity details
  async getEntity(id: number): Promise<Entity> {
    const { data } = await apiClient.get<Entity>(`${this.BASE_PATH}/entities/${id}/`);
    return data;
  }

  // Create entity
  async createEntity(payload: CreateEntityPayload): Promise<Entity> {
    const { data } = await apiClient.post<Entity>(
      `${this.BASE_PATH}/entities/`,
      payload
    );
    return data;
  }

  // Update entity (full update)
  async updateEntity(id: number, payload: CreateEntityPayload): Promise<Entity> {
    const { data } = await apiClient.put<Entity>(
      `${this.BASE_PATH}/entities/${id}/`,
      payload
    );
    return data;
  }

  // Partial update entity
  async patchEntity(id: number, payload: UpdateEntityPayload): Promise<Entity> {
    const { data } = await apiClient.patch<Entity>(
      `${this.BASE_PATH}/entities/${id}/`,
      payload
    );
    return data;
  }

  // Delete entity
  async deleteEntity(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/entities/${id}/`);
  }

  // Upload entity image
  async uploadEntityImage(id: number, file: File): Promise<Entity> {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.patch<Entity>(
      `${this.BASE_PATH}/entities/${id}/`,
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
      `${this.BASE_PATH}/entities/${id}/`,
      { image: null }
    );
    return data;
  }

  // Get entity placeholders for contract generation (backward compatible)
  async getEntityPlaceholders(id: number): Promise<Record<string, string>> {
    const { data } = await apiClient.get<Record<string, string>>(
      `${this.BASE_PATH}/entities/${id}/placeholders/`
    );
    return data;
  }

  // Get artists
  async getArtists(): Promise<EntityListItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<EntityListItem>>(
      `${this.BASE_PATH}/entities/artists/`
    );
    return data.results;
  }

  // Get writers
  async getWriters(): Promise<EntityListItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<EntityListItem>>(
      `${this.BASE_PATH}/entities/writers/`
    );
    return data.results;
  }

  // Get producers
  async getProducers(): Promise<EntityListItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<EntityListItem>>(
      `${this.BASE_PATH}/entities/producers/`
    );
    return data.results;
  }

  // Get business entities (for both client and brand searches)
  async getBusinessEntities(params?: EntitySearchParams): Promise<PaginatedResponse<EntityListItem>> {
    const { data } = await apiClient.get<PaginatedResponse<EntityListItem>>(
      `${this.BASE_PATH}/entities/business/`,
      { params }
    );
    return data;
  }

  // Get entity stats
  async getEntityStats(): Promise<any> {
    const { data } = await apiClient.get(`${this.BASE_PATH}/entities/stats/`);
    return data;
  }

  // Get sensitive identity
  async getSensitiveIdentity(entityId: number): Promise<SensitiveIdentity> {
    const { data } = await apiClient.get<SensitiveIdentity>(
      `${this.BASE_PATH}/sensitive-identities/`,
      { params: { entity: entityId } }
    );
    return data;
  }

  // Reveal CNP with audit logging
  async revealCNP(sensitiveIdentityId: number, reason: string): Promise<RevealCNPResponse> {
    const { data } = await apiClient.post<RevealCNPResponse>(
      `${this.BASE_PATH}/sensitive-identities/${sensitiveIdentityId}/reveal_cnp/`,
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
      `${this.BASE_PATH}/entities/${entityId}/latest_contract_shares/`,
      { params }
    );
    return data;
  }

  // Backward compatibility - redirect to entities
  async getClients(): Promise<EntityListItem[]> {
    const response = await this.getEntities({ has_role: 'client' });
    return response.results;
  }

  async getClient(id: number): Promise<Entity> {
    return this.getEntity(id);
  }

  async getClientPlaceholders(id: number): Promise<Record<string, string>> {
    return this.getEntityPlaceholders(id);
  }

  // Social Media Account methods
  async getSocialMediaAccounts(entityId: number): Promise<SocialMediaAccount[]> {
    const { data } = await apiClient.get<SocialMediaAccount[]>(
      `${this.BASE_PATH}/social-media-accounts/`,
      { params: { entity: entityId } }
    );
    return data;
  }

  async createSocialMediaAccount(payload: Partial<SocialMediaAccount>): Promise<SocialMediaAccount> {
    const { data } = await apiClient.post<SocialMediaAccount>(
      `${this.BASE_PATH}/social-media-accounts/`,
      payload
    );
    return data;
  }

  async updateSocialMediaAccount(id: number, payload: Partial<SocialMediaAccount>): Promise<SocialMediaAccount> {
    const { data } = await apiClient.patch<SocialMediaAccount>(
      `${this.BASE_PATH}/social-media-accounts/${id}/`,
      payload
    );
    return data;
  }

  async deleteSocialMediaAccount(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/social-media-accounts/${id}/`);
  }

  // Contact Person methods
  async getContactPersons(entityId?: number): Promise<ContactPerson[]> {
    const params = entityId ? { entity: entityId } : {};
    const { data } = await apiClient.get<{ results: ContactPerson[] }>(
      `${this.BASE_PATH}/contact-persons/`,
      { params }
    );
    return data.results || [];
  }

  async getContactPerson(id: number): Promise<ContactPerson> {
    const { data } = await apiClient.get<ContactPerson>(
      `${this.BASE_PATH}/contact-persons/${id}/`
    );
    return data;
  }

  async createContactPerson(payload: Partial<ContactPerson>): Promise<ContactPerson> {
    const { data } = await apiClient.post<ContactPerson>(
      `${this.BASE_PATH}/contact-persons/`,
      payload
    );
    return data;
  }

  async updateContactPerson(id: number, payload: Partial<ContactPerson>): Promise<ContactPerson> {
    const { data } = await apiClient.patch<ContactPerson>(
      `${this.BASE_PATH}/contact-persons/${id}/`,
      payload
    );
    return data;
  }

  async deleteContactPerson(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/contact-persons/${id}/`);
  }
}

const entitiesService = new EntitiesService();
export default entitiesService;