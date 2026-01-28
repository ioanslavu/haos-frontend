/**
 * InvoiceOriginsTab - Origins tab showing linked campaigns, distributions, etc.
 */

import { useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  Link2,
  Megaphone,
  Share2,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons'
import type { Platform } from '@/types/campaign'
import { format } from 'date-fns'
import type { Invoice, InvoiceOrigin } from '@/api/types/invoices'

interface InvoiceOriginsTabProps {
  invoice: Invoice
}

export function InvoiceOriginsTab({ invoice }: InvoiceOriginsTabProps) {
  const navigate = useNavigate()

  if (!invoice.has_origins) {
    return (
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl">
        <CardContent className="py-12">
          <div className="text-center">
            <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Origins Linked</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              This invoice is not linked to any campaigns, subcampaigns, or distributions.
              Origins are added when invoices are associated with marketing activities or distribution deals.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {invoice.origins.map((origin, index) => (
        <OriginCard
          key={`${origin.origin_type}-${origin.source_id}-${index}`}
          origin={origin}
          navigate={navigate}
        />
      ))}
    </div>
  )
}

function OriginCard({
  origin,
  navigate,
}: {
  origin: InvoiceOrigin
  navigate: (path: string) => void
}) {
  const getOriginIcon = () => {
    if (origin.origin_type === 'subcampaign' && origin.extra?.platform) {
      const platform = origin.extra?.platform as Platform
      const Icon = PLATFORM_ICONS[platform]
      const brandColor = PLATFORM_COLORS[platform]
      return (
        <div className={`p-2 rounded-lg ${brandColor?.split(' ').slice(1).join(' ') || 'bg-blue-500/10'}`}>
          <Icon className={`h-5 w-5 ${brandColor?.split(' ')[0] || 'text-blue-500'}`} />
        </div>
      )
    }

    const iconConfig = {
      campaign: { icon: Megaphone, color: 'bg-violet-500/10 text-violet-500' },
      distribution: { icon: Share2, color: 'bg-emerald-500/10 text-emerald-500' },
      default: { icon: Target, color: 'bg-blue-500/10 text-blue-500' },
    }

    const { icon: Icon, color } = iconConfig[origin.origin_type as keyof typeof iconConfig] || iconConfig.default
    return (
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    )
  }

  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl hover:bg-background/70 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {getOriginIcon()}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base truncate">
              {origin.display_name}
            </CardTitle>
            <p className="text-xs text-muted-foreground capitalize">
              {origin.origin_type}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status badge - campaigns */}
        {origin.extra?.status_display && origin.origin_type !== 'distribution' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className="text-xs">
              {origin.extra.status_display}
            </Badge>
          </div>
        )}

        {/* Status badge - distributions */}
        {origin.extra?.deal_status_display && origin.origin_type === 'distribution' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant="outline" className="text-xs">
              {origin.extra.deal_status_display}
            </Badge>
          </div>
        )}

        {/* Deal type for distributions */}
        {origin.extra?.deal_type_display && origin.origin_type === 'distribution' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Deal Type</span>
            <span>{origin.extra.deal_type_display}</span>
          </div>
        )}

        {/* Revenue share for distributions */}
        {origin.extra?.revenue_share && origin.origin_type === 'distribution' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Revenue Share</span>
            <span className="font-medium">{origin.extra.revenue_share}%</span>
          </div>
        )}

        {/* Entity name */}
        {origin.extra?.entity_name && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Entity</span>
            <span className="truncate max-w-[150px]">{origin.extra.entity_name}</span>
          </div>
        )}

        {/* Platform for subcampaigns */}
        {origin.extra?.platform && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Platform</span>
            <span className="flex items-center gap-2">
              {(() => {
                const platform = origin.extra?.platform as Platform
                const Icon = PLATFORM_ICONS[platform]
                const brandColor = PLATFORM_COLORS[platform]
                if (Icon) {
                  return (
                    <Icon className={`h-4 w-4 ${brandColor?.split(' ')[0] || 'text-muted-foreground'}`} />
                  )
                }
                return null
              })()}
              {origin.extra?.platform_display}
            </span>
          </div>
        )}

        {/* Parent campaign for subcampaigns */}
        {origin.extra?.campaign_name && origin.origin_type === 'subcampaign' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Campaign</span>
            <span className="truncate max-w-[150px]">{origin.extra.campaign_name}</span>
          </div>
        )}

        {/* Contract for distributions */}
        {origin.extra?.contract_number && origin.origin_type === 'distribution' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Contract</span>
            <span className="font-mono text-xs">{origin.extra.contract_number}</span>
          </div>
        )}

        {/* Linked info */}
        {origin.extra?.linked_at && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-white/10">
            Linked {format(new Date(origin.extra.linked_at), 'PPp')}
            {origin.extra.linked_by && <span> by {origin.extra.linked_by}</span>}
          </div>
        )}

        {/* View link */}
        {origin.url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2 gap-2"
            onClick={() => navigate(origin.url!)}
          >
            <ExternalLink className="h-4 w-4" />
            View {origin.origin_type === 'campaign' ? 'Campaign' : origin.origin_type === 'distribution' ? 'Distribution' : 'SubCampaign'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
