import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { useTaskStats } from '@/api/hooks/useTasks';

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

  // Calculate stats
  const campaignsList = campaigns?.results || [];
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
                      {campaign.service_types && campaign.service_types.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {campaign.service_types_display?.[0] || campaign.service_types[0]}
                        </Badge>
                      )}
                      {campaign.platforms && campaign.platforms.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {campaign.platforms_display?.[0] || campaign.platforms[0]}
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
    </div>
  );
}