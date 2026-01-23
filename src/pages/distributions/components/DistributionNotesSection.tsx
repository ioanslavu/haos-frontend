/**
 * DistributionNotesSection - Distribution notes wrapper
 *
 * Uses the shared NotesSection component with distribution-specific props
 */

import { NotesSection } from '@/components/notes/NotesSection'

interface DistributionNotesSectionProps {
  /** Current notes value from distribution (plain text) */
  notes: string | null | undefined
  /** Callback to save notes - should call updateDistribution mutation */
  onSave: (notes: string) => Promise<void>
  /** Whether the distribution is currently loading */
  isLoading?: boolean
}

export function DistributionNotesSection({
  notes,
  onSave,
  isLoading = false,
}: DistributionNotesSectionProps) {
  return (
    <NotesSection
      notes={notes}
      onSave={onSave}
      isLoading={isLoading}
      title="Notes"
      placeholder="Add notes about this distribution deal..."
    />
  )
}
