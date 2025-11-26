import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Building2,
  User,
  LayoutGrid,
  Table2,
  Mail,
  Phone,
  MoreVertical,
  Edit,
  Trash,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInfiniteEntities, useEntityStats } from '@/api/hooks/useEntities';
import { EntityFormDialog } from '@/components/entities/EntityFormDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { EntityListItem } from '@/api/services/entities.service';
import { getMediaUrl } from '@/lib/media';
import { GenericTable, type ColumnDef, type SortState, type FilterState } from '@/components/tables';

type ViewMode = 'grid' | 'table';

const roleOptions = [
  { value: 'artist', label: 'Artists' },
  { value: 'producer', label: 'Producers' },
  { value: 'composer', label: 'Composers' },
  { value: 'lyricist', label: 'Lyricists' },
  { value: 'audio_editor', label: 'Audio Editors' },
  { value: 'label', label: 'Label' },
  { value: 'booking', label: 'Booking' },
  { value: 'endorsements', label: 'Endorsements' },
  { value: 'publishing', label: 'Publishing' },
  { value: 'productie', label: 'Productie' },
  { value: 'new_business', label: 'New Business' },
  { value: 'digital', label: 'Digital' },
];

const roleColors: Record<string, string> = {
  artist: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  producer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  composer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  lyricist: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  audio_editor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  label: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  booking: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  endorsements: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  publishing: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  productie: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  new_business: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  digital: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
};

const kindOptions = [
  { value: 'PF', label: 'Person' },
  { value: 'PJ', label: 'Company' },
];

export default function Entities() {
  const navigate = useNavigate();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Server-side sort and filter state
  const [sortState, setSortState] = useState<SortState | null>({ columnId: 'created_at', direction: 'desc' });
  const [filterState, setFilterState] = useState<FilterState>({});

  // Build API params from filter state
  const entityParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page_size: 20,
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    // Map filter state to API params
    if (filterState.role) {
      params.has_role = filterState.role;
    }
    if (filterState.kind) {
      params.kind = filterState.kind;
    }
    if (filterState.is_internal !== undefined) {
      params.is_internal = filterState.is_internal === 'internal';
    }

    // Sorting
    if (sortState) {
      params.ordering = sortState.direction === 'desc' ? `-${sortState.columnId}` : sortState.columnId;
    }

    return params;
  }, [searchQuery, filterState, sortState]);

  const {
    data: entitiesData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteEntities(entityParams);

  // Flatten all pages into a single array
  const entities = useMemo(() => {
    return entitiesData?.pages.flatMap(page => page.results) || [];
  }, [entitiesData]);

  const totalCount = entitiesData?.pages[0]?.count || 0;

  // Fetch stats
  const { data: statsData } = useEntityStats(entityParams);

  const stats = useMemo(() => ({
    total: statsData?.total || 0,
    physical: statsData?.physical || 0,
    legal: statsData?.legal || 0,
    creative: statsData?.creative || 0,
  }), [statsData]);

  // Helper function
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle sort changes (server-side)
  const handleSort = useCallback((columnId: string, direction: 'asc' | 'desc' | null) => {
    if (direction) {
      setSortState({ columnId, direction });
    } else {
      setSortState(null);
    }
  }, []);

  // Handle filter changes (server-side) - receives full FilterState from GenericTable
  const handleFilter = useCallback((filters: FilterState) => {
    setFilterState(filters);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.keys(filterState).length;

  // Define columns for GenericTable
  const columns: ColumnDef<EntityListItem>[] = useMemo(() => [
    {
      id: 'display_name',
      accessorKey: 'display_name',
      header: 'Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      filterPlaceholder: 'Filter by name...',
      minWidth: 200,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={getMediaUrl(row.profile_photo) || `https://avatar.vercel.sh/${row.display_name}`} />
            <AvatarFallback className="text-xs">
              {getInitials(row.display_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.display_name}</p>
            {row.stage_name && (
              <p className="text-xs text-muted-foreground">
                aka "{row.stage_name}"
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'kind',
      accessorKey: 'kind',
      header: 'Type',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: kindOptions,
      width: 120,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.kind === 'PF' ? (
            <>
              <User className="h-3 w-3 mr-1" />
              Person
            </>
          ) : (
            <>
              <Building2 className="h-3 w-3 mr-1" />
              Company
            </>
          )}
        </Badge>
      ),
    },
    {
      id: 'role',
      accessorFn: (row) => row.roles?.[0] || '',
      header: 'Roles',
      sortable: false,
      filterable: true,
      filterType: 'select',
      filterOptions: roleOptions,
      minWidth: 180,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.has_internal_role && (
            <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
              Internal
            </Badge>
          )}
          {row.roles?.slice(0, 3).map((role) => (
            <Badge
              key={role}
              className={cn('text-xs', roleColors[role] || 'bg-gray-100 text-gray-700')}
            >
              {role}
            </Badge>
          ))}
          {row.roles && row.roles.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{row.roles.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Contact',
      sortable: true,
      minWidth: 200,
      cell: ({ row }) => (
        <div className="space-y-1">
          {row.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Added',
      sortable: true,
      width: 120,
      cell: ({ value }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(value as string), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: 50,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/entities/${row.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [navigate]);

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/30 to-violet-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Entities
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                  {stats.total} {stats.total === 1 ? 'entity' : 'entities'}
                  {activeFiltersCount > 0 && ` with ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setFormDialogOpen(true)} className="shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entity
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Glassmorphic Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Total Entities</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-1">{stats.total}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Physical Persons</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mt-1">{stats.physical}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <User className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Legal Entities</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mt-1">{stats.legal}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Building2 className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Creative Roles</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-1">{stats.creative}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Users className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar and View Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 backdrop-blur-sm bg-background/50 border-white/20 dark:border-white/10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterState({})}
              >
                Clear {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border bg-background p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode('table')}
              >
                <Table2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={cn(
            viewMode === 'grid' && 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            viewMode === 'table' && 'space-y-4'
          )}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : entities.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No entities found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery || activeFiltersCount > 0
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Get started by adding your first entity to the system.'}
                </p>
                {(searchQuery || activeFiltersCount > 0) ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterState({});
                    }}
                  >
                    Clear All Filters
                  </Button>
                ) : (
                  <Button onClick={() => setFormDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entity
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <>
            <GridView
              entities={entities}
              onEntityClick={(id) => navigate(`/entities/${id}`)}
              getInitials={getInitials}
            />
            {/* Infinite scroll trigger and loading indicator */}
            <div className="flex items-center justify-center py-8">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more entities...</span>
                </div>
              ) : hasNextPage ? (
                <Button variant="outline" onClick={() => fetchNextPage()}>
                  Load more ({entities.length} of {totalCount})
                </Button>
              ) : entities.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Showing all {totalCount} entities
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl overflow-hidden">
            <GenericTable
              columns={columns}
              data={entities}
              getRowId={(row) => row.id}
              sortState={sortState}
              filterState={filterState}
              onSort={handleSort}
              onFilter={handleFilter}
              onRowClick={(row) => navigate(`/entities/${row.id}`)}
              infiniteScroll={{
                enabled: true,
                hasNextPage: hasNextPage || false,
                isFetching: isFetchingNextPage,
                fetchNextPage,
                threshold: 200,
              }}
              loading={isLoading}
              density="comfortable"
              stickyHeader
              stripedRows
              persistKey="entities-table"
              footer={
                <div className="flex items-center justify-center py-2">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading more...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Showing {entities.length} of {totalCount} entities
                    </p>
                  )}
                </div>
              }
            />
          </Card>
        )}

        {/* Dialogs */}
        <EntityFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          role={filterState.role as string || 'artist'}
        />
      </div>
    </AppLayout>
  );
}

// Grid View Component (unchanged)
function GridView({
  entities,
  onEntityClick,
  getInitials,
}: {
  entities: EntityListItem[];
  onEntityClick: (id: number) => void;
  getInitials: (name: string) => string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entities.map((entity) => (
        <Card
          key={entity.id}
          className="group relative backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer rounded-2xl"
          onClick={() => onEntityClick(entity.id)}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="h-12 w-12 ring-2 ring-background">
                    <AvatarImage src={getMediaUrl(entity.profile_photo) || `https://avatar.vercel.sh/${entity.display_name}`} />
                    <AvatarFallback className="text-sm font-semibold">
                      {getInitials(entity.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight mb-1 truncate">
                      {entity.display_name}
                    </h4>
                    {entity.stage_name && (
                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        aka "{entity.stage_name}"
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {entity.has_internal_role && (
                        <Badge variant="default" className="text-xs h-5 bg-green-600 hover:bg-green-700">
                          Internal
                        </Badge>
                      )}
                      {entity.kind === 'PJ' ? (
                        <Badge variant="outline" className="text-xs h-5">
                          <Building2 className="h-3 w-3 mr-1" />
                          Company
                        </Badge>
                      ) : (
                        entity.roles?.slice(0, 2).map((role) => (
                          <Badge
                            key={role}
                            className={cn('text-xs h-5', roleColors[role] || 'bg-gray-100 text-gray-700')}
                          >
                            {role}
                          </Badge>
                        ))
                      )}
                      {entity.roles && entity.roles.length > 2 && (
                        <Badge variant="secondary" className="text-xs h-5">
                          +{entity.roles.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {entity.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{entity.email}</span>
                    </div>
                  )}
                  {entity.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{entity.phone}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Added {format(new Date(entity.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEntityClick(entity.id); }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
