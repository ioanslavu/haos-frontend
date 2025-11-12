import { SongChecklistItem, SongStage } from '@/types/song';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageChecklistViewProps {
  stage: SongStage;
  stageLabel: string;
  checklistItems: SongChecklistItem[];
  onToggleItem?: (itemId: number) => void;
  isLoading?: boolean;
}

const stageColors: Record<SongStage, string> = {
  draft: 'border-gray-400',
  publishing: 'border-blue-400',
  label_recording: 'border-purple-400',
  marketing_assets: 'border-pink-400',
  label_review: 'border-orange-400',
  ready_for_digital: 'border-green-400',
  digital_distribution: 'border-teal-400',
  released: 'border-emerald-400',
  archived: 'border-slate-400',
};

export const StageChecklistView = ({
  stage,
  stageLabel,
  checklistItems,
  onToggleItem,
  isLoading = false,
}: StageChecklistViewProps) => {
  // Filter items for this stage
  const stageItems = checklistItems.filter(item => item.stage === stage);

  // Calculate progress
  const completedCount = stageItems.filter(item => item.is_complete).length;
  const totalCount = stageItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Group items by category
  const itemsByCategory = stageItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SongChecklistItem[]>);

  const categories = Object.keys(itemsByCategory);

  if (stageItems.length === 0) {
    return (
      <Card className={cn('border-t-4', stageColors[stage])}>
        <CardHeader>
          <CardTitle>{stageLabel} Checklist</CardTitle>
          <CardDescription>No checklist items for this stage yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Circle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Checklist items will appear here once they're created for this stage.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-t-4', stageColors[stage])}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{stageLabel} Checklist</CardTitle>
            <CardDescription>
              {completedCount} of {totalCount} items complete
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(progressPercent)}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                progressPercent === 100 ? 'bg-green-500' : 'bg-primary'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {category}
            </h4>
            <div className="space-y-2">
              {itemsByCategory[category].map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    item.is_complete
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                      : 'bg-background hover:bg-accent border-border'
                  )}
                >
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.is_complete}
                    onCheckedChange={() => onToggleItem?.(item.id)}
                    disabled={isLoading}
                    className="mt-0.5"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <label
                      htmlFor={`item-${item.id}`}
                      className={cn(
                        'text-sm font-medium cursor-pointer',
                        item.is_complete && 'line-through text-muted-foreground'
                      )}
                    >
                      {item.item_name}
                      {item.required && (
                        <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">
                          Required
                        </Badge>
                      )}
                      {item.is_blocker && (
                        <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0">
                          <AlertCircle className="h-2.5 w-2.5 mr-1" />
                          Blocker
                        </Badge>
                      )}
                    </label>

                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {item.assigned_to_name && (
                        <span className="flex items-center gap-1">
                          <Circle className="h-2.5 w-2.5" />
                          {item.assigned_to_name}
                        </span>
                      )}
                      {item.completed_at && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed {new Date(item.completed_at).toLocaleDateString()}
                        </span>
                      )}
                      {!item.is_complete && item.required && (
                        <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
