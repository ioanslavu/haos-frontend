import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Publication } from '@/types/song';

interface PlatformDistributionListProps {
  publications: Publication[];
}

export function PlatformDistributionList({ publications }: PlatformDistributionListProps) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'processing':
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'planned':
        return <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
      case 'blocked':
      case 'taken_down':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'processing':
      case 'submitted':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'planned':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      case 'blocked':
      case 'taken_down':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'private':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const groupedPublications = publications.reduce((acc, pub) => {
    const platformName = getPlatformName(pub.platform);
    if (!acc[platformName]) {
      acc[platformName] = [];
    }
    acc[platformName].push(pub);
    return acc;
  }, {} as Record<string, Publication[]>);

  if (publications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No distribution platforms configured yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedPublications).map(([platformName, pubs]) => {
            const mainPub = pubs[0];
            return (
              <div
                key={platformName}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(mainPub.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold">{platformName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(mainPub.status)}>
                        {mainPub.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {mainPub.territory && mainPub.territory !== 'GLOBAL' && (
                        <span className="text-xs text-muted-foreground">
                          {mainPub.territory}
                        </span>
                      )}
                    </div>
                    {mainPub.published_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Published{' '}
                        {new Date(mainPub.published_at).toLocaleDateString()}
                      </p>
                    )}
                    {mainPub.scheduled_for && !mainPub.published_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Scheduled for{' '}
                        {new Date(mainPub.scheduled_for).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {mainPub.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={mainPub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
