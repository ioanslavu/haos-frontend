/**
 * Invoice types based on backend serializers
 */

export type InvoiceType = 'income' | 'expense';
export type InvoiceStatus = 'draft' | 'uploaded' | 'paid' | 'cancelled';
export type InvoiceCurrency = 'EUR' | 'USD' | 'GBP' | 'RON';
export type ExtractionStatus = 'pending' | 'processing' | 'success' | 'failed' | 'manual';

/**
 * Invoice list item - lightweight for table views
 */
export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: InvoiceType;
  invoice_type_display: string;
  name: string;
  amount: string | null;
  currency: InvoiceCurrency;
  status: InvoiceStatus;
  status_display: string;
  date_uploaded: string | null;
  date_paid: string | null;
  contract: number | null;
  contract_number: string | null;
  department: number;
  department_name: string;
  created_by: number | null;
  created_by_email: string | null;
  created_at: string;
  has_file: boolean;
  is_synced_to_gdrive: boolean;
  extraction_status: ExtractionStatus;
  extraction_status_display: string;
  extraction_successful: boolean;
}

/**
 * Full invoice detail - includes all fields
 */
export interface InvoiceDetail extends Invoice {
  currency_display: string;
  contract_title: string | null;
  file: string | null;
  gdrive_file_id: string | null;
  gdrive_file_url: string | null;
  notes: string | null;
  payment_reference: string | null;
  created_by_name: string | null;
  updated_at: string;
  // Computed properties
  is_income: boolean;
  is_expense: boolean;
  is_paid: boolean;
  // AI Extraction fields
  extracted_amount: string | null;
  extracted_currency: string | null;
  extraction_confidence: number | null;
  extraction_model: string | null;
  extraction_notes: string | null;
  extracted_at: string | null;
  has_extraction: boolean;
  needs_manual_amount: boolean;
}

/**
 * Filters for invoice list queries
 */
export interface InvoiceFilters {
  search?: string;
  invoice_type?: InvoiceType;
  status?: InvoiceStatus;
  currency?: InvoiceCurrency;
  department?: number;
  contract?: number;
  has_file?: boolean;
  has_contract?: boolean;
  amount_min?: number;
  amount_max?: number;
  created_after?: string;
  created_before?: string;
  uploaded_after?: string;
  uploaded_before?: string;
  paid_after?: string;
  paid_before?: string;
  page?: number;
  page_size?: number;
}

/**
 * Paginated response for invoice list
 */
export interface InvoiceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Invoice[];
}

/**
 * Invoice creation payload
 */
export interface InvoiceCreatePayload {
  invoice_type: InvoiceType;
  name: string;
  amount?: string | null;
  currency: InvoiceCurrency;
  contract?: number | null;
  file?: File;
  notes?: string;
  department?: number;
}

/**
 * Invoice update payload
 */
export interface InvoiceUpdatePayload {
  name?: string;
  amount?: string | null;
  currency?: InvoiceCurrency;
  status?: InvoiceStatus;
  contract?: number | null;
  notes?: string;
  payment_reference?: string;
}

/**
 * Mark paid payload
 */
export interface MarkPaidPayload {
  payment_reference?: string;
}

/**
 * Invoice statistics response
 */
export interface InvoiceStats {
  total_count: number;
  total_income: string;
  total_expense: string;
  pending_count: number;
  paid_count: number;
  by_currency: Record<InvoiceCurrency, { income: string; expense: string }>;
}
