import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/AppLayout'
import { useBrief, useDeleteBrief } from '@/api/hooks/useArtistSales'
import { BRIEF_STATUS_LABELS, BRIEF_STATUS_COLORS } from '@/types/artist-sales'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function BriefDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const briefId = id ? Number(id) : 0

  const { data: brief, isLoading } = useBrief(briefId, briefId > 0)
  const deleteBrief = useDeleteBrief()

  const handleDelete = async () => {
    try {
      await deleteBrief.mutateAsync(briefId)
      toast.success('Brief deleted successfully')
      navigate('/artist-sales/briefs')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete brief')
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!brief) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
          <p className="text-muted-foreground">Brief not found</p>
          <Button onClick={() => navigate('/artist-sales/briefs')}>
            Back to Briefs
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/artist-sales/briefs')} aria-label="Go back to briefs">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{brief.campaign_title}</h1>
                <Badge className={cn(BRIEF_STATUS_COLORS[brief.brief_status])}>
                  {BRIEF_STATUS_LABELS[brief.brief_status]}
                </Badge>
                {brief.is_overdue && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Overdue
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{brief.account.display_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/artist-sales/briefs/${brief.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this brief. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account</p>
                <p className="text-base">{brief.account.display_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Brand Category</p>
                <p className="text-base">{brief.brand_category || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received Date</p>
                <p className="text-base">{formatDate(brief.received_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">SLA Due Date</p>
                <p className="text-base">{brief.sla_due_date ? formatDate(brief.sla_due_date) : '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={cn(BRIEF_STATUS_COLORS[brief.brief_status])}>
                  {BRIEF_STATUS_LABELS[brief.brief_status]}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currency</p>
                <p className="text-base">{brief.currency}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Information */}
        {(brief.budget_range_min || brief.budget_range_max) && (
          <Card>
            <CardHeader>
              <CardTitle>Budget Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Minimum Budget</p>
                  <p className="text-base">{brief.budget_range_min ? `${brief.currency} ${brief.budget_range_min}` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Maximum Budget</p>
                  <p className="text-base">{brief.budget_range_max ? `${brief.currency} ${brief.budget_range_max}` : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deliverables & Notes */}
        {(brief.deliverables_requested || brief.notes) && (
          <Card>
            <CardHeader>
              <CardTitle>Deliverables & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {brief.deliverables_requested && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Deliverables Requested</p>
                  <p className="text-base whitespace-pre-wrap">{brief.deliverables_requested}</p>
                </div>
              )}
              {brief.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <p className="text-base whitespace-pre-wrap">{brief.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-base">{formatDate(brief.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-base">{formatDate(brief.updated_at)}</p>
              </div>
            </div>
            {brief.created_by && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="text-base">{brief.created_by.full_name || brief.created_by.email}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
