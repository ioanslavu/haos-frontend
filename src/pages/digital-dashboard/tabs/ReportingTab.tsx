import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useKPIOverview } from '@/api/hooks/useDigitalFinancial';

interface ReportingTabProps {
  filterPeriod: string;
  filterService: string;
}

export function ReportingTab({ filterPeriod, filterService }: ReportingTabProps) {
  // Fetch all KPIs from backend (all calculations done server-side)
  const { data: kpis, isLoading: kpisLoading } = useKPIOverview({
    period: filterPeriod as any,
    service_type: filterService !== 'all' ? filterService : undefined,
  });

  return (
    <div className="space-y-6">
      {/* KPI Overview - All data from backend */}
      {kpisLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : kpis ? (
        <>
          {/* Top Row: 3 Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1: Total Active Clients */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Active Clients</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.total_active_clients}</div>
                <p className="text-xs text-muted-foreground">
                  With active/confirmed campaigns
                </p>
              </CardContent>
            </Card>

            {/* KPI 2: Campaigns in Progress */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campaigns in Progress</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.campaigns_in_progress}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active campaigns
                </p>
              </CardContent>
            </Card>

            {/* KPI 3: Total Revenue Current Month */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{kpis.total_revenue_current_month.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  All values in EUR
                </p>
              </CardContent>
            </Card>
          </div>

          {/* KPI 4 & 5: Average Delivery Time and ROI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KPI 4: Average Delivery Time per Service */}
            <Card>
              <CardHeader>
                <CardTitle>Average Delivery Time per Service</CardTitle>
                <CardDescription>Average campaign duration in days</CardDescription>
              </CardHeader>
              <CardContent>
                {kpis.avg_delivery_time_by_service && kpis.avg_delivery_time_by_service.length > 0 ? (
                  <div className="space-y-4">
                    {kpis.avg_delivery_time_by_service.map((service) => (
                      <div key={service.service_type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{service.service_display}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {service.campaign_count} campaigns
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{service.avg_delivery_days} days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No delivery time data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KPI 5: ROI per Campaign Type */}
            <Card>
              <CardHeader>
                <CardTitle>ROI per Campaign Type</CardTitle>
                <CardDescription>Return on Investment by service</CardDescription>
              </CardHeader>
              <CardContent>
                {kpis.roi_by_campaign_type && kpis.roi_by_campaign_type.length > 0 ? (
                  <div className="space-y-4">
                    {kpis.roi_by_campaign_type.map((roi) => (
                      <div key={roi.service_type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{roi.service_display}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {roi.campaign_count} campaigns
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${roi.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {roi.roi > 0 ? '+' : ''}{roi.roi}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            €{roi.total_profit_eur.toLocaleString()} profit
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No ROI data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* KPI 6: Top 5 Clients by Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Clients by Revenue</CardTitle>
              <CardDescription>Top revenue-generating clients (all calculations on backend)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpis.top_clients && kpis.top_clients.length > 0 ? (
                  kpis.top_clients.map((client, index) => (
                    <div key={client.client_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{client.client_name}</p>
                          <p className="text-xs text-muted-foreground">{client.campaign_count} campaigns</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{client.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No client data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No KPI data available
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
