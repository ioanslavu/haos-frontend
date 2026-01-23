/**
 * OpportunityInvoicesSection - Display and manage invoices linked to an opportunity
 *
 * Features:
 * - List linked invoices with type badges
 * - Primary invoice indicator
 * - Link existing invoice
 * - Unlink invoice
 * - Invoice status display
 */

import { useState } from 'react'
import {
  Plus,
  Trash2,
  FileText,
  Star,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  useOpportunityInvoices,
  useLinkInvoice,
  useUnlinkInvoice,
  useUpdateInvoiceLink,
} from '@/api/hooks/useOpportunities'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import type { InvoiceType, OpportunityInvoiceLink } from '@/api/services/opportunities.service'

// Invoice type configuration
const INVOICE_TYPE_CONFIG: Record<InvoiceType, { label: string; color: string }> = {
  advance: { label: 'Advance', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  milestone: { label: 'Milestone', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  final: { label: 'Final', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
  full: { label: 'Full', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
}

// Invoice status configuration
const INVOICE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-500/10 text-gray-500' },
  sent: { label: 'Sent', color: 'bg-blue-500/10 text-blue-500' },
  paid: { label: 'Paid', color: 'bg-green-500/10 text-green-500' },
  overdue: { label: 'Overdue', color: 'bg-red-500/10 text-red-500' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/10 text-gray-500' },
}

interface OpportunityInvoicesSectionProps {
  opportunityId: number
}

export function OpportunityInvoicesSection({ opportunityId }: OpportunityInvoicesSectionProps) {
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null)

  const { data: invoiceLinks = [], isLoading } = useOpportunityInvoices(opportunityId)
  const unlinkMutation = useUnlinkInvoice()
  const updateLinkMutation = useUpdateInvoiceLink()

  const handleUnlink = async () => {
    if (!unlinkingId) return
    await unlinkMutation.mutateAsync({ linkId: unlinkingId, opportunityId })
    setUnlinkingId(null)
  }

  const handleSetPrimary = async (linkId: number) => {
    await updateLinkMutation.mutateAsync({
      linkId,
      opportunityId,
      data: { is_primary: true },
    })
  }

  // Calculate totals
  const totalInvoiced = invoiceLinks.reduce((sum, link) => {
    return sum + parseFloat(link.invoice_details?.total_amount || '0')
  }, 0)

  const paidAmount = invoiceLinks
    .filter(link => link.invoice_details?.status === 'paid')
    .reduce((sum, link) => sum + parseFloat(link.invoice_details?.total_amount || '0'), 0)

  if (isLoading) {
    return (
      <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices
              {invoiceLinks.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {invoiceLinks.length}
                </Badge>
              )}
            </h3>
            {invoiceLinks.length > 0 && (
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>
                  Total: <span className="font-medium text-foreground">{formatMoney(totalInvoiced, 'EUR')}</span>
                </span>
                <span>
                  Paid: <span className="font-medium text-green-500">{formatMoney(paidAmount, 'EUR')}</span>
                </span>
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setShowLinkModal(true)}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Link Invoice
          </Button>
        </div>

        {invoiceLinks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No invoices linked to this opportunity</p>
            <p className="text-sm mt-1">Link existing invoices to track payments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoiceLinks.map(link => {
              const typeConfig = INVOICE_TYPE_CONFIG[link.invoice_type]
              const statusConfig = INVOICE_STATUS_CONFIG[link.invoice_details?.status || 'draft']

              return (
                <div
                  key={link.id}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-xl bg-background/30 backdrop-blur-sm transition-all',
                    link.is_primary ? 'border-primary/50 ring-1 ring-primary/20' : 'border-white/10'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {link.is_primary && (
                      <Star className="h-4 w-4 text-primary fill-primary" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {link.invoice_details?.invoice_number || `Invoice #${link.invoice}`}
                        </span>
                        <Badge variant="outline" className={cn('text-xs', typeConfig?.color)}>
                          {typeConfig?.label || link.invoice_type}
                        </Badge>
                        <Badge variant="secondary" className={cn('text-xs', statusConfig?.color)}>
                          {statusConfig?.label || link.invoice_details?.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {link.invoice_details?.client_name && (
                          <span>{link.invoice_details.client_name} · </span>
                        )}
                        {link.invoice_details?.due_date && (
                          <span>Due: {formatDate(link.invoice_details.due_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-emerald-500">
                      {link.invoice_details?.total_amount
                        ? formatMoney(parseFloat(link.invoice_details.total_amount), link.invoice_details.currency || 'EUR')
                        : '-'}
                    </span>

                    {!link.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleSetPrimary(link.id)}
                        title="Set as primary"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => window.open(`/invoices/${link.invoice}`, '_blank')}
                      title="View invoice"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setUnlinkingId(link.id)}
                      title="Unlink invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Link Invoice Modal */}
      <LinkInvoiceModal
        open={showLinkModal}
        onOpenChange={setShowLinkModal}
        opportunityId={opportunityId}
      />

      {/* Unlink Confirmation */}
      <AlertDialog open={!!unlinkingId} onOpenChange={(open) => !open && setUnlinkingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this invoice from the opportunity?
              The invoice will not be deleted, only the link will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlink}
              className="bg-destructive hover:bg-destructive/90"
            >
              {unlinkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Unlink'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Link Invoice Modal Component
interface LinkInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunityId: number
}

function LinkInvoiceModal({ open, onOpenChange, opportunityId }: LinkInvoiceModalProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null)
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('full')
  const [isPrimary, setIsPrimary] = useState(false)

  const linkMutation = useLinkInvoice()

  const handleLink = async () => {
    if (!selectedInvoice) return

    await linkMutation.mutateAsync({
      opportunity: opportunityId,
      invoice: selectedInvoice,
      invoice_type: invoiceType,
      is_primary: isPrimary,
    })

    onOpenChange(false)
    setSelectedInvoice(null)
    setInvoiceType('full')
    setIsPrimary(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Invoice</DialogTitle>
          <DialogDescription>
            Link an existing invoice to this opportunity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Search/Select - placeholder for now */}
          <div>
            <label className="text-sm font-medium mb-2 block">Invoice ID</label>
            <input
              type="number"
              placeholder="Enter invoice ID"
              className="w-full px-3 py-2 border rounded-lg bg-background"
              value={selectedInvoice || ''}
              onChange={(e) => setSelectedInvoice(e.target.value ? Number(e.target.value) : null)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the ID of the invoice to link
            </p>
          </div>

          {/* Invoice Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Invoice Type</label>
            <Select value={invoiceType} onValueChange={(v) => setInvoiceType(v as InvoiceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INVOICE_TYPE_CONFIG).map(([type, config]) => (
                  <SelectItem key={type} value={type}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isPrimary" className="text-sm">
              Set as primary invoice
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedInvoice || linkMutation.isPending}
          >
            {linkMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Link Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
