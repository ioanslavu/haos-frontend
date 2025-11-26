import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortDirection } from '../types';
import { cn } from '@/lib/utils';

interface SortIndicatorProps {
  direction: SortDirection;
  className?: string;
}

export function SortIndicator({ direction, className }: SortIndicatorProps) {
  return (
    <span className={cn('ml-1 inline-flex', className)}>
      {direction === 'asc' ? (
        <ArrowUp className="h-4 w-4" />
      ) : direction === 'desc' ? (
        <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
      )}
    </span>
  );
}
