/**
 * ClientScoreSection - Display and edit client health scores inline
 *
 * Features:
 * - Click on any score to edit inline (no edit button)
 * - Smooth transitions between view/edit states
 * - Create profile if doesn't exist
 * - Color-coded score values (red/yellow/green)
 */

import { useState, useRef, useEffect } from 'react'
import { TrendingUp, Loader2, MessageSquare, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import {
  useClientProfileByEntity,
  useUpdateClientProfile,
  useCreateClientProfile,
} from '@/api/hooks/useClientProfiles'

interface ClientScoreSectionProps {
  entityId: number | undefined | null
  entityName?: string
  isLoading?: boolean
}

type ScoreKey = 'health_score' | 'collaboration_frequency_score' | 'feedback_score' | 'payment_latency_score'

interface ScoreFieldConfig {
  key: ScoreKey
  label: string
  shortLabel: string
}

const SCORE_FIELDS: ScoreFieldConfig[] = [
  { key: 'health_score', label: 'Health Score', shortLabel: 'Health' },
  { key: 'collaboration_frequency_score', label: 'Collaboration Frequency', shortLabel: 'Collab' },
  { key: 'feedback_score', label: 'Feedback Quality', shortLabel: 'Feedback' },
  { key: 'payment_latency_score', label: 'Payment Timeliness', shortLabel: 'Payment' },
]

function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-muted-foreground'
  if (score <= 3) return 'text-red-500'
  if (score <= 6) return 'text-yellow-500'
  return 'text-green-500'
}

function getScoreBgColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'bg-muted/30'
  if (score <= 3) return 'bg-red-500/10'
  if (score <= 6) return 'bg-yellow-500/10'
  return 'bg-green-500/10'
}

function getScoreRingColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'ring-muted-foreground/20'
  if (score <= 3) return 'ring-red-500/30'
  if (score <= 6) return 'ring-yellow-500/30'
  return 'ring-green-500/30'
}

interface InlineScoreEditorProps {
  field: ScoreFieldConfig
  value: number | null
  profileId: number | undefined
  entityId: number
  onUpdate: (key: ScoreKey, value: number) => Promise<void>
}

function InlineScoreEditor({ field, value, onUpdate }: InlineScoreEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<number>(value ?? 5)
  const [isSaving, setIsSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset edit value when value changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value ?? 5)
    }
  }, [value, isEditing])

  // Handle click outside to cancel
  useEffect(() => {
    if (!isEditing) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false)
        setEditValue(value ?? 5)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing, value])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(field.key, editValue)
      setIsEditing(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(value ?? 5)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative p-3 rounded-xl cursor-pointer transition-all duration-200',
        isEditing
          ? 'bg-background ring-2 ring-primary/50 shadow-lg'
          : cn(getScoreBgColor(value), 'hover:ring-2', getScoreRingColor(value))
      )}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{field.shortLabel}</span>
        {!isEditing && (
          <span className={cn('text-sm font-semibold transition-colors', getScoreColor(value))}>
            {value ?? '-'}/10
          </span>
        )}
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-out',
          isEditing ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Slider
              value={[editValue]}
              onValueChange={([val]) => setEditValue(val)}
              min={1}
              max={10}
              step={1}
              className="flex-1"
              onKeyDown={handleKeyDown}
            />
            <Input
              type="number"
              min={1}
              max={10}
              value={editValue}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (val >= 1 && val <= 10) setEditValue(val)
              }}
              onKeyDown={handleKeyDown}
              className="w-14 h-7 text-center text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(false)
                setEditValue(value ?? 5)
              }}
              disabled={isSaving}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                handleSave()
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface InlineNotesEditorProps {
  value: string
  onUpdate: (notes: string) => Promise<void>
}

function InlineNotesEditor({ value, onUpdate }: InlineNotesEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset edit value when value changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  // Handle click outside to cancel
  useEffect(() => {
    if (!isEditing) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false)
        setEditValue(value)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing, value])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(editValue)
      setIsEditing(false)
    } catch {
      // Error handled by mutation
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative p-3 rounded-xl cursor-pointer transition-all duration-200',
        isEditing
          ? 'bg-background ring-2 ring-primary/50 shadow-lg'
          : 'bg-muted/30 hover:ring-2 hover:ring-muted-foreground/20'
      )}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Notes</span>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Add notes about this client..."
            className="min-h-[80px] text-sm resize-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(false)
                setEditValue(value)
              }}
              disabled={isSaving}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                handleSave()
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      ) : value ? (
        <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-3">{value}</p>
      ) : (
        <p className="text-xs text-muted-foreground italic">Click to add notes...</p>
      )}
    </div>
  )
}

export function ClientScoreSection({
  entityId,
  entityName,
  isLoading: parentLoading = false,
}: ClientScoreSectionProps) {
  // Fetch client profile
  const { data: clientProfile, isLoading: profileLoading } = useClientProfileByEntity(entityId)
  const updateProfile = useUpdateClientProfile()
  const createProfile = useCreateClientProfile()

  const isLoading = parentLoading || profileLoading

  // Handle score update
  const handleScoreUpdate = async (key: ScoreKey, value: number) => {
    if (!entityId) return

    if (clientProfile?.id) {
      await updateProfile.mutateAsync({
        id: clientProfile.id,
        data: { [key]: value },
      })
    } else {
      await createProfile.mutateAsync({
        entity: entityId,
        [key]: value,
      })
    }
  }

  // Handle notes update
  const handleNotesUpdate = async (notes: string) => {
    if (!entityId) return

    if (clientProfile?.id) {
      await updateProfile.mutateAsync({
        id: clientProfile.id,
        data: { notes },
      })
    } else {
      await createProfile.mutateAsync({
        entity: entityId,
        notes,
      })
    }
  }

  // No entity ID - don't show the section
  if (!entityId) {
    return null
  }

  return (
    <Card className="p-6 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Client Score
          {entityName && (
            <span className="text-muted-foreground font-normal text-sm">({entityName})</span>
          )}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !clientProfile ? (
        // No profile exists - show clickable scores to create
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground text-center mb-2">
            Click any score to start tracking
          </p>
          <div className="grid grid-cols-2 gap-3">
            {SCORE_FIELDS.map((field) => (
              <InlineScoreEditor
                key={field.key}
                field={field}
                value={null}
                profileId={undefined}
                entityId={entityId}
                onUpdate={handleScoreUpdate}
              />
            ))}
          </div>
          <InlineNotesEditor value="" onUpdate={handleNotesUpdate} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Score Fields */}
          <div className="grid grid-cols-2 gap-3">
            {SCORE_FIELDS.map((field) => (
              <InlineScoreEditor
                key={field.key}
                field={field}
                value={clientProfile[field.key]}
                profileId={clientProfile.id}
                entityId={entityId}
                onUpdate={handleScoreUpdate}
              />
            ))}
          </div>

          {/* Notes Field */}
          <InlineNotesEditor
            value={clientProfile.notes || ''}
            onUpdate={handleNotesUpdate}
          />

          {/* Last Updated Info */}
          {clientProfile.updated_at && (
            <p className="text-[10px] text-muted-foreground text-right">
              Updated {new Date(clientProfile.updated_at).toLocaleDateString()}
              {clientProfile.updated_by_name && ` by ${clientProfile.updated_by_name}`}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
