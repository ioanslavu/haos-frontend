import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
} from 'lucide-react';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface FinancialTabProps {
  filterPeriod: string;
}

export function FinancialTab({ filterPeriod }: FinancialTabProps) {
  const { data: campaigns } = useCampaigns();

  // Extract campaigns from paginated response
  const campaignsList = campaigns?.results || [];

  // Calculate financial metrics
  const financialMetrics = {
    totalRevenue: campaignsList.reduce((sum, c) => sum + parseFloat(c.value), 0) || 0,
    totalBudgetAllocated: campaignsList.reduce((sum, c) => sum + parseFloat(c.budget_allocated || c.value), 0) || 0,
    totalBudgetSpent: campaignsList.reduce((sum, c) => sum + parseFloat(c.budget_spent || '0'), 0) || 0,
    pendingInvoices: 0, // Would come from invoice API
    overdueAmount: 0,
  };

  financialMetrics.budgetUtilization = financialMetrics.totalBudgetAllocated > 0
    ? (financialMetrics.totalBudgetSpent / financialMetrics.totalBudgetAllocated) * 100
    : 0;

  financialMetrics.profitMargin = financialMetrics.totalRevenue > 0
    ? ((financialMetrics.totalRevenue - financialMetrics.totalBudgetSpent) / financialMetrics.totalRevenue) * 100
    : 0;

  // Mock monthly revenue data (in real app, this would come from API)
  const monthlyData = [
    { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
    { month: 'Feb', revenue: 52000, expenses: 38000, profit: 14000 },
    { month: 'Mar', revenue: 48000, expenses: 35000, profit: 13000 },
    { month: 'Apr', revenue: 61000, expenses: 42000, profit: 19000 },
    { month: 'May', revenue: 58000, expenses: 40000, profit: 18000 },
    { month: 'Jun', revenue: 65000, expenses: 45000, profit: 20000 },
  ];

  // Mock invoice data
  const invoices = [
    { id: 1, client: 'Big Little Festival', amount: 2500, status: 'paid', date: '2024-01-15', dueDate: '2024-02-15' },
    { id: 2, client: 'Olivia Management', amount: 1800, status: 'pending', date: '2024-01-20', dueDate: '2024-02-20' },
    { id: 3, client: 'Warner Music', amount: 5200, status: 'overdue', date: '2024-01-10', dueDate: '2024-02-10' },
    { id: 4, client: 'Universal Music', amount: 3400, status: 'paid', date: '2024-01-25', dueDate: '2024-02-25' },
    { id: 5, client: 'Sony Music', amount: 2900, status: 'pending', date: '2024-01-28', dueDate: '2024-02-28' },
  ];

  // Calculate revenue by service type
  const revenueByService = campaignsList.reduce((acc, campaign) => {
    const service = campaign.service_type_display || 'Other';
    if (!acc[service]) acc[service] = 0;
    acc[service] += parseFloat(campaign.value);
    return acc;
  }, {} as Record<string, number>);

  const serviceRevenueData = Object.entries(revenueByService).map(([service, revenue]) => ({
    service,
    revenue,
  }));

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{financialMetrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline text-green-600" /> +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{financialMetrics.totalBudgetSpent.toLocaleString()}</div>
            <Progress value={financialMetrics.budgetUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {financialMetrics.budgetUtilization.toFixed(1)}% of allocated budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialMetrics.profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              €{(financialMetrics.totalRevenue - financialMetrics.totalBudgetSpent).toLocaleString()} profit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(i => i.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              €{invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0).toLocaleString()} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Expenses Trend</CardTitle>
            <CardDescription>Monthly financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service Type</CardTitle>
            <CardDescription>Revenue distribution across services</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="service" type="category" width={100} />
                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice Status</CardTitle>
              <CardDescription>Recent invoices and payment status</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>#{invoice.id.toString().padStart(4, '0')}</TableCell>
                  <TableCell>{invoice.client}</TableCell>
                  <TableCell>€{invoice.amount.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(invoice.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === 'paid' ? 'default' :
                        invoice.status === 'pending' ? 'secondary' :
                        'destructive'
                      }
                    >
                      <div className="flex items-center gap-1">
                        {invoice.status === 'paid' && <CheckCircle className="h-3 w-3" />}
                        {invoice.status === 'pending' && <Clock className="h-3 w-3" />}
                        {invoice.status === 'overdue' && <AlertCircle className="h-3 w-3" />}
                        {invoice.status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenue per Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['Big Little Festival', 'Olivia Management', 'Warner Music'].map((client, i) => (
                <div key={client} className="flex items-center justify-between">
                  <span className="text-sm">{client}</span>
                  <span className="text-sm font-medium">€{((i + 1) * 2500).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Ad Spend</span>
                <span className="text-sm font-medium">65%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Content Creation</span>
                <span className="text-sm font-medium">20%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Platform Fees</span>
                <span className="text-sm font-medium">10%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Other</span>
                <span className="text-sm font-medium">5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Bank Transfer</span>
                <Badge variant="secondary">70%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Credit Card</span>
                <Badge variant="secondary">20%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">PayPal</span>
                <Badge variant="secondary">10%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}