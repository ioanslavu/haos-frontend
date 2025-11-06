import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Loader2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/AppLayout'
import { useOpportunity, useDeleteOpportunity } from '@/api/hooks/useArtistSales'
import { OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGE_COLORS } from '@/types/artist-sales'
import { formatDate, formatCurrency } from '@/lib/utils'
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

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const opportunityId = id ? Number(id) : 0

  const { data: opportunity, isLoading } = useOpportunity(opportunityId, opportunityId > 0)
  const deleteOpportunity = useDeleteOpportunity()

  const handleDelete = async () => {
    try {
      await deleteOpportunity.mutateAsync(opportunityId)
      toast.success('Opportunity deleted successfully')
      navigate('/artist-sales/opportunities')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete opportunity')
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

  if (!opportunity) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
          <p className="text-muted-foreground">Opportunity not found</p>
          <Button onClick={() => navigate('/artist-sales/opportunities')}>
            Back to Opportunities
          </Button>
        </div>
      </AppLayout>
    )
  }

  const weightedValue = opportunity.amount_expected
    ? (Number(opportunity.amount_expected) * opportunity.probability_percent) / 100
    : 0

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/artist-sales/opportunities')} aria-label="Go back to opportunities">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{opportunity.opp_name}</h1>
                <Badge className={cn(OPPORTUNITY_STAGE_COLORS[opportunity.stage])}>
                  {OPPORTUNITY_STAGE_LABELS[opportunity.stage]}
                </Badge>
              </div>
              <p className="text-muted-foreground">{opportunity.account.display_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/artist-sales/opportunities/${opportunity.id}/edit`)}
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
                    This will permanently delete this opportunity. This action cannot be undone.
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

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expected Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {opportunity.amount_expected ? formatCurrency(Number(opportunity.amount_expected), opportunity.currency) : '-'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Probability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{opportunity.probability_percent}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Weighted Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(weightedValue, opportunity.currency)}
              </div>
            </CardContent>
          </Card>
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
                <p className="text-base">{opportunity.account.display_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stage</p>
                <Badge className={cn(OPPORTUNITY_STAGE_COLORS[opportunity.stage])}>
                  {OPPORTUNITY_STAGE_LABELS[opportunity.stage]}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Close Date</p>
                <p className="text-base">{opportunity.expected_close_date ? formatDate(opportunity.expected_close_date) : '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currency</p>
                <p className="text-base">{opportunity.currency}</p>
              </div>
            </div>
            {opportunity.brief && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Related Brief</p>
                <p className="text-base">
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/artist-sales/briefs/${opportunity.brief!.id}`)}
                  >
                    {opportunity.brief.campaign_title}
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lost Reason (if applicable) */}
        {opportunity.stage === 'closed_lost' && opportunity.lost_reason && (
          <Card>
            <CardHeader>
              <CardTitle>Lost Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap">{opportunity.lost_reason}</p>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {opportunity.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap">{opportunity.notes}</p>
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
                <p className="text-base">{formatDate(opportunity.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-base">{formatDate(opportunity.updated_at)}</p>
              </div>
            </div>
            {opportunity.created_by && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="text-base">{opportunity.created_by.full_name || opportunity.created_by.email}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
