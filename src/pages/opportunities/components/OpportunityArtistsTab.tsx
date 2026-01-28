/**
 * OpportunityArtistsTab - Artists tab content
 */

import { Plus, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArtistCard } from './ArtistCard'
import { InlineArtistAdd } from './InlineArtistAdd'
import type { OpportunityArtist } from '@/types/opportunities'

interface OpportunityArtistsTabProps {
  opportunityId: number
  artists: OpportunityArtist[]
  showAddArtist: boolean
  setShowAddArtist: (show: boolean) => void
  expandedArtistIds: Set<number>
  toggleArtistExpanded: (artistId: number) => void
}

export function OpportunityArtistsTab({
  opportunityId,
  artists,
  showAddArtist,
  setShowAddArtist,
  expandedArtistIds,
  toggleArtistExpanded,
}: OpportunityArtistsTabProps) {
  return (
    <div className="space-y-4">
      {/* Inline Add Form */}
      {showAddArtist && (
        <InlineArtistAdd
          opportunityId={opportunityId}
          onClose={() => setShowAddArtist(false)}
        />
      )}

      {artists.length === 0 ? (
        <EmptyArtists
          showAddArtist={showAddArtist}
          setShowAddArtist={setShowAddArtist}
        />
      ) : (
        <>
          {/* Header with count and add button */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {artists.length} Artist{artists.length !== 1 ? 's' : ''}
            </h3>
            {!showAddArtist && (
              <Button onClick={() => setShowAddArtist(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Artist
              </Button>
            )}
          </div>

          {/* Artist Cards */}
          <div className="space-y-3">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                opportunityId={opportunityId}
                isExpanded={expandedArtistIds.has(artist.id)}
                onToggleExpand={() => toggleArtistExpanded(artist.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function EmptyArtists({
  showAddArtist,
  setShowAddArtist,
}: {
  showAddArtist: boolean
  setShowAddArtist: (show: boolean) => void
}) {
  return (
    <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <h4 className="font-semibold mb-2">No artists yet</h4>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
        Add artists to this opportunity to track their involvement and fees.
      </p>
      {!showAddArtist && (
        <Button onClick={() => setShowAddArtist(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Artist
        </Button>
      )}
    </Card>
  )
}
