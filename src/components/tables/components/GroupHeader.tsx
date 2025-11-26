import { ChevronDown, ChevronRight } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RowDensity, DENSITY_CLASSES } from '../types';

interface GroupHeaderProps {
  groupKey: string;
  groupLabel: string;
  count: number;
  isExpanded: boolean;
  onToggle: (groupKey: string) => void;
  colSpan: number;
  densityClasses: typeof DENSITY_CLASSES[RowDensity];
  level?: number;
  icon?: React.ReactNode;
}

export function GroupHeader({
  groupKey,
  groupLabel,
  count,
  isExpanded,
  onToggle,
  colSpan,
  densityClasses,
  level = 0,
  icon,
}: GroupHeaderProps) {
  return (
    <TableRow
      className={cn(
        'bg-muted/30 hover:bg-muted/50 transition-colors',
        level > 0 && 'bg-muted/20'
      )}
    >
      <TableCell
        colSpan={colSpan}
        className={cn(densityClasses.cell, 'font-medium')}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mr-2"
          onClick={() => onToggle(groupKey)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        {icon && <span className="mr-2">{icon}</span>}
        <span>{groupLabel}</span>
        <span className="ml-2 text-muted-foreground text-sm">
          ({count} {count === 1 ? 'item' : 'items'})
        </span>
      </TableCell>
    </TableRow>
  );
}
