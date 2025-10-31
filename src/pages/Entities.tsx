import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Building2,
  User,
  LayoutGrid,
  Table2,
  SlidersHorizontal,
  Mail,
  Phone,
  MoreVertical,
  Edit,
  Trash,
  ChevronDown,
  ArrowUpDown,
  Download,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEntities } from '@/api/hooks/useEntities';
import { EntityFormDialog } from './crm/components/EntityFormDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Entity } from '@/api/services/entities.service';
import { getMediaUrl } from '@/lib/media';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type ViewMode = 'grid' | 'table';
type SortField = 'name' | 'created' | 'role' | 'type';
type SortOrder = 'asc' | 'desc';

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'artist', label: 'Artists', category: 'creative' },
  { value: 'producer', label: 'Producers', category: 'creative' },
  { value: 'composer', label: 'Composers', category: 'creative' },
  { value: 'lyricist', label: 'Lyricists', category: 'creative' },
  { value: 'audio_editor', label: 'Audio Editors', category: 'creative' },
  { value: 'label', label: 'Label', category: 'business' },
  { value: 'booking', label: 'Booking', category: 'business' },
  { value: 'endorsements', label: 'Endorsements', category: 'business' },
  { value: 'publishing', label: 'Publishing', category: 'business' },
  { value: 'productie', label: 'Productie', category: 'business' },
  { value: 'new_business', label: 'New Business', category: 'business' },
  { value: 'digital', label: 'Digital', category: 'business' },
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

export default function Entities() {
  const navigate = useNavigate();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState<'all' | 'PF' | 'PJ'>('all');
  const [internalFilter, setInternalFilter] = useState<'all' | 'internal' | 'external'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Fetch entities based on filters with backend pagination
  const { data: entitiesData, isLoading } = useEntities({
    ...(roleFilter !== 'all' && { has_role: roleFilter }),
    ...(internalFilter !== 'all' && { is_internal: internalFilter === 'internal' }),
    page: currentPage,
    page_size: itemsPerPage,
  });
  const entities = entitiesData?.results || [];
  const totalCount = entitiesData?.count || 0;

  // Client-side filter and sort (for search and kind filter that aren't in backend yet)
  const filteredAndSortedEntities = useMemo(() => {
    let filtered = entities.filter((entity) => {
      const matchesSearch =
        !searchQuery ||
        entity.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.stage_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesKind = kindFilter === 'all' || entity.kind === kindFilter;

      return matchesSearch && matchesKind;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.display_name.localeCompare(b.display_name);
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'type':
          comparison = a.kind.localeCompare(b.kind);
          break;
        case 'role':
          const aRole = a.roles?.[0] || '';
          const bRole = b.roles?.[0] || '';
          comparison = aRole.localeCompare(bRole);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [entities, searchQuery, kindFilter, sortField, sortOrder]);

  // Pagination (backend handles the actual pagination)
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, kindFilter, internalFilter, sortField, sortOrder]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const stats = useMemo(() => ({
    total: entities.length,
    physical: entities.filter(e => e.kind === 'PF').length,
    legal: entities.filter(e => e.kind === 'PJ').length,
    creative: entities.filter(e => e.roles?.some(r => ['artist', 'producer', 'composer', 'lyricist', 'audio_editor'].includes(r))).length,
  }), [entities]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (roleFilter !== 'all') count++;
    if (kindFilter !== 'all') count++;
    if (internalFilter !== 'all') count++;
    return count;
  }, [roleFilter, kindFilter, internalFilter]);

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
                  {filteredAndSortedEntities.length} {filteredAndSortedEntities.length === 1 ? 'entity' : 'entities'}
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

        {/* Search and Filters Bar */}
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
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
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

            {/* Sort Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleSort('name')}>
                  <span className="flex-1">Name</span>
                  {sortField === 'name' && <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('created')}>
                  <span className="flex-1">Date Added</span>
                  {sortField === 'created' && <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('type')}>
                  <span className="flex-1">Entity Type</span>
                  {sortField === 'type' && <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('role')}>
                  <span className="flex-1">Role</span>
                  {sortField === 'role' && <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Role</label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Creative</div>
                        {roleOptions.filter(r => r.category === 'creative').map(role => (
                          <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">Business</div>
                        {roleOptions.filter(r => r.category === 'business').map(role => (
                          <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Entity Type</label>
                    <Select value={kindFilter} onValueChange={(value: any) => setKindFilter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="PF">Physical Persons</SelectItem>
                        <SelectItem value="PJ">Legal Entities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={internalFilter} onValueChange={(value: any) => setInternalFilter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="internal">Signed Artists</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRoleFilter('all');
                      setKindFilter('all');
                      setInternalFilter('all');
                    }}
                    className="sm:mt-6"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
        ) : filteredAndSortedEntities.length === 0 ? (
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
                      setRoleFilter('all');
                      setKindFilter('all');
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
              entities={filteredAndSortedEntities}
              onEntityClick={(id) => navigate(`/entity/${id}`)}
              getInitials={getInitials}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entities
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <>
            <TableView
              entities={filteredAndSortedEntities}
              onEntityClick={(id) => navigate(`/entity/${id}`)}
              getInitials={getInitials}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entities
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {/* Dialogs */}
        <EntityFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          role={roleFilter === 'all' ? 'artist' : roleFilter}
        />
      </div>
    </AppLayout>
  );
}

// Grid View Component
function GridView({
  entities,
  onEntityClick,
  getInitials,
}: {
  entities: Entity[];
  onEntityClick: (id: string) => void;
  getInitials: (name: string) => string;
}) {
  // Debug: Log first entity to see what data we're getting
  React.useEffect(() => {
    if (entities.length > 0) {
      const firstEntity = entities[0];
      console.log('DEBUG - First entity:', {
        name: firstEntity.display_name,
        profile_photo: firstEntity.profile_photo,
        profile_photo_url: getMediaUrl(firstEntity.profile_photo),
      });
    }
  }, [entities]);

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

// Table View Component
function TableView({
  entities,
  onEntityClick,
  getInitials,
}: {
  entities: Entity[];
  onEntityClick: (id: string) => void;
  getInitials: (name: string) => string;
}) {
  return (
    <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((entity) => (
              <TableRow
                key={entity.id}
                className="cursor-pointer group hover:bg-muted/50"
              >
                <TableCell onClick={() => onEntityClick(entity.id)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getMediaUrl(entity.profile_photo) || `https://avatar.vercel.sh/${entity.display_name}`} />
                      <AvatarFallback className="text-xs">
                        {getInitials(entity.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{entity.display_name}</p>
                      {entity.stage_name && (
                        <p className="text-xs text-muted-foreground">
                          aka "{entity.stage_name}"
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell onClick={() => onEntityClick(entity.id)}>
                  <Badge variant="outline" className="text-xs">
                    {entity.kind === 'PF' ? (
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
                </TableCell>
                <TableCell onClick={() => onEntityClick(entity.id)}>
                  <div className="flex flex-wrap gap-1">
                    {entity.roles?.slice(0, 3).map((role) => (
                      <Badge
                        key={role}
                        className={cn('text-xs', roleColors[role] || 'bg-gray-100 text-gray-700')}
                      >
                        {role}
                      </Badge>
                    ))}
                    {entity.roles && entity.roles.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{entity.roles.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={() => onEntityClick(entity.id)}>
                  <div className="space-y-1">
                    {entity.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{entity.email}</span>
                      </div>
                    )}
                    {entity.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{entity.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={() => onEntityClick(entity.id)}>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(entity.created_at), 'MMM d, yyyy')}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEntityClick(entity.id)}>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
