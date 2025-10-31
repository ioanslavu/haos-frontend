import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Filter, CalendarIcon, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ServicesTab } from '../digital-dashboard/tabs/ServicesTab';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCampaigns } from '@/api/hooks/useCampaigns';

export default function DigitalServicesPage() {
  const [filterService, setFilterService] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('30d');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const { data: campaigns } = useCampaigns();

  // Get unique clients from digital campaigns for the filter
  const uniqueClients = Array.from(
    new Set(
      campaigns?.results
        ?.filter(c => c.department_display?.toLowerCase() === 'digital' || c.service_type)
        .map(c => JSON.stringify({ id: c.client.id, name: c.client.display_name }))
    )
  ).map(str => JSON.parse(str));

  // Clear custom date range
  const clearDateRange = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFilterPeriod('30d');
  };

  // Clear all more filters
  const clearMoreFilters = () => {
    setFilterClient('all');
    setFilterStatus('all');
    clearDateRange();
  };

  // Count active filters
  const activeFiltersCount = [
    startDate || endDate ? 1 : 0,
    filterClient !== 'all' ? 1 : 0,
    filterStatus !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Digital Services
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Overview and management of all digital services
              </p>
            </div>
          </div>
        </div>

        {/* Modern Glassmorphic Filters */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            <Sheet open={showMoreFilters} onOpenChange={setShowMoreFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 rounded-xl relative">
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">More Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center" variant="default">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Additional Filters</SheetTitle>
                  <SheetDescription>
                    Filter campaigns by date range, client, and status
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Date Range Filters */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Date Range</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'PP') : 'Start date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(date) => {
                              setStartDate(date);
                              setFilterPeriod('custom');
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'PP') : 'End date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={(date) => {
                              setEndDate(date);
                              setFilterPeriod('custom');
                            }}
                            initialFocus
                            disabled={(date) => startDate ? date < startDate : false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {(startDate || endDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDateRange}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear dates
                      </Button>
                    )}
                  </div>

                  {/* Client Filter */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Client</h3>
                    <Select value={filterClient} onValueChange={setFilterClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {uniqueClients.map((client: any) => (
                          <SelectItem key={client.id} value={String(client.id)}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Campaign Status</h3>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear All Button */}
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearMoreFilters}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear all filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Tab Content */}
        <ServicesTab
          filterService={filterService}
          filterPeriod={filterPeriod}
          startDate={startDate}
          endDate={endDate}
          filterClient={filterClient}
          filterStatus={filterStatus}
        />
      </div>
    </AppLayout>
  );
}
