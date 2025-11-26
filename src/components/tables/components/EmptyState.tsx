import { TableRow, TableCell } from '@/components/ui/table';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  columnCount: number;
  children?: ReactNode;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({
  columnCount,
  children,
  hasFilters,
  onClearFilters,
}: EmptyStateProps) {
  if (children) {
    return (
      <TableRow>
        <TableCell colSpan={columnCount} className="h-48">
          {children}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell colSpan={columnCount} className="h-48">
        <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
          <div className="rounded-full bg-muted p-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No results found</p>
            <p className="text-xs text-muted-foreground">
              {hasFilters
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'No data available to display.'}
            </p>
          </div>
          {hasFilters && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
