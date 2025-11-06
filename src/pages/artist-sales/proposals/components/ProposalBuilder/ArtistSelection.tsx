import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProposalBuilderData } from './index'
import { useOpportunities } from '@/api/hooks/useArtistSales'

interface ArtistSelectionProps {
  data: ProposalBuilderData
  updateData: (updates: Partial<ProposalBuilderData>) => void
}

const ARTIST_ROLES = [
  { value: 'main', label: 'Main Artist' },
  { value: 'featured', label: 'Featured Artist' },
  { value: 'guest', label: 'Guest Artist' },
  { value: 'ensemble', label: 'Ensemble' },
]

export function ArtistSelection({ data, updateData }: ArtistSelectionProps) {
  const [selectedArtist, setSelectedArtist] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('main')
  const [proposedFee, setProposedFee] = useState('')

  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useOpportunities()
  const opportunities = opportunitiesData?.results || []

  const handleAddArtist = () => {
    if (selectedArtist) {
      const newArtist = {
        artistId: selectedArtist,
        role: selectedRole as any,
        proposedFee: proposedFee || undefined,
      }
      updateData({ artists: [...data.artists, newArtist] })
      setSelectedArtist(null)
      setProposedFee('')
    }
  }

  const handleRemoveArtist = (index: number) => {
    updateData({
      artists: data.artists.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      {/* Opportunity Selection */}
      <div className="space-y-2 p-4 border rounded-lg bg-primary/5">
        <Label>Opportunity *</Label>
        <Select
          value={data.opportunityId?.toString() || ''}
          onValueChange={(value) => updateData({ opportunityId: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an opportunity..." />
          </SelectTrigger>
          <SelectContent>
            {opportunitiesLoading ? (
              <SelectItem value="loading" disabled>
                Loading opportunities...
              </SelectItem>
            ) : opportunities.length === 0 ? (
              <SelectItem value="none" disabled>
                No opportunities available
              </SelectItem>
            ) : (
              opportunities.map((opp) => (
                <SelectItem key={opp.id} value={opp.id.toString()}>
                  {opp.opp_name} - {opp.account.display_name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {!data.opportunityId && (
          <p className="text-sm text-muted-foreground">
            Select an opportunity to create a proposal for
          </p>
        )}
      </div>

      {/* Add Artist Form */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <h3 className="font-semibold">Add Artist</h3>

        <div className="space-y-2">
          <Label>Artist</Label>
          <EntitySearchCombobox
            value={selectedArtist}
            onValueChange={(value) => setSelectedArtist(value)}
            placeholder="Search for artist..."
            filter={{ has_role: 'artist' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ARTIST_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Proposed Fee (optional)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={proposedFee}
              onChange={(e) => setProposedFee(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleAddArtist} disabled={!selectedArtist} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Artist
        </Button>
      </div>

      {/* Selected Artists List */}
      <div className="space-y-3">
        <h3 className="font-semibold">
          Selected Artists ({data.artists.length})
        </h3>

        {data.artists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            No artists selected yet
          </div>
        ) : (
          <div className="space-y-2">
            {data.artists.map((artist, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-background"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">Artist ID: {artist.artistId}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {ARTIST_ROLES.find((r) => r.value === artist.role)?.label}
                      </Badge>
                      {artist.proposedFee && (
                        <span className="text-sm text-muted-foreground">
                          €{artist.proposedFee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveArtist(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {(!data.opportunityId || data.artists.length === 0) && (
        <p className="text-sm text-muted-foreground">
          {!data.opportunityId && 'Select an opportunity and '}
          {data.artists.length === 0 && 'at least one artist '}
          to continue to the next step.
        </p>
      )}
    </div>
  )
}
