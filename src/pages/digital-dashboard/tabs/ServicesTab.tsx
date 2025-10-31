import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Target,
  TrendingUp,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Music,
  Video,
  Radio,
  Film,
  Youtube
} from 'lucide-react';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { SERVICE_TYPE_LABELS } from '@/api/types/campaigns';
import { Campaign } from '@/types/campaign';
import { useMemo } from 'react';
import { ServiceMetricsUpdateDialog } from '@/components/digital/ServiceMetricsUpdateDialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ServicesTabProps {
  filterService: string;
  filterPeriod: string;
  startDate?: Date;
  endDate?: Date;
  filterClient?: string;
  filterStatus?: string;
}

// Helper function to filter campaigns by digital department and date
const filterDigitalCampaigns = (
  campaigns: Campaign[],
  filterPeriod: string,
  startDate?: Date,
  endDate?: Date,
  filterClient?: string,
  filterStatus?: string
) => {
  if (!campaigns) return [];

  // Filter by digital department
  let filtered = campaigns.filter(c =>
    c.department_display?.toLowerCase() === 'digital' ||
    c.service_type // If has service_type, likely digital
  );

  // Apply date filter
  if (filterPeriod === 'custom' && (startDate || endDate)) {
    // Use custom date range
    filtered = filtered.filter(c => {
      const createdAt = new Date(c.created_at);
      if (startDate && createdAt < startDate) return false;
      if (endDate && createdAt > endDate) return false;
      return true;
    });
  } else if (filterPeriod !== 'custom') {
    // Use predefined period
    const now = new Date();
    const periodDays: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'year': 365
    };

    const days = periodDays[filterPeriod] || 30;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    filtered = filtered.filter(c => {
      const createdAt = new Date(c.created_at);
      return createdAt >= cutoffDate;
    });
  }

  // Apply client filter
  if (filterClient && filterClient !== 'all') {
    filtered = filtered.filter(c => String(c.client.id) === filterClient);
  }

  // Apply status filter
  if (filterStatus && filterStatus !== 'all') {
    filtered = filtered.filter(c => c.status === filterStatus);
  }

  return filtered;
};

// Helper function to aggregate service-specific metrics
const calculateServiceMetrics = (campaigns: Campaign[], serviceType: string) => {
  const serviceCampaigns = campaigns.filter(c => c.service_type === serviceType);

  if (serviceCampaigns.length === 0) {
    return null;
  }

  const metrics = serviceCampaigns.reduce((acc, campaign) => {
    const data = campaign.department_data || {};

    // Aggregate all numeric fields
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'number') {
        acc[key] = (acc[key] || 0) + value;
      }
    });

    return acc;
  }, {} as Record<string, number>);

  return {
    campaignCount: serviceCampaigns.length,
    ...metrics
  };
};

// Service metric card component
interface ServiceMetricCardProps {
  title: string;
  icon: any;
  metrics: Array<{ label: string; value: number | string; color?: string; suffix?: string }>;
  isEmpty?: boolean;
  className?: string;
  campaigns?: Campaign[];
  serviceType?: string;
}

const ServiceMetricCard = ({ title, icon: Icon, metrics, isEmpty, className, campaigns = [], serviceType }: ServiceMetricCardProps) => {
  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {title.toLowerCase()} campaigns in selected period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          {campaigns.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Update Metrics ({campaigns.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Update Campaign Metrics</h4>
                  <p className="text-xs text-muted-foreground">
                    Select a campaign to update its metrics
                  </p>
                  <div className="space-y-1 max-h-60 overflow-auto">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{campaign.campaign_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{campaign.client.display_name}</p>
                        </div>
                        <ServiceMetricsUpdateDialog
                          campaign={campaign}
                          variant="ghost"
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className={`text-2xl font-bold ${metric.color || ''}`}>
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                {metric.suffix && <span className="text-sm ml-1">{metric.suffix}</span>}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export function ServicesTab({ filterService, filterPeriod, startDate, endDate, filterClient, filterStatus }: ServicesTabProps) {
  const { data: campaigns } = useCampaigns();

  // Filter digital campaigns
  const digitalCampaigns = useMemo(() => {
    let filtered = filterDigitalCampaigns(
      campaigns?.results || [],
      filterPeriod,
      startDate,
      endDate,
      filterClient,
      filterStatus
    );

    // Apply service filter
    if (filterService && filterService !== 'all') {
      filtered = filtered.filter(c => c.service_type === filterService);
    }

    return filtered;
  }, [campaigns, filterPeriod, filterService, startDate, endDate, filterClient, filterStatus]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const uniqueServices = new Set(digitalCampaigns.map(c => c.service_type).filter(Boolean));
    const totalCampaigns = digitalCampaigns.length;
    const totalBudget = digitalCampaigns.reduce((sum, c) =>
      sum + parseFloat(c.budget_allocated || c.value || '0'), 0);
    const totalSpent = digitalCampaigns.reduce((sum, c) =>
      sum + parseFloat(c.budget_spent || '0'), 0);
    const totalRevenue = digitalCampaigns.reduce((sum, c) =>
      sum + parseFloat(c.value || '0'), 0);

    return {
      activeServices: uniqueServices.size,
      totalCampaigns,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      totalRevenue
    };
  }, [digitalCampaigns]);

  // Service-specific campaigns
  const dspCampaigns = useMemo(() =>
    digitalCampaigns.filter(c => c.service_type === 'dsp_distribution'),
    [digitalCampaigns]
  );

  const youtubeCampaigns = useMemo(() =>
    digitalCampaigns.filter(c => c.service_type === 'youtube_cms'),
    [digitalCampaigns]
  );

  const tiktokCampaigns = useMemo(() =>
    digitalCampaigns.filter(c => c.service_type === 'tiktok_ugc'),
    [digitalCampaigns]
  );

  const playlistCampaigns = useMemo(() =>
    digitalCampaigns.filter(c => c.service_type === 'playlist_pitching' || c.service_type === 'radio_plugging'),
    [digitalCampaigns]
  );

  const ppcCampaigns = useMemo(() =>
    digitalCampaigns.filter(c => c.service_type === 'ppc'),
    [digitalCampaigns]
  );

  // Service-specific metrics
  const dspMetrics = useMemo(() =>
    calculateServiceMetrics(digitalCampaigns, 'dsp_distribution'),
    [digitalCampaigns]
  );

  const youtubeMetrics = useMemo(() =>
    calculateServiceMetrics(digitalCampaigns, 'youtube_cms'),
    [digitalCampaigns]
  );

  const tiktokMetrics = useMemo(() =>
    calculateServiceMetrics(digitalCampaigns, 'tiktok_ugc'),
    [digitalCampaigns]
  );

  const playlistMetrics = useMemo(() => {
    const playlistCampaigns = digitalCampaigns.filter(c =>
      c.service_type === 'playlist_pitching' || c.service_type === 'radio_plugging'
    );

    if (playlistCampaigns.length === 0) return null;

    const aggregated = playlistCampaigns.reduce((acc, campaign) => {
      const data = campaign.department_data || {};
      acc.contacts_sent = (acc.contacts_sent || 0) + (data.contacts_sent || 0);
      acc.responses_received = (acc.responses_received || 0) + (data.responses_received || 0);
      acc.tracks_accepted = (acc.tracks_accepted || 0) + (data.tracks_accepted || 0);
      return acc;
    }, {} as Record<string, number>);

    const acceptanceRate = aggregated.contacts_sent > 0
      ? ((aggregated.tracks_accepted || 0) / aggregated.contacts_sent * 100).toFixed(1)
      : '0';

    return {
      campaignCount: playlistCampaigns.length,
      ...aggregated,
      acceptance_rate: acceptanceRate
    };
  }, [digitalCampaigns]);

  const ppcMetrics = useMemo(() => {
    const ppcCampaigns = digitalCampaigns.filter(c => c.service_type === 'ppc');

    if (ppcCampaigns.length === 0) return null;

    const totalAllocated = ppcCampaigns.reduce((sum, c) =>
      sum + parseFloat(c.budget_allocated || c.value || '0'), 0);
    const totalSpent = ppcCampaigns.reduce((sum, c) =>
      sum + parseFloat(c.budget_spent || '0'), 0);

    const aggregated = ppcCampaigns.reduce((acc, campaign) => {
      const data = campaign.department_data || {};
      acc.conversions = (acc.conversions || 0) + (data.conversions || 0);
      acc.cost_per_result_sum = (acc.cost_per_result_sum || 0) + (data.cost_per_result || 0);
      acc.count = (acc.count || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgCostPerResult = aggregated.count > 0
      ? (aggregated.cost_per_result_sum / aggregated.count).toFixed(2)
      : '0';

    return {
      campaignCount: ppcCampaigns.length,
      budget_allocated: totalAllocated,
      budget_spent: totalSpent,
      conversions: aggregated.conversions || 0,
      avg_cost_per_result: avgCostPerResult
    };
  }, [digitalCampaigns]);

  // Platform distribution data
  const platformData = useMemo(() => {
    const platformCounts = digitalCampaigns.reduce((acc, campaign) => {
      const platform = campaign.platform_display || campaign.platform || 'Other';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(platformCounts)
      .map(([name, count]) => ({ name, campaigns: count }))
      .sort((a, b) => b.campaigns - a.campaigns);
  }, [digitalCampaigns]);

  // Revenue per service data
  const revenueData = useMemo(() => {
    const serviceRevenue = digitalCampaigns.reduce((acc, campaign) => {
      const service = campaign.service_type || 'other';
      const revenue = parseFloat(campaign.value || '0');
      const budgetAllocated = parseFloat(campaign.budget_allocated || campaign.value || '0');
      const budgetSpent = parseFloat(campaign.budget_spent || '0');

      if (!acc[service]) {
        acc[service] = { revenue: 0, allocated: 0, spent: 0 };
      }
      acc[service].revenue += revenue;
      acc[service].allocated += budgetAllocated;
      acc[service].spent += budgetSpent;
      return acc;
    }, {} as Record<string, { revenue: number; allocated: number; spent: number }>);

    return Object.entries(serviceRevenue).map(([service, data]) => ({
      name: SERVICE_TYPE_LABELS[service as keyof typeof SERVICE_TYPE_LABELS] || service,
      revenue: data.revenue,
      utilization: data.allocated > 0 ? (data.spent / data.allocated) * 100 : 0
    }));
  }, [digitalCampaigns]);

  // Service stats for table
  const serviceStats = useMemo(() => {
    return digitalCampaigns.reduce((acc, campaign) => {
      const service = campaign.service_type || 'other';
      if (!acc[service]) {
        acc[service] = {
          count: 0,
          revenue: 0,
          active: 0,
          completed: 0,
          avgKpi: 0,
          totalBudget: 0,
          totalSpent: 0,
        };
      }
      acc[service].count++;
      acc[service].revenue += parseFloat(campaign.value);
      acc[service].totalBudget += parseFloat(campaign.budget_allocated || campaign.value);
      acc[service].totalSpent += parseFloat(campaign.budget_spent || '0');

      if (campaign.status === 'active' || campaign.status === 'confirmed') {
        acc[service].active++;
      }
      if (campaign.status === 'completed') {
        acc[service].completed++;
      }
      acc[service].avgKpi += campaign.kpi_completion || 0;

      return acc;
    }, {} as Record<string, any>);
  }, [digitalCampaigns]);

  // Calculate averages for table
  Object.keys(serviceStats).forEach(service => {
    serviceStats[service].avgKpi = serviceStats[service].count > 0
      ? serviceStats[service].avgKpi / serviceStats[service].count
      : 0;
    serviceStats[service].utilization = serviceStats[service].totalBudget > 0
      ? (serviceStats[service].totalSpent / serviceStats[service].totalBudget) * 100
      : 0;
  });

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.activeServices}</div>
            <p className="text-xs text-muted-foreground">Service types running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.budgetUtilization.toFixed(1)}%</div>
            <Progress value={overallStats.budgetUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{overallStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Service-Specific Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DSP Distribution */}
        <ServiceMetricCard
          title="DSP Distribution"
          icon={Music}
          isEmpty={!dspMetrics}
          campaigns={dspCampaigns}
          serviceType="dsp_distribution"
          metrics={dspMetrics ? [
            { label: 'Piese livrate', value: dspMetrics.tracks_delivered || 0, color: 'text-green-600' },
            { label: 'În pending', value: dspMetrics.tracks_pending || 0, color: 'text-yellow-600' },
            { label: 'În QC', value: dspMetrics.tracks_in_qc || 0, color: 'text-blue-600' },
            { label: 'Respinse', value: dspMetrics.tracks_rejected || 0, color: 'text-red-600' },
          ] : []}
        />

        {/* YouTube CMS */}
        <ServiceMetricCard
          title="YouTube CMS"
          icon={Youtube}
          isEmpty={!youtubeMetrics}
          campaigns={youtubeCampaigns}
          serviceType="youtube_cms"
          metrics={youtubeMetrics ? [
            { label: 'Clipuri noi', value: youtubeMetrics.new_clips || 0 },
            { label: 'Revenue estimate', value: `€${(youtubeMetrics.revenue_estimate || 0).toLocaleString()}` },
            { label: 'Dispute active', value: youtubeMetrics.active_disputes || 0, color: 'text-orange-600' },
            { label: 'Strike-uri', value: youtubeMetrics.strikes || 0, color: 'text-red-600' },
          ] : []}
        />

        {/* TikTok Clipping */}
        <ServiceMetricCard
          title="TikTok Clipping"
          icon={Film}
          isEmpty={!tiktokMetrics}
          campaigns={tiktokCampaigns}
          serviceType="tiktok_ugc"
          metrics={tiktokMetrics ? [
            { label: 'Clipuri generate', value: tiktokMetrics.clips_generated || 0 },
            { label: 'Engagement mediu', value: tiktokMetrics.avg_engagement || 0, suffix: '%' },
            { label: 'Total views', value: tiktokMetrics.total_views || 0 },
            { label: 'Campaigns', value: tiktokMetrics.campaignCount || 0 },
          ] : []}
        />

        {/* Playlist Pitching & Radio Plugging */}
        <ServiceMetricCard
          title="Playlist Pitching & Radio"
          icon={Radio}
          isEmpty={!playlistMetrics}
          campaigns={playlistCampaigns}
          serviceType="playlist_pitching"
          metrics={playlistMetrics ? [
            { label: 'Contacte trimise', value: playlistMetrics.contacts_sent || 0 },
            { label: 'Răspunsuri primite', value: playlistMetrics.responses_received || 0, color: 'text-blue-600' },
            { label: 'Piese acceptate', value: playlistMetrics.tracks_accepted || 0, color: 'text-green-600' },
            { label: 'Acceptance rate', value: playlistMetrics.acceptance_rate || 0, suffix: '%' },
          ] : []}
        />

        {/* PPC Campaigns - Full width */}
        <ServiceMetricCard
          title="PPC Campaigns"
          icon={Target}
          isEmpty={!ppcMetrics}
          campaigns={ppcCampaigns}
          serviceType="ppc"
          className="lg:col-span-2"
          metrics={ppcMetrics ? [
            { label: 'Buget alocat', value: `€${(ppcMetrics.budget_allocated || 0).toLocaleString()}` },
            { label: 'Buget cheltuit', value: `€${(ppcMetrics.budget_spent || 0).toLocaleString()}`, color: 'text-orange-600' },
            { label: 'Cost per result', value: `€${ppcMetrics.avg_cost_per_result}` },
            { label: 'Conversii', value: ppcMetrics.conversions || 0, color: 'text-green-600' },
          ] : []}
        />
      </div>

      {/* Improved Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution per Platform</CardTitle>
            <CardDescription>Campaign distribution across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            {platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="campaigns" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No platform data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue per Service */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue per Service</CardTitle>
            <CardDescription>Revenue and budget utilization by service</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#82ca9d" name="Revenue (€)" />
                  <Line yAxisId="right" type="monotone" dataKey="utilization" stroke="#ff7300" name="Utilization (%)" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Performance Details</CardTitle>
          <CardDescription>Detailed metrics for each service type</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(serviceStats).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Budget Utilization</TableHead>
                  <TableHead>Avg KPI</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(serviceStats).map(([service, stats]: [string, any]) => (
                  <TableRow key={service}>
                    <TableCell>
                      <div className="font-medium">
                        {SERVICE_TYPE_LABELS[service as keyof typeof SERVICE_TYPE_LABELS] || service}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{stats.active}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{stats.completed}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={stats.utilization} className="w-20" />
                        <span className="text-sm">{stats.utilization.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {stats.avgKpi >= 80 ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : stats.avgKpi >= 60 ? (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>{stats.avgKpi.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>€{stats.revenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        stats.avgKpi >= 80 ? 'default' :
                        stats.avgKpi >= 60 ? 'outline' :
                        'destructive'
                      }>
                        {stats.avgKpi >= 80 ? 'Optimal' :
                         stats.avgKpi >= 60 ? 'Good' :
                         'Needs Attention'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No service data available for selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
