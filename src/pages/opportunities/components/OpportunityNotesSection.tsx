/**
 * OpportunityNotesSection - Opportunity notes wrapper
 *
 * Uses the shared NotesSection component with opportunity-specific props
 */

import { NotesSection } from '@/components/notes/NotesSection'

interface OpportunityNotesSectionProps {
  /** Current notes value from opportunity (plain text) */
  notes: string | null | undefined
  /** Callback to save notes - should call updateOpportunity mutation */
  onSave: (notes: string) => Promise<void>
  /** Whether the opportunity is currently loading */
  isLoading?: boolean
}

export function OpportunityNotesSection({
  notes,
  onSave,
  isLoading = false,
}: OpportunityNotesSectionProps) {
  return (
    <NotesSection
      notes={notes}
      onSave={onSave}
      isLoading={isLoading}
      title="Notes"
      placeholder="Add notes about this opportunity..."
    />
  )
}
