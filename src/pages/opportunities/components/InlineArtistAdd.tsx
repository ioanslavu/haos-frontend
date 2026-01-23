/**
 * InlineArtistAdd - Inline form for adding artists to an opportunity
 *
 * Matches the Campaign's InlineAddPlatform pattern exactly:
 * - Clean card with primary border tint
 * - Search for artist entity
 * - Role selection with text buttons
 * - Optional fee input
 */

import { useState } from 'react'
import {
  X,
  Loader2,
  Check,
  User,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSearchEntities } from '@/api/hooks/useEntities'
import { useCreateOpportunityArtist } from '@/api/hooks/useOpportunities'
import { cn } from '@/lib/utils'
import type { ArtistRole } from '@/types/opportunities'

interface InlineArtistAddProps {
  opportunityId: number
  currency: string
  existingArtistIds: number[]
  onClose: () => void
  onSuccess?: (artistId: number) => void
}

// Artist role options
const ROLE_OPTIONS: { value: ArtistRole; label: string }[] = [
  { value: 'main', label: 'Main' },
  { value: 'featured', label: 'Featured' },
  { value: 'guest', label: 'Guest' },
  { value: 'ensemble', label: 'Ensemble' },
]

export function InlineArtistAdd({
  opportunityId,
  currency,
  existingArtistIds,
  onClose,
  onSuccess,
}: InlineArtistAddProps) {
  const [artistSearch, setArtistSearch] = useState('')
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null)
  const [selectedArtistName, setSelectedArtistName] = useState('')
  const [selectedRole, setSelectedRole] = useState<ArtistRole>('main')
  const [proposedFee, setProposedFee] = useState('')

  // Search for artists
  const { data: artistSearchResults = [] } = useSearchEntities(artistSearch, artistSearch.length >= 2)

  const createArtist = useCreateOpportunityArtist()

  const handleSubmit = async () => {
    if (!selectedArtistId) return

    try {
      const result = await createArtist.mutateAsync({
        opportunity: opportunityId,
        artist_id: selectedArtistId,
        role: selectedRole,
        proposed_fee: proposedFee || undefined,
      })
      onSuccess?.(result.id)
      onClose()
    } catch {
      // Error handled by mutation
    }
  }

  const handleCancel = () => {
    setArtistSearch('')
    setSelectedArtistId(null)
    setSelectedArtistName('')
    setSelectedRole('main')
    setProposedFee('')
    onClose()
  }

  const canSubmit = selectedArtistId !== null

  // Filter out already added artists
  const filteredResults = artistSearchResults.filter(
    (entity) => !existingArtistIds.includes(entity.id)
  )

  return (
    <Card className="p-4 rounded-xl border-primary/20 bg-primary/5 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Add artist</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Artist Search */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Artist *</p>
          {selectedArtistId ? (
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium flex-1">{selectedArtistName}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedArtistId(null)
                  setSelectedArtistName('')
                  setArtistSearch('')
                }}
                className="h-6 px-2 text-xs"
              >
                Change
              </Button>
            </div>
          ) : (
            <>
              <Input
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
                placeholder="Search for an artist..."
                className="h-9 text-sm"
              />
              {artistSearch.length >= 2 && filteredResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-32 overflow-y-auto bg-background">
                  {filteredResults.slice(0, 6).map((entity) => (
                    <button
                      key={entity.id}
                      onClick={() => {
                        setSelectedArtistId(entity.id)
                        setSelectedArtistName(entity.display_name)
                        setArtistSearch('')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm border-b last:border-b-0 transition-colors"
                    >
                      {entity.display_name}
                    </button>
                  ))}
                </div>
              )}
              {artistSearch.length >= 2 && filteredResults.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">No artists found</p>
              )}
            </>
          )}
        </div>

        {/* Role Selection - Text buttons like service type groups */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Role</p>
          <div className="flex gap-1 flex-wrap">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedRole(option.value)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-all',
                  selectedRole === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Proposed Fee */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">Proposed fee ({currency})</p>
          <Input
            type="number"
            step="0.01"
            value={proposedFee}
            onChange={(e) => setProposedFee(e.target.value)}
            placeholder="0.00"
            className="h-9 text-sm max-w-xs"
          />
        </div>

        {/* Add Button */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || createArtist.isPending}
          >
            {createArtist.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Add Artist'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
