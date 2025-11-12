/**
 * Empty States Usage Examples
 *
 * Demonstrates how to use the modern empty state components throughout the app.
 */

import {
  NoContractsEmptyState,
  NoClientsEmptyState,
  NoSearchResultsEmptyState,
  NoFilterResultsEmptyState,
  NoCatalogItemsEmptyState,
  AccessDeniedEmptyState,
  ErrorEmptyState,
  ComingSoonEmptyState,
  CustomEmptyState,
} from "./empty-states-presets"
import { EmptyState } from "./empty-state"
import { FileText, Plus } from "lucide-react"

/**
 * Example 1: Contracts Page
 */
export function ContractsPageExample() {
  const hasContracts = false
  const [showSampleData, setShowSampleData] = React.useState(false)

  if (!hasContracts) {
    return (
      <NoContractsEmptyState
        onPrimaryAction={() => {
          // Open create contract dialog
          // Action placeholder
        }}
        onSecondaryAction={() => {
          // Navigate to templates
          // Action placeholder
        }}
        showSampleDataOption={true}
        onLoadSampleData={() => {
          setShowSampleData(true)
          // Load sample data
        }}
      />
    )
  }

  return <div>Contracts list...</div>
}

/**
 * Example 2: Search Results with No Matches
 */
export function SearchResultsExample() {
  const searchQuery = "nonexistent contract"
  const results = []

  if (results.length === 0 && searchQuery) {
    return (
      <NoSearchResultsEmptyState
        searchQuery={searchQuery}
        onClearSearch={() => {
          // Clear search
          // Action placeholder
        }}
      />
    )
  }

  return <div>Search results...</div>
}

/**
 * Example 3: Filtered List with No Results
 */
export function FilteredListExample() {
  const activeFilters = ["status:active", "type:employment"]
  const results = []

  if (results.length === 0 && activeFilters.length > 0) {
    return (
      <NoFilterResultsEmptyState
        onClearFilters={() => {
          // Clear all filters
          // Action placeholder
        }}
      />
    )
  }

  return <div>Filtered list...</div>
}

/**
 * Example 4: Music Catalog - Works
 */
export function WorksListExample() {
  const works = []

  if (works.length === 0) {
    return (
      <NoCatalogItemsEmptyState
        itemType="works"
        onPrimaryAction={() => {
          // Open add work dialog
          // Action placeholder
        }}
        showSampleDataOption={true}
        onLoadSampleData={() => {
          // Load sample works
          // Action placeholder
        }}
      />
    )
  }

  return <div>Works list...</div>
}

/**
 * Example 5: Error State
 */
export function ErrorStateExample() {
  const [error, setError] = React.useState<Error | null>(
    new Error("Failed to load contracts")
  )

  if (error) {
    return (
      <ErrorEmptyState
        errorMessage={error.message}
        onRetry={() => {
          setError(null)
          // Retry loading
          // Action placeholder
        }}
      />
    )
  }

  return <div>Content...</div>
}

/**
 * Example 6: Access Denied
 */
export function RestrictedPageExample() {
  const hasAccess = false

  if (!hasAccess) {
    return (
      <AccessDeniedEmptyState
        onSecondaryAction={() => {
          // Contact admin
          // Action placeholder
        }}
      />
    )
  }

  return <div>Restricted content...</div>
}

/**
 * Example 7: Custom Empty State
 */
export function CustomExample() {
  return (
    <CustomEmptyState
      icon={FileText}
      title="Custom Empty State"
      description="You can create fully custom empty states with your own content."
      primaryAction={{
        label: "Primary Action",
        onClick: () => {/* Action placeholder */},
        icon: Plus,
      }}
      tips={[
        "Add helpful tips for users",
        "Guide them on what to do next",
        "Provide context about the feature",
      ]}
    />
  )
}

/**
 * Example 8: Compact Variant (for smaller spaces)
 */
export function CompactEmptyStateExample() {
  return (
    <NoClientsEmptyState
      compact
      onPrimaryAction={() => {/* Action placeholder */}}
    />
  )
}

/**
 * Example 9: With Additional Custom Content
 */
export function EmptyStateWithCustomContentExample() {
  return (
    <EmptyState
      icon={FileText}
      title="Welcome to Contracts"
      description="Get started by creating your first contract or exploring templates."
      primaryAction={{
        label: "Create Contract",
        onClick: () => {/* Action placeholder */},
        icon: Plus,
      }}
    >
      {/* Custom content below actions */}
      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
        <h4 className="font-medium text-sm mb-2">Need help getting started?</h4>
        <ul className="text-xs text-muted-foreground space-y-1 text-left">
          <li>• Watch our 2-minute tutorial video</li>
          <li>• Browse the documentation</li>
          <li>• Contact support for assistance</li>
        </ul>
      </div>
    </EmptyState>
  )
}

/**
 * Migration Guide
 *
 * Before (old pattern):
 * ```tsx
 * {data.length === 0 && (
 *   <div className="text-center py-8">
 *     <p>No items found</p>
 *     <button>Add Item</button>
 *   </div>
 * )}
 * ```
 *
 * After (new pattern):
 * ```tsx
 * {data.length === 0 && (
 *   <NoItemsEmptyState
 *     onPrimaryAction={handleAddItem}
 *     showSampleDataOption
 *   />
 * )}
 * ```
 *
 * Benefits:
 * - Consistent empty state design
 * - Built-in tips and guidance
 * - Sample data option
 * - Better accessibility
 * - Reduced code duplication
 * - Professional appearance
 */
