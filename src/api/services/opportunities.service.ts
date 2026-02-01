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
  Approval,
  OpportunityInvoiceLink,
  OpportunityContractLink,
  LinkInvoiceInput,
  LinkContractInput,
  CreateAndLinkContractInput,
  InvoiceType,
  OpportunityStats,
} from '@/types/opportunities';

const BASE_URL = '/api/v1';

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

// === APPROVALS ===

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

export const opportunityStatsApi = {
  get: (params?: OpportunityListParams) => {
    return apiClient.get<OpportunityStats>(`${BASE_URL}/opportunities/stats/`, { params });
  },
};

// === OPPORTUNITY INVOICE LINKS ===

export const opportunityInvoicesApi = {
  /**
   * List invoice links for an opportunity
   */
  list: (opportunityId: number) => {
    return apiClient.get<OpportunityInvoiceLink[]>(
      `${BASE_URL}/opportunities/${opportunityId}/invoices/`
    );
  },

  /**
   * Link an existing invoice to an opportunity
   */
  link: (data: LinkInvoiceInput) => {
    return apiClient.post<OpportunityInvoiceLink>(
      `${BASE_URL}/opportunities/${data.opportunity}/invoices/`,
      { invoice_id: data.invoice, invoice_type: data.invoice_type, is_primary: data.is_primary }
    );
  },

  /**
   * Unlink an invoice from an opportunity
   */
  unlink: (opportunityId: number, linkId: number) => {
    return apiClient.delete(`${BASE_URL}/opportunities/${opportunityId}/invoices/${linkId}/`);
  },

  /**
   * Update invoice link (change type, primary status)
   */
  update: (opportunityId: number, linkId: number, data: { invoice_type?: InvoiceType; is_primary?: boolean }) => {
    return apiClient.patch<OpportunityInvoiceLink>(
      `${BASE_URL}/opportunities/${opportunityId}/invoices/${linkId}/`,
      data
    );
  },
};

// === OPPORTUNITY CONTRACT LINKS ===

export const opportunityContractsApi = {
  /**
   * List contract links for an opportunity
   */
  list: (opportunityId: number) => {
    return apiClient.get<OpportunityContractLink[]>(
      `${BASE_URL}/opportunities/${opportunityId}/contracts/`
    );
  },

  /**
   * Link an existing contract to an opportunity
   */
  link: (data: LinkContractInput) => {
    return apiClient.post<OpportunityContractLink>(
      `${BASE_URL}/opportunities/${data.opportunity}/contracts/`,
      { contract_id: data.contract, is_primary: data.is_primary }
    );
  },

  /**
   * Create a new contract and link it to an opportunity
   */
  createAndLink: (data: CreateAndLinkContractInput) => {
    return apiClient.post<OpportunityContractLink>(
      `${BASE_URL}/opportunities/${data.opportunity}/contracts/generate/`,
      data
    );
  },

  /**
   * Unlink a contract from an opportunity
   */
  unlink: (opportunityId: number, linkId: number) => {
    return apiClient.delete(`${BASE_URL}/opportunities/${opportunityId}/contracts/${linkId}/`);
  },

  /**
   * Update contract link (change primary status)
   */
  update: (opportunityId: number, linkId: number, data: { is_primary?: boolean }) => {
    return apiClient.patch<OpportunityContractLink>(
      `${BASE_URL}/opportunities/${opportunityId}/contracts/${linkId}/`,
      data
    );
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
