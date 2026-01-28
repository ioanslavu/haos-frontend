/**
 * RevenueTab - Revenue by platform display
 */

import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatMoney } from '@/lib/utils'
import { DISTRIBUTION_PLATFORM_LABELS } from '@/types/distribution'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import type { Platform } from '@/types/distribution'

interface RevenueByPlatform {
  platform: Platform
  revenue: number
  streams: number
  downloads: number
  count: number
}

interface RevenueTabProps {
  revenueByPlatform: RevenueByPlatform[]
}

export function RevenueTab({ revenueByPlatform }: RevenueTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Revenue by Platform</h3>

      {revenueByPlatform.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {revenueByPlatform.map(({ platform, revenue, streams, downloads, count }) => {
            const Icon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]
            const colorClass = PLATFORM_TEXT_COLORS[platform as keyof typeof PLATFORM_TEXT_COLORS]

            return (
              <Card key={platform} className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      {Icon && <Icon className={cn('h-5 w-5', colorClass)} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{DISTRIBUTION_PLATFORM_LABELS[platform]}</p>
                      <p className="text-xs text-muted-foreground">{count} report{count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {formatMoney(revenue, 'EUR')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {streams > 0 && <span>{streams.toLocaleString()} streams</span>}
                        {downloads > 0 && <span>{downloads.toLocaleString()} downloads</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No revenue reports yet</p>
            <p className="text-sm">Add revenue reports to catalog items to see analytics</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
