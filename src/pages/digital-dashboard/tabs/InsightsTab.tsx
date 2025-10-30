import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Sparkles,
  Activity,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { useTasks } from '@/api/hooks/useTasks';
import { cn } from '@/lib/utils';

interface InsightsTabProps {
  filterPeriod: string;
}

export function InsightsTab({ filterPeriod }: InsightsTabProps) {
  const { data: campaigns } = useCampaigns();
  const { data: tasks } = useTasks();

  // Mock AI-generated insights
  const aiInsights = [
    {
      id: 1,
      type: 'opportunity',
      priority: 'high',
      title: 'TikTok UGC campaigns showing 45% higher engagement',
      description: 'Your TikTok UGC campaigns are outperforming other channels by 45% in engagement rate. Consider allocating more budget to this channel.',
      metric: '+45%',
      action: 'Increase TikTok budget',
      category: 'performance'
    },
    {
      id: 2,
      type: 'warning',
      priority: 'medium',
      title: 'Google Ads CPA increasing over past 2 weeks',
      description: 'Cost per acquisition on Google Ads has increased by 23% in the last 14 days. Review targeting settings and ad creative.',
      metric: '+23%',
      action: 'Review Google Ads',
      category: 'cost'
    },
    {
      id: 3,
      type: 'success',
      priority: 'low',
      title: 'Playlist pitching success rate improved',
      description: 'Your playlist acceptance rate has improved to 35%, up from 22% last month. Current strategy is working well.',
      metric: '+13pp',
      action: 'Continue strategy',
      category: 'performance'
    },
    {
      id: 4,
      type: 'recommendation',
      priority: 'high',
      title: 'Optimal posting time identified',
      description: 'Analysis shows 3-5 PM CET generates 2.3x more engagement for your campaigns. Schedule content accordingly.',
      metric: '2.3x',
      action: 'Adjust schedule',
      category: 'optimization'
    },
  ];

  // Mock predictive analytics data
  const forecastData = [
    { month: 'Jan', actual: 45000, forecast: 44000 },
    { month: 'Feb', actual: 52000, forecast: 51000 },
    { month: 'Mar', actual: 48000, forecast: 49500 },
    { month: 'Apr', actual: 61000, forecast: 59000 },
    { month: 'May', actual: 58000, forecast: 60000 },
    { month: 'Jun', actual: null, forecast: 65000 },
    { month: 'Jul', actual: null, forecast: 68000 },
    { month: 'Aug', actual: null, forecast: 72000 },
  ];

  // Mock cohort analysis data
  const cohortData = [
    { cohort: 'Jan', month1: 100, month2: 85, month3: 72, month4: 65, month5: 58, month6: 52 },
    { cohort: 'Feb', month1: 100, month2: 88, month3: 75, month4: 68, month5: 62 },
    { cohort: 'Mar', month1: 100, month2: 90, month3: 78, month4: 71 },
    { cohort: 'Apr', month1: 100, month2: 92, month3: 82 },
    { cohort: 'May', month1: 100, month2: 93 },
  ];

  // Mock correlation data
  const correlationData = [
    { x: 1000, y: 50, z: 10, name: 'Campaign A' },
    { x: 2500, y: 120, z: 15, name: 'Campaign B' },
    { x: 1800, y: 85, z: 12, name: 'Campaign C' },
    { x: 3200, y: 180, z: 20, name: 'Campaign D' },
    { x: 2100, y: 110, z: 18, name: 'Campaign E' },
    { x: 4000, y: 250, z: 25, name: 'Campaign F' },
    { x: 1500, y: 65, z: 8, name: 'Campaign G' },
  ];

  // Mock anomaly detection
  const anomalies = [
    { date: '2024-02-08', metric: 'CTR', expected: 5.2, actual: 8.7, severity: 'positive' },
    { date: '2024-02-06', metric: 'CPA', expected: 15, actual: 22, severity: 'negative' },
    { date: '2024-02-04', metric: 'Impressions', expected: 50000, actual: 32000, severity: 'negative' },
  ];

  // Mock performance scores
  const performanceScores = {
    overall: 82,
    efficiency: 78,
    growth: 88,
    engagement: 75,
    roi: 91,
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'recommendation': return <Sparkles className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{performanceScores.overall}</div>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
            <Progress value={performanceScores.overall} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScores.efficiency}%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+5% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScores.growth}%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+12% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScores.engagement}%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600">-3% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScores.roi}%</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">+18% vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </div>
            <Button variant="outline" size="sm">
              View All Insights
            </Button>
          </div>
          <CardDescription>Automated recommendations based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <Alert key={insight.id} className={cn(
                "border-l-4",
                insight.type === 'opportunity' && "border-l-blue-600",
                insight.type === 'warning' && "border-l-orange-600",
                insight.type === 'success' && "border-l-green-600",
                insight.type === 'recommendation' && "border-l-purple-600"
              )}>
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <AlertTitle className="text-sm font-medium">
                      {insight.title}
                    </AlertTitle>
                    <AlertDescription className="mt-1 text-xs">
                      {insight.description}
                    </AlertDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {insight.metric}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        {insight.action}
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant={
                    insight.priority === 'high' ? 'destructive' :
                    insight.priority === 'medium' ? 'default' :
                    'secondary'
                  } className="text-xs">
                    {insight.priority}
                  </Badge>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>Predicted revenue for next 3 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="Actual"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                  strokeDasharray="5 5"
                  name="Forecast"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget vs Conversions Correlation</CardTitle>
            <CardDescription>Relationship between spend and results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name="Budget" unit="€" />
                <YAxis dataKey="y" name="Conversions" />
                <ZAxis dataKey="z" range={[60, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Campaigns" data={correlationData} fill="#8884d8">
                  {correlationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Client Retention Cohort Analysis</CardTitle>
          <CardDescription>Client retention rate by acquisition month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cohort</th>
                  <th className="text-center p-2">Month 1</th>
                  <th className="text-center p-2">Month 2</th>
                  <th className="text-center p-2">Month 3</th>
                  <th className="text-center p-2">Month 4</th>
                  <th className="text-center p-2">Month 5</th>
                  <th className="text-center p-2">Month 6</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((cohort) => (
                  <tr key={cohort.cohort} className="border-b">
                    <td className="p-2 font-medium">{cohort.cohort} 2024</td>
                    <td className="text-center p-2">
                      <div className={cn(
                        "inline-block px-2 py-1 rounded text-xs",
                        "bg-green-100 text-green-800"
                      )}>
                        {cohort.month1}%
                      </div>
                    </td>
                    {cohort.month2 && (
                      <td className="text-center p-2">
                        <div className={cn(
                          "inline-block px-2 py-1 rounded text-xs",
                          cohort.month2 >= 80 ? "bg-green-100 text-green-800" :
                          cohort.month2 >= 60 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {cohort.month2}%
                        </div>
                      </td>
                    )}
                    {cohort.month3 && (
                      <td className="text-center p-2">
                        <div className={cn(
                          "inline-block px-2 py-1 rounded text-xs",
                          cohort.month3 >= 70 ? "bg-green-100 text-green-800" :
                          cohort.month3 >= 50 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {cohort.month3}%
                        </div>
                      </td>
                    )}
                    {cohort.month4 && (
                      <td className="text-center p-2">
                        <div className={cn(
                          "inline-block px-2 py-1 rounded text-xs",
                          cohort.month4 >= 60 ? "bg-green-100 text-green-800" :
                          cohort.month4 >= 40 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {cohort.month4}%
                        </div>
                      </td>
                    )}
                    {cohort.month5 && (
                      <td className="text-center p-2">
                        <div className={cn(
                          "inline-block px-2 py-1 rounded text-xs",
                          cohort.month5 >= 50 ? "bg-green-100 text-green-800" :
                          cohort.month5 >= 30 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {cohort.month5}%
                        </div>
                      </td>
                    )}
                    {cohort.month6 && (
                      <td className="text-center p-2">
                        <div className={cn(
                          "inline-block px-2 py-1 rounded text-xs",
                          cohort.month6 >= 40 ? "bg-green-100 text-green-800" :
                          cohort.month6 >= 20 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {cohort.month6}%
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Detection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>Unusual patterns detected in your data</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Real-time
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {anomalies.map((anomaly, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {anomaly.severity === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{anomaly.metric} Anomaly</p>
                    <p className="text-xs text-muted-foreground">
                      {anomaly.date} • Expected: {anomaly.expected}, Actual: {anomaly.actual}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Investigate
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}