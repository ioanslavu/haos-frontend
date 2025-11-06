import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StageBadge } from './StageBadge';
import { transitionSong } from '@/api/songApi';
import { Song, SongStage, SongChecklistItem } from '@/types/song';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Music,
  Image as ImageIcon,
  Clock,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: Song;
  targetStage: SongStage;
  checklist: SongChecklistItem[];
  isRejection?: boolean;
}

const stageInfo: Record<SongStage, { title: string; description: string; icon: any; requirements: string[] }> = {
  draft: {
    title: 'Draft',
    description: 'Initial song creation and basic information',
    icon: FileText,
    requirements: ['Song title', 'Artist assignment'],
  },
  publishing: {
    title: 'Publishing',
    description: 'Copyright registration and rights clearance',
    icon: Shield,
    requirements: ['Work created with ISWC', 'Writer splits defined', 'Publisher splits configured'],
  },
  label_recording: {
    title: 'Label Recording',
    description: 'Studio recording and production',
    icon: Music,
    requirements: ['Recording created with ISRC', 'Master recording uploaded', 'Credits assigned'],
  },
  marketing_assets: {
    title: 'Marketing Assets',
    description: 'Marketing material creation and approval',
    icon: ImageIcon,
    requirements: ['Cover art uploaded', 'Press photos ready', 'Marketing copy drafted'],
  },
  label_review: {
    title: 'Label Review',
    description: 'Final label approval before distribution',
    icon: CheckCircle2,
    requirements: ['All assets approved', 'Metadata verified', 'Quality check passed'],
  },
  ready_for_digital: {
    title: 'Ready for Digital',
    description: 'Pre-distribution preparation',
    icon: Clock,
    requirements: ['Release created', 'Distribution platforms selected', 'Release date set'],
  },
  digital_distribution: {
    title: 'Digital Distribution',
    description: 'Distribution to streaming platforms',
    icon: ArrowRight,
    requirements: ['Submitted to distributors', 'Platform confirmations received'],
  },
  released: {
    title: 'Released',
    description: 'Live on all platforms',
    icon: CheckCircle2,
    requirements: ['Live on Spotify', 'Live on Apple Music', 'Other platforms confirmed'],
  },
  archived: {
    title: 'Archived',
    description: 'Song archived or cancelled',
    icon: XCircle,
    requirements: [],
  },
};

const rejectionCategories = [
  { value: 'quality_issues', label: 'Quality Issues', description: 'Audio or visual quality does not meet standards' },
  { value: 'missing_information', label: 'Missing Information', description: 'Required metadata or documentation incomplete' },
  { value: 'rights_clearance', label: 'Rights Clearance', description: 'Copyright or licensing issues detected' },
  { value: 'creative_direction', label: 'Creative Direction', description: 'Does not align with creative vision' },
  { value: 'other', label: 'Other', description: 'Other reason not listed above' },
];

export const StageTransitionDialog = ({
  open,
  onOpenChange,
  song,
  targetStage,
  checklist,
  isRejection = false,
}: StageTransitionDialogProps) => {
  const [notes, setNotes] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuthStore();

  // Calculate validation
  const completedItems = checklist.filter((item) => item.is_completed).length;
  const totalItems = checklist.length;
  const checklistProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const isChecklistComplete = checklistProgress === 100;

  // Validate required data based on target stage
  const validationIssues: { type: 'error' | 'warning'; message: string }[] = [];

  if (targetStage === 'publishing' && !song.work) {
    validationIssues.push({ type: 'error', message: 'Work must be created before moving to Publishing stage' });
  }

  if (targetStage === 'label_recording' && !song.work) {
    validationIssues.push({ type: 'error', message: 'Work must exist before recording' });
  }

  if (targetStage === 'marketing_assets' && !song.recording) {
    validationIssues.push({ type: 'error', message: 'Recording must be created before marketing assets' });
  }

  if (targetStage === 'ready_for_digital' && !song.release) {
    validationIssues.push({ type: 'error', message: 'Release must be created before digital distribution' });
  }

  if (!isChecklistComplete) {
    validationIssues.push({
      type: isAdmin() ? 'warning' : 'error',
      message: `Checklist is ${checklistProgress}% complete. ${isAdmin() ? 'As admin, you can override this.' : 'Complete all items before proceeding.'}`,
    });
  }

  // Check if transition is allowed
  const hasBlockingIssues = validationIssues.some((issue) => issue.type === 'error');
  const canProceed = !hasBlockingIssues || isAdmin();

  const transitionMutation = useMutation({
    mutationFn: () =>
      transitionSong(song.id, {
        target_stage: targetStage,
        notes: isRejection ? `[${rejectionCategory}] ${notes}` : notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['song', song.id] });
      queryClient.invalidateQueries({ queryKey: ['song-checklist', song.id] });
      queryClient.invalidateQueries({ queryKey: ['song-transitions', song.id] });

      toast({
        title: isRejection ? 'Song Rejected' : 'Stage Transition Complete',
        description: isRejection
          ? `Song sent back to ${stageInfo[targetStage].title}`
          : `Song moved to ${stageInfo[targetStage].title}`,
      });

      onOpenChange(false);
      setNotes('');
      setRejectionCategory('');
    },
    onError: (error: any) => {
      toast({
        title: 'Transition Failed',
        description: error.response?.data?.detail || 'Failed to transition song stage',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (isRejection && !rejectionCategory) {
      toast({
        title: 'Category Required',
        description: 'Please select a rejection category',
        variant: 'destructive',
      });
      return;
    }

    if (!notes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide notes explaining this transition',
        variant: 'destructive',
      });
      return;
    }

    transitionMutation.mutate();
  };

  const currentStageInfo = stageInfo[song.current_stage || 'draft'];
  const targetStageInfo = stageInfo[targetStage];
  const CurrentIcon = currentStageInfo.icon;
  const TargetIcon = targetStageInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isRejection ? (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                Reject Song
              </>
            ) : (
              <>
                <ArrowRight className="h-6 w-6 text-blue-500" />
                Stage Transition
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isRejection
              ? 'Send this song back for revision'
              : 'Review and confirm stage transition'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stage Transition Visual */}
          <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/30">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md">
                <CurrentIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <StageBadge stage={song.current_stage || 'draft'} />
            </div>

            <ArrowRight className="h-8 w-8 text-muted-foreground flex-shrink-0" />

            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md">
                <TargetIcon className={cn(
                  "h-6 w-6",
                  isRejection ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                )} />
              </div>
              <StageBadge stage={targetStage} />
            </div>
          </div>

          {/* Target Stage Info */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">About {targetStageInfo.title}</h4>
            <p className="text-sm text-muted-foreground">{targetStageInfo.description}</p>
            {targetStageInfo.requirements.length > 0 && (
              <div className="space-y-1 mt-3">
                <p className="text-xs font-medium text-muted-foreground">Key Requirements:</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  {targetStageInfo.requirements.map((req, idx) => (
                    <li key={idx} className="list-disc">{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Checklist Status */}
          <div className="p-4 rounded-xl border border-border bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Checklist Progress</h4>
              <Badge variant={isChecklistComplete ? 'default' : 'secondary'} className="ml-2">
                {completedItems} / {totalItems}
              </Badge>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute top-0 left-0 h-full transition-all duration-300",
                  isChecklistComplete
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                )}
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isChecklistComplete
                ? 'All checklist items completed'
                : `${totalItems - completedItems} items remaining`
              }
            </p>
          </div>

          {/* Validation Issues */}
          {validationIssues.length > 0 && (
            <div className="space-y-2">
              {validationIssues.map((issue, idx) => (
                <Alert key={idx} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{issue.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Rejection Category (if rejection) */}
          {isRejection && (
            <div className="space-y-3">
              <Label htmlFor="rejection-category">Rejection Category *</Label>
              <div className="space-y-2">
                {rejectionCategories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setRejectionCategory(category.value)}
                    className={cn(
                      "w-full p-3 rounded-xl border-2 text-left transition-all",
                      rejectionCategory === category.value
                        ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                        : "border-border hover:border-red-300 dark:hover:border-red-700"
                    )}
                  >
                    <p className="font-medium text-sm">{category.label}</p>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="transition-notes">
              {isRejection ? 'Rejection Reason *' : 'Transition Notes *'}
            </Label>
            <Textarea
              id="transition-notes"
              placeholder={
                isRejection
                  ? 'Explain why this song is being rejected and what needs to be fixed...'
                  : 'Document the reason for this transition and any important context...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This note will be added to the song's activity log and visible to all team members
            </p>
          </div>

          {/* Time in Current Stage */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              This song has been in {currentStageInfo.title} for {song.days_in_current_stage} days
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={transitionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canProceed || transitionMutation.isPending}
            variant={isRejection ? 'destructive' : 'default'}
            className={cn(
              !isRejection && "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            )}
          >
            {transitionMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Processing...
              </>
            ) : isRejection ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject & Send Back
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Transition
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
