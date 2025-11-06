import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/AppLayout'
import { useProposal, useDeleteProposal } from '@/api/hooks/useArtistSales'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } from '@/types/artist-sales'
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
import { ProposalArtistsSection } from './components/ProposalArtistsSection'
import { ProposalPreview } from './components/ProposalPreview'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSendProposalToClient } from '@/api/hooks/useArtistSales'

export default function ProposalDetail() {
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [ccEmails, setCcEmails] = useState('')
  const [message, setMessage] = useState('')
  const sendMutation = useSendProposalToClient()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const proposalId = id ? Number(id) : 0

  const { data: proposal, isLoading } = useProposal(proposalId, proposalId > 0)
  const deleteProposal = useDeleteProposal()

  const handleDelete = async () => {
    try {
      await deleteProposal.mutateAsync(proposalId)
      toast.success('Proposal deleted successfully')
      navigate('/artist-sales/proposals')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete proposal')
    }
  }

  const handleSendToClient = async () => {
    try {
      const cc = ccEmails.split(',').map(e => e.trim()).filter(e => e)
      await sendMutation.mutateAsync({
        id: proposalId,
        data: {
          recipient_email: recipientEmail,
          cc_emails: cc,
          message,
        },
      })
      toast.success('Proposal sent successfully')
      setSendDialogOpen(false)
      setRecipientEmail('')
      setCcEmails('')
      setMessage('')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send proposal')
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

  if (!proposal) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
          <p className="text-muted-foreground">Proposal not found</p>
          <Button onClick={() => navigate('/artist-sales/proposals')}>
            Back to Proposals
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        <div className="flex items-start justify-between print:block">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/artist-sales/proposals')} className="print:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{proposal.opportunity.opp_name}</h1>
                <Badge variant="outline" className="print:hidden">v{proposal.version}</Badge>
                <Badge className={cn(PROPOSAL_STATUS_COLORS[proposal.proposal_status], "print:hidden")}>
                  {PROPOSAL_STATUS_LABELS[proposal.proposal_status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">{proposal.opportunity.account_name}</p>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/artist-sales/proposals/${proposal.id}/edit`)}
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
                    This will permanently delete this proposal. This action cannot be undone.
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

        <div className="print:hidden grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gross Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(Number(proposal.fee_gross), proposal.currency)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(Number(proposal.fee_net), proposal.currency)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Proposal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Opportunity</p>
                <p className="text-base">
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => navigate(`/artist-sales/opportunities/${proposal.opportunity.id}`)}
                  >
                    {proposal.opportunity.opp_name}
                  </Button>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={cn(PROPOSAL_STATUS_COLORS[proposal.proposal_status])}>
                  {PROPOSAL_STATUS_LABELS[proposal.proposal_status]}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sent Date</p>
                <p className="text-base">{proposal.sent_date ? formatDate(proposal.sent_date) : '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
                <p className="text-base">{proposal.valid_until ? formatDate(proposal.valid_until) : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="print:hidden">
          <ProposalArtistsSection proposalId={proposal.id} currency={proposal.currency} />
        </div>

        <ProposalPreview
          proposal={proposal}
          onSendToClient={() => setSendDialogOpen(true)}
        />

        {proposal.notes && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap">{proposal.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-base">{formatDate(proposal.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-base">{formatDate(proposal.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send to Client Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Proposal to Client</DialogTitle>
            <DialogDescription>
              Enter the client's email address and an optional message to send this proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email *</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="client@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc">CC (comma-separated)</Label>
              <Input
                id="cc"
                type="text"
                placeholder="person1@example.com, person2@example.com"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialogOpen(false)}
              disabled={sendMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendToClient}
              disabled={!recipientEmail || sendMutation.isPending}
            >
              {sendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
