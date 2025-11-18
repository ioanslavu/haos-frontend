import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import { CampaignMetrics, CampaignMetricsInput, CampaignMetricsSummary } from '../types/campaigns';
import { toast } from 'sonner';

// API endpoints
const METRICS_BASE_URL = '/api/v1/campaign-metrics';

// Fetch campaign metrics with filters
export const useCampaignMetrics = (params?: {
  campaign?: number;
  source?: string | string[];
  recorded_date?: string;
  recorded_date_gte?: string;
  recorded_date_lte?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(`${key}__in`, v));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }

  return useQuery({
    queryKey: ['campaign-metrics', params],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number; results: CampaignMetrics[] } | CampaignMetrics[]>(
        `${METRICS_BASE_URL}/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      // Handle both paginated and non-paginated responses
      return Array.isArray(response.data) ? response.data : response.data.results;
    },
  });
};

// Get single metric record
export const useCampaignMetric = (metricId: number | string) => {
  return useQuery({
    queryKey: ['campaign-metrics', metricId],
    queryFn: async () => {
      const response = await apiClient.get<CampaignMetrics>(`${METRICS_BASE_URL}/${metricId}/`);
      return response.data;
    },
    enabled: !!metricId,
  });
};

// Get campaign metrics summary
export const useCampaignMetricsSummary = (campaignId: number | string) => {
  return useQuery({
    queryKey: ['campaign-metrics', 'summary', campaignId],
    queryFn: async () => {
      const response = await apiClient.get<CampaignMetricsSummary>(
        `${METRICS_BASE_URL}/report-by-campaign/?campaign=${campaignId}`
      );
      return response.data;
    },
    enabled: !!campaignId,
  });
};

// Create metric record
export const useCreateCampaignMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CampaignMetricsInput) => {
      const response = await apiClient.post<CampaignMetrics>(`${METRICS_BASE_URL}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', 'summary', data.campaign] });
      toast.success('Metrics recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to record metrics');
    },
  });
};

// Update metric record
export const useUpdateCampaignMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CampaignMetricsInput> }) => {
      const response = await apiClient.patch<CampaignMetrics>(`${METRICS_BASE_URL}/${id}/`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', data.id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', 'summary', data.campaign] });
      toast.success('Metrics updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update metrics');
    },
  });
};

// Delete metric record
export const useDeleteCampaignMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`${METRICS_BASE_URL}/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics'] });
      toast.success('Metrics deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete metrics');
    },
  });
};

// Bulk import metrics
export const useBulkImportMetrics = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaign,
      metrics,
    }: {
      campaign: number;
      metrics: Omit<CampaignMetricsInput, 'campaign'>[];
    }) => {
      const response = await apiClient.post(`${METRICS_BASE_URL}/bulk-import/`, {
        campaign,
        metrics,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics'] });
      queryClient.invalidateQueries({
        queryKey: ['campaign-metrics', 'summary', variables.campaign]
      });
      if (data.errors?.length) {
        toast.warning(`Imported ${data.created} metrics with ${data.errors.length} errors`);
      } else {
        toast.success(`Successfully imported ${data.created} metrics`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to import metrics');
    },
  });
};

// Helper to calculate KPI progress
export const useCalculateKPIProgress = (
  campaignId: number | string,
  kpiTargets?: Record<string, { target: number; unit: string }>
) => {
  const { data: summary } = useCampaignMetricsSummary(campaignId);

  if (!summary || !kpiTargets) {
    return { progress: {}, overall: 0 };
  }

  const progress: Record<string, number> = {};
  let totalProgress = 0;
  let kpiCount = 0;

  Object.entries(kpiTargets).forEach(([key, target]) => {
    const actual = summary[key] || 0;
    const percentage = target.target > 0 ? (actual / target.target) * 100 : 0;
    progress[key] = Math.min(percentage, 100);
    totalProgress += progress[key];
    kpiCount++;
  });

  return {
    progress,
    overall: kpiCount > 0 ? totalProgress / kpiCount : 0,
  };
};