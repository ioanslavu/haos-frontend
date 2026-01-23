/**
 * InlineSongAdd - Inline form for adding external songs to a distribution
 *
 * Matches the Campaign's InlineAddPlatform pattern exactly:
 * - Clean card with primary border tint
 * - Visual icon selection
 * - Grouped status buttons
 * - Simple clean UI
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Loader2,
  Music,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { distributionsService } from '@/api/services/distributions.service'
import { cn } from '@/lib/utils'
import type { Platform, DistributionSongFormData } from '@/types/distribution'
import { PLATFORM_ICONS, PLATFORM_COLORS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'

interface InlineSongAddProps {
  distributionId: number
  onClose: () => void
  onSuccess?: () => void
}

// Distribution platforms in display order
const DISTRIBUTION_PLATFORMS: Platform[] = [
  'spotify',
  'apple_music',
  'youtube',
  'tiktok',
  'amazon_music',
  'deezer',
  'soundcloud',
]

// Platform labels
const PLATFORM_LABELS: Record<Platform, string> = {
  spotify: 'Spotify',
  apple_music: 'Apple Music',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  amazon_music: 'Amazon',
  deezer: 'Deezer',
  soundcloud: 'SoundCloud',
  meta: 'Meta',
  google: 'Google',
  twitter: 'Twitter',
  snapchat: 'Snapchat',
  pinterest: 'Pinterest',
  linkedin: 'LinkedIn',
  other: 'Other',
  multi: 'Multi',
}

// Status groups for better organization (like service type groups in campaigns)
const STATUS_OPTIONS = [
  { value: 'pending' as const, label: 'Pending' },
  { value: 'live' as const, label: 'Live' },
  { value: 'taken_down' as const, label: 'Taken Down' },
]

// Client type options
const CLIENT_TYPE_OPTIONS = [
  { value: '', label: 'Select type' },
  { value: 'Original', label: 'Original' },
  { value: 'Cover', label: 'Cover' },
  { value: 'Remix', label: 'Remix' },
  { value: 'Master', label: 'Master' },
  { value: 'Remaster', label: 'Remaster' },
]

export function InlineSongAdd({
  distributionId,
  onClose,
  onSuccess,
}: InlineSongAddProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Form state - minimal like campaigns
  const [songName, setSongName] = useState('')
  const [artistName, setArtistName] = useState('')
  const [isrc, setIsrc] = useState('')
  const [clientType, setClientType] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'live' | 'taken_down'>('pending')

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (data: DistributionSongFormData) =>
      distributionsService.addSong(distributionId, data),
    onSuccess: () => {
      toast({ title: 'Song added successfully' })
      queryClient.invalidateQueries({ queryKey: ['distribution', distributionId.toString()] })
      queryClient.invalidateQueries({ queryKey: ['distributions'] })
      onSuccess?.()
      onClose()
    },
    onError: () => {
      toast({ title: 'Failed to add song', variant: 'destructive' })
    },
  })

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  const handleSubmit = async () => {
    if (!songName.trim() || !artistName.trim()) return

    const data: DistributionSongFormData = {
      song_name: songName.trim(),
      artist_name: artistName.trim(),
      isrc: isrc.trim() || undefined,
      client_type: clientType || undefined,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      distribution_status: selectedStatus,
    }

    try {
      await addMutation.mutateAsync(data)
      // Reset and close
      setSongName('')
      setArtistName('')
      setIsrc('')
      setClientType('')
      setSelectedPlatforms([])
      setSelectedStatus('pending')
      onClose()
    } catch {
      // Error handled by mutation
    }
  }

  const handleCancel = () => {
    setSongName('')
    setArtistName('')
    setIsrc('')
    setClientType('')
    setSelectedPlatforms([])
    setSelectedStatus('pending')
    onClose()
  }

  const canSubmit = songName.trim() !== '' && artistName.trim() !== ''

  return (
    <Card className="p-4 rounded-xl border-primary/20 bg-primary/5 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Add song</p>
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

        {/* Song Name & Artist Name - Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Song Name *</p>
            <Input
              placeholder="Enter song name"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Artist Name *</p>
            <Input
              placeholder="Enter artist name"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* ISRC & Client Type - Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">ISRC</p>
            <Input
              placeholder="e.g. USRC12345678"
              value={isrc}
              onChange={(e) => setIsrc(e.target.value)}
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Type</p>
            <div className="flex gap-1 flex-wrap">
              {CLIENT_TYPE_OPTIONS.filter(o => o.value).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setClientType(clientType === option.value ? '' : option.value)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-all',
                    clientType === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Icons Row - Exact same pattern as campaigns */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Platforms</p>
          <div className="flex flex-wrap gap-1">
            {DISTRIBUTION_PLATFORMS.map((platform) => {
              const Icon = PLATFORM_ICONS[platform]
              const isSelected = selectedPlatforms.includes(platform)
              const brandColor = PLATFORM_COLORS[platform]
              const textColor = PLATFORM_TEXT_COLORS[platform]

              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  title={PLATFORM_LABELS[platform]}
                  className={cn(
                    'p-2 rounded-lg border transition-all',
                    textColor,
                    isSelected
                      ? brandColor?.replace(textColor, '') || 'bg-primary/10 border-primary/30'
                      : 'border-transparent hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Status Selection - Grouped buttons like service types */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Status</p>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedStatus(option.value)}
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium transition-all',
                  selectedStatus === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Button - Same as campaigns */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || addMutation.isPending}
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Add Song'
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
