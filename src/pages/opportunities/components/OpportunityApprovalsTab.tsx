/**
 * Opportunity Approvals Tab
 * Workflow-based approvals view with stage grouping and version tracking
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, FileText, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Approval } from '@/types/opportunities';
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
import {
  useApprovals,
  useApproveApproval,
  useRejectApproval,
  useRequestChangesApproval
} from '@/api/hooks/useOpportunities';
import { useDeleteApproval } from '@/api/hooks/opportunities/useOpportunityMutations';
import { formatDate } from '@/lib/utils';
import { ApprovalDialog } from './ApprovalDialog';

interface OpportunityApprovalsTabProps {
  opportunityId: number;
}

const STAGE_LABELS: Record<string, string> = {
  concept: 'Concept',
  script: 'Script',
  storyboard: 'Storyboard',
  rough_cut: 'Rough Cut',
  final_cut: 'Final Cut',
  caption: 'Caption/Copy',
  static_kv: 'Static Key Visual',
  usage_extension: 'Usage Extension Request',
  other: 'Other',
};

const STAGE_ORDER = [
  'concept',
  'script',
  'storyboard',
  'rough_cut',
  'final_cut',
  'caption',
  'static_kv',
  'usage_extension',
  'other',
];

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  changes_requested: 'Changes Requested',
  rejected: 'Rejected',
};

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  approved: 'bg-green-500/10 text-green-700 dark:text-green-400',
  changes_requested: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  rejected: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export function OpportunityApprovalsTab({ opportunityId }: OpportunityApprovalsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingApproval, setEditingApproval] = useState<Approval | null>(null);
  const [deletingApproval, setDeletingApproval] = useState<Approval | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick action states
  const [approvingApproval, setApprovingApproval] = useState<Approval | null>(null);
  const [rejectingApproval, setRejectingApproval] = useState<Approval | null>(null);
  const [requestingChangesApproval, setRequestingChangesApproval] = useState<Approval | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  const { data: approvals, isLoading } = useApprovals({ opportunity: opportunityId });
  const approvalsList = Array.isArray(approvals) ? approvals : (approvals?.results || []);

  // Quick action mutations
  const approveMutation = useApproveApproval();
  const rejectMutation = useRejectApproval();
  const requestChangesMutation = useRequestChangesApproval();
  const deleteApprovalMutation = useDeleteApproval(opportunityId);

  const handleEdit = (approval: Approval) => {
    setEditingApproval(approval);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingApproval(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingApproval) return;

    try {
      setIsDeleting(true);
      await deleteApprovalMutation.mutateAsync(deletingApproval.id);
      setDeletingApproval(null);
    } catch {
      // Error handled by mutation
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async () => {
    if (!approvingApproval) return;

    try {
      await approveMutation.mutateAsync({
        id: approvingApproval.id,
        data: { notes: actionNotes || undefined }
      });
      setApprovingApproval(null);
      setActionNotes('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!rejectingApproval) return;
    if (!actionNotes.trim()) {
      toast.error('Notes are required when rejecting');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: rejectingApproval.id,
        data: { notes: actionNotes }
      });
      setRejectingApproval(null);
      setActionNotes('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reject');
    }
  };

  const handleRequestChanges = async () => {
    if (!requestingChangesApproval) return;
    if (!actionNotes.trim()) {
      toast.error('Notes are required when requesting changes');
      return;
    }

    try {
      await requestChangesMutation.mutateAsync({
        id: requestingChangesApproval.id,
        data: { notes: actionNotes }
      });
      setRequestingChangesApproval(null);
      setActionNotes('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to request changes');
    }
  };

  // Group approvals by stage
  const approvalsByStage = approvalsList.reduce((acc, approval) => {
    const stage = approval.stage;
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(approval);
    return acc;
  }, {} as Record<string, Approval[]>);

  // Sort approvals within each stage by version (descending)
  Object.keys(approvalsByStage).forEach((stage) => {
    approvalsByStage[stage].sort((a, b) => b.version - a.version);
  });

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Approvals Workflow</CardTitle>
          <Button
            onClick={handleAdd}
            size="sm"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Approval
          </Button>
        </CardHeader>
        <CardContent>
          {approvalsList.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No approvals yet</p>
              <Button
                onClick={handleAdd}
                variant="outline"
                className="rounded-xl border-white/10 hover:bg-white/10"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Approval
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Workflow stages */}
              {STAGE_ORDER.map((stage) => {
                const stageApprovals = approvalsByStage[stage];
                if (!stageApprovals || stageApprovals.length === 0) return null;

                const latestApproval = stageApprovals[0];

                return (
                  <div key={stage} className="border border-white/10 rounded-xl p-4 bg-background/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {STAGE_LABELS[stage] || stage}
                        <Badge variant="secondary" className="text-xs">
                          {stageApprovals.length} version{stageApprovals.length > 1 ? 's' : ''}
                        </Badge>
                      </h3>
                      <Badge className={APPROVAL_STATUS_COLORS[latestApproval.status] || ''}>
                        {APPROVAL_STATUS_LABELS[latestApproval.status] || latestApproval.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {stageApprovals.map((approval) => (
                        <div
                          key={approval.id}
                          className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg border border-white/5"
                        >
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Version {approval.version}</span>
                              <Badge
                                variant="outline"
                                className={APPROVAL_STATUS_COLORS[approval.status] || ''}
                              >
                                {APPROVAL_STATUS_LABELS[approval.status] || approval.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-0.5">
                              <p>Submitted: {formatDate(approval.submitted_at)}</p>
                              {approval.approved_at && (
                                <p>Approved: {formatDate(approval.approved_at)}</p>
                              )}
                              {(approval.approver_contact || approval.approver_user) && (
                                <p>
                                  Approver: {approval.approver_user?.full_name || approval.approver_contact?.full_name || 'N/A'}
                                </p>
                              )}
                              {approval.notes && (
                                <p className="text-xs mt-1 line-clamp-2">
                                  Notes: {approval.notes}
                                </p>
                              )}
                            </div>
                            {approval.file_url && (
                              <a
                                href={approval.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                View File <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {/* Quick action buttons - only show for pending approvals */}
                            {approval.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setApprovingApproval(approval)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setRequestingChangesApproval(approval)}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  title="Request Changes"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setRejectingApproval(approval)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(approval)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingApproval(approval)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ApprovalDialog
        opportunityId={opportunityId}
        approval={editingApproval}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingApproval(null);
        }}
      />

      <AlertDialog open={!!deletingApproval} onOpenChange={() => setDeletingApproval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this approval? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Dialog */}
      <Dialog open={!!approvingApproval} onOpenChange={(open) => {
        if (!open) {
          setApprovingApproval(null);
          setActionNotes('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Submission</DialogTitle>
            <DialogDescription>
              Approve this {approvingApproval ? STAGE_LABELS[approvingApproval.stage] : ''} submission (Version {approvingApproval?.version}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-notes">Notes (Optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add any comments or feedback..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovingApproval(null);
                setActionNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingApproval} onOpenChange={(open) => {
        if (!open) {
          setRejectingApproval(null);
          setActionNotes('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Reject this {rejectingApproval ? STAGE_LABELS[rejectingApproval.stage] : ''} submission (Version {rejectingApproval?.version}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes">Reason for Rejection *</Label>
              <Textarea
                id="reject-notes"
                placeholder="Please explain why this is being rejected..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectingApproval(null);
                setActionNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={rejectMutation.isPending || !actionNotes.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={!!requestingChangesApproval} onOpenChange={(open) => {
        if (!open) {
          setRequestingChangesApproval(null);
          setActionNotes('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Request changes for this {requestingChangesApproval ? STAGE_LABELS[requestingChangesApproval.stage] : ''} submission (Version {requestingChangesApproval?.version}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="changes-notes">Requested Changes *</Label>
              <Textarea
                id="changes-notes"
                placeholder="Please describe what needs to be changed..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRequestingChangesApproval(null);
                setActionNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={requestChangesMutation.isPending || !actionNotes.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {requestChangesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
