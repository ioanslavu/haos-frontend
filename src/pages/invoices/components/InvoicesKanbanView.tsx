/**
 * InvoicesKanbanView - Display invoices in a Kanban board by status
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, FileUp, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons'
import { InvoiceTypeBadge } from './InvoiceTypeBadge'
import type { Invoice, InvoiceStatus } from '@/types/invoice'
import type { Platform } from '@/types/campaign'

interface InvoicesKanbanViewProps {
  invoices: Invoice[]
  loading?: boolean
}

interface KanbanColumn {
  status: InvoiceStatus
  label: string
  icon: typeof FileText
  color: string
  bgColor: string
}

const columns: KanbanColumn[] = [
  {
    status: 'draft',
    label: 'Draft',
    icon: FileText,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
  },
  {
    status: 'uploaded',
    label: 'Uploaded',
    icon: FileUp,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    status: 'paid',
    label: 'Paid',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    status: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
]

const currencySymbols: Record<string, string> = {
  EUR: '\u20AC',
  USD: '$',
  GBP: '\u00A3',
  RON: 'RON',
}

function formatAmount(amount: string | null, currency: string): string {
  if (!amount) return '-'
  const num = parseFloat(amount)
  const symbol = currencySymbols[currency] || currency
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function InvoiceKanbanCard({ invoice }: { invoice: Invoice }) {
  const navigate = useNavigate()
  const platform = invoice.platform as Platform | null

  return (
    <Card
      className="rounded-xl border-white/10 bg-background/70 backdrop-blur-sm hover:bg-background/90 cursor-pointer transition-all hover:shadow-lg"
      onClick={() => navigate(`/invoices/${invoice.id}`)}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header: Invoice number + Type badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {invoice.invoice_number}
          </span>
          <InvoiceTypeBadge type={invoice.invoice_type} />
        </div>

        {/* Client with platform icon */}
        <div className="flex items-center gap-2">
          {invoice.origin_type === 'subcampaign' && platform ? (
            (() => {
              const Icon = PLATFORM_ICONS[platform]
              const brandColor = PLATFORM_COLORS[platform]
              return Icon ? (
                <Icon className={cn('h-4 w-4 flex-shrink-0', brandColor?.split(' ')[0] || 'text-muted-foreground')} />
              ) : null
            })()
          ) : null}
          <span className="text-sm font-medium truncate">
            {invoice.client_name || invoice.name}
          </span>
        </div>

        {/* Origin group name if different from client */}
        {invoice.origin_group_name && invoice.origin_group_name !== invoice.client_name && (
          <div className="text-xs text-muted-foreground truncate">
            {invoice.origin_group_type === 'campaign' ? 'Campaign: ' : 'Distribution: '}
            {invoice.origin_group_name}
          </div>
        )}

        {/* Amount */}
        <div className={cn(
          'text-lg font-semibold',
          invoice.invoice_type === 'income' ? 'text-emerald-600' : 'text-orange-600'
        )}>
          {invoice.amount ? (
            <>
              {invoice.invoice_type === 'income' ? '+' : '-'}
              {formatAmount(invoice.amount, invoice.currency)}
            </>
          ) : (
            <span className="text-sm text-muted-foreground italic font-normal">Amount pending</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumnComponent({ column, invoices, loading }: { column: KanbanColumn; invoices: Invoice[]; loading?: boolean }) {
  const Icon = column.icon

  return (
    <div className="flex-1 min-w-[280px] max-w-[320px]">
      <Card className="rounded-2xl border-white/10 bg-background/30 backdrop-blur-xl h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-lg', column.bgColor)}>
                <Icon className={cn('h-4 w-4', column.color)} />
              </div>
              <CardTitle className="text-sm font-medium">{column.label}</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">
              {invoices.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
            {loading ? (
              // Loading skeleton
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="rounded-xl border-white/10 bg-background/50 animate-pulse">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 w-20 bg-muted rounded" />
                        <div className="h-5 w-16 bg-muted rounded" />
                      </div>
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-6 w-24 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No invoices
              </div>
            ) : (
              invoices.map((invoice) => (
                <InvoiceKanbanCard key={invoice.id} invoice={invoice} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function InvoicesKanbanView({ invoices, loading }: InvoicesKanbanViewProps) {
  const invoicesByStatus = useMemo(() => {
    const grouped: Record<InvoiceStatus, Invoice[]> = {
      draft: [],
      uploaded: [],
      paid: [],
      cancelled: [],
    }

    invoices.forEach((invoice) => {
      if (grouped[invoice.status]) {
        grouped[invoice.status].push(invoice)
      }
    })

    return grouped
  }, [invoices])

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <KanbanColumnComponent
          key={column.status}
          column={column}
          invoices={invoicesByStatus[column.status]}
          loading={loading}
        />
      ))}
    </div>
  )
}
