import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Music, User } from 'lucide-react';
import { Song } from '@/types/song';
import { formatDistanceToNow } from 'date-fns';

interface SongInfoCardProps {
  song: Song;
}

export const SongInfoCard = ({ song }: SongInfoCardProps) => {
  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">Song Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Artist */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Artist{song.featured_artists && song.featured_artists.length > 0 ? 's' : ''}</p>
              <p className="text-sm font-semibold">
                {song.display_artists || song.artist?.display_name || 'No artist'}
              </p>
              {song.featured_artists && song.featured_artists.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Primary + {song.featured_artists.length} featured
                </p>
              )}
            </div>
          </div>

          {/* Genre */}
          {song.genre && (
            <div className="flex items-start gap-3">
              <Music className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Genre</p>
                <p className="text-sm font-semibold">{song.genre}</p>
              </div>
            </div>
          )}

          {/* Target Release Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Target Release</p>
              <p className="text-sm font-semibold">
                {song.target_release_date
                  ? new Date(song.target_release_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>
          </div>

          {/* Time in Stage */}
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time in Stage</p>
              <p className="text-sm font-semibold">
                {song.days_in_current_stage} {song.days_in_current_stage === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          {/* Language */}
          {song.language && (
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Language</p>
                <p className="text-sm font-semibold">{song.language}</p>
              </div>
            </div>
          )}

          {/* Assigned User */}
          {song.assigned_user && (
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                <p className="text-sm font-semibold">{song.assigned_user.full_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Work, Recording, Release IDs */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Catalog Links</p>
          <div className="flex flex-wrap gap-2">
            {song.work && (
              <Badge variant="outline" className="text-xs hover:bg-primary/10 transition-colors">
                Work: {song.work.iswc || `ID ${song.work.id}`}
              </Badge>
            )}
            {song.recording && (
              <Badge variant="outline" className="text-xs hover:bg-primary/10 transition-colors">
                Recording: {song.recording.isrc || `ID ${song.recording.id}`}
              </Badge>
            )}
            {song.release && (
              <Badge variant="outline" className="text-xs hover:bg-primary/10 transition-colors">
                Release: {song.release.upc || `ID ${song.release.id}`}
              </Badge>
            )}
            {!song.work && !song.recording && !song.release && (
              <p className="text-xs text-muted-foreground">No catalog links yet</p>
            )}
          </div>
        </div>

        {/* Created/Updated */}
        <div className="pt-4 border-t border-white/10 text-xs text-muted-foreground space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Created {formatDistanceToNow(new Date(song.created_at), { addSuffix: true })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Updated {formatDistanceToNow(new Date(song.updated_at), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
