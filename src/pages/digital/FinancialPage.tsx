import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FinancialTab } from '../digital-dashboard/tabs/FinancialTab';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DigitalFinancialPage() {
  const [filterPeriod, setFilterPeriod] = useState<string>('30d');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterServiceType, setFilterServiceType] = useState<string>('all');
  const [filterCampaignStatus, setFilterCampaignStatus] = useState<string>('all');
  const [filterInvoiceStatus, setFilterInvoiceStatus] = useState<string>('all');

  // Clear custom date range
  const clearDateRange = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFilterPeriod('30d'); // Reset to default period
  };

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
                Digital Financial
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Financial overview and revenue tracking
              </p>
            </div>
          </div>
        </div>

        {/* Modern Glassmorphic Filters */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          {/* Quick Period Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Quick filters:</span>
            <Button
              variant={filterPeriod === '7d' && !startDate && !endDate ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-lg"
              onClick={() => {
                setFilterPeriod('7d');
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Last 7 days
            </Button>
            <Button
              variant={filterPeriod === '30d' && !startDate && !endDate ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-lg"
              onClick={() => {
                setFilterPeriod('30d');
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Last 30 days
            </Button>
            <Button
              variant={filterPeriod === '90d' && !startDate && !endDate ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-lg"
              onClick={() => {
                setFilterPeriod('90d');
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Last 90 days
            </Button>
            <Button
              variant={filterPeriod === 'year' && !startDate && !endDate ? 'default' : 'outline'}
              size="sm"
              className="h-8 rounded-lg"
              onClick={() => {
                setFilterPeriod('year');
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              This year
            </Button>
          </div>

          {/* Date Range Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 rounded-xl bg-background/50 border-white/10 justify-start text-left font-normal",
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
                    "h-12 rounded-xl bg-background/50 border-white/10 justify-start text-left font-normal",
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

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-12 rounded-xl"
                onClick={clearDateRange}
              >
                <X className="h-4 w-4 mr-2" />
                Clear dates
              </Button>
            )}
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={filterServiceType} onValueChange={setFilterServiceType}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Service Type" />
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

            <Select value={filterCampaignStatus} onValueChange={setFilterCampaignStatus}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Campaign Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterInvoiceStatus} onValueChange={setFilterInvoiceStatus}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Invoice Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10">
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="issued">Issued (Emisă)</SelectItem>
                <SelectItem value="collected">Collected (Încasată)</SelectItem>
                <SelectItem value="delayed">Delayed (Întârziată)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab Content */}
        <FinancialTab
          filterPeriod={filterPeriod}
          startDate={startDate}
          endDate={endDate}
          filterServiceType={filterServiceType}
          filterCampaignStatus={filterCampaignStatus}
          filterInvoiceStatus={filterInvoiceStatus}
        />
      </div>
    </AppLayout>
  );
}
