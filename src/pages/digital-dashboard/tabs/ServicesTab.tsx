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
  PieChart,
  Pie,
  Cell,
  Legend
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
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { SERVICE_TYPE_LABELS } from '@/api/types/campaigns';

interface ServicesTabProps {
  filterService: string;
  filterPeriod: string;
}

export function ServicesTab({ filterService, filterPeriod }: ServicesTabProps) {
  const { data: campaigns } = useCampaigns();

  // Extract campaigns from paginated response
  const campaignsList = campaigns?.results || [];

  // Group campaigns by service type
  const serviceStats = campaignsList.reduce((acc, campaign) => {
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
  }, {} as Record<string, any>) || {};

  // Calculate averages
  Object.keys(serviceStats).forEach(service => {
    serviceStats[service].avgKpi = serviceStats[service].count > 0
      ? serviceStats[service].avgKpi / serviceStats[service].count
      : 0;
    serviceStats[service].utilization = serviceStats[service].totalBudget > 0
      ? (serviceStats[service].totalSpent / serviceStats[service].totalBudget) * 100
      : 0;
  });

  // Prepare data for charts
  const chartData = Object.entries(serviceStats).map(([service, stats]: [string, any]) => ({
    name: SERVICE_TYPE_LABELS[service as keyof typeof SERVICE_TYPE_LABELS] || service,
    campaigns: stats.count,
    revenue: stats.revenue,
    kpi: Math.round(stats.avgKpi),
  }));

  const pieData = Object.entries(serviceStats)
    .filter(([_, stats]: [string, any]) => stats.count > 0)
    .map(([service, stats]: [string, any]) => ({
      name: SERVICE_TYPE_LABELS[service as keyof typeof SERVICE_TYPE_LABELS] || service,
      value: stats.revenue,
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Mock service-specific data (in real app, this would come from API)
  const serviceDetails = {
    ppc: {
      platforms: { 'Meta': 45, 'Google': 35, 'TikTok': 20 },
      performance: { ctr: 2.5, cpa: 15, roi: 285 },
      status: 'optimal'
    },
    tiktok_ugc: {
      platforms: { 'TikTok': 100 },
      performance: { views: 1500000, engagement: 8.5, shares: 12000 },
      status: 'growing'
    },
    dsp_distribution: {
      platforms: { 'Spotify': 60, 'Apple Music': 25, 'Other': 15 },
      performance: { streams: 250000, playlists: 45, revenue: 1250 },
      status: 'stable'
    },
    playlist_pitching: {
      platforms: { 'Spotify': 80, 'Apple Music': 20 },
      performance: { pitches_sent: 150, accepted: 35, reach: 500000 },
      status: 'optimal'
    }
  };

  return (
    <div className="space-y-6">
      {/* Service Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(serviceStats).length}</div>
            <p className="text-xs text-muted-foreground">Active service types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(serviceStats).reduce((sum: number, s: any) => sum + s.active, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(serviceStats).reduce((sum: number, s: any, _, arr) =>
                sum + s.avgKpi / arr.length, 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">KPI achievement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{Object.values(serviceStats).reduce((sum: number, s: any) => sum + s.revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+22%</span> vs last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaigns by Service</CardTitle>
            <CardDescription>Distribution of campaigns across service types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="campaigns" fill="#8884d8" />
                <Bar dataKey="kpi" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>Revenue breakdown by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: €${entry.value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Service Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Performance Details</CardTitle>
          <CardDescription>Detailed metrics for each service type</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Service-specific sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Campaign distribution across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Meta (Facebook/Instagram)</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <Progress value={45} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Google Ads</span>
                  <span className="text-sm font-medium">30%</span>
                </div>
                <Progress value={30} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">TikTok</span>
                  <span className="text-sm font-medium">20%</span>
                </div>
                <Progress value={20} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Other</span>
                  <span className="text-sm font-medium">5%</span>
                </div>
                <Progress value={5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Health Check</CardTitle>
            <CardDescription>Quick status overview of all services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">PPC Campaigns</span>
                </div>
                <Badge variant="outline" className="text-xs">Optimal</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">TikTok UGC</span>
                </div>
                <Badge variant="outline" className="text-xs">Growing</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">DSP Distribution</span>
                </div>
                <Badge variant="outline" className="text-xs">Stable</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Playlist Pitching</span>
                </div>
                <Badge variant="outline" className="text-xs">Optimal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}