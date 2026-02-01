import apiClient from '../client';
import { PaginatedResponse, EntityListItem, Entity, EntitySearchParams } from './entities.service';

// Business-specific fields (from backend Business model)
export interface Business extends Entity {
  // Business-specific fields
  business_type: 'brand' | 'agency' | 'label' | 'publisher' | 'distributor' | 'client_other';
  holding?: string;
  billing_address?: string;
  billing_email?: string;
}

export interface BusinessListItem extends EntityListItem {
  business_type: string;
  holding?: string;
}

export interface CreateBusinessPayload {
  kind: 'PF' | 'PJ';
  display_name: string;
  business_type: string;
  is_internal?: boolean;
  first_name?: string;
  last_name?: string;
  nationality?: string;
  gender?: 'M' | 'F' | 'O';
  holding?: string;
  billing_address?: string;
  billing_email?: string;
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

export type UpdateBusinessPayload = Partial<CreateBusinessPayload>;

export interface BusinessSearchParams extends Omit<EntitySearchParams, 'classification'> {
  business_type?: string;
}

export interface BusinessStats {
  total: number;
  by_business_type: Record<string, number>;
  by_kind: {
    physical: number;
    legal: number;
  };
  by_internal: {
    internal: number;
    external: number;
  };
  recent_businesses: BusinessListItem[];
}

class BusinessesService {
  private readonly BASE_PATH = '/api/v1/businesses';

  // List all businesses (paginated)
  async getBusinesses(params?: BusinessSearchParams): Promise<PaginatedResponse<BusinessListItem>> {
    const { data } = await apiClient.get<PaginatedResponse<BusinessListItem>>(
      `${this.BASE_PATH}/`,
      { params }
    );
    return data;
  }

  // Search businesses (autocomplete)
  async searchBusinesses(query: string): Promise<BusinessListItem[]> {
    const { data } = await apiClient.get<PaginatedResponse<BusinessListItem>>(
      `${this.BASE_PATH}/`,
      {
        params: { search: query, page_size: 20 },
      }
    );
    return data.results;
  }

  // Get business details
  async getBusiness(id: number): Promise<Business> {
    const { data } = await apiClient.get<Business>(`${this.BASE_PATH}/${id}/`);
    return data;
  }

  // Create business
  async createBusiness(payload: CreateBusinessPayload): Promise<Business> {
    const { data } = await apiClient.post<Business>(
      `${this.BASE_PATH}/`,
      payload
    );
    return data;
  }

  // Update business (full update)
  async updateBusiness(id: number, payload: CreateBusinessPayload): Promise<Business> {
    const { data } = await apiClient.put<Business>(
      `${this.BASE_PATH}/${id}/`,
      payload
    );
    return data;
  }

  // Partial update business
  async patchBusiness(id: number, payload: UpdateBusinessPayload): Promise<Business> {
    const { data } = await apiClient.patch<Business>(
      `${this.BASE_PATH}/${id}/`,
      payload
    );
    return data;
  }

  // Delete business
  async deleteBusiness(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_PATH}/${id}/`);
  }

  // Get business stats
  async getBusinessStats(params?: BusinessSearchParams): Promise<BusinessStats> {
    const { data } = await apiClient.get<BusinessStats>(`${this.BASE_PATH}/stats/`, { params });
    return data;
  }
}

const businessesService = new BusinessesService();
export default businessesService;

// Constants for business types
export const BUSINESS_TYPE_OPTIONS = [
  { value: 'brand', label: 'Brand' },
  { value: 'agency', label: 'Agency' },
  { value: 'label', label: 'Label' },
  { value: 'publisher', label: 'Publisher' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'client_other', label: 'Other Client' },
] as const;
