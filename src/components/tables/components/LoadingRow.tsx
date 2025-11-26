import { TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { RowDensity, DENSITY_CLASSES } from '../types';

interface LoadingRowProps {
  columnCount: number;
  densityClasses: typeof DENSITY_CLASSES[RowDensity];
}

export function LoadingRow({ columnCount, densityClasses }: LoadingRowProps) {
  return (
    <TableRow>
      {Array.from({ length: columnCount }).map((_, index) => (
        <TableCell key={index} className={cn(densityClasses.cell)}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

interface LoadingSkeletonProps {
  rowCount?: number;
  columnCount: number;
  densityClasses: typeof DENSITY_CLASSES[RowDensity];
}

export function LoadingSkeleton({
  rowCount = 5,
  columnCount,
  densityClasses,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <LoadingRow
          key={index}
          columnCount={columnCount}
          densityClasses={densityClasses}
        />
      ))}
    </>
  );
}
