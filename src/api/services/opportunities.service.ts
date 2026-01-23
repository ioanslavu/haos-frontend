/**
 * API Service for Opportunities
 */

import apiClient from '../client';
import type {
  Opportunity,
  OpportunityListParams,
  OpportunityCreateInput,
  OpportunityUpdateInput,
  OpportunityTask,
  OpportunityActivity,
  OpportunityComment,
  OpportunityArtist,
  OpportunityDeliverable,
  OpportunityAssignment,
  OpportunityAssignmentRole,
  DeliverableType,
  PaginatedResponse,
  BulkUpdateInput,
  AdvanceStageInput,
  MarkLostInput,
} from '@/types/opportunities';

const BASE_URL = '/api/v1/artist-sales';

// === OPPORTUNITIES ===

export const opportunitiesApi = {
  /**
   * List opportunities with filters and pagination
   */
  list: (params?: OpportunityListParams) => {
    return apiClient.get<PaginatedResponse<Opportunity>>(`${BASE_URL}/opportunities/`, { params });
  },

  /**
   * Get opportunity detail
   */
  get: (id: number) => {
    return apiClient.get<Opportunity>(`${BASE_URL}/opportunities/${id}/`);
  },

  /**
   * Create new opportunity
   */
  create: (data: OpportunityCreateInput) => {
    return apiClient.post<Opportunity>(`${BASE_URL}/opportunities/`, data);
  },

  /**
   * Update opportunity
   */
  update: (id: number, data: OpportunityUpdateInput) => {
    return apiClient.patch<Opportunity>(`${BASE_URL}/opportunities/${id}/`, data);
  },

  /**
   * Delete opportunity
   */
  delete: (id: number) => {
    return apiClient.delete(`${BASE_URL}/opportunities/${id}/`);
  },

  /**
   * Advance opportunity to next stage
   */
  advanceStage: (id: number, data: AdvanceStageInput) => {
    return apiClient.post<Opportunity>(`${BASE_URL}/opportunities/${id}/advance-stage/`, data);
  },

  /**
   * Mark opportunity as won
   */
  markWon: (id: number) => {
    return apiClient.post<Opportunity>(`${BASE_URL}/opportunities/${id}/mark-won/`);
  },

  /**
   * Mark opportunity as lost
   */
  markLost: (id: number, data: MarkLostInput) => {
    return apiClient.post<Opportunity>(`${BASE_URL}/opportunities/${id}/mark-lost/`, data);
  },

  /**
   * Bulk update opportunities
   */
  bulkUpdate: (data: BulkUpdateInput) => {
    return apiClient.post(`${BASE_URL}/opportunities/bulk-update/`, data);
  },

  /**
   * Get activities for opportunity
   */
  getActivities: (id: number) => {
    return apiClient.get<OpportunityActivity[]>(`${BASE_URL}/opportunities/${id}/activities/`);
  },

  /**
   * Get comments for opportunity
   */
  getComments: (id: number) => {
    return apiClient.get<OpportunityComment[]>(`${BASE_URL}/opportunities/${id}/comments/`);
  },

  /**
   * Add comment to opportunity
   */
  addComment: (id: number, data: { comment: string; is_internal?: boolean }) => {
    return apiClient.post<OpportunityComment>(`${BASE_URL}/opportunities/${id}/comments/`, data);
  },
};

// === OPPORTUNITY ARTISTS ===

export const opportunityArtistsApi = {
  list: (params?: { opportunity?: number }) => {
    return apiClient.get<PaginatedResponse<OpportunityArtist>>(`${BASE_URL}/opportunity-artists/`, { params });
  },

  create: (data: Partial<OpportunityArtist> & { opportunity: number; artist_id: number }) => {
    return apiClient.post<OpportunityArtist>(`${BASE_URL}/opportunity-artists/`, data);
  },

  update: (id: number, data: Partial<OpportunityArtist>) => {
    return apiClient.patch<OpportunityArtist>(`${BASE_URL}/opportunity-artists/${id}/`, data);
  },

  delete: (id: number) => {
    return apiClient.delete(`${BASE_URL}/opportunity-artists/${id}/`);
  },
};

// === OPPORTUNITY TASKS ===

export const opportunityTasksApi = {
  list: (params?: { opportunity?: number; assigned_to?: number; status?: string }) => {
    return apiClient.get<PaginatedResponse<OpportunityTask>>(`${BASE_URL}/opportunity-tasks/`, { params });
  },

  create: (data: Partial<OpportunityTask> & { opportunity: number; title: string }) => {
    return apiClient.post<OpportunityTask>(`${BASE_URL}/opportunity-tasks/`, data);
  },

  update: (id: number, data: Partial<OpportunityTask>) => {
    return apiClient.patch<OpportunityTask>(`${BASE_URL}/opportunity-tasks/${id}/`, data);
  },

  delete: (id: number) => {
    return apiClient.delete(`${BASE_URL}/opportunity-tasks/${id}/`);
  },

  complete: (id: number) => {
    return apiClient.post<OpportunityTask>(`${BASE_URL}/opportunity-tasks/${id}/complete/`);
  },
};

// === OPPORTUNITY DELIVERABLES ===

export const opportunityDeliverablesApi = {
  list: (params?: { opportunity?: number; status?: string }) => {
    return apiClient.get<PaginatedResponse<OpportunityDeliverable>>(`${BASE_URL}/opportunity-deliverables/`, { params });
  },

  create: (data: Partial<OpportunityDeliverable> & { opportunity: number; deliverable_type: DeliverableType }) => {
    return apiClient.post<OpportunityDeliverable>(`${BASE_URL}/opportunity-deliverables/`, data);
  },

  update: (id: number, data: Partial<OpportunityDeliverable>) => {
    return apiClient.patch<OpportunityDeliverable>(`${BASE_URL}/opportunity-deliverables/${id}/`, data);
  },

  delete: (id: number) => {
    return apiClient.delete(`${BASE_URL}/opportunity-deliverables/${id}/`);
  },
};

// === ACTIVITIES & COMMENTS ===

export const opportunityActivitiesApi = {
  list: (params?: { opportunity?: number; activity_type?: string }) => {
    return apiClient.get<PaginatedResponse<OpportunityActivity>>(`${BASE_URL}/opportunity-activities/`, { params });
  },
};

export const opportunityCommentsApi = {
  list: (params?: { opportunity?: number }) => {
    return apiClient.get<PaginatedResponse<OpportunityComment>>(`${BASE_URL}/opportunity-comments/`, { params });
  },

  create: (data: { opportunity: number; comment: string; is_internal?: boolean }) => {
    return apiClient.post<OpportunityComment>(`${BASE_URL}/opportunity-comments/`, data);
  },

  update: (id: number, data: Partial<OpportunityComment>) => {
    return apiClient.patch<OpportunityComment>(`${BASE_URL}/opportunity-comments/${id}/`, data);
  },

  delete: (id: number) => {
    return apiClient.delete(`${BASE_URL}/opportunity-comments/${id}/`);
  },
};

// === USAGE TERMS ===

export interface UsageTerms {
  id: number;
  name: string;
  usage_scope?: string;
  territories?: string[];
  exclusivity_category?: string;
  exclusivity_duration_days?: number;
  usage_duration_days?: number;
  extensions_allowed?: boolean;
  buyout?: boolean;
  brand_list_blocked?: string[];
  is_template: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const usageTermsApi = {
  list: (params?: { is_template?: boolean; search?: string }) => {
    return apiClient.get<PaginatedResponse<UsageTerms>>(`${BASE_URL}/usage-terms/`, { params });
  },

  get: (id: number) => {
    return apiClient.get<UsageTerms>(`${BASE_URL}/usage-terms/${id}/`);
  },

  create: (data: Partial<UsageTerms>) => {
    return apiClient.post<UsageTerms>(`${BASE_URL}/usage-terms/`, data);
  },

  update: (id: number, data: Partial<UsageTerms>) => {
    return apiClient.patch<UsageTerms>(`${BASE_URL}/usage-terms/${id}/`, data);
  },

  delete: (id: number) => {
    return apiClient.delete(`${BASE_URL}/usage-terms/${id}/`);
  },
};

// === DELIVERABLE PACKS ===

export interface DeliverablePackItem {
  id: number;
  pack: number;
  deliverable_type: string;
  deliverable_type_display: string;
  quantity: number;
  description?: string;
  created_at: string;
}

export interface DeliverablePack {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  items: DeliverablePackItem[];
  created_at: string;
  updated_at: string;
}

export const deliverablePacksApi = {
  list: (params?: { is_active?: boolean; search?: string }) => {
    return apiClient.get<PaginatedResponse<DeliverablePack>>(`${BASE_URL}/deliverable-packs/`, { params });
  },

  get: (id: number) => {
    return apiClient.get<DeliverablePack>(`${BASE_URL}/deliverable-packs/${id}/`);
  },

  create: (data: Partial<DeliverablePack>) => {
    return apiClient.post<DeliverablePack>(`${BASE_URL}/deliverable-packs/`, data);
  },

  update: (id: number, data: Partial<DeliverablePack>) => {
    return apiClient.patch<DeliverablePack>(`${BASE_URL}/deliverable-packs/${id}/`, data);
  },

  delete: (id: number) => {
    return apiClient.delete(`${BASE_URL}/deliverable-packs/${id}/`);
  },
};

// === APPROVALS ===

export interface Approval {
  id: number;
  opportunity: number;
  deliverable?: number;
  stage: string;
  version: number;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  submitted_at?: string;
  approved_at?: string;
  approver_contact?: any;
  approver_user?: any;
  notes?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export const approvalsApi = {
  list: (params?: { opportunity?: number; status?: string }) => {
    return apiClient.get<PaginatedResponse<Approval>>(`${BASE_URL}/approvals/`, { params });
  },

  get: (id: number) => {
    return apiClient.get<Approval>(`${BASE_URL}/approvals/${id}/`);
  },

  create: (data: Partial<Approval>) => {
    return apiClient.post<Approval>(`${BASE_URL}/approvals/`, data);
  },

  update: (id: number, data: Partial<Approval>) => {
    return apiClient.patch<Approval>(`${BASE_URL}/approvals/${id}/`, data);
  },

  delete: (id: number) => {
    return apiClient.delete(`${BASE_URL}/approvals/${id}/`);
  },

  approve: (id: number, data: { notes?: string }) => {
    return apiClient.post<Approval>(`${BASE_URL}/approvals/${id}/approve/`, data);
  },

  reject: (id: number, data: { notes: string }) => {
    return apiClient.post<Approval>(`${BASE_URL}/approvals/${id}/reject/`, data);
  },

  requestChanges: (id: number, data: { notes: string }) => {
    return apiClient.post<Approval>(`${BASE_URL}/approvals/${id}/request_changes/`, data);
  },
};

// === OPPORTUNITY STATS ===

export interface OpportunityStats {
  total: number;
  by_stage: Record<string, number>;
  by_priority: Record<string, number>;
  total_value: string;
  won_value: string;
  pipeline_value: string;
}

export const opportunityStatsApi = {
  get: (params?: OpportunityListParams) => {
    return apiClient.get<OpportunityStats>(`${BASE_URL}/opportunities/stats/`, { params });
  },
};

// === OPPORTUNITY INVOICE LINKS ===

export type InvoiceType = 'advance' | 'milestone' | 'final' | 'full';

export interface OpportunityInvoiceLink {
  id: number;
  opportunity: number;
  invoice: number;
  invoice_type: InvoiceType;
  is_primary: boolean;
  created_at: string;
  // Nested invoice info
  invoice_details?: {
    id: number;
    invoice_number: string;
    status: string;
    total_amount: string;
    currency: string;
    due_date: string;
    client_name: string;
  };
}

export interface LinkInvoiceInput {
  opportunity: number;
  invoice: number;
  invoice_type: InvoiceType;
  is_primary?: boolean;
}

export const opportunityInvoicesApi = {
  /**
   * List invoice links for an opportunity
   */
  list: (opportunityId: number) => {
    return apiClient.get<OpportunityInvoiceLink[]>(
      `${BASE_URL}/opportunity-invoices/`,
      { params: { opportunity: opportunityId } }
    );
  },

  /**
   * Link an existing invoice to an opportunity
   */
  link: (data: LinkInvoiceInput) => {
    return apiClient.post<OpportunityInvoiceLink>(`${BASE_URL}/opportunity-invoices/link/`, data);
  },

  /**
   * Unlink an invoice from an opportunity
   */
  unlink: (linkId: number) => {
    return apiClient.delete(`${BASE_URL}/opportunity-invoices/${linkId}/`);
  },

  /**
   * Update invoice link (change type, primary status)
   */
  update: (linkId: number, data: { invoice_type?: InvoiceType; is_primary?: boolean }) => {
    return apiClient.patch<OpportunityInvoiceLink>(`${BASE_URL}/opportunity-invoices/${linkId}/`, data);
  },
};

// === OPPORTUNITY CONTRACT LINKS ===

export interface OpportunityContractLink {
  id: number;
  opportunity: number;
  contract: number;
  is_primary: boolean;
  created_at: string;
  // Nested contract info
  contract_details?: {
    id: number;
    contract_type: string;
    contract_type_display: string;
    status: string;
    status_display: string;
    entity_name: string;
    created_at: string;
  };
}

export interface LinkContractInput {
  opportunity: number;
  contract: number;
  is_primary?: boolean;
}

export interface CreateAndLinkContractInput {
  opportunity: number;
  contract_type: string;
  entity: number;
  effective_date?: string;
  expiry_date?: string;
  notes?: string;
  is_primary?: boolean;
}

export const opportunityContractsApi = {
  /**
   * List contract links for an opportunity
   */
  list: (opportunityId: number) => {
    return apiClient.get<OpportunityContractLink[]>(
      `${BASE_URL}/opportunity-contracts/`,
      { params: { opportunity: opportunityId } }
    );
  },

  /**
   * Link an existing contract to an opportunity
   */
  link: (data: LinkContractInput) => {
    return apiClient.post<OpportunityContractLink>(`${BASE_URL}/opportunity-contracts/link/`, data);
  },

  /**
   * Create a new contract and link it to an opportunity
   */
  createAndLink: (data: CreateAndLinkContractInput) => {
    return apiClient.post<OpportunityContractLink>(`${BASE_URL}/opportunity-contracts/create_and_link/`, data);
  },

  /**
   * Unlink a contract from an opportunity
   */
  unlink: (linkId: number) => {
    return apiClient.delete(`${BASE_URL}/opportunity-contracts/${linkId}/`);
  },

  /**
   * Update contract link (change primary status)
   */
  update: (linkId: number, data: { is_primary?: boolean }) => {
    return apiClient.patch<OpportunityContractLink>(`${BASE_URL}/opportunity-contracts/${linkId}/`, data);
  },
};

// === OPPORTUNITY ASSIGNMENTS ===

export const opportunityAssignmentsApi = {
  /**
   * List assignments for an opportunity
   */
  list: (opportunityId: number) => {
    return apiClient.get<OpportunityAssignment[]>(`${BASE_URL}/opportunities/${opportunityId}/assignments/`);
  },

  /**
   * Add user to opportunity
   */
  create: (opportunityId: number, userId: number, role: OpportunityAssignmentRole) => {
    return apiClient.post<OpportunityAssignment>(`${BASE_URL}/opportunities/${opportunityId}/assignments/`, {
      user_id: userId,
      role,
    });
  },

  /**
   * Remove user from opportunity
   */
  delete: (opportunityId: number, assignmentId: number) => {
    return apiClient.delete(`${BASE_URL}/opportunities/${opportunityId}/assignments/${assignmentId}/`);
  },
};
