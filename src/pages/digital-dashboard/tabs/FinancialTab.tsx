import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Download,
  Info,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/types/campaign';
import { useNavigate } from 'react-router-dom';
import {
  useFinancialMetrics,
  useMonthlyRevenue,
  useRevenueByService,
  useCampaignFinancials,
} from '@/api/hooks/useDigitalFinancial';
import type { FinancialFilters } from '@/api/types/digital-financial';

interface FinancialTabProps {
  filterPeriod: string;
  startDate?: Date;
  endDate?: Date;
  filterServiceType: string;
  filterCampaignStatus: string;
  filterInvoiceStatus: string;
}

export function FinancialTab({
  filterPeriod,
  startDate,
  endDate,
  filterServiceType,
  filterCampaignStatus,
  filterInvoiceStatus,
}: FinancialTabProps) {
  const navigate = useNavigate();

  // Build filters for backend API
  const filters: FinancialFilters = useMemo(() => {
    const f: FinancialFilters = {
      service_type: filterServiceType !== 'all' ? filterServiceType : undefined,
      campaign_status: filterCampaignStatus !== 'all' ? filterCampaignStatus : undefined,
      invoice_status: filterInvoiceStatus !== 'all' ? filterInvoiceStatus : undefined,
    };

    // If custom date range is selected
    if (startDate && endDate) {
      f.start_date = format(startDate, 'yyyy-MM-dd');
      f.end_date = format(endDate, 'yyyy-MM-dd');
      f.period = 'custom';
    } else {
      // Use period filter
      f.period = filterPeriod as any;
    }

    return f;
  }, [filterPeriod, startDate, endDate, filterServiceType, filterCampaignStatus, filterInvoiceStatus]);

  // Fetch data from backend - all calculations done server-side
  const { data: metrics, isLoading: metricsLoading } = useFinancialMetrics(filters);
  const { data: monthlyRevenue, isLoading: monthlyLoading } = useMonthlyRevenue(filters);
  const { data: revenueByService, isLoading: serviceLoading } = useRevenueByService(filters);
  const { data: campaignFinancials, isLoading: campaignsLoading } = useCampaignFinancials(filters);

  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const isLoading = metricsLoading || monthlyLoading || serviceLoading || campaignsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards - Data from backend */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{(metrics?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All campaigns (converted to EUR)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{(metrics?.total_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.profit_margin?.toFixed(1) || 0}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{(metrics?.total_budget_spent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total campaign expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Collections</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{(metrics?.pending_collections || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Issued/delayed invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis Charts - Data from backend aggregations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Month</CardTitle>
            <CardDescription>Monthly revenue and profit trends (aggregated on backend)</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRevenue && monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${Number(value).toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Profit" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service Type</CardTitle>
            <CardDescription>Distribution across digital services (grouped on backend)</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByService && revenueByService.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByService}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service_display" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${Number(value).toLocaleString()}`} />
                  <Bar dataKey="revenue">
                    {revenueByService.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No service data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Financial Table - Currency conversion done on backend */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Campaign Financials</CardTitle>
              <CardDescription>Financial details and invoice status (all values converted to EUR on backend)</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        Value
                        <Info className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Converted to EUR on backend</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>Budget Spent</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Internal Cost</TableHead>
                <TableHead>Invoice Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignFinancials && campaignFinancials.results && campaignFinancials.results.length > 0 ? (
                campaignFinancials.results.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                    <TableCell>{campaign.client_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.service_types && campaign.service_types.length > 0 ? (
                          campaign.service_types.map((st: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {campaign.service_types_display[idx] || st}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.value_eur !== null ? (
                        campaign.original_currency !== 'EUR' ? (
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger>
                                €{campaign.value_eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Original: {campaign.original_currency} {campaign.original_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        ) : (
                          <span>€{campaign.value_eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.budget_spent_eur !== null ? (
                        campaign.original_currency !== 'EUR' ? (
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger>
                                €{campaign.budget_spent_eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Original: {campaign.original_currency} {campaign.original_budget_spent?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        ) : (
                          <span>€{campaign.budget_spent_eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.profit_eur !== null ? (
                        campaign.original_currency !== 'EUR' ? (
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger>
                                €{campaign.profit_eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Original: {campaign.original_currency} {campaign.original_profit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        ) : (
                          <span>€{campaign.profit_eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.internal_cost_estimate_eur !== null ? (
                        campaign.original_currency !== 'EUR' ? (
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger>
                                €{campaign.internal_cost_estimate_eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Original: {campaign.original_currency} {campaign.original_internal_cost?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        ) : (
                          <span>€{campaign.internal_cost_estimate_eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.invoice_status ? (
                        <Badge className={INVOICE_STATUS_COLORS[campaign.invoice_status]}>
                          {INVOICE_STATUS_LABELS[campaign.invoice_status]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/digital/campaigns/${campaign.id}/edit`)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No campaigns found for the selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
