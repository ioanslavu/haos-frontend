/**
 * SongCard - Expandable card for distribution songs
 *
 * Matches Campaign's SubCampaignCard pattern:
 * - Collapsible card with summary header
 * - Click-to-edit inline fields
 * - Platform icons with brand colors
 * - Status badge
 */

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Music,
  Trash2,
  Loader2,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { useUpdateSong, useRemoveSong } from '@/api/hooks/useDistributions'
import { cn } from '@/lib/utils'
import type { DistributionSong, Platform } from '@/types/distribution'
import { DISTRIBUTION_STATUS_CONFIG } from '@/types/distribution'
import { PLATFORM_ICONS, PLATFORM_COLORS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'

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

// Status options
const STATUS_OPTIONS = [
  { value: 'pending' as const, label: 'Pending' },
  { value: 'live' as const, label: 'Live' },
  { value: 'taken_down' as const, label: 'Taken Down' },
]

// Client type options
const CLIENT_TYPE_OPTIONS = ['Original', 'Cover', 'Remix', 'Master', 'Remaster']

interface SongCardProps {
  song: DistributionSong
  distributionId: number
  isExpanded: boolean
  onToggleExpand: () => void
}

export function SongCard({
  song,
  distributionId,
  isExpanded,
  onToggleExpand,
}: SongCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [releaseDateOpen, setReleaseDateOpen] = useState(false)

  // Inline editing state
  type EditableField = 'song_name' | 'artist_name' | 'isrc' | 'client_type' | 'mentions' | 'notes' | null
  const [editingField, setEditingField] = useState<EditableField>(null)

  // Field values
  const [songNameInput, setSongNameInput] = useState(song.song_name)
  const [artistNameInput, setArtistNameInput] = useState(song.artist_name)
  const [isrcInput, setIsrcInput] = useState(song.isrc || '')
  const [mentionsInput, setMentionsInput] = useState(song.mentions || '')
  const [notesInput, setNotesInput] = useState(song.notes || '')

  // Sync input values when song data changes
  useEffect(() => {
    if (editingField === null) {
      setSongNameInput(song.song_name)
      setArtistNameInput(song.artist_name)
      setIsrcInput(song.isrc || '')
      setMentionsInput(song.mentions || '')
      setNotesInput(song.notes || '')
    }
  }, [song, editingField])

  const updateSong = useUpdateSong()
  const removeSong = useRemoveSong()

  const statusConfig = DISTRIBUTION_STATUS_CONFIG[song.distribution_status]

  // Generic save handler for text fields
  const handleSaveField = async (field: NonNullable<EditableField>) => {
    const inputMap: Record<string, string> = {
      song_name: songNameInput,
      artist_name: artistNameInput,
      isrc: isrcInput,
      mentions: mentionsInput,
      notes: notesInput,
    }
    const originalMap: Record<string, string> = {
      song_name: song.song_name,
      artist_name: song.artist_name,
      isrc: song.isrc || '',
      mentions: song.mentions || '',
      notes: song.notes || '',
    }
    const setterMap: Record<string, (v: string) => void> = {
      song_name: setSongNameInput,
      artist_name: setArtistNameInput,
      isrc: setIsrcInput,
      mentions: setMentionsInput,
      notes: setNotesInput,
    }

    if (inputMap[field] === originalMap[field]) {
      setEditingField(null)
      return
    }

    try {
      await updateSong.mutateAsync({
        distributionId,
        songId: song.id,
        data: { [field]: inputMap[field] || undefined },
      })
      setEditingField(null)
    } catch {
      setterMap[field](originalMap[field])
      setEditingField(null)
    }
  }

  // Handle status change
  const handleStatusChange = async (status: 'pending' | 'live' | 'taken_down') => {
    try {
      await updateSong.mutateAsync({
        distributionId,
        songId: song.id,
        data: { distribution_status: status },
      })
    } catch {
      // Error handled by mutation
    }
  }

  // Handle client type change
  const handleClientTypeChange = async (clientType: string) => {
    try {
      await updateSong.mutateAsync({
        distributionId,
        songId: song.id,
        data: { client_type: clientType || undefined },
      })
    } catch {
      // Error handled by mutation
    }
  }

  // Handle platform toggle
  const handlePlatformToggle = async (platform: Platform) => {
    const newPlatforms = song.platforms.includes(platform)
      ? song.platforms.filter(p => p !== platform)
      : [...song.platforms, platform]

    try {
      await updateSong.mutateAsync({
        distributionId,
        songId: song.id,
        data: { platforms: newPlatforms },
      })
    } catch {
      // Error handled by mutation
    }
  }

  // Handle release date change
  const handleReleaseDateChange = async (date: Date | undefined) => {
    try {
      await updateSong.mutateAsync({
        distributionId,
        songId: song.id,
        data: { release_date: date ? format(date, 'yyyy-MM-dd') : null },
      })
      setReleaseDateOpen(false)
    } catch {
      // Error handled by mutation
    }
  }

  // Handle delete
  const handleDelete = async () => {
    try {
      await removeSong.mutateAsync({ distributionId, songId: song.id })
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

                {/* Song Icon */}
                <div className="p-2 rounded-lg bg-primary/10">
                  <Music className="h-6 w-6 text-primary" />
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{song.song_name}</h4>
                    {song.client_type && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {song.client_type}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{song.artist_name}</span>
                    {song.isrc && (
                      <span className="font-mono text-xs">{song.isrc}</span>
                    )}
                  </div>
                </div>

                {/* Platform Icons */}
                <div className="flex items-center gap-1">
                  {song.platforms.slice(0, 5).map((platform) => {
                    const Icon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]
                    const colorClass = PLATFORM_TEXT_COLORS[platform as keyof typeof PLATFORM_TEXT_COLORS]
                    return Icon ? (
                      <Icon
                        key={platform}
                        className={cn('h-4 w-4', colorClass)}
                        title={PLATFORM_LABELS[platform as Platform]}
                      />
                    ) : null
                  })}
                  {song.platforms.length > 5 && (
                    <span className="text-xs text-muted-foreground">
                      +{song.platforms.length - 5}
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, 'shrink-0')}>
                  {statusConfig.label}
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
                  title="Delete song"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-4">
              {/* Basic Info - Click to edit */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Song Name */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Song Name</p>
                  {editingField === 'song_name' ? (
                    <Input
                      value={songNameInput}
                      onChange={(e) => setSongNameInput(e.target.value)}
                      onBlur={() => handleSaveField('song_name')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('song_name')
                        if (e.key === 'Escape') {
                          setSongNameInput(song.song_name)
                          setEditingField(null)
                        }
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField('song_name')}
                      className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left w-full truncate"
                    >
                      {song.song_name}
                    </button>
                  )}
                </div>

                {/* Artist Name */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Artist Name</p>
                  {editingField === 'artist_name' ? (
                    <Input
                      value={artistNameInput}
                      onChange={(e) => setArtistNameInput(e.target.value)}
                      onBlur={() => handleSaveField('artist_name')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('artist_name')
                        if (e.key === 'Escape') {
                          setArtistNameInput(song.artist_name)
                          setEditingField(null)
                        }
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField('artist_name')}
                      className="font-medium hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left w-full truncate"
                    >
                      {song.artist_name}
                    </button>
                  )}
                </div>

                {/* ISRC */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ISRC</p>
                  {editingField === 'isrc' ? (
                    <Input
                      value={isrcInput}
                      onChange={(e) => setIsrcInput(e.target.value)}
                      onBlur={() => handleSaveField('isrc')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveField('isrc')
                        if (e.key === 'Escape') {
                          setIsrcInput(song.isrc || '')
                          setEditingField(null)
                        }
                      }}
                      className="h-8 text-sm font-mono"
                      placeholder="USRC12345678"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField('isrc')}
                      className="font-mono text-sm hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left w-full"
                    >
                      {song.isrc || <span className="text-muted-foreground">Add ISRC</span>}
                    </button>
                  )}
                </div>

                {/* Release Date */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Release Date</p>
                  <Popover open={releaseDateOpen} onOpenChange={setReleaseDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1 -mx-2 rounded text-sm transition-colors hover:bg-muted/50 text-left",
                          !song.release_date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {song.release_date ? format(new Date(song.release_date), 'MMM d, yyyy') : 'Set date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={song.release_date ? new Date(song.release_date) : undefined}
                        onSelect={handleReleaseDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Client Type Selection */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Type</p>
                <div className="flex gap-1 flex-wrap">
                  {CLIENT_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleClientTypeChange(song.client_type === type ? '' : type)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        song.client_type === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Selection */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Platforms</p>
                <div className="flex flex-wrap gap-1">
                  {DISTRIBUTION_PLATFORMS.map((platform) => {
                    const Icon = PLATFORM_ICONS[platform]
                    const isSelected = song.platforms.includes(platform)
                    const brandColor = PLATFORM_COLORS[platform]
                    const textColor = PLATFORM_TEXT_COLORS[platform]

                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => handlePlatformToggle(platform)}
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

              {/* Status Selection */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Status</p>
                <div className="flex gap-1">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStatusChange(option.value)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        song.distribution_status === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mentions */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Mentions / Special Notes</p>
                {editingField === 'mentions' ? (
                  <Input
                    value={mentionsInput}
                    onChange={(e) => setMentionsInput(e.target.value)}
                    onBlur={() => handleSaveField('mentions')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveField('mentions')
                      if (e.key === 'Escape') {
                        setMentionsInput(song.mentions || '')
                        setEditingField(null)
                      }
                    }}
                    className="h-8 text-sm"
                    placeholder="Add mentions or special contract notes..."
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => setEditingField('mentions')}
                    className="text-sm hover:bg-muted/50 px-2 py-1 -mx-2 rounded transition-colors text-left w-full"
                  >
                    {song.mentions || <span className="text-muted-foreground">Add mentions...</span>}
                  </button>
                )}
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
                        setNotesInput(song.notes || '')
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
                    {song.notes || <span className="text-muted-foreground">Add notes...</span>}
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
            <AlertDialogTitle>Delete Song</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{song.song_name}" from this distribution?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {removeSong.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
