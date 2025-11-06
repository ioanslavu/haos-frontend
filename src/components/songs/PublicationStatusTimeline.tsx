import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Publication } from '@/types/song';
import { formatDistanceToNow } from 'date-fns';

interface PublicationStatusTimelineProps {
  publications: Publication[];
}

export function PublicationStatusTimeline({ publications }: PublicationStatusTimelineProps) {
  const sortedPublications = [...publications].sort((a, b) => {
    const dateA = a.published_at || a.scheduled_for || a.created_at;
    const dateB = b.published_at || b.scheduled_for || b.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'text-green-600 dark:text-green-400';
      case 'processing':
      case 'submitted':
        return 'text-blue-600 dark:text-blue-400';
      case 'planned':
        return 'text-gray-600 dark:text-gray-400';
      case 'blocked':
      case 'taken_down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getTimelineIcon = (status: string, isFirst: boolean) => {
    const colorClass = getStatusColor(status);

    if (status === 'live') {
      return <CheckCircle2 className={`h-5 w-5 ${colorClass}`} />;
    }

    if (status === 'processing' || status === 'submitted') {
      return <Clock className={`h-5 w-5 ${colorClass}`} />;
    }

    return <Circle className={`h-5 w-5 ${colorClass} ${isFirst ? 'fill-current' : ''}`} />;
  };

  const getPlatformName = (platform: string): string => {
    const platformMap: Record<string, string> = {
      spotify_track: 'Spotify',
      spotify_album: 'Spotify Album',
      apple_music_track: 'Apple Music',
      apple_music_album: 'Apple Music Album',
      youtube_video: 'YouTube',
      youtube_music: 'YouTube Music',
      amazon_music_track: 'Amazon Music',
      tiktok_sound: 'TikTok',
      deezer_track: 'Deezer',
      tidal_track: 'Tidal',
      soundcloud_track: 'SoundCloud',
    };
    return platformMap[platform] || platform;
  };

  if (sortedPublications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Publication Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No publication history yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publication Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {sortedPublications.map((pub, index) => {
            const isFirst = index === 0;
            const isLast = index === sortedPublications.length - 1;
            const eventDate = pub.published_at || pub.scheduled_for || pub.created_at;

            return (
              <div key={pub.id} className="relative flex gap-4">
                {!isLast && (
                  <div className="absolute left-2.5 top-8 bottom-0 w-px bg-border" />
                )}

                <div className="relative z-10 mt-1">
                  {getTimelineIcon(pub.status, isFirst)}
                </div>

                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {getPlatformName(pub.platform)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {pub.status === 'live' && pub.published_at
                          ? `Published ${formatDistanceToNow(new Date(pub.published_at), {
                              addSuffix: true,
                            })}`
                          : pub.status === 'planned' && pub.scheduled_for
                          ? `Scheduled for ${new Date(pub.scheduled_for).toLocaleDateString()}`
                          : `Status: ${pub.status.replace('_', ' ')}`}
                      </p>
                      {pub.territory && pub.territory !== 'GLOBAL' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Territory: {pub.territory}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        pub.status === 'live'
                          ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
                          : pub.status === 'processing' || pub.status === 'submitted'
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                          : 'border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400'
                      }`}
                    >
                      {pub.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
