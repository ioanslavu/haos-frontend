/**
 * SongsTab - Songs/catalog tab content
 */

import {
  LayoutGrid,
  List,
  MoreHorizontal,
  Music,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { DISTRIBUTION_STATUS_CONFIG, DISTRIBUTION_PLATFORM_LABELS } from '@/types/distribution'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import { InlineSongAdd } from './InlineSongAdd'
import { SongCard } from './SongCard'
import type { DistributionSong } from '@/types/distribution'

interface SongsTabProps {
  distributionId: number
  songs: DistributionSong[]
  showAddSongInline: boolean
  setShowAddSongInline: (show: boolean) => void
  songsViewMode: 'cards' | 'table'
  setSongsViewMode: (mode: 'cards' | 'table') => void
  expandedSongIds: Set<number>
  toggleSongExpanded: (songId: number) => void
  onRemoveSong: (songId: number) => void
}

export function SongsTab({
  distributionId,
  songs,
  showAddSongInline,
  setShowAddSongInline,
  songsViewMode,
  setSongsViewMode,
  expandedSongIds,
  toggleSongExpanded,
  onRemoveSong,
}: SongsTabProps) {
  return (
    <div className="space-y-4">
      {/* Inline Add Form - shown at top when triggered */}
      {showAddSongInline && (
        <InlineSongAdd
          distributionId={distributionId}
          onClose={() => setShowAddSongInline(false)}
        />
      )}

      {(!songs || songs.length === 0) ? (
        <EmptyState
          showAddSongInline={showAddSongInline}
          setShowAddSongInline={setShowAddSongInline}
        />
      ) : (
        <>
          {/* Header with count, view toggle, and add button */}
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {songs.length} Song{songs.length !== 1 ? 's' : ''}
            </h3>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <ViewToggle
                viewMode={songsViewMode}
                setViewMode={setSongsViewMode}
              />
              {!showAddSongInline && (
                <Button onClick={() => setShowAddSongInline(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Song
                </Button>
              )}
            </div>
          </div>

          {/* Card View */}
          {songsViewMode === 'cards' && (
            <div className="space-y-3">
              {songs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  distributionId={distributionId}
                  isExpanded={expandedSongIds.has(song.id)}
                  onToggleExpand={() => toggleSongExpanded(song.id)}
                />
              ))}
            </div>
          )}

          {/* Table View */}
          {songsViewMode === 'table' && (
            <SongsTable
              songs={songs}
              setSongsViewMode={setSongsViewMode}
              setExpandedSongIds={(fn) => {
                // This is a workaround - ideally we'd lift this state properly
              }}
              onRemoveSong={onRemoveSong}
              onExpandSong={(songId) => {
                setSongsViewMode('cards')
                // Toggle expansion via parent
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({
  showAddSongInline,
  setShowAddSongInline,
}: {
  showAddSongInline: boolean
  setShowAddSongInline: (show: boolean) => void
}) {
  return (
    <Card className="p-12 rounded-2xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Music className="h-8 w-8 text-primary" />
      </div>
      <h4 className="font-semibold mb-2">No songs yet</h4>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
        Add songs to this distribution to track their platforms and status.
      </p>
      {!showAddSongInline && (
        <Button onClick={() => setShowAddSongInline(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Song
        </Button>
      )}
    </Card>
  )
}

function ViewToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: 'cards' | 'table'
  setViewMode: (mode: 'cards' | 'table') => void
}) {
  return (
    <div className="flex items-center border rounded-lg p-0.5 bg-muted/30">
      <button
        onClick={() => setViewMode('cards')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          viewMode === 'cards'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Card view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => setViewMode('table')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          viewMode === 'table'
            ? 'bg-background shadow-sm text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Table view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  )
}

function SongsTable({
  songs,
  setSongsViewMode,
  setExpandedSongIds,
  onRemoveSong,
  onExpandSong,
}: {
  songs: DistributionSong[]
  setSongsViewMode: (mode: 'cards' | 'table') => void
  setExpandedSongIds: (fn: (prev: Set<number>) => Set<number>) => void
  onRemoveSong: (songId: number) => void
  onExpandSong: (songId: number) => void
}) {
  return (
    <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/10">
            <TableHead>Song</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>ISRC</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Platforms</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.map((song) => {
            const statusConfig = DISTRIBUTION_STATUS_CONFIG[song.distribution_status]

            return (
              <TableRow
                key={song.id}
                className="hover:bg-muted/50 border-white/10 cursor-pointer"
                onClick={() => onExpandSong(song.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{song.song_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{song.artist_name}</span>
                </TableCell>
                <TableCell>
                  {song.isrc ? (
                    <span className="text-xs font-mono text-muted-foreground">{song.isrc}</span>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {song.client_type ? (
                    <Badge variant="outline" className="text-xs">
                      {song.client_type}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/50">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {song.platforms.slice(0, 4).map((platform) => {
                      const Icon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS]
                      const colorClass = PLATFORM_TEXT_COLORS[platform as keyof typeof PLATFORM_TEXT_COLORS]
                      return Icon ? (
                        <Icon
                          key={platform}
                          className={cn('h-4 w-4', colorClass)}
                          title={DISTRIBUTION_PLATFORM_LABELS[platform]}
                        />
                      ) : null
                    })}
                    {song.platforms.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{song.platforms.length - 4}
                      </span>
                    )}
                    {song.platforms.length === 0 && (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onExpandSong(song.id)
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveSong(song.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
