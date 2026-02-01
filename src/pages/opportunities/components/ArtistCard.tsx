/**
 * ArtistCard - Expandable card for opportunity artists
 *
 * Matches Campaign's SubCampaignCard and Distribution's SongCard patterns:
 * - Collapsible card with summary header
 * - Click-to-edit inline fields
 * - Role badge
 * - Contract status
 */

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Loader2,
  User,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useUpdateOpportunityArtist, useDeleteOpportunityArtist } from '@/api/hooks/opportunities/useOpportunityMutations'
import { cn, formatMoney } from '@/lib/utils'
import type { ArtistRole, ArtistContractStatus } from '@/types/opportunities'

// Artist role labels
const ARTIST_ROLE_LABELS: Record<ArtistRole, string> = {
  main: 'Main Artist',
  featured: 'Featured',
  guest: 'Guest',
  ensemble: 'Ensemble',
}

// Role options
const ROLE_OPTIONS: { value: ArtistRole; label: string }[] = [
  { value: 'main', label: 'Main' },
  { value: 'featured', label: 'Featured' },
  { value: 'guest', label: 'Guest' },
  { value: 'ensemble', label: 'Ensemble' },
]

// Contract status options
const CONTRACT_STATUS_OPTIONS: { value: ArtistContractStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
  { value: 'active', label: 'Active' },
]

interface Artist {
  id: number
  artist: {
    id: number
    display_name: string
  }
  role: ArtistRole
  contract_status: ArtistContractStatus
  proposed_fee?: string | null
  confirmed_fee?: string | null
  notes?: string | null
}

interface ArtistCardProps {
  artist: Artist
  opportunityId: number
  currency: string
  isExpanded: boolean
  onToggleExpand: () => void
}

export function ArtistCard({
  artist,
  opportunityId,
  currency,
  isExpanded,
  onToggleExpand,
}: ArtistCardProps) {
  const updateArtist = useUpdateOpportunityArtist(opportunityId)
  const deleteArtist = useDeleteOpportunityArtist(opportunityId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isUpdating = updateArtist.isPending || deleteArtist.isPending

  // Inline editing state
  type EditableField = 'proposed_fee' | 'confirmed_fee' | 'notes' | null
  const [editingField, setEditingField] = useState<EditableField>(null)

  // Field values
  const [proposedFeeInput, setProposedFeeInput] = useState(artist.proposed_fee || '')
  const [confirmedFeeInput, setConfirmedFeeInput] = useState(artist.confirmed_fee || '')
  const [notesInput, setNotesInput] = useState(artist.notes || '')

  // Sync input values when artist data changes
  useEffect(() => {
    if (editingField === null) {
      setProposedFeeInput(artist.proposed_fee || '')
      setConfirmedFeeInput(artist.confirmed_fee || '')
      setNotesInput(artist.notes || '')
    }
  }, [artist, editingField])

  // Handle field save
  const handleSaveField = async (field: NonNullable<EditableField>) => {
    const inputMap: Record<string, string> = {
      proposed_fee: proposedFeeInput,
      confirmed_fee: confirmedFeeInput,
      notes: notesInput,
    }
    const originalMap: Record<string, string> = {
      proposed_fee: artist.proposed_fee || '',
      confirmed_fee: artist.confirmed_fee || '',
      notes: artist.notes || '',
    }
    const setterMap: Record<string, (v: string) => void> = {
      proposed_fee: setProposedFeeInput,
      confirmed_fee: setConfirmedFeeInput,
      notes: setNotesInput,
    }

    if (inputMap[field] === originalMap[field]) {
      setEditingField(null)
      return
    }

    try {
      await updateArtist.mutateAsync({ artistId: artist.id, updates: { [field]: inputMap[field] || undefined } })
      setEditingField(null)
    } catch {
      setterMap[field](originalMap[field])
      setEditingField(null)
    }
  }

  // Handle role change
  const handleRoleChange = async (role: ArtistRole) => {
    if (role === artist.role) return
    try {
      await updateArtist.mutateAsync({ artistId: artist.id, updates: { role } })
    } catch {
      // Error handled by mutation
    }
  }

  // Handle contract status change
  const handleContractStatusChange = async (status: ArtistContractStatus) => {
    if (status === artist.contract_status) return
    try {
      await updateArtist.mutateAsync({ artistId: artist.id, updates: { contract_status: status } })
    } catch {
      // Error handled by mutation
    }
  }

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteArtist.mutateAsync(artist.id)
      setShowDeleteConfirm(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <>
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          {/* Header - entire row is clickable */}
          <CollapsibleTrigger asChild>
            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 shrink-0 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Icon */}
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <User className="h-6 w-6 text-purple-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{artist.artist.display_name}</h4>
                    <Badge variant="outline" className="text-xs shrink-0 capitalize">
                      {artist.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {artist.confirmed_fee ? (
                      <span className="font-medium text-green-600">
                        {formatMoney(parseFloat(artist.confirmed_fee), currency)}
                      </span>
                    ) : artist.proposed_fee ? (
                      <span>
                        Proposed: {formatMoney(parseFloat(artist.proposed_fee), currency)}
                      </span>
                    ) : (
                      <span>No fee set</span>
                    )}
                  </div>
                </div>

                {/* Contract Status Badge */}
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize shrink-0",
                    artist.contract_status === 'signed' && 'border-green-500/50 text-green-500 bg-green-500/10',
                    artist.contract_status === 'sent' && 'border-amber-500/50 text-amber-500 bg-amber-500/10'
                  )}
                >
                  {artist.contract_status.replace('_', ' ')}
                </Badge>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteConfirm(true)
                  }}
                  title="Remove artist"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
              {/* Fees - Click to edit */}
              <div className="grid grid-cols-2 gap-4">
                {/* Proposed Fee */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Proposed Fee ({currency})</p>
                  {editingField === 'proposed_fee' ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={proposedFeeInput}
                      onChange={(e) => setProposedFeeInput(e.target.value)}
                      onBlur={() => handleSaveField('proposed_fee')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('proposed_fee')
                        if (e.key === 'Escape') {
                          setProposedFeeInput(artist.proposed_fee || '')
                          setEditingField(null)
                        }
                      }}
                      className="h-8 text-sm"
                      placeholder="0.00"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField('proposed_fee')}
                      className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left"
                    >
                      {artist.proposed_fee ? formatMoney(parseFloat(artist.proposed_fee), currency) : <span className="text-muted-foreground">Set fee</span>}
                    </button>
                  )}
                </div>

                {/* Confirmed Fee */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Confirmed Fee ({currency})</p>
                  {editingField === 'confirmed_fee' ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={confirmedFeeInput}
                      onChange={(e) => setConfirmedFeeInput(e.target.value)}
                      onBlur={() => handleSaveField('confirmed_fee')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('confirmed_fee')
                        if (e.key === 'Escape') {
                          setConfirmedFeeInput(artist.confirmed_fee || '')
                          setEditingField(null)
                        }
                      }}
                      className="h-8 text-sm"
                      placeholder="0.00"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField('confirmed_fee')}
                      className={cn(
                        "font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left",
                        artist.confirmed_fee && "text-green-600"
                      )}
                    >
                      {artist.confirmed_fee ? formatMoney(parseFloat(artist.confirmed_fee), currency) : <span className="text-muted-foreground">Set fee</span>}
                    </button>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Role</p>
                <div className="flex gap-1 flex-wrap">
                  {ROLE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleRoleChange(option.value)}
                      disabled={isUpdating}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        artist.role === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contract Status Selection */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Contract Status</p>
                <div className="flex gap-1 flex-wrap">
                  {CONTRACT_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleContractStatusChange(option.value)}
                      disabled={isUpdating}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        artist.contract_status === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                {editingField === 'notes' ? (
                  <Input
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    onBlur={() => handleSaveField('notes')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveField('notes')
                      if (e.key === 'Escape') {
                        setNotesInput(artist.notes || '')
                        setEditingField(null)
                      }
                    }}
                    className="h-8 text-sm"
                    placeholder="Add notes..."
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setEditingField('notes')}
                    className="text-sm hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left w-full"
                  >
                    {artist.notes || <span className="text-muted-foreground">Add notes...</span>}
                  </button>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Artist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {artist.artist.display_name} from this opportunity?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
