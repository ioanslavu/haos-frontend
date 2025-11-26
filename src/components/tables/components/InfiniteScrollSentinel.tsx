import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScrollSentinelProps {
  isFetching: boolean;
  hasMore: boolean;
  loadedCount?: number;
  totalCount?: number;
  className?: string;
}

export const InfiniteScrollSentinel = forwardRef<HTMLDivElement, InfiniteScrollSentinelProps>(
  ({ isFetching, hasMore, loadedCount, totalCount, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center py-4', className)}
      >
        {isFetching ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        ) : hasMore ? (
          loadedCount && totalCount ? (
            <p className="text-sm text-muted-foreground">
              Showing {loadedCount} of {totalCount}
            </p>
          ) : null
        ) : loadedCount && totalCount ? (
          <p className="text-sm text-muted-foreground">
            Showing all {totalCount} items
          </p>
        ) : null}
      </div>
    );
  }
);

InfiniteScrollSentinel.displayName = 'InfiniteScrollSentinel';
