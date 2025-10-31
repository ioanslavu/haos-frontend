import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OverviewTab } from '../digital-dashboard/tabs/OverviewTab';
import { DigitalCampaignFormDialog } from '@/pages/crm/components/DigitalCampaignFormDialog';

export default function DigitalOverviewPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30d');
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Digital Overview
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Manage campaigns, track KPIs, and monitor digital services
              </p>
            </div>
            <Button
              onClick={() => setShowCampaignDialog(true)}
              size="lg"
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Modern Glassmorphic Filters */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search clients, artists, campaigns..."
              className="pl-12 h-12 rounded-xl bg-background/50 border-white/10 focus:border-blue-500/50 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10">
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
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-12 rounded-xl">
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">More</span>
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <OverviewTab
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          filterService={filterService}
          filterPeriod={filterPeriod}
        />
      </div>

      {/* Campaign Form Dialog */}
      <DigitalCampaignFormDialog
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        campaign={null}
      />
    </AppLayout>
  );
}
