/**
 * InvoiceClientCell - Display client name with platform icon for subcampaign invoices
 */

import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/lib/platform-icons'
import type { Invoice } from '@/types/invoice'
import type { Platform } from '@/types/campaign'

interface InvoiceClientCellProps {
  invoice: Invoice
}

export function InvoiceClientCell({ invoice }: InvoiceClientCellProps) {
  const { client_name, platform, origin_type } = invoice

  if (!client_name && !platform) {
    return <span className="text-muted-foreground">-</span>
  }

  // For subcampaign invoices, show platform icon
  if (origin_type === 'subcampaign' && platform) {
    const Icon = PLATFORM_ICONS[platform as Platform]
    const brandColor = PLATFORM_COLORS[platform as Platform]

    return (
      <span className="flex items-center gap-2">
        {Icon && (
          <Icon className={`h-4 w-4 flex-shrink-0 ${brandColor?.split(' ')[0] || 'text-muted-foreground'}`} />
        )}
        <span className="truncate">{client_name || '-'}</span>
      </span>
    )
  }

  // For campaign or distribution invoices, just show client name
  return <span className="truncate">{client_name || '-'}</span>
}
