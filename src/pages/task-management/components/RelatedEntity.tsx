/**
 * RelatedEntity - Displays linked domain entity (campaign, song, opportunity, etc.)
 */

import { Link2, Briefcase, Music, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import type { Platform } from '@/types/campaign'
import type { Task } from '@/api/types/tasks'

interface RelatedEntityProps {
  task: Task
  onClick: (e: React.MouseEvent, path: string) => void
}

export function RelatedEntity({ task, onClick }: RelatedEntityProps) {
  // Use domain_info from the registry (new agnostic approach)
  if (task.domain_info) {
    const { domain_type, entity_id, entity_name, extra } = task.domain_info

    // For campaigns with subcampaign, show platform icon
    if (domain_type === 'campaign' && extra?.subcampaign?.platform) {
      const platform = extra.subcampaign.platform as Platform
      const PlatformIcon = PLATFORM_ICONS[platform]
      const colorClass = PLATFORM_TEXT_COLORS[platform] || 'text-muted-foreground'

      return (
        <div
          onClick={(e) => onClick(e, `/campaigns/${entity_id}`)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          {PlatformIcon && <PlatformIcon className={cn('h-2.5 w-2.5 flex-shrink-0', colorClass)} />}
          <span className="truncate group-hover:underline">{entity_name}</span>
        </div>
      )
    }

    // Map domain types to icons and paths
    const domainConfig: Record<string, { icon: React.ReactNode; path: string }> = {
      campaign: {
        icon: <Link2 className="h-2.5 w-2.5 flex-shrink-0" />,
        path: `/campaigns/${entity_id}`,
      },
      opportunity: {
        icon: <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />,
        path: `/sales/opportunities/${entity_id}`,
      },
      song: {
        icon: <Music className="h-2.5 w-2.5 flex-shrink-0" />,
        path: `/songs/${entity_id}`,
      },
      entity: {
        icon: <User className="h-2.5 w-2.5 flex-shrink-0" />,
        path: `/entities/${entity_id}`,
      },
    }

    const config = domainConfig[domain_type]
    if (config) {
      return (
        <div
          onClick={(e) => onClick(e, config.path)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          {config.icon}
          <span className="truncate group-hover:underline">{entity_name}</span>
        </div>
      )
    }
  }

  // Fallback to legacy fields for backwards compatibility
  if (task.opportunity && task.opportunity_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/sales/opportunities/${task.opportunity}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.opportunity_detail.title}</span>
      </div>
    )
  }

  if (task.song && task.song_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/songs/${task.song}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Music className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.song_detail.title}</span>
      </div>
    )
  }

  if (task.entity && task.entity_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/entities/${task.entity}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <User className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.entity_detail.display_name}</span>
      </div>
    )
  }

  if (task.campaign && task.campaign_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/campaigns/${task.campaign}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Link2 className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.campaign_detail.name}</span>
      </div>
    )
  }

  if (task.contract && task.contract_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/contracts/${task.contract}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Link2 className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline">{task.contract_detail.title}</span>
      </div>
    )
  }

  return null
}
