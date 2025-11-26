import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import {
  Invoice,
  InvoiceDetail,
  InvoiceFilters,
  InvoiceListResponse,
  InvoiceCreatePayload,
  InvoiceUpdatePayload,
  MarkPaidPayload,
  InvoiceStats,
} from '@/types/invoice';

// Query keys
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceFilters) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
  stats: () => [...invoiceKeys.all, 'stats'] as const,
};

// API functions
const fetchInvoices = async (filters: InvoiceFilters = {}): Promise<InvoiceListResponse> => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.invoice_type) params.append('invoice_type', filters.invoice_type);
  if (filters.status) params.append('status', filters.status);
  if (filters.currency) params.append('currency', filters.currency);
  if (filters.department) params.append('department', filters.department.toString());
  if (filters.contract) params.append('contract', filters.contract.toString());
  if (filters.has_file !== undefined) params.append('has_file', filters.has_file.toString());
  if (filters.has_contract !== undefined) params.append('has_contract', filters.has_contract.toString());
  if (filters.amount_min) params.append('amount_min', filters.amount_min.toString());
  if (filters.amount_max) params.append('amount_max', filters.amount_max.toString());
  if (filters.created_after) params.append('created_after', filters.created_after);
  if (filters.created_before) params.append('created_before', filters.created_before);
  if (filters.uploaded_after) params.append('uploaded_after', filters.uploaded_after);
  if (filters.uploaded_before) params.append('uploaded_before', filters.uploaded_before);
  if (filters.paid_after) params.append('paid_after', filters.paid_after);
  if (filters.paid_before) params.append('paid_before', filters.paid_before);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.page_size) params.append('page_size', filters.page_size.toString());

  const response = await apiClient.get(`/api/v1/invoices/?${params.toString()}`);
  return response.data;
};

const fetchInvoice = async (id: number): Promise<InvoiceDetail> => {
  const response = await apiClient.get(`/api/v1/invoices/${id}/`);
  return response.data;
};

const fetchInvoiceStats = async (): Promise<InvoiceStats> => {
  const response = await apiClient.get('/api/v1/invoices/stats/');
  return response.data;
};

const createInvoice = async (payload: InvoiceCreatePayload): Promise<InvoiceDetail> => {
  const formData = new FormData();
  formData.append('invoice_type', payload.invoice_type);
  formData.append('name', payload.name);
  formData.append('currency', payload.currency);

  if (payload.amount) formData.append('amount', payload.amount);
  if (payload.contract) formData.append('contract', payload.contract.toString());
  if (payload.file) formData.append('file', payload.file);
  if (payload.notes) formData.append('notes', payload.notes);
  if (payload.department) formData.append('department', payload.department.toString());

  const response = await apiClient.post('/api/v1/invoices/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const updateInvoice = async ({ id, payload }: { id: number; payload: InvoiceUpdatePayload }): Promise<InvoiceDetail> => {
  const response = await apiClient.patch(`/api/v1/invoices/${id}/`, payload);
  return response.data;
};

const deleteInvoice = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/invoices/${id}/`);
};

const markInvoicePaid = async ({ id, payload }: { id: number; payload?: MarkPaidPayload }): Promise<InvoiceDetail> => {
  const response = await apiClient.post(`/api/v1/invoices/${id}/mark_paid/`, payload || {});
  return response.data;
};

const cancelInvoice = async (id: number): Promise<InvoiceDetail> => {
  const response = await apiClient.post(`/api/v1/invoices/${id}/cancel/`);
  return response.data;
};

const uploadInvoiceFile = async ({ id, file }: { id: number; file: File }): Promise<InvoiceDetail> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(`/api/v1/invoices/${id}/upload_file/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const acceptExtraction = async (id: number): Promise<InvoiceDetail> => {
  const response = await apiClient.post(`/api/v1/invoices/${id}/accept_extraction/`);
  return response.data;
};

const retryExtraction = async (id: number): Promise<InvoiceDetail> => {
  const response = await apiClient.post(`/api/v1/invoices/${id}/retry_extraction/`);
  return response.data;
};

const syncToGdrive = async (id: number): Promise<{ success: boolean; gdrive_url?: string }> => {
  const response = await apiClient.post(`/api/v1/invoices/${id}/sync_to_gdrive/`);
  return response.data;
};

// Query hooks
export const useInvoices = (filters: InvoiceFilters = {}) => {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => fetchInvoices(filters),
  });
};

export const useInvoice = (id: number, enabled = true) => {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => fetchInvoice(id),
    enabled: enabled && id > 0,
  });
};

export const useInvoiceStats = () => {
  return useQuery({
    queryKey: invoiceKeys.stats(),
    queryFn: fetchInvoiceStats,
  });
};

// Mutation hooks
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
};

export const useMarkInvoicePaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markInvoicePaid,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
};

export const useCancelInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelInvoice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
};

export const useUploadInvoiceFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadInvoiceFile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
};

export const useAcceptExtraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptExtraction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
};

export const useRetryExtraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryExtraction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
};

export const useSyncToGdrive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncToGdrive,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
};
