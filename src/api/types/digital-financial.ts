// Digital Financial API Types
// These types match the expected backend API responses

export interface FinancialMetrics {
  total_revenue: number; // All in EUR, calculated on backend
  total_profit: number;
  total_budget_spent: number;
  pending_collections: number;
  profit_margin: number; // Percentage
}

export interface MonthlyRevenue {
  month: string; // e.g., "Jan 2024"
  revenue: number; // EUR
  profit: number; // EUR
  spent: number; // EUR
}

export interface RevenueByService {
  service: string;
  service_display: string;
  revenue: number; // EUR
  campaign_count: number;
}

export interface RevenueByClient {
  client_id: number;
  client_name: string;
  revenue: number; // EUR
  campaign_count: number;
}

export interface CampaignFinancial {
  id: number;
  campaign_name: string;
  client_id: number;
  client_name: string;
  service_types: string[];
  service_types_display: string[];

  // All financial values in EUR (converted on backend)
  value_eur: number;
  budget_spent_eur: number;
  profit_eur: number | null;
  internal_cost_estimate_eur: number | null;

  // Original currency for display
  original_currency: string;
  original_value: number;
  original_budget_spent: number;
  original_profit: number | null;
  original_internal_cost: number | null;

  invoice_status: 'issued' | 'collected' | 'delayed' | null;
  campaign_status: string;
  start_date: string;
  end_date: string;
}

export interface FinancialFilters {
  start_date?: string; // ISO date
  end_date?: string; // ISO date
  service_type?: string;
  campaign_status?: string;
  invoice_status?: string;
  period?: '7d' | '30d' | '90d' | 'year' | 'custom';
}

// KPI Overview Types
export interface AvgDeliveryByService {
  service_type: string;
  service_display: string;
  avg_delivery_days: number;
  campaign_count: number;
}

export interface ROIByCampaignType {
  service_type: string;
  service_display: string;
  roi: number; // Percentage
  total_profit_eur: number;
  total_budget_spent_eur: number;
  campaign_count: number;
}

export interface KPIOverview {
  total_active_clients: number;
  campaigns_in_progress: number;
  total_revenue_current_month: number; // EUR
  avg_delivery_time_by_service: AvgDeliveryByService[];
  roi_by_campaign_type: ROIByCampaignType[];
  top_clients: RevenueByClient[];
}
