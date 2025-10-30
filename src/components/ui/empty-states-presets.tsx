/**
 * Preset Empty States for Common Scenarios
 *
 * Ready-to-use empty state components for different contexts:
 * - No data/items
 * - No search results
 * - No filter results
 * - Access denied
 * - Error states
 * - Coming soon
 */

import { EmptyState, type EmptyStateProps } from "./empty-state"
import {
  Inbox,
  Search,
  Filter,
  FileText,
  Users,
  Shield,
  AlertTriangle,
  Rocket,
  Database,
  FileSignature,
  Music,
  Calendar,
  Plus,
  RefreshCw,
  Settings,
  Target,
} from "lucide-react"

// Base props for all presets
interface PresetProps {
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  onLoadSampleData?: () => void
  showSampleDataOption?: boolean
  compact?: boolean
}

/**
 * No Contracts Empty State
 */
export function NoContractsEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={FileSignature}
      title="No contracts yet"
      description="Start by creating your first contract from a template or uploading an existing one."
      primaryAction={
        props.onPrimaryAction
          ? {
              label: "Create Contract",
              onClick: props.onPrimaryAction,
              icon: Plus,
            }
          : undefined
      }
      secondaryAction={
        props.onSecondaryAction
          ? {
              label: "Browse Templates",
              onClick: props.onSecondaryAction,
              icon: FileText,
            }
          : undefined
      }
      showSampleDataOption={props.showSampleDataOption}
      onLoadSampleData={props.onLoadSampleData}
      compact={props.compact}
      tips={[
        "Contracts are automatically generated from templates",
        "You can track signature status in real-time",
        "All contracts are searchable and filterable",
      ]}
    />
  )
}

/**
 * No Clients Empty State
 */
export function NoClientsEmptyState(props: PresetProps & { title?: string; description?: string; icon?: any; tips?: string[] }) {
  return (
    <EmptyState
      icon={props.icon || Users}
      title={props.title || "No clients yet"}
      description={props.description || "Add your first client to start managing relationships and contracts."}
      primaryAction={
        props.onPrimaryAction
          ? {
              label: "Add Client",
              onClick: props.onPrimaryAction,
              icon: Plus,
            }
          : undefined
      }
      showSampleDataOption={props.showSampleDataOption}
      onLoadSampleData={props.onLoadSampleData}
      compact={props.compact}
      tips={props.tips || [
        "Client data auto-fills contract templates",
        "Track all contracts per client",
        "Export client lists to CSV",
      ]}
    />
  )
}

/**
 * No Campaigns Empty State
 */
export function NoCampaignsEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={Target}
      title="No campaigns yet"
      description="Create your first marketing campaign to start tracking client engagement and deals."
      primaryAction={
        props.onPrimaryAction
          ? {
              label: "New Campaign",
              onClick: props.onPrimaryAction,
              icon: Plus,
            }
          : undefined
      }
      showSampleDataOption={props.showSampleDataOption}
      onLoadSampleData={props.onLoadSampleData}
      compact={props.compact}
      tips={[
        "Campaigns help organize marketing efforts",
        "Track campaign performance and metrics",
        "Link campaigns to clients, artists, and brands",
      ]}
    />
  )
}

/**
 * No Templates Empty State
 */
export function NoTemplatesEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={FileText}
      title="No templates available"
      description="Templates are the foundation for generating contracts. Contact your administrator to add templates."
      secondaryAction={
        props.onSecondaryAction
          ? {
              label: "Contact Support",
              onClick: props.onSecondaryAction,
            }
          : undefined
      }
      compact={props.compact}
    />
  )
}

/**
 * No Search Results Empty State
 */
export function NoSearchResultsEmptyState({
  searchQuery,
  onClearSearch,
  ...props
}: PresetProps & { searchQuery?: string; onClearSearch?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        searchQuery
          ? `We couldn't find anything matching "${searchQuery}".`
          : "Try adjusting your search terms or filters."
      }
      secondaryAction={
        onClearSearch
          ? {
              label: "Clear Search",
              onClick: onClearSearch,
              icon: RefreshCw,
            }
          : undefined
      }
      compact={props.compact}
      tips={[
        "Try using different keywords",
        "Check for typos in your search",
        "Use fewer or more specific terms",
      ]}
    />
  )
}

/**
 * No Filter Results Empty State
 */
export function NoFilterResultsEmptyState({
  onClearFilters,
  ...props
}: PresetProps & { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={Filter}
      title="No matches found"
      description="No items match your current filters. Try adjusting or clearing them."
      primaryAction={
        onClearFilters
          ? {
              label: "Clear Filters",
              onClick: onClearFilters,
              icon: RefreshCw,
            }
          : undefined
      }
      compact={props.compact}
    />
  )
}

/**
 * No Music Catalog Items Empty State
 */
export function NoCatalogItemsEmptyState({
  itemType = "works",
  ...props
}: PresetProps & { itemType?: "works" | "recordings" | "releases" }) {
  const config = {
    works: {
      title: "No works yet",
      description:
        "Add your first musical work to start tracking compositions and royalties.",
      tips: [
        "Works represent original compositions",
        "Track splits and collaborators",
        "Connect works to recordings",
      ],
    },
    recordings: {
      title: "No recordings yet",
      description:
        "Add recordings to manage your music catalog and track usage.",
      tips: [
        "Recordings link to works",
        "Assign ISRC codes automatically",
        "Track recording metadata",
      ],
    },
    releases: {
      title: "No releases yet",
      description:
        "Create your first release to distribute and track your music.",
      tips: [
        "Releases contain multiple recordings",
        "Assign UPC codes automatically",
        "Track distribution channels",
      ],
    },
  }[itemType]

  return (
    <EmptyState
      icon={Music}
      title={config.title}
      description={config.description}
      primaryAction={
        props.onPrimaryAction
          ? {
              label: `Add ${itemType === "works" ? "Work" : itemType === "recordings" ? "Recording" : "Release"}`,
              onClick: props.onPrimaryAction,
              icon: Plus,
            }
          : undefined
      }
      showSampleDataOption={props.showSampleDataOption}
      onLoadSampleData={props.onLoadSampleData}
      compact={props.compact}
      tips={config.tips}
    />
  )
}

/**
 * Access Denied Empty State
 */
export function AccessDeniedEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={Shield}
      title="Access Denied"
      description="You don't have permission to view this content. Contact your administrator if you believe this is an error."
      secondaryAction={
        props.onSecondaryAction
          ? {
              label: "Contact Admin",
              onClick: props.onSecondaryAction,
            }
          : undefined
      }
      compact={props.compact}
    />
  )
}

/**
 * Error State
 */
export function ErrorEmptyState({
  errorMessage,
  onRetry,
  ...props
}: PresetProps & { errorMessage?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something went wrong"
      description={
        errorMessage ||
        "We encountered an error while loading this content. Please try again."
      }
      primaryAction={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
              icon: RefreshCw,
            }
          : undefined
      }
      compact={props.compact}
    />
  )
}

/**
 * Coming Soon Empty State
 */
export function ComingSoonEmptyState({
  featureName,
  ...props
}: PresetProps & { featureName?: string }) {
  return (
    <EmptyState
      icon={Rocket}
      title={featureName ? `${featureName} Coming Soon` : "Coming Soon"}
      description="We're working hard to bring you this feature. Stay tuned for updates!"
      compact={props.compact}
    />
  )
}

/**
 * No Data Empty State (Generic)
 */
export function NoDataEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={Database}
      title="No data available"
      description="There's no data to display at the moment."
      primaryAction={
        props.onPrimaryAction
          ? {
              label: "Refresh",
              onClick: props.onPrimaryAction,
              icon: RefreshCw,
            }
          : undefined
      }
      showSampleDataOption={props.showSampleDataOption}
      onLoadSampleData={props.onLoadSampleData}
      compact={props.compact}
    />
  )
}

/**
 * No Events/Calendar Empty State
 */
export function NoEventsEmptyState(props: PresetProps) {
  return (
    <EmptyState
      icon={Calendar}
      title="No events scheduled"
      description="Your calendar is clear. Add an event to get started."
      primaryAction={
        props.onPrimaryAction
          ? {
              label: "Create Event",
              onClick: props.onPrimaryAction,
              icon: Plus,
            }
          : undefined
      }
      compact={props.compact}
    />
  )
}

/**
 * Empty Configuration State
 */
export function NoConfigurationEmptyState({
  settingName,
  ...props
}: PresetProps & { settingName?: string }) {
  return (
    <EmptyState
      icon={Settings}
      title="Configuration needed"
      description={
        settingName
          ? `${settingName} needs to be configured before you can continue.`
          : "Some settings need to be configured before you can continue."
      }
      primaryAction={
        props.onPrimaryAction
          ? {
              label: "Configure Now",
              onClick: props.onPrimaryAction,
              icon: Settings,
            }
          : undefined
      }
      compact={props.compact}
    />
  )
}

/**
 * Generic Empty State with Custom Content
 */
export function CustomEmptyState(props: Omit<EmptyStateProps, "icon"> & { icon?: any }) {
  return <EmptyState {...props} icon={props.icon || Inbox} />
}
