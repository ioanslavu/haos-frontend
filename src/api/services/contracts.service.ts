import apiClient from '@/api/client';
import { API_BASE_URL } from '@/lib/constants';

const CONTRACTS_BASE = `${API_BASE_URL}/api/v1`;

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Form schema field definition (for dynamic form generation)
export interface FormSchemaField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'email' | 'phone';
  required: boolean;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  default_value?: any;
  placeholder?: string;
  // For entity auto-population
  entity_field?: string;
}

// Form schema for template (defines dynamic form structure)
export interface FormSchema {
  fields: FormSchemaField[];
  layout?: {
    columns?: number;
    sections?: Array<{
      title: string;
      fields: string[];
    }>;
  };
}

export interface ContractTemplate {
  id: number;
  name: string;
  description: string;
  series: string;
  department: number | null;
  department_name: string | null;
  gdrive_template_file_id: string;
  form_schema: FormSchema;
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
  form_schema_snapshot: FormSchema;
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

// Entity reference (lightweight, from EntityListSerializer)
export interface EntityReference {
  id: number;
  display_name: string;
  entity_type: 'PF' | 'PJ';
  cnp?: string;
  cui?: string;
  email?: string;
}

// Contract origin information (from registry)
export interface ContractOriginInfo {
  contract_id: number;
  origin_type: string;
  source_app: string;
  source_model: string;
  source_id: number;
  display_name: string;
  url: string | null;
  extra: {
    campaign_type?: string;
    status?: string;
    status_display?: string;
    entity_id?: number | null;
    entity_name?: string | null;
    department_name?: string | null;
    linked_at?: string | null;
    linked_by?: string | null;
  } | null;
}

export interface Contract {
  id: number;
  template: number;
  template_name: string;
  template_version: number | null;
  template_version_number: number | null;
  contract_number: string;
  title: string;
  department: number | null;
  // Entity references
  counterparty_entity: number | null;
  counterparty: EntityReference | null;
  label_entity: number | null;
  label: EntityReference | null;
  // Contract dates
  start_date: string | null;
  end_date: string | null;
  // Form data snapshot (all submitted values)
  data: Record<string, any>;
  // Google Drive
  gdrive_file_id: string;
  gdrive_file_url: string;
  gdrive_pdf_file_id: string | null;
  gdrive_pdf_file_url: string | null;
  // Public sharing
  is_public: boolean;
  public_share_url: string;
  // Status and processing
  status: 'processing' | 'draft' | 'pending_signature' | 'signed' | 'cancelled' | 'failed';
  celery_task_id: string | null;
  error_message?: string;
  // Dropbox Sign
  dropbox_sign_request_id: string;
  // Audit
  created_by: number;
  created_by_email: string;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  // Signatures
  signatures: ContractSignature[];
  // Annex support
  parent_contract: number | null;
  is_annex: boolean;
  is_master_contract: boolean;
  parent_contract_number: string | null;
  annexes_count: number;
  // Origin information
  origins: ContractOriginInfo[];
  origin_count: number;
  has_origins: boolean;
}

// Lightweight origin for list views
export interface ContractListOrigin {
  origin_type: string;
  display_name: string;
  url: string | null;
}

// Lightweight contract for list views (excludes heavy fields)
export interface ContractListItem {
  id: number;
  template: number;
  template_name: string;
  contract_number: string;
  title: string;
  counterparty_entity: number | null;
  counterparty_name: string | null;
  label_entity: number | null;
  start_date: string | null;
  end_date: string | null;
  department: number | null;
  status: 'processing' | 'draft' | 'pending_signature' | 'signed' | 'cancelled' | 'failed';
  created_by: number;
  created_by_email: string;
  created_at: string;
  updated_at: string;
  signed_at: string | null;
  // Annex fields
  is_annex: boolean;
  is_master_contract: boolean;
  parent_contract_number: string | null;
  parent_contract: number | null;
  // Origin fields
  has_origins: boolean;
  primary_origin: ContractListOrigin | null;
}

export interface ImportTemplatePayload {
  gdrive_file_id: string;
  name: string;
  description?: string;
  series: string;
  form_schema: FormSchema;
  gdrive_output_folder_id: string;
}

export interface GenerateContractPayload {
  template_id: number;
  counterparty_entity_id: number;
  start_date: string;
  end_date?: string | null;
  parent_contract_id?: number | null;
  label_entity_id?: number | null;
  title?: string | null;
  form_data: Record<string, any>;
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
  gdrive_file_id?: string;
  form_schema?: FormSchema;
  change_description: string;
  update_template?: boolean;
}

export interface RegenerateContractPayload {
  form_data: Record<string, any>;
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

// Entity latest shares for auto-populating contract generation forms
export interface EntityLatestShares {
  entity_id: number;
  entity_name: string;
  shares: Record<string, number>;
  last_contract_date?: string;
  last_contract_type?: string;
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
  async getContracts(params?: {
    status?: string;
    template?: number;
    counterparty_entity?: number;
    is_annex?: boolean;
    ordering?: string;
    search?: string;
  }): Promise<ContractListItem[]> {
    const response = await apiClient.get<PaginatedResponse<ContractListItem>>(`${CONTRACTS_BASE}/contracts/`, { params });
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

  // Annexes
  async getContractAnnexes(contractId: number): Promise<ContractListItem[]> {
    const response = await apiClient.get<PaginatedResponse<ContractListItem>>(
      `${CONTRACTS_BASE}/contracts/`,
      { params: { parent_contract: contractId } }
    );
    return response.data.results;
  }

  async createAnnex(parentContractId: number, payload: Omit<GenerateContractPayload, 'parent_contract_id'>): Promise<Contract> {
    return this.generateContract({
      ...payload,
      parent_contract_id: parentContractId,
    });
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
