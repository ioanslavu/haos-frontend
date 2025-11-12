import { Split } from '@/types/song';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SplitVisualizationProps {
  writerSplits: Split[];
  publisherSplits: Split[];
  writerTotal: number;
  publisherTotal: number;
}

// Color palette for splits
const SPLIT_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-green-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-teal-500',
];

export function SplitVisualization({
  writerSplits,
  publisherSplits,
  writerTotal,
  publisherTotal,
}: SplitVisualizationProps) {
  const hasWriters = writerSplits && writerSplits.length > 0;
  const hasPublishers = publisherSplits && publisherSplits.length > 0;

  const isWriterComplete = Math.abs(writerTotal - 100) < 0.01;
  const isPublisherComplete = Math.abs(publisherTotal - 100) < 0.01;

  if (!hasWriters && !hasPublishers) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No splits defined yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Writer Splits Visualization */}
      {hasWriters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Writer Splits</h4>
            <Badge variant={isWriterComplete ? 'default' : 'destructive'} className="text-xs">
              {writerTotal.toFixed(2)}% / 100%
            </Badge>
          </div>

          {/* Progress Bar Overview */}
          <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
            {writerSplits.map((split, idx) => {
              const share = parseFloat(split.share);
              const widthPercent = (share / 100) * 100;
              const colorClass = SPLIT_COLORS[idx % SPLIT_COLORS.length];

              return (
                <div
                  key={split.id}
                  className={`absolute top-0 bottom-0 ${colorClass} opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium text-white`}
                  style={{
                    left: `${writerSplits
                      .slice(0, idx)
                      .reduce((sum, s) => sum + parseFloat(s.share), 0)}%`,
                    width: `${widthPercent}%`,
                  }}
                  title={`${split.entity_name}: ${share.toFixed(2)}%`}
                >
                  {widthPercent > 10 && (
                    <span className="truncate px-2">{split.entity_name}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Individual Split Bars */}
          <div className="space-y-2">
            {writerSplits.map((split, idx) => {
              const share = parseFloat(split.share);
              const colorClass = SPLIT_COLORS[idx % SPLIT_COLORS.length];

              return (
                <div key={split.id} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{split.entity_name}</span>
                      <span className="text-sm font-mono text-muted-foreground ml-2">
                        {share.toFixed(2)}%
                      </span>
                    </div>
                    <Progress value={share} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning for incomplete splits */}
          {!isWriterComplete && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
              <span className="font-medium">
                Missing {(100 - writerTotal).toFixed(2)}% to complete 100%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Publisher Splits Visualization */}
      {hasPublishers && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Publisher Splits</h4>
            <Badge variant={isPublisherComplete ? 'default' : 'destructive'} className="text-xs">
              {publisherTotal.toFixed(2)}% / 100%
            </Badge>
          </div>

          {/* Progress Bar Overview */}
          <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
            {publisherSplits.map((split, idx) => {
              const share = parseFloat(split.share);
              const widthPercent = (share / 100) * 100;
              const colorClass = SPLIT_COLORS[idx % SPLIT_COLORS.length];

              return (
                <div
                  key={split.id}
                  className={`absolute top-0 bottom-0 ${colorClass} opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium text-white`}
                  style={{
                    left: `${publisherSplits
                      .slice(0, idx)
                      .reduce((sum, s) => sum + parseFloat(s.share), 0)}%`,
                    width: `${widthPercent}%`,
                  }}
                  title={`${split.entity_name}: ${share.toFixed(2)}%`}
                >
                  {widthPercent > 10 && (
                    <span className="truncate px-2">{split.entity_name}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Individual Split Bars */}
          <div className="space-y-2">
            {publisherSplits.map((split, idx) => {
              const share = parseFloat(split.share);
              const colorClass = SPLIT_COLORS[idx % SPLIT_COLORS.length];

              return (
                <div key={split.id} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{split.entity_name}</span>
                      <span className="text-sm font-mono text-muted-foreground ml-2">
                        {share.toFixed(2)}%
                      </span>
                    </div>
                    <Progress value={share} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning for incomplete splits */}
          {!isPublisherComplete && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
              <span className="font-medium">
                Missing {(100 - publisherTotal).toFixed(2)}% to complete 100%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
