import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StageBadge } from './StageBadge';
import { StageTransitionDialog } from './StageTransitionDialog';
import { Song, SongStage, SongChecklistItem } from '@/types/song';
import { ArrowRight, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface StageInfoCardProps {
  song: Song;
  checklist: SongChecklistItem[];
  className?: string;
}

// Define stage flow
const stageFlow: SongStage[] = [
  'draft',
  'publishing',
  'label_recording',
  'marketing_assets',
  'label_review',
  'ready_for_digital',
  'digital_distribution',
  'released',
];

const stageDescriptions: Record<SongStage, string> = {
  draft: 'Initial song creation. Set up basic information and assign team members.',
  publishing: 'Register copyright, clear rights, and define writer/publisher splits.',
  label_recording: 'Record the song, upload master files, and assign production credits.',
  marketing_assets: 'Create marketing materials including cover art and promotional content.',
  label_review: 'Label team reviews all assets and metadata before distribution.',
  ready_for_digital: 'Final preparation before distribution. Create release and set platforms.',
  digital_distribution: 'Song is being distributed to streaming platforms.',
  released: 'Song is live on all platforms and available to the public.',
  archived: 'Song has been archived or cancelled.',
};

const estimatedDays: Record<SongStage, number> = {
  draft: 1,
  publishing: 3,
  label_recording: 7,
  marketing_assets: 5,
  label_review: 2,
  ready_for_digital: 1,
  digital_distribution: 3,
  released: 0,
  archived: 0,
};

export const StageInfoCard = ({ song, checklist, className }: StageInfoCardProps) => {
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<SongStage | null>(null);
  const [isRejection, setIsRejection] = useState(false);
  const { isAdmin } = useAuthStore();

  const currentStage = song.current_stage || 'draft';
  const currentIndex = stageFlow.indexOf(currentStage);
  const nextStage = currentIndex >= 0 && currentIndex < stageFlow.length - 1 ? stageFlow[currentIndex + 1] : null;
  const previousStage = currentIndex > 0 ? stageFlow[currentIndex - 1] : null;

  const isOverdue = song.days_in_current_stage > estimatedDays[currentStage];
  const completedItems = checklist.filter((item) => item.is_complete).length;
  const totalItems = checklist.length;
  const checklistProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100; // 100% if no items (nothing to block)

  const handleTransitionClick = (target: SongStage, rejection = false) => {
    setTransitionTarget(target);
    setIsRejection(rejection);
    setShowTransitionDialog(true);
  };

  return (
    <>
      <Card className={cn('rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">Current Stage</CardTitle>
              <CardDescription>Track progress through the workflow</CardDescription>
            </div>
            <StageBadge stage={currentStage} className="text-lg px-4 py-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stage Description */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/30">
            <p className="text-sm text-foreground/80">{stageDescriptions[currentStage]}</p>
          </div>

          {/* Time in Stage */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isOverdue ? "bg-red-100 dark:bg-red-950/30" : "bg-blue-100 dark:bg-blue-950/30"
              )}>
                <Clock className={cn(
                  "h-5 w-5",
                  isOverdue ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {song.days_in_current_stage} {song.days_in_current_stage === 1 ? 'day' : 'days'} in stage
                </p>
                <p className="text-xs text-muted-foreground">
                  Target: ~{estimatedDays[currentStage]} days
                </p>
              </div>
            </div>
            {isOverdue && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Checklist Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Checklist Progress</p>
              <span className="text-sm text-muted-foreground">
                {completedItems} / {totalItems}
              </span>
            </div>
            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute top-0 left-0 h-full transition-all duration-300",
                  checklistProgress === 100
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                )}
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
            {checklistProgress < 100 && (
              <p className="text-xs text-muted-foreground">
                Complete all items to unlock stage transition
              </p>
            )}
          </div>

          {/* Transition Buttons */}
          <div className="space-y-3 pt-4 border-t border-border">
            {/* Next Stage Button */}
            {nextStage && currentStage !== 'released' && currentStage !== 'archived' && (
              <Button
                onClick={() => handleTransitionClick(nextStage, false)}
                disabled={checklistProgress < 100 && !isAdmin()}
                className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <ArrowRight className="h-5 w-5 mr-2" />
                Move to {stageFlow[currentIndex + 1]?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Button>
            )}

            {/* Previous Stage Button (Rejection) */}
            {previousStage && currentStage !== 'draft' && currentStage !== 'archived' && (
              <Button
                onClick={() => handleTransitionClick(previousStage, true)}
                variant="outline"
                className="w-full rounded-xl border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                size="lg"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Send Back for Revision
              </Button>
            )}

            {/* Released State */}
            {currentStage === 'released' && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Live on all platforms</span>
                </div>
              </div>
            )}
          </div>

          {/* Target Release Date */}
          {song.target_release_date && (
            <div className="p-4 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target Release Date</p>
                  <p className="text-sm font-medium">
                    {new Date(song.target_release_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {song.is_overdue && (
                  <Badge variant="destructive">Behind Schedule</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition Dialog */}
      {transitionTarget && (
        <StageTransitionDialog
          open={showTransitionDialog}
          onOpenChange={setShowTransitionDialog}
          song={song}
          targetStage={transitionTarget}
          checklist={checklist}
          isRejection={isRejection}
        />
      )}
    </>
  );
};
