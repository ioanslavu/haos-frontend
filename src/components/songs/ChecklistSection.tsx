import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, Send } from 'lucide-react';
import { SongChecklistItem } from '@/types/song';
import { ChecklistItem } from './ChecklistItem';
import { ProgressBar } from './ProgressBar';

interface ChecklistSectionProps {
  items: SongChecklistItem[];
  currentStage?: string;
  onToggle?: (itemId: number) => void;
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
  items,
  currentStage,
  onToggle,
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
  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SongChecklistItem[]>);

  // Calculate progress
  const completedCount = items.filter((item) => item.is_completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
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
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const categoryCompleted = categoryItems.filter((item) => item.is_completed).length;
          const categoryTotal = categoryItems.length;
          const categoryProgress = Math.round((categoryCompleted / categoryTotal) * 100);

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-700">{category}</h4>
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
                      onToggle={onToggle}
                      disabled={disabled}
                    />
                  ))}
              </div>
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
