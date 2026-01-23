/**
 * CampaignNotesSection - Campaign notes wrapper
 *
 * Uses the shared NotesSection component with campaign-specific props
 */

import { NotesSection } from '@/components/notes/NotesSection'

interface CampaignNotesSectionProps {
  /** Current notes value from campaign (plain text) */
  notes: string | null | undefined
  /** Callback to save notes - should call updateCampaign mutation */
  onSave: (notes: string) => Promise<void>
  /** Whether the campaign is currently loading */
  isLoading?: boolean
}

export function CampaignNotesSection({
  notes,
  onSave,
  isLoading = false,
}: CampaignNotesSectionProps) {
  return (
    <NotesSection
      notes={notes}
      onSave={onSave}
      isLoading={isLoading}
      title="Notes"
      placeholder="Add notes about this campaign..."
    />
  )
}
