import { Loader2, Plus, CheckCircle, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChecklistSection,
  WorkflowProgressBar,
} from '@/components/songs';
import { SongStage, SongChecklistItem } from '@/types/song';
import { STAGE_LABELS } from '../constants';

interface SongOverviewTabProps {
  song: any;
  songId: number;
  checklist: SongChecklistItem[];
  selectedStage: SongStage | undefined;
  onStageClick: (stage: SongStage) => void;
  onToggleChecklist: (itemId: number) => void;
  onAssignChecklist: (itemId: number) => void;
  onUpdateAssetUrl: (itemId: number, assetUrl: string) => void;
  onOpenTaskModal: (checklistItemId: number) => void;
  onValidateAll: () => void;
  isValidating: boolean;
  stageActionMutation: {
    mutate: (params: { stage: SongStage; action: 'start' | 'finish' | 'resume' }) => void;
    isPending: boolean;
  };
  onAddTemplate: () => void;
}

export function SongOverviewTab({
  song,
  songId,
  checklist,
  selectedStage,
  onStageClick,
  onToggleChecklist,
  onAssignChecklist,
  onUpdateAssetUrl,
  onOpenTaskModal,
  onValidateAll,
  isValidating,
  stageActionMutation,
  onAddTemplate,
}: SongOverviewTabProps) {
  const currentStage = song.current_stage || 'draft';

  const getSelectedStageStatus = () => {
    if (!selectedStage || !song.stage_statuses) return null;
    return song.stage_statuses.find((s: any) => s.stage === selectedStage);
  };

  const selectedStageStatus = getSelectedStageStatus();
  const selectedStageStatusValue = selectedStageStatus?.status || 'not_started';

  return (
    <div className="space-y-8">
      {/* Workflow Progress Bar */}
      <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-xl shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <WorkflowProgressBar
            songId={song.id}
            currentStage={currentStage}
            stageStatuses={song.stage_statuses}
            interactive={true}
            selectedStage={selectedStage}
            onStageClick={onStageClick}
          />
        </CardContent>
      </Card>

      {/* Stage Detail */}
      {selectedStage && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{STAGE_LABELS[selectedStage]} Checklist</h2>
              <p className="text-sm text-muted-foreground">Complete tasks to progress this stage</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onAddTemplate}
                className="rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Checklist
              </Button>

              {selectedStageStatusValue === 'not_started' && (
                <Button
                  onClick={() => stageActionMutation.mutate({ stage: selectedStage, action: 'start' })}
                  disabled={stageActionMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  {stageActionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Stage
                    </>
                  )}
                </Button>
              )}

              {selectedStageStatusValue === 'in_progress' && (
                <Button
                  onClick={() => stageActionMutation.mutate({ stage: selectedStage, action: 'finish' })}
                  disabled={stageActionMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                >
                  {stageActionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finish Stage
                    </>
                  )}
                </Button>
              )}

              {selectedStageStatusValue === 'blocked' && (
                <Button
                  onClick={() => stageActionMutation.mutate({ stage: selectedStage, action: 'resume' })}
                  disabled={stageActionMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg"
                >
                  {stageActionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resuming...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Resume Stage
                    </>
                  )}
                </Button>
              )}

              {selectedStageStatusValue === 'completed' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Completed</span>
                </div>
              )}
            </div>
          </div>

          {checklist.filter(item => item.stage === selectedStage).length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground mb-2">No checklist items for this stage yet</p>
              <p className="text-sm text-muted-foreground">Checklist items will appear here once they're created for this stage</p>
            </div>
          ) : (
            <ChecklistSection
              songId={songId}
              items={checklist.filter(item => item.stage === selectedStage)}
              currentStage={selectedStage}
              onToggle={onToggleChecklist}
              onAssign={onAssignChecklist}
              onUpdateAssetUrl={onUpdateAssetUrl}
              onOpenTaskModal={onOpenTaskModal}
              onValidateAll={onValidateAll}
              isValidating={isValidating}
            />
          )}
        </div>
      )}
    </div>
  );
}
