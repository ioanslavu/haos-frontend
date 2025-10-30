import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { useTaskStats } from '@/api/hooks/useTasks';
import { useActivities } from '@/api/hooks/useActivities';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface OverviewTabProps {
  searchQuery: string;
  filterStatus: string;
  filterService: string;
  filterPeriod: string;
}

export function OverviewTab({ filterPeriod }: OverviewTabProps) {
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns({
    status: ['active', 'confirmed'],
  });
  const { data: taskStats } = useTaskStats();
  const { data: recentActivities } = useActivities({
    my_activities: true,
    limit: 5
  });

  // Calculate stats
  const campaignsList = campaigns?.results || [];
  const activitiesList = recentActivities?.results || [];
  const stats = {
    activeCampaigns: campaignsList.length || 0,
    totalBudget: campaignsList.reduce((sum, c) => sum + parseFloat(c.budget_allocated || '0'), 0) || 0,
    totalSpent: campaignsList.reduce((sum, c) => sum + parseFloat(c.budget_spent || '0'), 0) || 0,
    avgKpiCompletion: campaignsList.reduce((sum, c) => sum + (c.kpi_completion || 0), 0) / (campaignsList.length || 1) || 0,
  };

  const budgetUtilization = stats.totalBudget > 0 ? (stats.totalSpent / stats.totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 dark:text-green-400">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</div>
            <Progress value={budgetUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              €{stats.totalSpent.toLocaleString()} of €{stats.totalBudget.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg KPI Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgKpiCompletion.toFixed(1)}%</div>
            <Progress value={stats.avgKpiCompletion} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Across all active campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats?.total || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="destructive" className="text-xs">
                {taskStats?.overdue || 0} overdue
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {taskStats?.due_today || 0} due today
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Campaign Board */}
      <Card>
        <CardHeader>
          <CardTitle>Active Campaigns Board</CardTitle>
          <CardDescription>Overview of all running campaigns and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaignsList.slice(0, 5).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {campaign.client.display_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{campaign.campaign_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {campaign.service_type_display || 'Service'}
                      </Badge>
                      {campaign.platform && (
                        <Badge variant="secondary" className="text-xs">
                          {campaign.platform_display}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{campaign.client.display_name}</span>
                      {campaign.artist && (
                        <>
                          <span>•</span>
                          <span>{campaign.artist.display_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-xs text-muted-foreground">
                      €{parseFloat(campaign.budget_spent || '0').toLocaleString()} /
                      €{parseFloat(campaign.budget_allocated || campaign.value).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">KPI Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={campaign.kpi_completion || 0} className="w-20" />
                      <span className="text-xs">{campaign.kpi_completion || 0}%</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">Status</p>
                    <Badge
                      variant={campaign.status === 'active' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {campaign.status}
                    </Badge>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium">Next Step</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Review KPIs
                    </p>
                  </div>

                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest interactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activitiesList.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-1 rounded-full p-1",
                    activity.type === 'email' && "bg-blue-100 text-blue-600",
                    activity.type === 'call' && "bg-green-100 text-green-600",
                    activity.type === 'meeting' && "bg-purple-100 text-purple-600",
                    activity.type === 'note' && "bg-gray-100 text-gray-600"
                  )}>
                    {activity.type === 'email' && <AlertCircle className="h-3 w-3" />}
                    {activity.type === 'call' && <CheckCircle className="h-3 w-3" />}
                    {activity.type === 'meeting' && <Users className="h-3 w-3" />}
                    {activity.type === 'note' && <AlertCircle className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.entity_detail?.display_name} • {formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Service Performance</CardTitle>
            <CardDescription>Performance by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm">PPC Campaigns</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">85%</span>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm">TikTok UGC</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">92%</span>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">DSP Distribution</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">78%</span>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm">Playlist Pitching</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">70%</span>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}