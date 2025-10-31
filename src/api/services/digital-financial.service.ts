import apiClient from '../client';
import type {
  FinancialMetrics,
  MonthlyRevenue,
  RevenueByService,
  RevenueByClient,
  CampaignFinancial,
  FinancialFilters,
  KPIOverview,
} from '../types/digital-financial';
import type { PaginatedResponse } from '@/types';

/**
 * Digital Financial Service
 *
 * TODO: Backend Implementation Required
 *
 * The following endpoints need to be implemented on the backend:
 *
 * 1. GET /api/v1/digital/financial/metrics/ - Financial overview metrics
 *    - Aggregates: total_revenue, total_profit, budget_spent, pending_collections
 *    - All values converted to EUR on backend
 *    - Filters: start_date, end_date, service_type, campaign_status, invoice_status
 *
 * 2. GET /api/v1/digital/financial/revenue-by-month/ - Monthly revenue breakdown
 *    - Database GROUP BY month with SUM aggregations
 *    - Returns monthly revenue, profit, spent (all in EUR)
 *    - Filters: same as above
 *
 * 3. GET /api/v1/digital/financial/revenue-by-service/ - Service type revenue
 *    - Database GROUP BY service_type with SUM aggregations
 *    - Returns revenue per service, sorted by revenue DESC
 *    - Filters: same as above
 *
 * 4. GET /api/v1/digital/financial/revenue-by-client/ - Top clients by revenue
 *    - Database GROUP BY client with SUM aggregations
 *    - Returns top 5 clients by revenue (LIMIT 5, ORDER BY revenue DESC)
 *    - Filters: same as above
 *
 * 5. GET /api/v1/digital/financial/campaigns/ - Campaign financial details
 *    - Returns campaigns with all financial data
 *    - Currency conversion to EUR done on backend
 *    - Includes original currency values for tooltips
 *    - Filters: same as above + pagination
 *
 * Backend Requirements:
 * - Use database aggregations (not application-level loops)
 * - Implement currency conversion service (fetch rates from external API or cached)
 * - Add proper indexes on: start_date, service_type, campaign_status, invoice_status
 * - Use Redis/memcached for exchange rate caching
 * - Implement rate limiting for these endpoints
 * - Add proper authorization (only authenticated users with digital department access)
 */

class DigitalFinancialService {
  private readonly basePath = '/api/v1/digital/financial';

  /**
   * Get financial metrics overview
   * All aggregations calculated on backend
   */
  async getFinancialMetrics(filters: FinancialFilters): Promise<FinancialMetrics> {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get<FinancialMetrics>(`${this.basePath}/metrics/`, { params });
    return response.data;
  }

  /**
   * Get monthly revenue breakdown
   * Backend aggregates by month
   */
  async getMonthlyRevenue(filters: FinancialFilters): Promise<MonthlyRevenue[]> {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get<MonthlyRevenue[]>(`${this.basePath}/revenue-by-month/`, { params });
    return response.data;
  }

  /**
   * Get revenue by service type
   * Backend groups and aggregates
   */
  async getRevenueByService(filters: FinancialFilters): Promise<RevenueByService[]> {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get<RevenueByService[]>(`${this.basePath}/revenue-by-service/`, { params });
    return response.data;
  }

  /**
   * Get top clients by revenue
   * Backend returns top 5, sorted by revenue
   */
  async getRevenueByClient(filters: FinancialFilters): Promise<RevenueByClient[]> {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get<RevenueByClient[]>(`${this.basePath}/revenue-by-client/`, { params });
    return response.data;
  }

  /**
   * Get campaign financial details
   * Backend handles currency conversion
   */
  async getCampaignFinancials(
    filters: FinancialFilters,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<CampaignFinancial>> {
    const params = this.buildQueryParams(filters);
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;

    const response = await apiClient.get<PaginatedResponse<CampaignFinancial>>(
      `${this.basePath}/campaigns/`,
      { params }
    );
    return response.data;
  }

  /**
   * Get KPI overview with all metrics in single response
   * Backend calculates all KPIs including:
   * - Total active clients
   * - Campaigns in progress
   * - Total revenue current month
   * - Average delivery time by service
   * - ROI by campaign type
   * - Top 5 clients
   */
  async getKPIOverview(filters: FinancialFilters): Promise<KPIOverview> {
    const params = this.buildQueryParams(filters);
    const response = await apiClient.get<KPIOverview>(`${this.basePath}/kpis/`, { params });
    return response.data;
  }

  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters: FinancialFilters): Record<string, any> {
    const params: Record<string, any> = {};

    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;
    if (filters.service_type && filters.service_type !== 'all') {
      params.service_type = filters.service_type;
    }
    if (filters.campaign_status && filters.campaign_status !== 'all') {
      params.status = filters.campaign_status;
    }
    if (filters.invoice_status && filters.invoice_status !== 'all') {
      params.invoice_status = filters.invoice_status;
    }
    if (filters.period) {
      params.period = filters.period;
    }

    return params;
  }
}

export const digitalFinancialService = new DigitalFinancialService();
