import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StageBadge } from './StageBadge';
import { SongStageTransition } from '@/types/song';
import { ArrowRight, Clock, Calendar } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { cn, getInitials } from '@/lib/utils';

interface TransitionTimelineProps {
  transitions: SongStageTransition[];
  className?: string;
}

export const TransitionTimeline = ({ transitions, className }: TransitionTimelineProps) => {
  // Sort transitions by date (most recent first)
  const sortedTransitions = [...transitions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate time between transitions
  const transitionsWithDuration = sortedTransitions.map((transition, index) => {
    const nextTransition = sortedTransitions[index + 1];
    const daysInStage = nextTransition
      ? differenceInDays(new Date(transition.created_at), new Date(nextTransition.created_at))
      : null;

    return {
      ...transition,
      daysInStage,
    };
  });

  if (transitions.length === 0) {
    return (
      <Card className={cn('rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl', className)}>
        <CardHeader>
          <CardTitle className="text-xl">Stage Transition History</CardTitle>
          <CardDescription>Track all stage changes and workflow progression</CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
              <ArrowRight className="h-8 w-8 text-muted-foreground opacity-30" />
            </div>
            <p className="text-muted-foreground mb-2">No stage transitions yet</p>
            <p className="text-sm text-muted-foreground">
              Transitions will appear here as the song progresses through the workflow
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl', className)}>
      <CardHeader>
        <CardTitle className="text-xl">Stage Transition History</CardTitle>
        <CardDescription>
          {transitions.length} {transitions.length === 1 ? 'transition' : 'transitions'} recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-8">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-30" />

          {transitionsWithDuration.map((transition, index) => {
            const isFirst = index === 0;
            const isLast = index === transitionsWithDuration.length - 1;

            return (
              <div key={transition.id} className="relative flex gap-4 group">
                {/* Timeline node */}
                <div className="relative flex-shrink-0">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full border-4 border-background flex items-center justify-center transition-all',
                      isFirst && 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg ring-4 ring-blue-500/20',
                      !isFirst && 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
                    )}
                  >
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>

                  {/* Time in stage indicator */}
                  {transition.daysInStage !== null && !isLast && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 flex flex-col items-center">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/80 backdrop-blur-sm border border-border">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {transition.daysInStage}d
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transition content */}
                <div className="flex-1 pb-8">
                  <div
                    className={cn(
                      'rounded-2xl border p-4 transition-all',
                      isFirst
                        ? 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20'
                        : 'border-border bg-background/50 group-hover:bg-muted/50'
                    )}
                  >
                    {/* Stage transition badges */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <StageBadge stage={transition.from_stage} />
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <StageBadge stage={transition.to_stage} />
                      {isFirst && (
                        <div className="ml-auto">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500 text-white text-xs font-medium">
                            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            Current
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {transition.notes && (
                      <p className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">{transition.notes}</p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                      {transition.created_by && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {getInitials(transition.created_by.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{transition.created_by.full_name}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        {transition.created_at && (() => {
                          try {
                            const date = new Date(transition.created_at);
                            if (!isNaN(date.getTime())) {
                              return (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(date, 'MMM d, yyyy')}</span>
                                  </div>
                                  <span className="text-muted-foreground/60">
                                    {formatDistanceToNow(date, { addSuffix: true })}
                                  </span>
                                </>
                              );
                            }
                          } catch (e) {
                            return null;
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{transitions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Transitions</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-2xl font-bold text-foreground">
                {transitionsWithDuration
                  .filter((t) => t.daysInStage !== null)
                  .reduce((sum, t) => sum + (t.daysInStage || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Days</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-2xl font-bold text-foreground">
                {transitionsWithDuration.filter((t) => t.daysInStage !== null).length > 0
                  ? Math.round(
                      transitionsWithDuration
                        .filter((t) => t.daysInStage !== null)
                        .reduce((sum, t) => sum + (t.daysInStage || 0), 0) /
                        transitionsWithDuration.filter((t) => t.daysInStage !== null).length
                    )
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Avg Days/Stage</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-2xl font-bold text-foreground">
                {(() => {
                  try {
                    const firstTransition = sortedTransitions[sortedTransitions.length - 1];
                    if (firstTransition?.created_at) {
                      const date = new Date(firstTransition.created_at);
                      if (!isNaN(date.getTime())) {
                        return format(date, 'MMM d');
                      }
                    }
                  } catch (e) {
                    return '-';
                  }
                  return '-';
                })()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Started</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
