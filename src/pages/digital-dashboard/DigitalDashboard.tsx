import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings2,
  DollarSign,
  CheckSquare,
  TrendingUp,
  BarChart3,
  Plus,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore } from '@/stores/authStore';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { useEntities } from '@/api/hooks/useEntities';
import { useTasks, useTaskStats } from '@/api/hooks/useTasks';
import { useActivities } from '@/api/hooks/useActivities';

// Import tab components
import { OverviewTab } from './tabs/OverviewTab';
import { ClientsTab } from './tabs/ClientsTab';
import { CampaignsTab } from './tabs/CampaignsTab';
import { ServicesTab } from './tabs/ServicesTab';
import { FinancialTab } from './tabs/FinancialTab';
import { TasksTab } from './tabs/TasksTab';
import { ReportingTab } from './tabs/ReportingTab';
import { InsightsTab } from './tabs/InsightsTab';

export default function DigitalDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30d');

  // Check if user is in digital department
  const isDigitalDepartment = user?.department?.code === 'digital';

  const tabConfig = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'clients', label: 'Clienți', icon: Users },
    { id: 'campaigns', label: 'Campanii', icon: Megaphone },
    { id: 'services', label: 'Servicii', icon: Settings2 },
    { id: 'financial', label: 'Financiar', icon: DollarSign },
    { id: 'tasks', label: 'Task-uri', icon: CheckSquare },
    { id: 'reporting', label: 'Raportare', icon: BarChart3 },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
  ];

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header Section */}
        <div className="border-b p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Digital Department Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage campaigns, track KPIs, and monitor digital services
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                {filterPeriod === '7d' && 'Last 7 days'}
                {filterPeriod === '30d' && 'Last 30 days'}
                {filterPeriod === '90d' && 'Last 90 days'}
                {filterPeriod === 'year' && 'This year'}
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients, artists, campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="ppc">PPC Campaign</SelectItem>
                  <SelectItem value="tiktok_ugc">TikTok UGC</SelectItem>
                  <SelectItem value="dsp_distribution">DSP Distribution</SelectItem>
                  <SelectItem value="radio_plugging">Radio Plugging</SelectItem>
                  <SelectItem value="playlist_pitching">Playlist Pitching</SelectItem>
                  <SelectItem value="youtube_cms">YouTube CMS</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Main Content - Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-8 w-full max-w-5xl mx-auto mt-4">
              {tabConfig.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-auto p-4">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab
                  searchQuery={searchQuery}
                  filterStatus={filterStatus}
                  filterService={filterService}
                  filterPeriod={filterPeriod}
                />
              </TabsContent>

              <TabsContent value="clients" className="mt-0">
                <ClientsTab
                  searchQuery={searchQuery}
                  filterPeriod={filterPeriod}
                />
              </TabsContent>

              <TabsContent value="campaigns" className="mt-0">
                <CampaignsTab
                  searchQuery={searchQuery}
                  filterStatus={filterStatus}
                  filterService={filterService}
                  filterPeriod={filterPeriod}
                />
              </TabsContent>

              <TabsContent value="services" className="mt-0">
                <ServicesTab
                  filterService={filterService}
                  filterPeriod={filterPeriod}
                />
              </TabsContent>

              <TabsContent value="financial" className="mt-0">
                <FinancialTab
                  filterPeriod={filterPeriod}
                />
              </TabsContent>

              <TabsContent value="tasks" className="mt-0">
                <TasksTab
                  searchQuery={searchQuery}
                  filterStatus={filterStatus}
                />
              </TabsContent>

              <TabsContent value="reporting" className="mt-0">
                <ReportingTab
                  filterPeriod={filterPeriod}
                  filterService={filterService}
                />
              </TabsContent>

              <TabsContent value="insights" className="mt-0">
                <InsightsTab
                  filterPeriod={filterPeriod}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}