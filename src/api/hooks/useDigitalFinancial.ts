import { useQuery } from '@tanstack/react-query';
import { digitalFinancialService } from '../services/digital-financial.service';
import type { FinancialFilters } from '../types/digital-financial';

/**
 * React Query hooks for Digital Financial data
 *
 * These hooks fetch pre-aggregated data from backend endpoints.
 * All calculations, currency conversions, and aggregations happen on the backend.
 *
 * IMPORTANT: Backend endpoints must be implemented for these to work.
 * See digital-financial.service.ts for endpoint specifications.
 */

/**
 * Query keys factory for digital financial data
 */
export const digitalFinancialKeys = {
  all: ['digital-financial'] as const,
  metrics: (filters?: FinancialFilters) => [...digitalFinancialKeys.all, 'metrics', filters] as const,
  monthlyRevenue: (filters?: FinancialFilters) => [...digitalFinancialKeys.all, 'monthly-revenue', filters] as const,
  revenueByService: (filters?: FinancialFilters) => [...digitalFinancialKeys.all, 'revenue-by-service', filters] as const,
  revenueByClient: (filters?: FinancialFilters) => [...digitalFinancialKeys.all, 'revenue-by-client', filters] as const,
  campaignFinancials: (filters?: FinancialFilters, page?: number) =>
    [...digitalFinancialKeys.all, 'campaign-financials', filters, page] as const,
};

/**
 * Hook to get financial metrics overview
 * Backend calculates: total_revenue, total_profit, budget_spent, pending_collections
 */
export const useFinancialMetrics = (filters: FinancialFilters) => {
  return useQuery({
    queryKey: digitalFinancialKeys.metrics(filters),
    queryFn: () => digitalFinancialService.getFinancialMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - financial data doesn't change frequently
  });
};

/**
 * Hook to get monthly revenue breakdown
 * Backend groups campaigns by month and aggregates revenue, profit, spent
 */
export const useMonthlyRevenue = (filters: FinancialFilters) => {
  return useQuery({
    queryKey: digitalFinancialKeys.monthlyRevenue(filters),
    queryFn: () => digitalFinancialService.getMonthlyRevenue(filters),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get revenue by service type
 * Backend groups by service_type and sums revenue
 */
export const useRevenueByService = (filters: FinancialFilters) => {
  return useQuery({
    queryKey: digitalFinancialKeys.revenueByService(filters),
    queryFn: () => digitalFinancialService.getRevenueByService(filters),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get top clients by revenue
 * Backend returns top 5 clients sorted by revenue
 */
export const useRevenueByClient = (filters: FinancialFilters) => {
  return useQuery({
    queryKey: digitalFinancialKeys.revenueByClient(filters),
    queryFn: () => digitalFinancialService.getRevenueByClient(filters),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get campaign financial details
 * Backend returns campaigns with currency already converted to EUR
 */
export const useCampaignFinancials = (
  filters: FinancialFilters,
  page?: number,
  pageSize?: number
) => {
  return useQuery({
    queryKey: digitalFinancialKeys.campaignFinancials(filters, page),
    queryFn: () => digitalFinancialService.getCampaignFinancials(filters, page, pageSize),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get comprehensive KPI overview
 * Returns all 6 KPIs in single response (backend calculates everything)
 */
export const useKPIOverview = (filters: FinancialFilters) => {
  return useQuery({
    queryKey: [...digitalFinancialKeys.all, 'kpi-overview', filters],
    queryFn: () => digitalFinancialService.getKPIOverview(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
