import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Music, TrendingUp } from 'lucide-react';
import { Song, SongNote } from '@/types/song';
import { ProgressBar } from './ProgressBar';
import { StageBadge } from './StageBadge';

interface CompactSongCardProps {
  song: Song;
  recentNotes?: SongNote[];
}

export const CompactSongCard = ({ song, recentNotes = [] }: CompactSongCardProps) => {
  // Get active stages (in_progress status)
  const activeStages = song.stage_statuses?.filter(s => s.status === 'in_progress') || [];

  return (
    <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-xl shadow-lg">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-6">
          {/* LEFT: Title and Artist */}
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold leading-tight">{song.title}</h1>
            <p className="text-sm text-muted-foreground">{song.artist?.display_name || 'No artist'}</p>
          </div>

          {/* RIGHT: All Info */}
          <div className="flex items-center gap-4 text-sm">
            {/* Active Stages */}
            {activeStages.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  {activeStages.map((stageStatus) => (
                    <StageBadge key={stageStatus.id} stage={stageStatus.stage} />
                  ))}
                </div>
                <div className="h-10 w-px bg-white/10" />
              </>
            )}

            {/* Progress */}
            <div className="flex items-center gap-2 min-w-[140px]">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <ProgressBar progress={song.checklist_progress} showLabel={true} />
              </div>
            </div>

            {/* Divider */}
            <div className="h-10 w-px bg-white/10" />

            {/* Target Release */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {song.target_release_date
                  ? new Date(song.target_release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Not set'}
              </span>
            </div>

            {/* Genre */}
            {song.genre && (
              <>
                <div className="h-10 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{song.genre}</span>
                </div>
              </>
            )}

            {/* Assigned User */}
            {song.assigned_user && (
              <>
                <div className="h-10 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-xs">Assigned:</span>
                  <span className="font-semibold">{song.assigned_user.full_name}</span>
                </div>
              </>
            )}

            {/* Activity Count */}
            {recentNotes.length > 0 && (
              <>
                <div className="h-10 w-px bg-white/10" />
                <Badge variant="outline" className="text-xs">
                  {recentNotes.length} notes
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <TabsList className="grid w-full grid-cols-8 p-2 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-12 shadow-lg">
          <TabsTrigger
            value="overview"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="artists"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
          >
            Artists
          </TabsTrigger>
          <TabsTrigger
            value="work"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
          >
            Work
          </TabsTrigger>
          <TabsTrigger
            value="recording"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
          >
            Recording
          </TabsTrigger>
          <TabsTrigger
            value="assets"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
          >
            Assets
          </TabsTrigger>
          <TabsTrigger
            value="release"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
          >
            Release
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
          >
            Activity
          </TabsTrigger>
        </TabsList>
      </CardContent>
    </Card>
  );
};
