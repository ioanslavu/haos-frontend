/**
 * HistoryTab - Campaign activity timeline
 */

import {
  ChevronRight,
  History,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, cn } from '@/lib/utils'
import { EVENT_CONFIG } from '../../../types'
import type { UseCampaignDetailReturn } from '../../../hooks/useCampaignDetail'

interface HistoryTabProps {
  ctx: UseCampaignDetailReturn
}

export function HistoryTab({ ctx }: HistoryTabProps) {
  const { history } = ctx

  return (
    <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="h-4 w-4" />
          Activity History
        </h3>
        {history && history.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {history.length} events
          </Badge>
        )}
      </div>

      {history && history.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-muted to-transparent" />

          <div className="space-y-1">
            {history.map((entry) => {
              const config = EVENT_CONFIG[entry.event_type] || { icon: '•', color: 'bg-primary' }

              return (
                <div
                  key={entry.id}
                  className="relative pl-12 py-3 pr-4 hover:bg-muted/30 rounded-xl transition-colors group"
                >
                  {/* Timeline dot with icon */}
                  <div
                    className={cn(
                      'absolute left-2 top-3.5 w-8 h-8 rounded-full flex items-center justify-center text-sm',
                      config.color + '/20',
                      'ring-2 ring-background'
                    )}
                  >
                    {config.icon}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {entry.event_type_display || entry.event_type.replace(/_/g, ' ')}
                        </p>
                        {entry.created_by_name && (
                          <span className="text-xs text-muted-foreground">
                            by {entry.created_by_name}
                          </span>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {entry.description}
                        </p>
                      )}
                      {entry.old_value && entry.new_value && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-500 line-through">
                            {entry.old_value}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-500">
                            {entry.new_value}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(entry.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-1">No activity recorded yet</p>
          <p className="text-xs text-muted-foreground">
            Events will appear here as you make changes
          </p>
        </div>
      )}
    </Card>
  )
}
