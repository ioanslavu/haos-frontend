/**
 * InvoicesGroupedView - Display invoices grouped by origin (campaign/distribution)
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Megaphone, Share2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import { InvoiceTypeBadge } from './InvoiceTypeBadge'
import type { Invoice } from '@/types/invoice'
import type { Platform } from '@/types/campaign'
import { formatDistanceToNow } from 'date-fns'

interface InvoicesGroupedViewProps {
  invoices: Invoice[]
  loading?: boolean
}

interface InvoiceGroup {
  groupId: string
  groupName: string
  groupType: 'campaign' | 'distribution' | 'ungrouped'
  clientName: string | null
  invoices: Invoice[]
}

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

function InvoiceGroupCard({ group, defaultExpanded = true }: { group: InvoiceGroup; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const navigate = useNavigate()

  const GroupIcon = group.groupType === 'campaign' ? Megaphone : group.groupType === 'distribution' ? Share2 : FileText
  const groupColor = group.groupType === 'campaign'
    ? 'bg-violet-500/10 text-violet-500'
    : group.groupType === 'distribution'
    ? 'bg-emerald-500/10 text-emerald-500'
    : 'bg-muted text-muted-foreground'

  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          <div className={cn('p-2 rounded-lg', groupColor)}>
            <GroupIcon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{group.groupName}</span>
              <Badge variant="secondary" className="text-xs">
                {group.invoices.length} {group.invoices.length === 1 ? 'invoice' : 'invoices'}
              </Badge>
            </div>
            {group.clientName && (
              <span className="text-xs text-muted-foreground">{group.clientName}</span>
            )}
          </div>

          <Badge variant="outline" className="text-xs capitalize">
            {group.groupType}
          </Badge>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-2 px-2">
          <div className="space-y-1">
            {group.invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} onClick={() => navigate(`/invoices/${invoice.id}`)} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function InvoiceRow({ invoice, onClick }: { invoice: Invoice; onClick: () => void }) {
  const platform = invoice.platform as Platform | null

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Platform icon for subcampaigns */}
      <div className="w-6 flex justify-center">
        {invoice.origin_type === 'subcampaign' && platform ? (
          (() => {
            const Icon = PLATFORM_ICONS[platform]
            const brandColor = PLATFORM_COLORS[platform]
            return Icon ? (
              <Icon className={cn('h-4 w-4', brandColor?.split(' ')[0] || 'text-muted-foreground')} />
            ) : null
          })()
        ) : (
          <div className="w-4" />
        )}
      </div>

      {/* Invoice number */}
      <span className="font-mono text-sm text-muted-foreground w-28 flex-shrink-0">
        {invoice.invoice_number}
      </span>

      {/* Name */}
      <span className="flex-1 truncate text-sm">{invoice.name}</span>

      {/* Type badge */}
      <InvoiceTypeBadge type={invoice.invoice_type} />

      {/* Amount */}
      <span className={cn(
        'w-28 text-right text-sm font-medium',
        invoice.invoice_type === 'income' ? 'text-emerald-600' : 'text-orange-600'
      )}>
        {invoice.amount ? (
          <>
            {invoice.invoice_type === 'income' ? '+' : '-'}
            {formatAmount(invoice.amount, invoice.currency)}
          </>
        ) : (
          <span className="text-muted-foreground italic">Pending</span>
        )}
      </span>

      {/* Status */}
      <div className="w-24">
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      {/* Date */}
      <span className="text-xs text-muted-foreground w-24 text-right">
        {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
      </span>
    </div>
  )
}

export function InvoicesGroupedView({ invoices, loading }: InvoicesGroupedViewProps) {
  const groups = useMemo(() => {
    const groupMap = new Map<string, InvoiceGroup>()

    invoices.forEach((invoice) => {
      let groupId: string
      let groupName: string
      let groupType: 'campaign' | 'distribution' | 'ungrouped'

      if (invoice.origin_group_id && invoice.origin_group_type) {
        // Group by origin
        groupId = `${invoice.origin_group_type}-${invoice.origin_group_id}`
        groupName = invoice.origin_group_name || `${invoice.origin_group_type} #${invoice.origin_group_id}`
        groupType = invoice.origin_group_type as 'campaign' | 'distribution'
      } else {
        // Ungrouped invoices
        groupId = 'ungrouped'
        groupName = 'Other Invoices'
        groupType = 'ungrouped'
      }

      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          groupId,
          groupName,
          groupType,
          clientName: invoice.client_name,
          invoices: [],
        })
      }

      groupMap.get(groupId)!.invoices.push(invoice)
    })

    // Sort groups: campaigns first, then distributions, then ungrouped
    const sortedGroups = Array.from(groupMap.values()).sort((a, b) => {
      const typeOrder = { campaign: 0, distribution: 1, ungrouped: 2 }
      if (typeOrder[a.groupType] !== typeOrder[b.groupType]) {
        return typeOrder[a.groupType] - typeOrder[b.groupType]
      }
      return a.groupName.localeCompare(b.groupName)
    })

    return sortedGroups
  }, [invoices])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl animate-pulse">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-muted rounded" />
                <div className="h-8 w-8 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded mt-1" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No invoices to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <InvoiceGroupCard key={group.groupId} group={group} />
      ))}
    </div>
  )
}
