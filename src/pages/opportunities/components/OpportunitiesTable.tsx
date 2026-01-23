/**
 * OpportunitiesTable - Compact table view for opportunities
 *
 * Displays opportunities in a table with:
 * - Stage indicator (colored bar)
 * - Title and opportunity number
 * - Client with avatar
 * - Value
 * - Owner
 * - Expected close date
 * - Priority badge (if high/urgent)
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import type { Opportunity } from '@/types/opportunities'
import { STAGE_CONFIG, PRIORITY_CONFIG } from '@/types/opportunities'

interface OpportunitiesTableProps {
  opportunities: Opportunity[]
  onOpportunityClick: (id: number) => void
  onAccountClick: (accountId: number) => void
}

export function OpportunitiesTable({
  opportunities,
  onOpportunityClick,
  onAccountClick,
}: OpportunitiesTableProps) {
  if (opportunities.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/10">
            <TableHead className="w-[3px] p-0" />
            <TableHead>Opportunity</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Close Date</TableHead>
            <TableHead>Stage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => {
            const stageConfig = STAGE_CONFIG[opp.stage]
            const priorityConfig = PRIORITY_CONFIG[opp.priority]
            const showPriority = opp.priority === 'high' || opp.priority === 'urgent'

            return (
              <TableRow
                key={opp.id}
                className="cursor-pointer hover:bg-muted/50 border-white/10 group"
                onClick={() => onOpportunityClick(opp.id)}
              >
                {/* Stage indicator bar */}
                <TableCell className="p-0 w-[3px]">
                  <div className={cn('w-[3px] h-full min-h-[60px]', stageConfig.color)} />
                </TableCell>

                {/* Opportunity title */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {opp.title}
                        {showPriority && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0',
                              opp.priority === 'urgent'
                                ? 'border-red-500/50 text-red-500'
                                : 'border-orange-500/50 text-orange-500'
                            )}
                          >
                            {priorityConfig.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{opp.opportunity_number}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Client */}
                <TableCell>
                  <button
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (opp.account?.id) onAccountClick(opp.account.id)
                    }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {opp.account?.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate max-w-[150px]">
                      {opp.account?.display_name || 'Unknown'}
                    </span>
                  </button>
                </TableCell>

                {/* Value */}
                <TableCell className="text-right">
                  <span className="font-semibold text-emerald-500">
                    {opp.estimated_value
                      ? formatMoney(parseFloat(opp.estimated_value), opp.currency || 'EUR')
                      : '-'}
                  </span>
                </TableCell>

                {/* Owner */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {opp.owner?.full_name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                      {opp.owner?.full_name || 'Unassigned'}
                    </span>
                  </div>
                </TableCell>

                {/* Close Date */}
                <TableCell>
                  <span className={cn(
                    'text-sm',
                    opp.expected_close_date && new Date(opp.expected_close_date) < new Date()
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  )}>
                    {opp.expected_close_date
                      ? formatDate(opp.expected_close_date)
                      : '-'}
                  </span>
                </TableCell>

                {/* Stage */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      opp.stage === 'won' && 'border-green-500/50 text-green-500 bg-green-500/10',
                      opp.stage === 'closed_lost' && 'border-red-500/50 text-red-500 bg-red-500/10',
                      opp.stage === 'executing' && 'border-blue-500/50 text-blue-500 bg-blue-500/10'
                    )}
                  >
                    {stageConfig.emoji} {stageConfig.label}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
