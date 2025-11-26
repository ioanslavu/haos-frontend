/**
 * DistributionsTable - Custom table for distributions list
 *
 * Features:
 * - Entity name with avatar
 * - Deal type with icon
 * - Status badge
 * - Revenue share percentage
 * - Signing date
 * - Track count
 * - Total revenue
 */

import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn, formatMoney } from '@/lib/utils'
import type { Distribution, DealType, DealStatus } from '@/types/distribution'
import { DEAL_STATUS_CONFIG, DEAL_TYPE_CONFIG } from '@/types/distribution'

interface DistributionsTableProps {
  distributions: Distribution[]
  onDistributionClick: (id: number) => void
  onEntityClick?: (entityId: number) => void
}

export function DistributionsTable({
  distributions,
  onDistributionClick,
  onEntityClick,
}: DistributionsTableProps) {
  const handleEntityClick = (e: React.MouseEvent, entityId: number) => {
    e.stopPropagation()
    onEntityClick?.(entityId)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/10">
            <TableHead className="w-[250px]">Entity</TableHead>
            <TableHead>Deal Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Rev. Share</TableHead>
            <TableHead>Signing Date</TableHead>
            <TableHead className="text-right">Tracks</TableHead>
            <TableHead className="text-right">Total Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {distributions.map((distribution) => {
            const statusConfig = DEAL_STATUS_CONFIG[distribution.deal_status]
            const typeConfig = DEAL_TYPE_CONFIG[distribution.deal_type]

            return (
              <TableRow
                key={distribution.id}
                className="cursor-pointer hover:bg-muted/50 border-white/10"
                onClick={() => onDistributionClick(distribution.id)}
              >
                {/* Entity */}
                <TableCell>
                  <div
                    className="flex items-center gap-3 group"
                    onClick={(e) => handleEntityClick(e, distribution.entity.id)}
                  >
                    {distribution.entity.image_url ? (
                      <img
                        src={distribution.entity.image_url}
                        alt={distribution.entity.display_name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <span className="text-xs font-semibold">
                          {distribution.entity.display_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {distribution.entity.display_name}
                      </p>
                      {distribution.contact_person && (
                        <p className="text-xs text-muted-foreground truncate">
                          {distribution.contact_person.name}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Deal Type */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('gap-1', typeConfig.bgColor, typeConfig.color)}
                  >
                    <span>{typeConfig.emoji}</span>
                    {typeConfig.label}
                  </Badge>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', statusConfig.dotColor)} />
                    <span className={cn('text-sm', statusConfig.color)}>
                      {statusConfig.label}
                    </span>
                  </div>
                </TableCell>

                {/* Revenue Share */}
                <TableCell className="text-right">
                  <span className="font-medium">
                    {parseFloat(distribution.global_revenue_share_percentage).toFixed(0)}%
                  </span>
                </TableCell>

                {/* Signing Date */}
                <TableCell>
                  {distribution.signing_date ? (
                    <span className="text-muted-foreground">
                      {format(new Date(distribution.signing_date), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                {/* Track Count */}
                <TableCell className="text-right">
                  <Badge variant="secondary" className="font-mono">
                    {distribution.track_count}
                  </Badge>
                </TableCell>

                {/* Total Revenue */}
                <TableCell className="text-right">
                  {parseFloat(distribution.total_revenue) > 0 ? (
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatMoney(parseFloat(distribution.total_revenue), 'EUR')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {distributions.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No distributions found
        </div>
      )}
    </div>
  )
}
