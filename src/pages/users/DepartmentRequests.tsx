import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, User, MessageSquare, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDepartmentRequests, useReviewDepartmentRequest } from '@/api/hooks/useUsers';
import type { DepartmentRequest } from '@/types/user';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  approved: 'bg-green-500/10 text-green-500',
  rejected: 'bg-red-500/10 text-red-500',
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

export default function DepartmentRequests() {
  const { data: pendingRequests, isLoading: pendingLoading } = useDepartmentRequests('pending');
  const { data: approvedRequests, isLoading: approvedLoading } = useDepartmentRequests('approved');
  const { data: rejectedRequests, isLoading: rejectedLoading } = useDepartmentRequests('rejected');

  const reviewMutation = useReviewDepartmentRequest();

  const [selectedRequest, setSelectedRequest] = useState<DepartmentRequest | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async (request: DepartmentRequest) => {
    try {
      await reviewMutation.mutateAsync({
        requestId: request.id,
        data: { status: 'approved' },
      });
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = (request: DepartmentRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest) return;

    try {
      await reviewMutation.mutateAsync({
        requestId: selectedRequest.id,
        data: {
          status: 'rejected',
          rejection_reason: rejectionReason,
        },
      });
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const RequestCard = ({ request }: { request: DepartmentRequest }) => {
    const StatusIcon = statusIcons[request.status];

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">{request.user_name}</CardTitle>
                <CardDescription className="text-sm">{request.user_email}</CardDescription>
              </div>
            </div>
            <Badge className={statusColors[request.status]}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {request.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Request Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Department:</span>
              <Badge variant="outline" className="capitalize">
                {request.requested_department}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Requested {format(new Date(request.created_at), 'MMM d, yyyy')}
            </div>
          </div>

          {/* Message */}
          {request.message && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Message
              </div>
              <p className="text-sm">{request.message}</p>
            </div>
          )}

          {/* Review Info */}
          {request.status !== 'pending' && (
            <div className="pt-3 border-t space-y-1">
              <p className="text-xs text-muted-foreground">
                {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                {request.reviewed_by_email || 'Unknown'}
              </p>
              {request.reviewed_at && (
                <p className="text-xs text-muted-foreground">
                  on {format(new Date(request.reviewed_at), 'MMM d, yyyy HH:mm')}
                </p>
              )}
              {request.status === 'rejected' && request.rejection_reason && (
                <p className="text-sm text-destructive mt-2">
                  Reason: {request.rejection_reason}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleApprove(request)}
                className="flex-1"
                size="sm"
                disabled={reviewMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                onClick={() => handleReject(request)}
                variant="outline"
                className="flex-1"
                size="sm"
                disabled={reviewMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Department Requests</h1>
          <p className="text-muted-foreground">Review and manage department access requests</p>
        </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingRequests && pendingRequests.length > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-yellow-500 text-white">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingRequests && pendingRequests.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No pending requests</h3>
                <p className="text-sm text-muted-foreground">
                  All department requests have been reviewed
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="space-y-4">
          {approvedLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : approvedRequests && approvedRequests.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {approvedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No approved requests</h3>
                <p className="text-sm text-muted-foreground">
                  Approved requests will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-4">
          {rejectedLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rejectedRequests && rejectedRequests.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {rejectedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No rejected requests</h3>
                <p className="text-sm text-muted-foreground">
                  Rejected requests will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedRequest?.user_name}'s request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be visible to the user
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedRequest(null);
              }}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={reviewMutation.isPending || !rejectionReason.trim()}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}
