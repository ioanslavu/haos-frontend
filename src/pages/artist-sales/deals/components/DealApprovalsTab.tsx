import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useDealApprovals,
  useDeleteApproval,
} from '@/api/hooks/useArtistSales'
import { Approval, APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS } from '@/types/artist-sales'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { ApprovalDialog } from './ApprovalDialog'

interface DealApprovalsTabProps {
  dealId: number
}

const STAGE_LABELS: Record<string, string> = {
  concept: 'Concept',
  script: 'Script',
  storyboard: 'Storyboard',
  rough_cut: 'Rough Cut',
  final_cut: 'Final Cut',
  caption: 'Caption',
  static_kv: 'Static Key Visual',
  usage_extension: 'Usage Extension',
  other: 'Other',
}

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
]

export function DealApprovalsTab({ dealId }: DealApprovalsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingApproval, setEditingApproval] = useState<Approval | null>(null)
  const [deletingApproval, setDeletingApproval] = useState<Approval | null>(null)

  const { data: approvals, isLoading } = useDealApprovals(dealId)
  const approvalsList = Array.isArray(approvals) ? approvals : []
  const deleteMutation = useDeleteApproval()

  const handleEdit = (approval: Approval) => {
    setEditingApproval(approval)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingApproval(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingApproval) return

    try {
      await deleteMutation.mutateAsync(deletingApproval.id)
      toast.success('Approval deleted')
      setDeletingApproval(null)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete approval')
    }
  }

  // Group approvals by stage
  const approvalsByStage = approvalsList.reduce((acc, approval) => {
    const stage = approval.stage
    if (!acc[stage]) {
      acc[stage] = []
    }
    acc[stage].push(approval)
    return acc
  }, {} as Record<string, Approval[]>)

  // Sort approvals within each stage by version (descending)
  Object.keys(approvalsByStage).forEach((stage) => {
    approvalsByStage[stage].sort((a, b) => b.version - a.version)
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Approvals Workflow</CardTitle>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Approval
          </Button>
        </CardHeader>
        <CardContent>
          {approvalsList.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No approvals yet</p>
              <Button onClick={handleAdd} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add First Approval
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Workflow stages */}
              {STAGE_ORDER.map((stage) => {
                const stageApprovals = approvalsByStage[stage]
                if (!stageApprovals || stageApprovals.length === 0) return null

                const latestApproval = stageApprovals[0]

                return (
                  <div key={stage} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {STAGE_LABELS[stage] || stage}
                        <Badge variant="secondary" className="text-xs">
                          {stageApprovals.length} version{stageApprovals.length > 1 ? 's' : ''}
                        </Badge>
                      </h3>
                      <Badge className={APPROVAL_STATUS_COLORS[latestApproval.status] || ''}>
                        {APPROVAL_STATUS_LABELS[latestApproval.status] || latestApproval.status_display || latestApproval.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {stageApprovals.map((approval) => (
                        <div
                          key={approval.id}
                          className="flex items-start gap-4 p-3 bg-muted/30 rounded-md"
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
                              {approval.approver_contact && (
                                <p>
                                  Approver: {approval.approver_contact.full_name || 'N/A'}
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
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ApprovalDialog
        dealId={dealId}
        approval={editingApproval}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingApproval(null)
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
