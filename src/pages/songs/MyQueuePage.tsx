import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StageBadge } from '@/components/songs/StageBadge';
import { ProgressBar } from '@/components/songs/ProgressBar';
import { fetchMyQueue, fetchOverdueSongs } from '@/api/songApi';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { Song } from '@/types/song';
import { AppLayout } from '@/components/layout/AppLayout';

export default function MyQueuePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['my-queue'],
    queryFn: fetchMyQueue,
  });

  const { data: overdueData, isLoading: overdueLoading } = useQuery({
    queryKey: ['overdue-songs'],
    queryFn: fetchOverdueSongs,
  });

  const queue = Array.isArray(queueData?.data) ? queueData.data : [];
  const overdue = Array.isArray(overdueData?.data) ? overdueData.data : [];

  // Group queue by priority (overdue first, then by days in stage)
  const priorityQueue = [...queue].sort((a, b) => {
    if (a.is_overdue && !b.is_overdue) return -1;
    if (!a.is_overdue && b.is_overdue) return 1;
    return b.days_in_current_stage - a.days_in_current_stage;
  });

  const renderSongCard = (song: Song, showPriority = false) => (
    <Card
      key={song.id}
      className="cursor-pointer hover:shadow-xl transition-all rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-lg hover:scale-[1.02]"
      onClick={() => navigate(`/songs/${song.id}`)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 truncate">{song.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{song.artist?.display_name || 'No artist'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {song.current_stage && <StageBadge stage={song.current_stage} />}
              {song.is_overdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
              {showPriority && song.days_in_current_stage > 7 && !song.is_overdue && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {song.days_in_current_stage} days
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs text-muted-foreground">
                {song.checklist_progress}%
              </span>
            </div>
            <ProgressBar progress={song.checklist_progress} showLabel={false} />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{song.days_in_current_stage} days in stage</span>
            </div>
            {song.target_release_date && (
              <span
                className={song.is_overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}
              >
                Due: {new Date(song.target_release_date).toLocaleDateString()}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/songs/${song.id}`);
            }}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                My Queue
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Songs assigned to your department that need attention
              </p>
            </div>
          </div>
        </div>

        {queueLoading || overdueLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {overdue.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h2 className="text-xl font-semibold text-red-600">
                    Overdue ({overdue.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {overdue.map((song) => renderSongCard(song))}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center gap-2 mb-4">
                <ListMusic className="h-5 w-5" />
                <h2 className="text-xl font-semibold">
                  In Progress ({priorityQueue.filter((s) => !s.is_overdue).length})
                </h2>
              </div>
              {priorityQueue.filter((s) => !s.is_overdue).length === 0 ? (
                <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
                  <CardContent className="py-12 text-center">
                    <ListMusic className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground mb-2">Your queue is empty!</p>
                    <p className="text-sm text-muted-foreground">
                      No songs currently assigned to {user?.department || 'your department'}.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 rounded-xl"
                      onClick={() => navigate('/songs')}
                    >
                      View All Songs
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {priorityQueue
                    .filter((s) => !s.is_overdue)
                    .map((song) => renderSongCard(song, true))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
