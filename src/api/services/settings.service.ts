import apiClient from '@/api/client';

export interface CompanySettings {
  id: number;
  company_name: string;
  legal_name: string;
  admin_name: string;
  admin_role: string;
  registration_number: string;  // J40/XXXXX/2020
  cif: string;  // RO12345678 (C.I.F.)
  vat_number: string;  // Optional, defaults to C.I.F.
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  bank_name: string;
  bank_account: string;
  bank_swift: string;
  timezone: string;
  currency: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateCompanySettingsPayload {
  company_name?: string;
  legal_name?: string;
  admin_name?: string;
  admin_role?: string;
  registration_number?: string;  // J40/XXXXX/2020
  cif?: string;  // RO12345678 (C.I.F.)
  vat_number?: string;  // Optional, defaults to C.I.F.
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  bank_name?: string;
  bank_account?: string;
  bank_swift?: string;
  timezone?: string;
  currency?: string;
  language?: string;
}

class SettingsService {
  private readonly baseURL = '/api/v1/settings';

  async getCompanySettings(): Promise<CompanySettings> {
    const response = await apiClient.get<CompanySettings>(`${this.baseURL}/company/`);
    return response.data;
  }

  async updateCompanySettings(payload: UpdateCompanySettingsPayload): Promise<CompanySettings> {
    const response = await apiClient.patch<CompanySettings>(`${this.baseURL}/company/`, payload);
    return response.data;
  }
}

export default new SettingsService();
