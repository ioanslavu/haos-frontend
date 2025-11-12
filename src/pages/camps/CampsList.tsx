import * as React from 'react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  X,
  Eye,
  Edit,
  Copy,
  FileText,
  Trash,
  MoreVertical,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCamps, useDeleteCamp, useDuplicateCamp, useExportCampPDF } from '@/api/hooks/useCamps';
import { CampFilters } from '@/types/camps';
import { CampCreateDialog } from './CampCreateDialog';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const statusLabels = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function CampsList() {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'completed' | 'cancelled'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campToDelete, setCampToDelete] = useState<number | null>(null);
  const itemsPerPage = 20;

  const deleteCamp = useDeleteCamp();
  const duplicateCamp = useDuplicateCamp();
  const exportPDF = useExportCampPDF();

  // Build filters
  const filters: CampFilters = useMemo(() => {
    const f: CampFilters = {
      page: currentPage,
      page_size: itemsPerPage,
    };

    if (searchQuery) f.search = searchQuery;
    if (statusFilter && statusFilter !== 'all') f.status = statusFilter;
    if (timeFilter && timeFilter !== 'all') f.time_filter = timeFilter;

    return f;
  }, [searchQuery, statusFilter, timeFilter, currentPage]);

  // Fetch camps
  const { data: campsData, isLoading } = useCamps(filters);
  const camps = campsData?.results || [];
  const totalCount = campsData?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, timeFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter && statusFilter !== 'all') count++;
    if (timeFilter && timeFilter !== 'all') count++;
    return count;
  }, [statusFilter, timeFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTimeFilter('all');
  };

  const handleDelete = (id: number) => {
    setCampToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (campToDelete) {
      await deleteCamp.mutateAsync(campToDelete);
      setDeleteDialogOpen(false);
      setCampToDelete(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    const response = await duplicateCamp.mutateAsync(id);
    if (response?.data?.id) {
      navigate(`/camps/${response.data.id}`);
    }
  };

  const handleExportPDF = async (id: number) => {
    await exportPDF.mutateAsync(id);
  };

  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return 'No dates set';
    if (startDate && !endDate) return `From ${format(new Date(startDate), 'MMM d, yyyy')}`;
    if (!startDate && endDate) return `Until ${format(new Date(endDate), 'MMM d, yyyy')}`;
    return `${format(new Date(startDate!), 'MMM d, yyyy')} - ${format(new Date(endDate!), 'MMM d, yyyy')}`;
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-400/30 to-violet-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Camps
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                  Manage recording camps and studio sessions
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Camp
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search camps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-background/50 border-white/10"
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
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: 'all' | 'draft' | 'active' | 'completed' | 'cancelled') => setStatusFilter(value)}>
                <SelectTrigger className="w-[140px] h-12 rounded-xl bg-background/50 border-white/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeFilter} onValueChange={(value: 'all' | 'upcoming' | 'past') => setTimeFilter(value)}>
                <SelectTrigger className="w-[140px] h-12 rounded-xl bg-background/50 border-white/10">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/10">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-12">
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : camps.length === 0 ? (
          <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <Calendar className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No camps found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery || activeFiltersCount > 0
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Get started by creating your first camp.'}
                </p>
                {searchQuery || activeFiltersCount > 0 ? (
                  <Button variant="outline" onClick={handleResetFilters}>
                    Clear All Filters
                  </Button>
                ) : (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Camp
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">All Camps</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {totalCount} {totalCount === 1 ? 'camp' : 'camps'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-white/10">
                        <TableHead>Name</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Studios</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {camps.map((camp) => (
                      <TableRow
                        key={camp.id}
                        className="cursor-pointer group hover:bg-muted/50 transition-colors border-white/10"
                        onClick={() => navigate(`/camps/${camp.id}`)}
                      >
                        <TableCell>
                          <div className="font-medium">{camp.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDateRange(camp.start_date, camp.end_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {camp.studios_count} {camp.studios_count === 1 ? 'studio' : 'studios'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', statusColors[camp.status])}>
                            {statusLabels[camp.status]}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/camps/${camp.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/camps/${camp.id}?edit=true`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(camp.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportPDF(camp.id)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Export PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(camp.id)}
                              >
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
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} camps
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

        {/* Create Dialog */}
        <CampCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Camp</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this camp? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
