import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppLayout } from '@/components/layout/AppLayout'
import { useDeal, useDeleteDeal } from '@/api/hooks/useArtistSales'
import { DEAL_STATUS_LABELS, DEAL_STATUS_COLORS } from '@/types/artist-sales'
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
import { DealArtistsTab } from './components/DealArtistsTab'
import { DealDeliverablesTab } from './components/DealDeliverablesTab'
import { DealApprovalsTab } from './components/DealApprovalsTab'
import { DealTimeline } from './components/DealTimeline'

export default function DealDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dealId = id ? Number(id) : 0

  const { data: deal, isLoading } = useDeal(dealId, dealId > 0)
  const deleteDeal = useDeleteDeal()

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(dealId)
      toast.success('Deal deleted successfully')
      navigate('/artist-sales/deals')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete deal')
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

  if (!deal) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
          <p className="text-muted-foreground">Deal not found</p>
          <Button onClick={() => navigate('/artist-sales/deals')}>
            Back to Deals
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/artist-sales/deals')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{deal.deal_title}</h1>
                <Badge className={cn(DEAL_STATUS_COLORS[deal.deal_status])}>
                  {DEAL_STATUS_LABELS[deal.deal_status]}
                </Badge>
                <Badge variant="outline">{deal.contract_number}</Badge>
              </div>
              <p className="text-muted-foreground">{deal.account.display_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/artist-sales/deals/${deal.id}/edit`)}
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
                    This will permanently delete this deal. This action cannot be undone.
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(Number(deal.fee_total), deal.currency)}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="deliverables">
              Deliverables
              {deal.deliverables_count && deal.deliverables_count > 0 && (
                <Badge variant="secondary" className="ml-2">{deal.deliverables_count}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="artists">
              Artists
              {deal.artists_count && deal.artists_count > 0 && (
                <Badge variant="secondary" className="ml-2">{deal.artists_count}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contract Number</p>
                    <p className="text-base">{deal.contract_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">PO Number</p>
                    <p className="text-base">{deal.po_number || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account</p>
                    <p className="text-base">{deal.account.display_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={cn(DEAL_STATUS_COLORS[deal.deal_status])}>
                      {DEAL_STATUS_LABELS[deal.deal_status]}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-base">{deal.start_date ? formatDate(deal.start_date) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-base">{deal.end_date ? formatDate(deal.end_date) : '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Related Opportunity</p>
                  <p className="text-base">
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => navigate(`/artist-sales/opportunities/${deal.opportunity.id}`)}
                    >
                      {deal.opportunity.opp_name}
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>

            {deal.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base whitespace-pre-wrap">{deal.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p className="text-base">{formatDate(deal.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-base">{formatDate(deal.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliverables">
            <DealDeliverablesTab dealId={deal.id} />
          </TabsContent>

          <TabsContent value="artists">
            <DealArtistsTab dealId={deal.id} currency={deal.currency} />
          </TabsContent>

          <TabsContent value="approvals">
            <DealApprovalsTab dealId={deal.id} />
          </TabsContent>

          <TabsContent value="timeline">
            <DealTimeline deal={deal} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
