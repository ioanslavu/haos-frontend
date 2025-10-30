import apiClient from '@/api/client';
import { API_BASE_URL } from '@/lib/constants';

const CONTRACTS_BASE = `${API_BASE_URL}/api/v1`;

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ContractTemplate {
  id: number;
  name: string;
  description: string;
  series: string;
  gdrive_template_file_id: string;
  placeholders: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
    options?: string[];
    validation?: string;
  }>;
  gdrive_output_folder_id: string;
  is_active: boolean;
  created_by: number;
  created_by_email: string;
  created_at: string;
  updated_at: string;
  last_contract_number: string | null;
}

export interface ContractTemplateVersion {
  id: number;
  template: number;
  template_name: string;
  version_number: number;
  gdrive_file_id: string;
  placeholders_snapshot: any[];
  change_description: string;
  created_by: number;
  created_by_email: string;
  created_at: string;
}

export interface ContractSignature {
  id: number;
  contract: number;
  signer_email: string;
  signer_name: string;
  signer_role: string;
  dropbox_sign_signature_id: string;
  status: 'pending' | 'viewed' | 'signed' | 'declined';
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  declined_at: string | null;
  decline_reason: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: number;
  template: number;
  template_name: string;
  template_version: number | null;
  template_version_number: number | null;
  contract_number: string;
  title: string;
  contract_type?: string | null;
  department?: string | null;
  placeholder_values: Record<string, any>;
  gdrive_file_id: string;
  gdrive_file_url: string;
  is_public: boolean;
  public_share_url: string;
  status: 'processing' | 'draft' | 'pending_signature' | 'signed' | 'cancelled' | 'failed';
  error_message?: string;
  dropbox_sign_request_id: string;
  created_by: number;
  created_by_email: string;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  signatures: ContractSignature[];
}

export interface ShareType {
  id: number;
  code: string;
  name: string;
  description: string;
  placeholder_keys: string[];
  contract_types: string[];
  created_at: string;
  updated_at: string;
}

export interface ContractShare {
  id: number;
  contract: number;
  share_type: number;
  share_type_code: string;
  share_type_name: string;
  value: string;
  unit: 'percent' | 'points' | 'flat';
  valid_from: string;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface EntityLatestShares {
  contract_id: number | null;
  contract_number?: string;
  contract_type: string | null;
  contract_title?: string;
  shares: ContractShare[];
}

export interface ImportTemplatePayload {
  gdrive_file_id: string;
  name: string;
  description?: string;
  placeholders: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
    options?: string[];
  }>;
  gdrive_output_folder_id: string;
}

export interface GenerateContractPayload {
  template_id: number;
  title: string;
  placeholder_values: Record<string, any>;
}

export interface SendForSignaturePayload {
  signers: Array<{
    email: string;
    name: string;
    role?: string;
  }>;
  test_mode?: boolean;
}

export interface CreateVersionPayload {
  gdrive_file_id: string;
  placeholders: any[];
  change_description: string;
  update_template: boolean;
}

export interface RegenerateContractPayload {
  placeholder_values: Record<string, any>;
}

export interface AuditEvent {
  timestamp: string;
  event_type: string;
  event_category: 'contract' | 'signature' | 'webhook' | 'system';
  actor: string | null;
  description: string;
  changes: Record<string, any> | null;
  metadata: Record<string, any> | null;
  source: string;
}

export interface ContractAuditTrail {
  contract_id: number;
  contract_number: string;
  current_status: string;
  events: AuditEvent[];
  summary: {
    total_events: number;
    contract_changes: number;
    webhook_events: number;
    signature_events: number;
    unique_actors: number;
  };
}

class ContractsService {
  // Templates
  async getTemplates(): Promise<ContractTemplate[]> {
    const response = await apiClient.get<PaginatedResponse<ContractTemplate>>(`${CONTRACTS_BASE}/templates/`);
    return response.data.results;
  }

  async getTemplate(id: number): Promise<ContractTemplate> {
    const response = await apiClient.get<ContractTemplate>(`${CONTRACTS_BASE}/templates/${id}/`);
    return response.data;
  }

  async importTemplate(payload: ImportTemplatePayload): Promise<ContractTemplate> {
    const response = await apiClient.post<ContractTemplate>(
      `${CONTRACTS_BASE}/templates/import_from_drive/`,
      payload
    );
    return response.data;
  }

  async updateTemplate(id: number, payload: Partial<ContractTemplate>): Promise<ContractTemplate> {
    const response = await apiClient.patch<ContractTemplate>(
      `${CONTRACTS_BASE}/templates/${id}/`,
      payload
    );
    return response.data;
  }

  async deleteTemplate(id: number): Promise<void> {
    await apiClient.delete(`${CONTRACTS_BASE}/templates/${id}/`);
  }

  async createTemplateVersion(
    templateId: number,
    payload: CreateVersionPayload
  ): Promise<ContractTemplateVersion> {
    const response = await apiClient.post<ContractTemplateVersion>(
      `${CONTRACTS_BASE}/templates/${templateId}/create_version/`,
      payload
    );
    return response.data;
  }

  async getTemplateVersions(templateId: number): Promise<ContractTemplateVersion[]> {
    const response = await apiClient.get<ContractTemplateVersion[]>(
      `${CONTRACTS_BASE}/templates/${templateId}/versions/`
    );
    return response.data;
  }

  // Contracts
  async getContracts(params?: { status?: string; template?: number }): Promise<Contract[]> {
    const response = await apiClient.get<PaginatedResponse<Contract>>(`${CONTRACTS_BASE}/contracts/`, { params });
    return response.data.results;
  }

  async getContract(id: number): Promise<Contract> {
    const response = await apiClient.get<Contract>(`${CONTRACTS_BASE}/contracts/${id}/`);
    return response.data;
  }

  async generateContract(payload: GenerateContractPayload): Promise<Contract> {
    const response = await apiClient.post<Contract>(
      `${CONTRACTS_BASE}/contracts/generate/`,
      payload
    );
    return response.data;
  }

  async updateContract(id: number, payload: Partial<Contract>): Promise<Contract> {
    const response = await apiClient.patch<Contract>(
      `${CONTRACTS_BASE}/contracts/${id}/`,
      payload
    );
    return response.data;
  }

  async deleteContract(id: number): Promise<void> {
    await apiClient.delete(`${CONTRACTS_BASE}/contracts/${id}/`);
  }

  async regenerateContract(id: number, payload: RegenerateContractPayload): Promise<Contract> {
    const response = await apiClient.post<Contract>(
      `${CONTRACTS_BASE}/contracts/${id}/regenerate/`,
      payload
    );
    return response.data;
  }

  async makeContractPublic(id: number): Promise<Contract> {
    const response = await apiClient.post<Contract>(
      `${CONTRACTS_BASE}/contracts/${id}/make_public/`
    );
    return response.data;
  }

  async sendForSignature(
    id: number,
    payload: SendForSignaturePayload
  ): Promise<Contract> {
    const response = await apiClient.post<Contract>(
      `${CONTRACTS_BASE}/contracts/${id}/send_for_signature/`,
      payload
    );
    return response.data;
  }

  async getSignatureStatus(id: number): Promise<any> {
    const response = await apiClient.get(
      `${CONTRACTS_BASE}/contracts/${id}/signature_status/`
    );
    return response.data;
  }

  async checkContractStatus(id: number): Promise<{ status: string; error_message?: string }> {
    const response = await apiClient.get<{ status: string; error_message?: string }>(
      `${CONTRACTS_BASE}/contracts/${id}/check_status/`
    );
    return response.data;
  }

  async getContractAuditTrail(id: number): Promise<ContractAuditTrail> {
    const response = await apiClient.get<ContractAuditTrail>(
      `${CONTRACTS_BASE}/contracts/${id}/audit_trail/`
    );
    return response.data;
  }

  // Google Drive Search
  async searchDriveDocuments(query: string = '', limit: number = 20): Promise<any[]> {
    const response = await apiClient.get(
      `${CONTRACTS_BASE}/templates/search_drive_documents/`,
      { params: { query, limit } }
    );
    return response.data.documents;
  }

  async searchDriveFolders(query: string = '', limit: number = 20): Promise<any[]> {
    const response = await apiClient.get(
      `${CONTRACTS_BASE}/templates/search_drive_folders/`,
      { params: { query, limit } }
    );
    return response.data.folders;
  }
}

export default new ContractsService();
