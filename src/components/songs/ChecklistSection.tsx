import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, Send, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { SongChecklistItem, SongStage } from '@/types/song';
import { ChecklistItem } from './ChecklistItem';
import { ProgressBar } from './ProgressBar';
import { Badge } from '@/components/ui/badge';

// Define stage flow order
const stageFlow: SongStage[] = [
  'draft',
  'publishing',
  'label_recording',
  'marketing_assets',
  'label_review',
  'ready_for_digital',
  'digital_distribution',
  'released',
  'archived',
];

const stageNames: Record<SongStage, string> = {
  draft: 'Draft',
  publishing: 'Publishing',
  label_recording: 'Label Recording',
  marketing_assets: 'Marketing Assets',
  label_review: 'Label Review',
  ready_for_digital: 'Ready for Digital',
  digital_distribution: 'Digital Distribution',
  released: 'Released',
  archived: 'Archived',
};

interface ChecklistSectionProps {
  songId: number;
  items: SongChecklistItem[];
  currentStage?: string;
  onToggle?: (itemId: number) => void;
  onAssign?: (itemId: number) => void;
  onUpdateAssetUrl?: (itemId: number, assetUrl: string) => void;
  onValidateAll?: () => void;
  onCompleteStage?: () => void;
  onSendToMarketing?: () => void;
  onSendToDigital?: () => void;
  isValidating?: boolean;
  isCompletingStage?: boolean;
  isSendingToMarketing?: boolean;
  isSendingToDigital?: boolean;
  disabled?: boolean;
}

export const ChecklistSection = ({
  songId,
  items,
  currentStage,
  onToggle,
  onAssign,
  onUpdateAssetUrl,
  onValidateAll,
  onCompleteStage,
  onSendToMarketing,
  onSendToDigital,
  isValidating = false,
  isCompletingStage = false,
  isSendingToMarketing = false,
  isSendingToDigital = false,
  disabled = false,
}: ChecklistSectionProps) => {
  // Get current stage index
  const currentStageIndex = stageFlow.indexOf(currentStage as SongStage);

  // Separate current stage items from previous stage items
  const currentStageItems = items.filter(item => item.stage === currentStage);
  const previousStageIncompleteItems = items.filter(item => {
    const itemStageIndex = stageFlow.indexOf(item.stage as SongStage);
    return itemStageIndex < currentStageIndex && itemStageIndex >= 0 && !item.is_complete;
  });

  // Separate song-level items from recording-specific items
  const songLevelItems = currentStageItems.filter(item => !item.recording);
  const recordingSpecificItems = currentStageItems.filter(item => item.recording);

  // Group song-level items by category
  const groupedItems = songLevelItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SongChecklistItem[]>);

  // Group recording-specific items by recording
  const recordingGroups = recordingSpecificItems.reduce((acc, item) => {
    const recordingId = item.recording!;
    if (!acc[recordingId]) {
      acc[recordingId] = {
        recordingId,
        recordingTitle: item.recording_title || `Recording #${recordingId}`,
        items: [],
      };
    }
    acc[recordingId].items.push(item);
    return acc;
  }, {} as Record<number, { recordingId: number; recordingTitle: string; items: SongChecklistItem[] }>);

  // State for collapsible recording sections
  const [expandedRecordings, setExpandedRecordings] = useState<Record<number, boolean>>(() => {
    // By default, expand all recordings
    const initialState: Record<number, boolean> = {};
    Object.keys(recordingGroups).forEach(recordingId => {
      initialState[Number(recordingId)] = true;
    });
    return initialState;
  });

  const toggleRecording = (recordingId: number) => {
    setExpandedRecordings(prev => ({
      ...prev,
      [recordingId]: !prev[recordingId],
    }));
  };

  // Group previous stage items by stage
  const previousItemsByStage = previousStageIncompleteItems.reduce((acc, item) => {
    if (!acc[item.stage]) {
      acc[item.stage] = [];
    }
    acc[item.stage].push(item);
    return acc;
  }, {} as Record<string, SongChecklistItem[]>);

  // Calculate progress for current stage only
  const completedCount = currentStageItems.filter((item) => item.is_complete).length;
  const totalCount = currentStageItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100; // 100% if no items
  const isComplete = progress === 100;

  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-shadow">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Stage Checklist</CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedCount} / {totalCount}
            </span>
          </div>
          <ProgressBar progress={progress} showLabel={true} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Previous Stage Incomplete Items Warning */}
        {previousStageIncompleteItems.length > 0 && (
          <div className="p-4 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-yellow-900 dark:text-yellow-100 mb-1">
                  Incomplete Items from Previous Stages
                </h4>
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  {previousStageIncompleteItems.length} {previousStageIncompleteItems.length === 1 ? 'item' : 'items'} from previous stages {previousStageIncompleteItems.length === 1 ? 'is' : 'are'} still incomplete. These should be completed when possible.
                </p>
              </div>
            </div>

            {/* Group by stage */}
            <div className="space-y-3">
              {Object.entries(previousItemsByStage)
                .sort(([stageA], [stageB]) =>
                  stageFlow.indexOf(stageA as SongStage) - stageFlow.indexOf(stageB as SongStage)
                )
                .map(([stage, stageItems]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700">
                        {stageNames[stage as SongStage]}
                      </Badge>
                      <span className="text-xs text-yellow-700 dark:text-yellow-300">
                        {stageItems.length} {stageItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="space-y-1.5 ml-2">
                      {stageItems.map((item) => (
                        <ChecklistItem
                          key={item.id}
                          item={item}
                          songId={songId}
                          onToggle={onToggle}
                          onAssign={onAssign}
                          onUpdateAssetUrl={onUpdateAssetUrl}
                          disabled={disabled}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Song-Level Items */}
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const categoryCompleted = categoryItems.filter((item) => item.is_complete).length;
          const categoryTotal = categoryItems.length;
          const categoryProgress = Math.round((categoryCompleted / categoryTotal) * 100);

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">{category}</h4>
                <span className="text-xs text-muted-foreground">
                  {categoryCompleted} / {categoryTotal}
                </span>
              </div>
              <div className="space-y-2">
                {categoryItems
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <ChecklistItem
                      key={item.id}
                      item={item}
                      songId={songId}
                      onToggle={onToggle}
                      onAssign={onAssign}
                      onUpdateAssetUrl={onUpdateAssetUrl}
                      disabled={disabled}
                    />
                  ))}
              </div>
            </div>
          );
        })}

        {/* Recording-Specific Checklists */}
        {Object.values(recordingGroups).map((recordingGroup) => {
          const recordingCompleted = recordingGroup.items.filter((item) => item.is_complete).length;
          const recordingTotal = recordingGroup.items.length;
          const recordingProgress = Math.round((recordingCompleted / recordingTotal) * 100);
          const isExpanded = expandedRecordings[recordingGroup.recordingId] ?? true;

          // Group recording items by category
          const recordingCategoryGroups = recordingGroup.items.reduce((acc, item) => {
            if (!acc[item.category]) {
              acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
          }, {} as Record<string, SongChecklistItem[]>);

          return (
            <div key={recordingGroup.recordingId} className="space-y-3 border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-blue-50/30 dark:bg-blue-950/10">
              {/* Recording Header (Collapsible) */}
              <button
                onClick={() => toggleRecording(recordingGroup.recordingId)}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700">
                    Recording
                  </Badge>
                  <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                    {recordingGroup.recordingTitle}
                  </h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {recordingCompleted} / {recordingTotal}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </button>

              {/* Progress Bar for Recording */}
              <ProgressBar progress={recordingProgress} showLabel={false} />

              {/* Recording Checklist Items (Collapsible) */}
              {isExpanded && (
                <div className="space-y-3 mt-3">
                  {Object.entries(recordingCategoryGroups).map(([category, categoryItems]) => {
                    const categoryCompleted = categoryItems.filter((item) => item.is_complete).length;
                    const categoryTotal = categoryItems.length;

                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">{category}</h5>
                          <span className="text-xs text-muted-foreground">
                            {categoryCompleted} / {categoryTotal}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {categoryItems
                            .sort((a, b) => a.order - b.order)
                            .map((item) => (
                              <ChecklistItem
                                key={item.id}
                                item={item}
                                songId={songId}
                                onToggle={onToggle}
                                onAssign={onAssign}
                                onUpdateAssetUrl={onUpdateAssetUrl}
                                disabled={disabled}
                              />
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
          {/* Validate All Button */}
          {onValidateAll && (
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={onValidateAll}
                disabled={disabled || isValidating}
                className="rounded-xl"
              >
                {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isValidating && <CheckCircle className="mr-2 h-4 w-4" />}
                Validate All
              </Button>
            </div>
          )}

          {/* Action Buttons - only show if checklist is complete */}
          {isComplete && (
            <div className="space-y-3">
              {/* Send to Marketing - show for label_recording stage */}
              {currentStage === 'label_recording' && onSendToMarketing && (
                <Button
                  onClick={onSendToMarketing}
                  disabled={disabled || isSendingToMarketing}
                  className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {isSendingToMarketing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send to Marketing
                </Button>
              )}

              {/* Send to Digital - show for ready_for_digital stage */}
              {currentStage === 'ready_for_digital' && onSendToDigital && (
                <Button
                  onClick={onSendToDigital}
                  disabled={disabled || isSendingToDigital}
                  className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {isSendingToDigital ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send to Digital
                </Button>
              )}

              {/* Complete Stage - show for other stages */}
              {currentStage !== 'label_recording' &&
               currentStage !== 'ready_for_digital' &&
               onCompleteStage && (
                <Button
                  onClick={onCompleteStage}
                  disabled={disabled || isCompletingStage}
                  className="w-full rounded-xl shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {isCompletingStage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Complete Stage
                </Button>
              )}
            </div>
          )}

          {/* Progress reminder if not complete */}
          {!isComplete && (
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Complete all checklist items to proceed to the next stage
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
