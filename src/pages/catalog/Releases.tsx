import React, { useState } from 'react';
import { Plus, Disc, Search, Calendar, Edit, Eye, Package, Music, Album, Radio, FileMusic, Film, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useReleases, useUpcomingReleases, useRecentReleases } from '@/api/hooks/useCatalog';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NoCatalogItemsEmptyState, NoSearchResultsEmptyState } from '@/components/ui/empty-states-presets';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';

export default function Releases() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useViewMode('releases', 'table');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: releasesData, isLoading } = useReleases({
    search: searchQuery || undefined,
    type: typeFilter === 'all' || !typeFilter ? undefined : typeFilter as any,
    status: statusFilter === 'all' || !statusFilter ? undefined : statusFilter as any,
    page,
    page_size: 20,
  });

  const { data: upcomingReleases } = useUpcomingReleases();
  const { data: recentReleases } = useRecentReleases(30);

  const releases = releasesData?.results || [];
  const totalPages = releasesData ? Math.ceil(releasesData.count / 20) : 1;

  const handleViewRelease = (id: number) => {
    navigate(`/catalog/releases/${id}`);
  };

  const handleCreateRelease = () => {
    navigate('/catalog/releases/new');
  };

  const getStatusConfig = (status: string): { variant: any; icon: any } => {
    switch (status) {
      case 'draft':
        return { variant: 'secondary', icon: Edit };
      case 'scheduled':
        return { variant: 'warning', icon: Calendar };
      case 'released':
        return { variant: 'success', icon: CheckCircle2 };
      case 'withdrawn':
        return { variant: 'destructive', icon: Radio };
      default:
        return { variant: 'secondary', icon: FileMusic };
    }
  };

  const getTypeConfig = (type: string): { variant: any; icon: any } => {
    switch (type) {
      case 'single':
        return { variant: 'default', icon: Music };
      case 'ep':
        return { variant: 'secondary', icon: Disc };
      case 'album':
        return { variant: 'outline', icon: Album };
      case 'compilation':
        return { variant: 'outline', icon: Package };
      case 'live_album':
        return { variant: 'destructive', icon: Radio };
      case 'soundtrack':
        return { variant: 'info', icon: Film };
      default:
        return { variant: 'secondary', icon: FileMusic };
    }
  };

  const getReleaseTypeIcon = (type: string) => {
    switch (type) {
      case 'single':
        return '1';
      case 'ep':
        return 'EP';
      case 'album':
        return 'LP';
      case 'compilation':
        return 'C';
      case 'soundtrack':
        return 'OST';
      default:
        return '?';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Releases</h1>
          <p className="text-muted-foreground">
            Manage albums, singles, EPs, and compilations
          </p>
        </div>
        <Button onClick={handleCreateRelease} aria-label="Create new release">
          <Plus className="mr-2 h-4 w-4" />
          New Release
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
            <Disc className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{releasesData?.count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Released</CardTitle>
            <Badge variant="outline" className="bg-green-500">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {releases.filter(r => r.status === 'released').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingReleases?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentReleases?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              aria-label="Search releases"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="ep">EP</SelectItem>
            <SelectItem value="album">Album</SelectItem>
            <SelectItem value="compilation">Compilation</SelectItem>
            <SelectItem value="live_album">Live Album</SelectItem>
            <SelectItem value="soundtrack">Soundtrack</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
        <ViewModeToggle
          value={viewMode}
          onValueChange={setViewMode}
          availableModes={['table', 'grid']}
        />
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <div className="rounded-md border">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Release Date</TableHead>
              <TableHead>UPC</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Tracks</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : releases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  {searchQuery || typeFilter || statusFilter ? (
                    <NoSearchResultsEmptyState
                      searchQuery={searchQuery}
                      onClearSearch={() => {
                        setSearchQuery('');
                        setTypeFilter('');
                        setStatusFilter('');
                      }}
                    />
                  ) : (
                    <NoCatalogItemsEmptyState
                      itemType="releases"
                      onPrimaryAction={handleCreateRelease}
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              releases.map((release) => (
                <TableRow key={release.id}>
                  <TableCell className="text-center">
                    {release.artwork_url ? (
                      <img
                        src={release.artwork_url}
                        alt={release.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs font-medium">
                        {getReleaseTypeIcon(release.type)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div>{release.title}</div>
                      {release.catalog_number && (
                        <div className="text-xs text-muted-foreground">
                          Cat# {release.catalog_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const config = getTypeConfig(release.type);
                      return (
                        <Badge variant={config.variant} icon={config.icon} size="sm">
                          {release.type.replace('_', ' ')}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const config = getStatusConfig(release.status);
                      return (
                        <Badge variant={config.variant} icon={config.icon} size="sm">
                          {release.status}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {release.release_date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(release.release_date), 'MMM d, yyyy')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {release.upc ? (
                      <Badge variant="outline">{release.upc}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{release.label_name || '—'}</TableCell>
                  <TableCell>
                    {release.track_count ? (
                      <Badge>{release.track_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>{release.formatted_total_duration || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewRelease(release.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/catalog/releases/${release.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/catalog/releases/${release.id}/tracks`)}
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-48 w-full mb-4 rounded" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))}
            </div>
          ) : releases.length === 0 ? (
            searchQuery || typeFilter || statusFilter ? (
              <NoSearchResultsEmptyState
                searchQuery={searchQuery}
                onClearSearch={() => {
                  setSearchQuery('');
                  setTypeFilter('');
                  setStatusFilter('');
                }}
              />
            ) : (
              <NoCatalogItemsEmptyState
                itemType="releases"
                onPrimaryAction={handleCreateRelease}
              />
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {releases.map((release) => {
                const typeConfig = getTypeConfig(release.type);
                const statusConfig = getStatusConfig(release.status);

                return (
                  <Card
                    key={release.id}
                    className="hover-lift transition-smooth cursor-pointer overflow-hidden"
                    onClick={() => handleViewRelease(release.id)}
                  >
                    <div className="aspect-square relative bg-muted">
                      {release.artwork_url ? (
                        <img
                          src={release.artwork_url}
                          alt={release.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                          {getReleaseTypeIcon(release.type)}
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant={statusConfig.variant} icon={statusConfig.icon} size="sm">
                          {release.status}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{release.title}</CardTitle>
                      {release.catalog_number && (
                        <CardDescription className="text-xs">
                          Cat# {release.catalog_number}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={typeConfig.variant} icon={typeConfig.icon} size="sm">
                          {release.type.replace('_', ' ')}
                        </Badge>
                        {release.upc && (
                          <Badge variant="outline" size="sm">{release.upc}</Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        {release.release_date && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Release:</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(release.release_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        )}
                        {release.label_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Label:</span>
                            <span className="font-medium truncate ml-2">{release.label_name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tracks:</span>
                          <Badge>{release.track_count || 0}</Badge>
                        </div>
                        {release.formatted_total_duration && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">{release.formatted_total_duration}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRelease(release.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/catalog/releases/${release.id}/edit`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, releasesData?.count || 0)} of {releasesData?.count || 0} releases
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}