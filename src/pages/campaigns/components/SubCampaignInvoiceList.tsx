/**
 * SubCampaignInvoiceList - Display and manage invoices linked to a subcampaign
 *
 * Features:
 * - List invoices with status badges
 * - Show extraction status for pending items
 * - Actions: accept extraction, set amount, unlink
 * - Link to full invoice detail
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  MoreHorizontal,
  ExternalLink,
  Trash2,
  CheckCircle,
  RefreshCw,
  FileText,
  Loader2,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { SubCampaign, SubCampaignInvoiceLink } from '@/types/campaign'
import {
  useSubCampaignInvoices,
  useUnlinkSubCampaignInvoice,
  useAcceptSubCampaignInvoiceExtraction,
  useRetrySubCampaignInvoiceExtraction,
} from '@/api/hooks/useCampaigns'

interface SubCampaignInvoiceListProps {
  campaignId: number
  subcampaign: SubCampaign
  onAddInvoice: () => void
}

function ExtractionStatusBadge({ status }: { status: SubCampaignInvoiceLink['extraction_status'] }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          Pending
        </Badge>
      )
    case 'processing':
      return (
        <Badge variant="outline" className="gap-1 text-xs text-blue-600 border-blue-600/30 bg-blue-500/10">
          <Sparkles className="h-3 w-3 animate-pulse" />
          Extracting
        </Badge>
      )
    case 'success':
      return (
        <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-600/30 bg-green-500/10">
          <CheckCircle className="h-3 w-3" />
          Extracted
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="outline" className="gap-1 text-xs text-red-600 border-red-600/30 bg-red-500/10">
          <AlertCircle className="h-3 w-3" />
          Failed
        </Badge>
      )
    case 'manual':
      return (
        <Badge variant="outline" className="gap-1 text-xs">
          Manual
        </Badge>
      )
    default:
      return null
  }
}

function InvoiceStatusBadge({ status }: { status: SubCampaignInvoiceLink['status'] }) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline">Draft</Badge>
    case 'uploaded':
      return <Badge variant="secondary">Uploaded</Badge>
    case 'paid':
      return <Badge variant="default" className="bg-green-500">Paid</Badge>
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function SubCampaignInvoiceList({
  campaignId,
  subcampaign,
  onAddInvoice,
}: SubCampaignInvoiceListProps) {
  const navigate = useNavigate()
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false)
  const [invoiceToUnlink, setInvoiceToUnlink] = useState<SubCampaignInvoiceLink | null>(null)

  // Queries
  const { data: invoices, isLoading, error } = useSubCampaignInvoices(
    campaignId,
    subcampaign.id
  )

  // Mutations
  const unlinkMutation = useUnlinkSubCampaignInvoice()
  const acceptExtractionMutation = useAcceptSubCampaignInvoiceExtraction()
  const retryExtractionMutation = useRetrySubCampaignInvoiceExtraction()

  const handleUnlink = async () => {
    if (!invoiceToUnlink) return

    try {
      await unlinkMutation.mutateAsync({
        campaignId,
        subcampaignId: subcampaign.id,
        invoiceLinkId: invoiceToUnlink.id,
      })
      setUnlinkDialogOpen(false)
      setInvoiceToUnlink(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleAcceptExtraction = async (invoice: SubCampaignInvoiceLink) => {
    try {
      await acceptExtractionMutation.mutateAsync({
        campaignId,
        subcampaignId: subcampaign.id,
        invoiceLinkId: invoice.id,
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleRetryExtraction = async (invoice: SubCampaignInvoiceLink) => {
    try {
      await retryExtractionMutation.mutateAsync({
        campaignId,
        subcampaignId: subcampaign.id,
        invoiceLinkId: invoice.id,
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Failed to load invoices</p>
      </div>
    )
  }

  // Empty state
  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">No invoices linked to this platform</p>
        <Button onClick={onAddInvoice} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Invoice
        </Button>
      </div>
    )
  }

  // Calculate total
  const total = invoices.reduce((sum, inv) => {
    if (inv.amount && inv.status !== 'cancelled') {
      return sum + parseFloat(inv.amount)
    }
    return sum
  }, 0)

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} &middot;{' '}
          <span className="font-medium text-foreground">
            {subcampaign.currency} {total.toFixed(2)}
          </span>{' '}
          total
        </div>
        <Button onClick={onAddInvoice} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Invoice
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Extraction</TableHead>
              <TableHead className="text-right">Added</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{invoice.invoice_name}</span>
                    <span className="text-xs text-muted-foreground">{invoice.invoice_number}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {invoice.amount ? (
                    <span>
                      {invoice.currency} {invoice.amount}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Pending</span>
                  )}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell>
                  <ExtractionStatusBadge status={invoice.extraction_status} />
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/digital/invoices/${invoice.invoice}`)}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Invoice
                      </DropdownMenuItem>

                      {/* Accept extraction if available */}
                      {invoice.extraction_status === 'success' && invoice.needs_manual_amount && (
                        <DropdownMenuItem
                          onClick={() => handleAcceptExtraction(invoice)}
                          disabled={acceptExtractionMutation.isPending}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accept Extraction
                        </DropdownMenuItem>
                      )}

                      {/* Retry extraction if failed */}
                      {invoice.extraction_status === 'failed' && invoice.has_file && (
                        <DropdownMenuItem
                          onClick={() => handleRetryExtraction(invoice)}
                          disabled={retryExtractionMutation.isPending}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Retry Extraction
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setInvoiceToUnlink(invoice)
                          setUnlinkDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Unlink Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the invoice from this platform. The invoice will not be deleted
              and can be linked again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
