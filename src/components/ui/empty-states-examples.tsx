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
          console.log("Create contract")
        }}
        onSecondaryAction={() => {
          // Navigate to templates
          console.log("Navigate to templates")
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
          console.log("Clear search")
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
          console.log("Clear filters")
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
          console.log("Add work")
        }}
        showSampleDataOption={true}
        onLoadSampleData={() => {
          // Load sample works
          console.log("Load sample works")
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
          console.log("Retry")
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
          console.log("Contact admin")
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
        onClick: () => console.log("Primary"),
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
      onPrimaryAction={() => console.log("Add client")}
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
        onClick: () => console.log("Create"),
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
