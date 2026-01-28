import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StageTransitionDialog } from '../dialogs/StageTransitionDialog';
import { Song, SongStage, SongChecklistItem } from '@/types/song';
import { Send, CheckCircle, Upload, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

interface QuickActionButtonsProps {
  song: Song;
  checklist: SongChecklistItem[];
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  targetStage: SongStage;
  currentStages: SongStage[];
  variant?: 'default' | 'outline' | 'secondary';
  gradient?: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'send_to_marketing',
    label: 'Send to Marketing',
    description: 'Recording complete, ready for marketing assets',
    icon: Send,
    targetStage: 'marketing_assets',
    currentStages: ['label_recording'],
    gradient: 'from-pink-600 to-purple-600',
  },
  {
    id: 'send_to_label_review',
    label: 'Send to Label Review',
    description: 'Marketing assets complete, ready for approval',
    icon: CheckCircle,
    targetStage: 'label_review',
    currentStages: ['marketing_assets'],
    gradient: 'from-orange-600 to-red-600',
  },
  {
    id: 'ready_for_distribution',
    label: 'Ready for Distribution',
    description: 'Label approved, ready for digital distribution',
    icon: Upload,
    targetStage: 'ready_for_digital',
    currentStages: ['label_review'],
    gradient: 'from-green-600 to-emerald-600',
  },
  {
    id: 'publish_release',
    label: 'Publish Release',
    description: 'Distribution ready, send to platforms',
    icon: Play,
    targetStage: 'digital_distribution',
    currentStages: ['ready_for_digital'],
    gradient: 'from-teal-600 to-cyan-600',
  },
];

export const QuickActionButtons = ({ song, checklist, className }: QuickActionButtonsProps) => {
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const { isAdmin } = useAuthStore();

  const currentStage = song.current_stage || 'draft';

  // Filter actions available for current stage
  const availableActions = quickActions.filter((action) =>
    action.currentStages.includes(currentStage)
  );

  // Check if checklist is complete
  const completedItems = checklist.filter((item) => item.is_complete).length;
  const totalItems = checklist.length;
  const checklistProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100; // 100% if no items
  const isChecklistComplete = checklistProgress === 100;

  if (availableActions.length === 0) {
    return null;
  }

  const handleActionClick = (action: QuickAction) => {
    setSelectedAction(action);
    setShowTransitionDialog(true);
  };

  return (
    <>
      <Card className={cn('rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl', className)}>
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription>Common workflow transitions for this stage</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {availableActions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={!isChecklistComplete && !isAdmin()}
                className={cn(
                  'w-full h-auto py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-start justify-start gap-4 text-left',
                  action.gradient && `bg-gradient-to-r ${action.gradient} hover:opacity-90`
                )}
                size="lg"
              >
                <div className="flex-shrink-0 p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white mb-1">{action.label}</p>
                  <p className="text-xs text-white/80">{action.description}</p>
                </div>
              </Button>
            );
          })}

          {!isChecklistComplete && !isAdmin() && (
            <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground text-center">
                Complete checklist ({completedItems}/{totalItems}) to unlock quick actions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition Dialog */}
      {selectedAction && (
        <StageTransitionDialog
          open={showTransitionDialog}
          onOpenChange={setShowTransitionDialog}
          song={song}
          targetStage={selectedAction.targetStage}
          checklist={checklist}
          isRejection={false}
        />
      )}
    </>
  );
};
