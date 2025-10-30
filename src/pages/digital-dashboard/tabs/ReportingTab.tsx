import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Share2,
  Mail,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Plus,
} from 'lucide-react';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { useTasks } from '@/api/hooks/useTasks';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';

interface ReportingTabProps {
  filterPeriod: string;
  filterService: string;
}

export function ReportingTab({ filterPeriod, filterService }: ReportingTabProps) {
  const [reportType, setReportType] = useState<'performance' | 'engagement' | 'roi'>('performance');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [selectedMetric, setSelectedMetric] = useState<'impressions' | 'clicks' | 'conversions'>('impressions');

  const { data: campaigns } = useCampaigns({
    service_type: filterService !== 'all' ? filterService : undefined,
  });
  const { data: tasks } = useTasks();

  // Extract from paginated responses
  const campaignsList = campaigns?.results || [];

  // Mock performance data - in real app would come from API
  const performanceData = [
    { date: 'Jan 1', impressions: 45000, clicks: 2300, conversions: 120, ctr: 5.1, cpc: 0.45 },
    { date: 'Jan 7', impressions: 52000, clicks: 2800, conversions: 145, ctr: 5.4, cpc: 0.42 },
    { date: 'Jan 14', impressions: 48000, clicks: 2600, conversions: 135, ctr: 5.4, cpc: 0.44 },
    { date: 'Jan 21', impressions: 61000, clicks: 3400, conversions: 180, ctr: 5.6, cpc: 0.38 },
    { date: 'Jan 28', impressions: 58000, clicks: 3200, conversions: 172, ctr: 5.5, cpc: 0.40 },
    { date: 'Feb 4', impressions: 65000, clicks: 3700, conversions: 195, ctr: 5.7, cpc: 0.36 },
    { date: 'Feb 11', impressions: 72000, clicks: 4200, conversions: 220, ctr: 5.8, cpc: 0.34 },
  ];

  // Mock channel performance data
  const channelData = [
    { channel: 'Meta', impressions: 250000, clicks: 14000, conversions: 750, roi: 320 },
    { channel: 'Google', impressions: 180000, clicks: 9500, conversions: 520, roi: 280 },
    { channel: 'TikTok', impressions: 320000, clicks: 22000, conversions: 980, roi: 410 },
    { channel: 'Spotify', impressions: 150000, clicks: 8000, conversions: 420, roi: 250 },
  ];

  // Mock KPI performance data for radar chart
  const kpiData = [
    { metric: 'Reach', target: 100, actual: 85 },
    { metric: 'Engagement', target: 100, actual: 92 },
    { metric: 'Conversions', target: 100, actual: 78 },
    { metric: 'ROI', target: 100, actual: 110 },
    { metric: 'Retention', target: 100, actual: 88 },
    { metric: 'Growth', target: 100, actual: 95 },
  ];

  // Calculate summary metrics
  const totalImpressions = performanceData.reduce((sum, d) => sum + d.impressions, 0);
  const totalClicks = performanceData.reduce((sum, d) => sum + d.clicks, 0);
  const totalConversions = performanceData.reduce((sum, d) => sum + d.conversions, 0);
  const avgCTR = (totalClicks / totalImpressions * 100).toFixed(2);
  const avgCPC = (totalClicks > 0 ? performanceData.reduce((sum, d) => sum + d.cpc, 0) / performanceData.length : 0).toFixed(2);

  // Mock scheduled reports
  const scheduledReports = [
    { id: 1, name: 'Weekly Performance Summary', frequency: 'Weekly', recipients: 3, lastSent: '2024-02-05', status: 'active' },
    { id: 2, name: 'Monthly ROI Analysis', frequency: 'Monthly', recipients: 5, lastSent: '2024-01-31', status: 'active' },
    { id: 3, name: 'Campaign Insights', frequency: 'Daily', recipients: 2, lastSent: '2024-02-10', status: 'paused' },
    { id: 4, name: 'Client Performance Report', frequency: 'Bi-weekly', recipients: 4, lastSent: '2024-02-01', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={reportType} onValueChange={(v) => setReportType(v as typeof reportType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance Report</SelectItem>
              <SelectItem value="engagement">Engagement Report</SelectItem>
              <SelectItem value="roi">ROI Report</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as typeof selectedMetric)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="impressions">Impressions</SelectItem>
              <SelectItem value="clicks">Clicks</SelectItem>
              <SelectItem value="conversions">Conversions</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as typeof exportFormat)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline text-green-600" /> +18% vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">CTR: {avgCTR}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">
              {(totalConversions / totalClicks * 100).toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CPC</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{avgCPC}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline text-green-600" /> -12% vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignsList.filter(c => c.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {Object.keys(channelData).length} channels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Key metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="impressions"
                  stroke="#8884d8"
                  name="Impressions"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="clicks"
                  stroke="#82ca9d"
                  name="Clicks"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ctr"
                  stroke="#ffc658"
                  name="CTR %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KPI Performance</CardTitle>
            <CardDescription>Target vs Actual comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={kpiData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 120]} />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Actual"
                  dataKey="actual"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>Performance breakdown by marketing channel</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">ROI</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelData.map((channel) => {
                const ctr = ((channel.clicks / channel.impressions) * 100).toFixed(2);
                const convRate = ((channel.conversions / channel.clicks) * 100).toFixed(2);
                return (
                  <TableRow key={channel.channel}>
                    <TableCell className="font-medium">{channel.channel}</TableCell>
                    <TableCell className="text-right">{channel.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{channel.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{ctr}%</TableCell>
                    <TableCell className="text-right">{channel.conversions}</TableCell>
                    <TableCell className="text-right">{convRate}%</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={channel.roi >= 300 ? 'default' : 'secondary'}>
                        {channel.roi}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {channel.roi >= 300 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-xs">
                          {channel.roi >= 300 ? '+' : '-'}{Math.abs(channel.roi - 300) / 10}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automated report delivery settings</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Last Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {report.name}
                    </div>
                  </TableCell>
                  <TableCell>{report.frequency}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span>{report.recipients}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(report.lastSent), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}