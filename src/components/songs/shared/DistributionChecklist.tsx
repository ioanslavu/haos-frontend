import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { Publication } from '@/types/song';
import { differenceInDays, parseISO, isPast, isFuture } from 'date-fns';

interface DistributionChecklistProps {
  publications: Publication[];
  releaseDate?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'warning' | 'blocked';
  detail?: string;
}

export function DistributionChecklist({ publications, releaseDate }: DistributionChecklistProps) {
  const majorPlatforms = ['spotify_album', 'apple_music_album', 'youtube_music', 'amazon_music_album'];

  const hasMajorPlatforms = majorPlatforms.some(platform =>
    publications.some(p => p.platform === platform)
  );

  const allLive = publications.length > 0 && publications.every(p => p.status === 'live');
  const anyLive = publications.some(p => p.status === 'live');
  const anyProcessing = publications.some(p => ['processing', 'submitted'].includes(p.status));
  const anyBlocked = publications.some(p => ['blocked', 'taken_down'].includes(p.status));

  // Check deadlines
  let daysUntilRelease: number | null = null;
  let missedDeadline = false;
  let urgentDeadline = false;

  if (releaseDate) {
    const releaseDateObj = parseISO(releaseDate);
    if (isFuture(releaseDateObj)) {
      daysUntilRelease = differenceInDays(releaseDateObj, new Date());
      urgentDeadline = daysUntilRelease <= 7;
      missedDeadline = daysUntilRelease < 0;
    }
  }

  const checklistItems: ChecklistItem[] = [
    {
      id: 'release_info',
      label: 'Release Information Complete',
      description: 'Title, UPC, release date, and metadata are set',
      status: releaseDate ? 'completed' : 'warning',
      detail: releaseDate ? 'All required information present' : 'Missing release date',
    },
    {
      id: 'major_platforms',
      label: 'Major Platforms Configured',
      description: 'Spotify, Apple Music, YouTube Music, Amazon Music',
      status: hasMajorPlatforms ? 'completed' : 'pending',
      detail: hasMajorPlatforms
        ? `${publications.filter(p => majorPlatforms.includes(p.platform)).length}/${majorPlatforms.length} major platforms configured`
        : 'No major platforms configured yet',
    },
    {
      id: 'all_submitted',
      label: 'All Platforms Submitted',
      description: 'Content submitted to all configured platforms',
      status: publications.length === 0
        ? 'pending'
        : publications.every(p => ['submitted', 'processing', 'live'].includes(p.status))
        ? 'completed'
        : anyProcessing
        ? 'in_progress'
        : 'pending',
      detail: publications.length > 0
        ? `${publications.filter(p => ['submitted', 'processing', 'live'].includes(p.status)).length}/${publications.length} platforms submitted`
        : 'No platforms configured',
    },
    {
      id: 'no_blocks',
      label: 'No Blocked or Issues',
      description: 'All publications are active or processing',
      status: anyBlocked ? 'blocked' : publications.length > 0 ? 'completed' : 'pending',
      detail: anyBlocked
        ? `${publications.filter(p => ['blocked', 'taken_down'].includes(p.status)).length} platforms have issues`
        : publications.length > 0
        ? 'No issues detected'
        : 'No platforms to check',
    },
    {
      id: 'timeline',
      label: 'Submission Timeline',
      description: 'Submitted at least 14 days before release date',
      status: !releaseDate
        ? 'pending'
        : missedDeadline
        ? 'blocked'
        : urgentDeadline
        ? 'warning'
        : daysUntilRelease !== null && daysUntilRelease > 14
        ? 'completed'
        : anyProcessing || anyLive
        ? 'in_progress'
        : 'pending',
      detail: releaseDate
        ? daysUntilRelease !== null
          ? missedDeadline
            ? 'Release date has passed'
            : urgentDeadline
            ? `Only ${daysUntilRelease} days until release (urgent)`
            : `${daysUntilRelease} days until release`
          : 'Release date has passed'
        : 'No release date set',
    },
    {
      id: 'all_live',
      label: 'All Platforms Live',
      description: 'Content is live on all configured platforms',
      status: publications.length === 0
        ? 'pending'
        : allLive
        ? 'completed'
        : anyLive
        ? 'in_progress'
        : 'pending',
      detail: publications.length > 0
        ? `${publications.filter(p => p.status === 'live').length}/${publications.length} platforms live`
        : 'No platforms configured',
    },
  ];

  const completedCount = checklistItems.filter(item => item.status === 'completed').length;
  const totalCount = checklistItems.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'blocked':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            Complete
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
            In Progress
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
            Warning
          </Badge>
        );
      case 'blocked':
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
            Blocked
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20">
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Distribution Checklist</CardTitle>
            <CardDescription>
              Track distribution readiness and compliance
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{completionPercentage}%</p>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{totalCount} complete
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checklistItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-4 border rounded-xl hover:bg-accent/50 transition-colors"
            >
              <div className="relative z-10 mt-0.5">
                {getStatusIcon(item.status)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h4 className="font-semibold text-sm">{item.label}</h4>
                  {getStatusBadge(item.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {item.description}
                </p>
                {item.detail && (
                  <p className="text-xs text-muted-foreground">
                    {item.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {anyBlocked && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300">
                  Action Required
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Some platforms have issues that need to be resolved before the release can go live.
                </p>
              </div>
            </div>
          </div>
        )}

        {urgentDeadline && !missedDeadline && (
          <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                  Urgent: Approaching Deadline
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Release date is in less than 7 days. Ensure all platforms are submitted and processing.
                </p>
              </div>
            </div>
          </div>
        )}

        {allLive && publications.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  Release Complete
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  All platforms are live. Monitor performance and analytics.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
