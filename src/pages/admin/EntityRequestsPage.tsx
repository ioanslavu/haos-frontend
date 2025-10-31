import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  useEntityRequests,
  useApproveEntityRequest,
  useRejectEntityRequest,
} from '@/api/hooks/useEntityRequests';
import {
  EntityChangeRequest,
  ENTITY_REQUEST_STATUS_LABELS,
  ENTITY_REQUEST_STATUS_COLORS,
  ENTITY_REQUEST_TYPE_LABELS,
} from '@/api/types/entityRequests';
import { format } from 'date-fns';
import { Search, CheckCircle, XCircle, Eye, Loader2, Filter } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';

export default function EntityRequestsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'administrator';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [selectedRequest, setSelectedRequest] = useState<EntityChangeRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch requests
  const {
    data: requestsData,
    isLoading,
    error,
  } = useEntityRequests(
    statusFilter !== 'all' ? { status: statusFilter as any } : undefined
  );

  const approveRequest = useApproveEntityRequest();
  const rejectRequest = useRejectEntityRequest();

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/crm/entities" replace />;
  }

  // Extract requests from paginated response
  const requests = requestsData?.results || [];

  // Filter requests based on search and type
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      !searchQuery ||
      request.entity_detail?.display_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.requested_by_detail?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === 'all' || request.request_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleReview = (request: EntityChangeRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setAdminNotes('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    try {
      if (reviewAction === 'approve') {
        await approveRequest.mutateAsync({
          id: selectedRequest.id,
          admin_notes: adminNotes,
        });
      } else {
        await rejectRequest.mutateAsync({
          id: selectedRequest.id,
          admin_notes: adminNotes,
        });
      }
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
    };
    return colorMap[status] || 'outline';
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Entity Change Requests</h1>
            <p className="text-muted-foreground">
              Review and manage entity edit and delete requests from users
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by entity, user, or message..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="edit">Edit Requests</SelectItem>
                  <SelectItem value="delete">Delete Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>
              {filteredRequests?.length || 0} request(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Failed to load requests. Please try again.
              </div>
            ) : !filteredRequests || filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No requests found matching your filters.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.entity_detail?.display_name || `Entity #${request.entity}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ENTITY_REQUEST_TYPE_LABELS[request.request_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.requested_by_detail?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {request.message}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(request.status)}>
                            {ENTITY_REQUEST_STATUS_LABELS[request.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleReview(request, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReview(request, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.status !== 'pending' && request.admin_notes && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedRequest?.status === 'pending'
                  ? `${reviewAction === 'approve' ? 'Approve' : 'Reject'} Request`
                  : 'Request Details'}
              </DialogTitle>
              <DialogDescription>
                {selectedRequest?.status === 'pending'
                  ? `Review and ${reviewAction} this ${selectedRequest?.request_type} request`
                  : 'View request details and admin response'}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Entity</Label>
                    <p className="font-medium">
                      {selectedRequest.entity_detail?.display_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Request Type</Label>
                    <p className="font-medium">
                      {ENTITY_REQUEST_TYPE_LABELS[selectedRequest.request_type]}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Requested By</Label>
                    <p className="font-medium">
                      {selectedRequest.requested_by_detail?.full_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Date</Label>
                    <p className="font-medium">
                      {format(new Date(selectedRequest.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm text-muted-foreground">User Message</Label>
                  <p className="mt-2 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    {selectedRequest.message}
                  </p>
                </div>

                {selectedRequest.status === 'pending' ? (
                  <>
                    <Separator />
                    <div>
                      <Label htmlFor="admin-notes">
                        Admin Notes (Optional)
                      </Label>
                      <Textarea
                        id="admin-notes"
                        placeholder="Add any notes about this decision..."
                        className="mt-2"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  selectedRequest.admin_notes && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Admin Notes
                        </Label>
                        <p className="mt-2 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                          {selectedRequest.admin_notes}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Reviewed By
                          </Label>
                          <p className="font-medium">
                            {selectedRequest.reviewed_by_detail?.full_name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Reviewed At
                          </Label>
                          <p className="font-medium">
                            {selectedRequest.reviewed_at
                              ? format(
                                  new Date(selectedRequest.reviewed_at),
                                  'MMM d, yyyy HH:mm'
                                )
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </>
                  )
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReviewDialogOpen(false);
                  setSelectedRequest(null);
                  setAdminNotes('');
                }}
              >
                {selectedRequest?.status === 'pending' ? 'Cancel' : 'Close'}
              </Button>
              {selectedRequest?.status === 'pending' && (
                <Button
                  variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                  onClick={handleSubmitReview}
                  disabled={approveRequest.isPending || rejectRequest.isPending}
                >
                  {approveRequest.isPending || rejectRequest.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {reviewAction === 'approve' ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Request
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject Request
                        </>
                      )}
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
