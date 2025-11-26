/**
 * Invoice types based on backend serializers
 */

import type { Platform } from './campaign';

export type InvoiceType = 'income' | 'expense';
export type InvoiceStatus = 'draft' | 'uploaded' | 'paid' | 'cancelled';
export type InvoiceCurrency = 'EUR' | 'USD' | 'GBP' | 'RON';
export type ExtractionStatus = 'pending' | 'processing' | 'success' | 'failed' | 'manual';
export type OriginType = 'campaign' | 'subcampaign' | 'distribution';
export type OriginGroupType = 'campaign' | 'distribution';

// View modes for invoice list
export type InvoiceViewMode = 'table' | 'grouped' | 'kanban';
export type InvoiceGroupBy = 'none' | 'origin' | 'client' | 'type';
export type InvoiceOriginFilter = 'all' | 'campaigns' | 'distributions';

/**
 * Extracted line item from AI extraction
 */
export interface ExtractedLineItem {
  description: string;
  quantity: string;
  unit_price: string | null;
  total: string | null;
}

/**
 * Invoice origin info - where the invoice came from
 */
export interface InvoiceOriginInfo {
  invoice_id: number;
  origin_type: string;  // 'campaign', 'subcampaign', 'distribution', etc.
  source_app: string;   // 'campaigns', 'distributions', etc.
  source_model: string; // 'Campaign', 'SubCampaign', 'Distribution', etc.
  source_id: number;
  display_name: string;
  url: string | null;
  extra: {
    // Common fields
    entity_id?: number | null;
    entity_name?: string | null;
    department_name?: string | null;
    linked_at?: string | null;
    linked_by?: string | null;
    // Campaign-specific
    campaign_type?: string;
    status?: string;
    status_display?: string;
    // SubCampaign-specific
    platform?: string;
    platform_display?: string;
    subcampaign_name?: string | null;
    campaign_id?: number;
    campaign_name?: string;
    // Distribution-specific
    deal_type?: string;
    deal_type_display?: string;
    deal_status?: string;
    deal_status_display?: string;
    revenue_share?: string;
    signing_date?: string | null;
    contract_id?: number | null;
    contract_number?: string | null;
  } | null;
}

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
  // Origin count for list view (optimized)
  origin_count: number;
  // Origin summary fields for list view display, grouping, and filtering
  origin_type: OriginType | null;
  client_name: string | null;
  platform: Platform | null;
  platform_display: string | null;
  origin_group_id: number | null;
  origin_group_name: string | null;
  origin_group_type: OriginGroupType | null;
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
  // AI Extraction - core fields
  extracted_amount: string | null;
  extracted_currency: string | null;
  extraction_confidence: number | null;
  extraction_model: string | null;
  extraction_notes: string | null;
  extracted_at: string | null;
  has_extraction: boolean;
  needs_manual_amount: boolean;
  // AI Extraction - invoice metadata
  extracted_invoice_number: string | null;
  extracted_invoice_date: string | null;
  extracted_due_date: string | null;
  extracted_payment_terms: string | null;
  // AI Extraction - vendor info
  extracted_vendor_name: string | null;
  extracted_vendor_address: string | null;
  extracted_vendor_vat: string | null;
  extracted_vendor_country: string | null;
  // AI Extraction - financial breakdown
  extracted_subtotal: string | null;
  extracted_tax_amount: string | null;
  extracted_tax_rate: string | null;
  // AI Extraction - payment info
  extracted_iban: string | null;
  extracted_bank_name: string | null;
  extracted_payment_ref: string | null;
  // AI Extraction - line items
  extracted_line_items: ExtractedLineItem[] | null;
  // Origin information (full details for detail view)
  origins: InvoiceOriginInfo[];
  has_origins: boolean;
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
  ordering?: string;
  page?: number;
  page_size?: number;
  // Origin filter for filtering by source type
  // 'campaigns' includes both campaign and subcampaign invoices
  origin?: 'campaign' | 'subcampaign' | 'campaigns' | 'distribution';
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
