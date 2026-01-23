/**
 * DistributionInvoicesTab - Invoices tab for distribution detail page
 *
 * Features:
 * - List invoices linked to distribution
 * - Financial summary cards
 * - Link existing invoice
 * - Upload new invoice
 */

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Receipt,
  Trash2,
  Upload,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn, formatMoney, formatDate } from '@/lib/utils'
import {
  useDistributionInvoices,
  useUnlinkDistributionInvoice,
  DistributionInvoice,
} from '@/api/hooks/useDistributions'

interface DistributionInvoicesTabProps {
  distributionId: number
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  sent: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
  paid: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  overdue: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  cancelled: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
}

export function DistributionInvoicesTab({ distributionId }: DistributionInvoicesTabProps) {
  const [invoiceToUnlink, setInvoiceToUnlink] = useState<DistributionInvoice | null>(null)

  const { data: invoices, isLoading } = useDistributionInvoices(distributionId)
  const unlinkInvoice = useUnlinkDistributionInvoice()

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    if (!invoices) return { totalIncome: 0, totalExpense: 0, paidIncome: 0, paidExpense: 0 }

    return invoices.reduce(
      (acc, inv) => {
        const amount = parseFloat(inv.amount || '0')
        if (inv.invoice_type === 'income') {
          acc.totalIncome += amount
          if (inv.status === 'paid') acc.paidIncome += amount
        } else {
          acc.totalExpense += amount
          if (inv.status === 'paid') acc.paidExpense += amount
        }
        return acc
      },
      { totalIncome: 0, totalExpense: 0, paidIncome: 0, paidExpense: 0 }
    )
  }, [invoices])

  const handleUnlinkInvoice = async () => {
    if (!invoiceToUnlink) return
    await unlinkInvoice.mutateAsync({
      distributionId,
      invoiceLinkId: invoiceToUnlink.id,
    })
    setInvoiceToUnlink(null)
  }

  const incomeInvoices = invoices?.filter((inv) => inv.invoice_type === 'income') || []
  const expenseInvoices = invoices?.filter((inv) => inv.invoice_type === 'expense') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">Invoices</h3>
          <p className="text-sm text-muted-foreground">
            Track revenue and expenses for this distribution deal
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link to={`/invoices?origin=distribution&distribution_id=${distributionId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View All
            </Link>
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Income</p>
              <p className="text-lg font-semibold text-emerald-600">
                {formatMoney(financialSummary.totalIncome)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-lg font-semibold text-red-600">
                {formatMoney(financialSummary.totalExpense)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Receipt className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid Income</p>
              <p className="text-lg font-semibold">
                {formatMoney(financialSummary.paidIncome)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Receipt className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Profit</p>
              <p
                className={cn(
                  'text-lg font-semibold',
                  financialSummary.paidIncome - financialSummary.paidExpense >= 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                )}
              >
                {formatMoney(financialSummary.paidIncome - financialSummary.paidExpense)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice Lists */}
      {isLoading ? (
        <Card className="p-8 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading invoices...</p>
        </Card>
      ) : invoices && invoices.length > 0 ? (
        <div className="space-y-6">
          {/* Income Invoices */}
          {incomeInvoices.length > 0 && (
            <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                </div>
                <h4 className="font-medium">Income ({incomeInvoices.length})</h4>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeInvoices.map((invoice) => {
                    const statusColor = STATUS_COLORS[invoice.status] || STATUS_COLORS.draft
                    return (
                      <TableRow key={invoice.id} className="border-white/10">
                        <TableCell>
                          <Link
                            to={`/invoices/${invoice.invoice_id}`}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{invoice.invoice_number}</p>
                              <p className="text-xs text-muted-foreground">{invoice.invoice_name}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('gap-1', statusColor.bg, statusColor.text)}
                          >
                            <span className={cn('h-1.5 w-1.5 rounded-full', statusColor.dot)} />
                            {invoice.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {invoice.amount ? formatMoney(parseFloat(invoice.amount), invoice.currency) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invoice.issue_date ? formatDate(invoice.issue_date) : '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setInvoiceToUnlink(invoice)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Expense Invoices */}
          {expenseInvoices.length > 0 && (
            <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/20">
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                </div>
                <h4 className="font-medium">Expenses ({expenseInvoices.length})</h4>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseInvoices.map((invoice) => {
                    const statusColor = STATUS_COLORS[invoice.status] || STATUS_COLORS.draft
                    return (
                      <TableRow key={invoice.id} className="border-white/10">
                        <TableCell>
                          <Link
                            to={`/invoices/${invoice.invoice_id}`}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{invoice.invoice_number}</p>
                              <p className="text-xs text-muted-foreground">{invoice.invoice_name}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('gap-1', statusColor.bg, statusColor.text)}
                          >
                            <span className={cn('h-1.5 w-1.5 rounded-full', statusColor.dot)} />
                            {invoice.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {invoice.amount ? formatMoney(parseFloat(invoice.amount), invoice.currency) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invoice.issue_date ? formatDate(invoice.issue_date) : '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setInvoiceToUnlink(invoice)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-8 w-8 text-cyan-500" />
          </div>
          <h4 className="font-semibold mb-2">No invoices yet</h4>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Link invoices to track revenue and expenses for this distribution deal.
          </p>
        </Card>
      )}

      {/* Unlink Confirmation Dialog */}
      <AlertDialog open={!!invoiceToUnlink} onOpenChange={() => setInvoiceToUnlink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link between this invoice and the distribution. The invoice
              itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinkInvoice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Unlink'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
