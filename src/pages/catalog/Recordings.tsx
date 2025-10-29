import React, { useState } from 'react';
import { Plus, Mic, Search, Filter, Edit, Eye, Upload, Calendar, Clock } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import { useRecordings } from '@/api/hooks/useCatalog';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Recordings() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'in_production':
        return 'default';
      case 'completed':
        return 'outline';
      case 'released':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'master':
        return 'default';
      case 'demo':
        return 'secondary';
      case 'live':
        return 'destructive';
      case 'remix':
        return 'outline';
      case 'cover':
        return 'outline';
      default:
        return 'secondary';
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
        <Button onClick={handleCreateRecording}>
          <Plus className="mr-2 h-4 w-4" />
          New Recording
        </Button>
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
      </div>

      {/* Table */}
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
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : recordings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No recordings found
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
                    <Badge variant={getTypeColor(recording.type) as any}>
                      {recording.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(recording.status) as any}>
                      {recording.status.replace('_', ' ')}
                    </Badge>
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
                      <Badge variant="default" className="bg-green-500">
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Incomplete</Badge>
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
    </div>
    </AppLayout>
  );
}