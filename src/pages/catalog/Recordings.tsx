import React, { useState } from 'react';
import { Plus, Mic, Search, Filter, Edit, Eye, Upload, Calendar, Clock, CheckCircle2, XCircle, FileMusic, Sparkles, Radio, Disc, Music2, Download } from 'lucide-react';
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
import { useRecordings } from '@/api/hooks/useCatalog';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { NoCatalogItemsEmptyState, NoSearchResultsEmptyState } from '@/components/ui/empty-states-presets';
import { AppLayout } from '@/components/layout/AppLayout';
import { ViewModeToggle, useViewMode } from '@/components/ui/view-mode-toggle';
import { ExportDialog } from '@/components/ui/export-dialog';

export default function Recordings() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useViewMode('recordings', 'table');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const { data: recordingsData, isLoading } = useRecordings({
    search: searchQuery || undefined,
    type: typeFilter === 'all' || !typeFilter ? undefined : typeFilter as any,
    status: statusFilter === 'all' || !statusFilter ? undefined : statusFilter as any,
    page,
    page_size: 20,
  });

  const recordings = recordingsData?.results || [];
  const totalPages = recordingsData ? Math.ceil(recordingsData.count / 20) : 1;

  const handleViewRecording = (id: number) => {
    navigate(`/catalog/recordings/${id}`);
  };

  const handleCreateRecording = () => {
    navigate('/catalog/recordings/create');
  };

  const getStatusConfig = (status: string): { variant: any; icon: any } => {
    switch (status) {
      case 'draft':
        return { variant: 'secondary', icon: Edit };
      case 'in_production':
        return { variant: 'warning', icon: Sparkles };
      case 'completed':
        return { variant: 'success', icon: CheckCircle2 };
      case 'released':
        return { variant: 'info', icon: Radio };
      default:
        return { variant: 'secondary', icon: FileMusic };
    }
  };

  const getTypeConfig = (type: string): { variant: any; icon: any } => {
    switch (type) {
      case 'master':
        return { variant: 'default', icon: Disc };
      case 'demo':
        return { variant: 'secondary', icon: Mic };
      case 'live':
        return { variant: 'destructive', icon: Radio };
      case 'remix':
        return { variant: 'outline', icon: Sparkles };
      case 'cover':
        return { variant: 'outline', icon: Music2 };
      default:
        return { variant: 'secondary', icon: FileMusic };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recordings</h1>
          <p className="text-muted-foreground">
            Manage master recordings, demos, and versions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
            disabled={recordings.length === 0}
            aria-label="Export recordings data"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateRecording} aria-label="Create new recording">
            <Plus className="mr-2 h-4 w-4" />
            New Recording
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordingsData?.count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Masters</CardTitle>
            <Badge variant="default">Production</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recordings.filter(r => r.type === 'master').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With ISRC</CardTitle>
            <Badge variant="outline">Standard</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recordings.filter(r => r.isrc).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Released</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recordings.filter(r => r.status === 'released').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              aria-label="Search recordings"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="master">Master</SelectItem>
            <SelectItem value="demo">Demo</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="remix">Remix</SelectItem>
            <SelectItem value="cover">Cover</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_production">In Production</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="released">Released</SelectItem>
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
                <TableHead>Title</TableHead>
                <TableHead>Work</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ISRC</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead>Master Splits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : recordings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-0">
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
                        itemType="recordings"
                        onPrimaryAction={handleCreateRecording}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                recordings.map((recording) => (
                  <TableRow key={recording.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{recording.title}</div>
                        {recording.version && (
                          <div className="text-xs text-muted-foreground">
                            Version: {recording.version}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {recording.work_title ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => navigate(`/catalog/works/${recording.work}`)}
                        >
                          {recording.work_title}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const config = getTypeConfig(recording.type);
                        return (
                          <Badge variant={config.variant} icon={config.icon} size="sm">
                            {recording.type}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const config = getStatusConfig(recording.status);
                        return (
                          <Badge variant={config.variant} icon={config.icon} size="sm">
                            {recording.status.replace('_', ' ')}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {recording.isrc ? (
                        <Badge variant="outline">{recording.isrc}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {recording.formatted_duration || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {recording.assets && recording.assets.length > 0 ? (
                        <Badge>{recording.assets.length}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {recording.has_complete_master_splits ? (
                        <Badge variant="subtle-success" icon={CheckCircle2} size="sm">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="subtle-destructive" icon={XCircle} size="sm">
                          Incomplete
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewRecording(recording.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/catalog/recordings/${recording.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/catalog/recordings/${recording.id}/assets`)}
                        >
                          <Upload className="h-4 w-4" />
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
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : recordings.length === 0 ? (
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
                itemType="recordings"
                onPrimaryAction={handleCreateRecording}
              />
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recordings.map((recording) => {
                const typeConfig = getTypeConfig(recording.type);
                const statusConfig = getStatusConfig(recording.status);

                return (
                  <Card
                    key={recording.id}
                    className="hover-lift transition-smooth cursor-pointer"
                    onClick={() => handleViewRecording(recording.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{recording.title}</CardTitle>
                      {recording.version && (
                        <CardDescription className="text-xs">
                          Version: {recording.version}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={typeConfig.variant} icon={typeConfig.icon} size="sm">
                          {recording.type}
                        </Badge>
                        <Badge variant={statusConfig.variant} icon={statusConfig.icon} size="sm">
                          {recording.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {recording.work_title && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Work:</span>{' '}
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/catalog/works/${recording.work}`);
                            }}
                          >
                            {recording.work_title}
                          </Button>
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        {recording.isrc && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ISRC:</span>
                            <Badge variant="outline" size="sm">{recording.isrc}</Badge>
                          </div>
                        )}
                        {recording.formatted_duration && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Duration:</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{recording.formatted_duration}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Assets:</span>
                          <Badge>{recording.assets?.length || 0}</Badge>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        {recording.has_complete_master_splits ? (
                          <Badge variant="subtle-success" icon={CheckCircle2} size="sm" className="w-full justify-center">
                            Complete Splits
                          </Badge>
                        ) : (
                          <Badge variant="subtle-destructive" icon={XCircle} size="sm" className="w-full justify-center">
                            Incomplete Splits
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRecording(recording.id);
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
                            navigate(`/catalog/recordings/${recording.id}/edit`);
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
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, recordingsData?.count || 0)} of {recordingsData?.count || 0} recordings
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

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        title="Export Recordings"
        data={recordings}
        filename="recordings"
        availableFormats={['csv', 'json']}
      />
    </div>
    </AppLayout>
  );
}