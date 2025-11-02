import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import {
  useActivities,
  useMyActivities,
  useActivitiesNeedingFollowUp
} from '@/api/hooks/useActivities';
import {
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_SENTIMENT_LABELS,
  ActivityType,
  ActivitySentiment
} from '@/api/types/activities';
import { Search, Filter, Calendar, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function ActivitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('type') || 'all');
  const [sentimentFilter, setSentimentFilter] = useState<string>(searchParams.get('sentiment') || 'all');
  const [dateFilter, setDateFilter] = useState<string>(searchParams.get('date') || 'all');
  const activeTab = searchParams.get('tab') || 'all';

  // Build query params for API
  const getQueryParams = () => {
    const params: any = {};
    if (searchQuery) params.search = searchQuery;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (sentimentFilter !== 'all') params.sentiment = sentimentFilter;

    // Date filtering
    if (dateFilter === 'today') {
      params.activity_date__gte = format(new Date(), 'yyyy-MM-dd');
    } else if (dateFilter === 'week') {
      params.activity_date__gte = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    } else if (dateFilter === 'month') {
      params.activity_date__gte = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    }

    return params;
  };

  // Query hooks
  const { data: allActivities, isLoading: allLoading } = useActivities(getQueryParams());
  const { data: myActivities, isLoading: myLoading } = useMyActivities(getQueryParams());
  const { data: followUpActivities, isLoading: followUpLoading } = useActivitiesNeedingFollowUp();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params: any = { tab: activeTab };
    if (value) params.search = value;
    if (typeFilter !== 'all') params.type = typeFilter;
    if (sentimentFilter !== 'all') params.sentiment = sentimentFilter;
    if (dateFilter !== 'all') params.date = dateFilter;
    setSearchParams(params);
  };

  const handleFilterChange = (filterType: 'type' | 'sentiment' | 'date', value: string) => {
    const params: any = { tab: activeTab };
    if (searchQuery) params.search = searchQuery;

    if (filterType === 'type') {
      setTypeFilter(value);
      if (value !== 'all') params.type = value;
      if (sentimentFilter !== 'all') params.sentiment = sentimentFilter;
      if (dateFilter !== 'all') params.date = dateFilter;
    } else if (filterType === 'sentiment') {
      setSentimentFilter(value);
      if (typeFilter !== 'all') params.type = typeFilter;
      if (value !== 'all') params.sentiment = value;
      if (dateFilter !== 'all') params.date = dateFilter;
    } else if (filterType === 'date') {
      setDateFilter(value);
      if (typeFilter !== 'all') params.type = typeFilter;
      if (sentimentFilter !== 'all') params.sentiment = sentimentFilter;
      if (value !== 'all') params.date = value;
    }

    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSentimentFilter('all');
    setDateFilter('all');
    setSearchParams({ tab: activeTab });
  };

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || sentimentFilter !== 'all' || dateFilter !== 'all';

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 lg:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-cyan-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 dark:from-purple-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Activity Log
                </h1>
                <p className="text-muted-foreground mt-2">
                  Track all interactions, communications, and activities across your organization
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Activities</p>
                      <p className="text-2xl font-bold">{allActivities?.count || 0}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">My Activities</p>
                      <p className="text-2xl font-bold">{myActivities?.count || 0}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Need Follow-up</p>
                      <p className="text-2xl font-bold">{followUpActivities?.count || 0}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold">
                        {allActivities?.results?.filter(a => {
                          const activityDate = new Date(a.activity_date);
                          return activityDate >= subDays(new Date(), 7);
                        }).length || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filters</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sentiment Filter */}
              <Select value={sentimentFilter} onValueChange={(value) => handleFilterChange('sentiment', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiments</SelectItem>
                  {Object.entries(ACTIVITY_SENTIMENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={(value) => handleFilterChange('date', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary">
                    Search: {searchQuery}
                  </Badge>
                )}
                {typeFilter !== 'all' && (
                  <Badge variant="secondary">
                    Type: {ACTIVITY_TYPE_LABELS[typeFilter as ActivityType]}
                  </Badge>
                )}
                {sentimentFilter !== 'all' && (
                  <Badge variant="secondary">
                    Sentiment: {ACTIVITY_SENTIMENT_LABELS[sentimentFilter as ActivitySentiment]}
                  </Badge>
                )}
                {dateFilter !== 'all' && (
                  <Badge variant="secondary">
                    Date: {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities Content */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="all">
                  All Activities
                  {allActivities?.count ? (
                    <Badge variant="secondary" className="ml-2">{allActivities.count}</Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="mine">
                  My Activities
                  {myActivities?.count ? (
                    <Badge variant="secondary" className="ml-2">{myActivities.count}</Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="follow-up">
                  Follow-ups Needed
                  {followUpActivities?.count ? (
                    <Badge variant="destructive" className="ml-2">{followUpActivities.count}</Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <ActivityTimeline />
              </TabsContent>

              <TabsContent value="mine">
                <ActivityTimeline />
              </TabsContent>

              <TabsContent value="follow-up">
                <ActivityTimeline />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
