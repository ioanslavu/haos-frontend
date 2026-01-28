/**
 * SubCampaignCardHeader - Collapsible header for subcampaign card
 */

import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  FileText,
  Music2,
  Trash2,
  User,
  CreditCard,
  Receipt,
  ClipboardList,
} from 'lucide-react'
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import {
  PLATFORM_CONFIG,
  PAYMENT_METHOD_CONFIG,
} from '@/types/campaign'
import type { SubCampaign } from './types'

interface SubCampaignCardHeaderProps {
  subcampaign: SubCampaign
  isExpanded: boolean
  invoiceCount: number
  onDeleteClick: () => void
  onCreateTaskClick: () => void
}

export function SubCampaignCardHeader({
  subcampaign,
  isExpanded,
  invoiceCount,
  onDeleteClick,
  onCreateTaskClick,
}: SubCampaignCardHeaderProps) {
  const platformConfig = PLATFORM_CONFIG[subcampaign.platform]
  const paymentConfig = subcampaign.payment_method
    ? PAYMENT_METHOD_CONFIG[subcampaign.payment_method]
    : null

  const budget = parseFloat(subcampaign.budget)
  const spent = parseFloat(subcampaign.spent)
  const utilization = budget > 0 ? (spent / budget) * 100 : 0

  return (
    <CollapsibleTrigger asChild>
      <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 shrink-0 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {(() => {
            const Icon = PLATFORM_ICONS[subcampaign.platform]
            const brandColor = PLATFORM_COLORS[subcampaign.platform]
            return (
              <div className={cn(
                'p-2 rounded-lg',
                brandColor ? brandColor.split(' ')[1] : 'bg-muted'
              )}>
                <Icon className={cn(
                  'h-6 w-6',
                  brandColor ? brandColor.split(' ')[0] : 'text-foreground'
                )} />
              </div>
            )
          })()}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{platformConfig.label}</h4>
            </div>

            {/* Budget Progress Summary */}
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-md">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="text-muted-foreground">Spent:</span>
                  <span className="font-medium">{formatMoney(spent, subcampaign.currency)}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">{formatMoney(budget, subcampaign.currency)}</span>
                  <span className="text-muted-foreground ml-1">
                    ({utilization.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={utilization} className="h-1.5" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Invoice Count */}
            {invoiceCount > 0 && (
              <span className="flex items-center gap-1">
                <Receipt className="h-4 w-4" />
                {invoiceCount}
              </span>
            )}
            {/* Annex Status */}
            {subcampaign.has_contract && subcampaign.contract_info ? (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs gap-1",
                  subcampaign.contract_info.status === 'signed'
                    ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                    : subcampaign.contract_info.status === 'pending_signature'
                    ? 'border-amber-500/50 text-amber-500 bg-amber-500/10'
                    : 'border-muted-foreground/50 text-muted-foreground'
                )}
              >
                <FileText className="h-3 w-3" />
                Annex {subcampaign.contract_info.status === 'signed' ? 'Signed' :
                 subcampaign.contract_info.status === 'pending_signature' ? 'Pending' :
                 subcampaign.contract_info.status === 'draft' ? 'Draft' : ''}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs gap-1 border-muted-foreground/30 text-muted-foreground/60"
              >
                <FileText className="h-3 w-3" />
                No Annex
              </Badge>
            )}
            {/* Date Warning */}
            {(!subcampaign.start_date || !subcampaign.end_date) && (
              <span className="flex items-center gap-1 text-amber-500" title="Dates not set">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-xs">Set dates</span>
              </span>
            )}
            {/* Show dates if both are set */}
            {subcampaign.start_date && subcampaign.end_date && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-xs">
                  {formatDate(subcampaign.start_date)} - {formatDate(subcampaign.end_date)}
                </span>
              </span>
            )}
            {subcampaign.song_count !== undefined && subcampaign.song_count > 0 && (
              <span className="flex items-center gap-1">
                <Music2 className="h-4 w-4" />
                {subcampaign.song_count}
              </span>
            )}
            {subcampaign.artist_count !== undefined && subcampaign.artist_count > 0 && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {subcampaign.artist_count}
              </span>
            )}
            {paymentConfig && (
              <span className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                {paymentConfig.label}
              </span>
            )}
          </div>

          {/* Create Task Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation()
              onCreateTaskClick()
            }}
            title="Create task for this platform"
          >
            <ClipboardList className="h-4 w-4" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteClick()
            }}
            title="Delete platform"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CollapsibleTrigger>
  )
}
