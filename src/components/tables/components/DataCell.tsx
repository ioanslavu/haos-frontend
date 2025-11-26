import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ColumnDef, CellContext, RowDensity, DENSITY_CLASSES, TableInstance } from '../types';

interface DataCellProps<T> {
  column: ColumnDef<T>;
  row: T;
  rowIndex: number;
  table: TableInstance<T>;
  densityClasses: typeof DENSITY_CLASSES[RowDensity];
}

export function DataCell<T>({
  column,
  row,
  rowIndex,
  table,
  densityClasses,
}: DataCellProps<T>) {
  // Get the cell value
  let value: unknown;
  if (column.accessorFn) {
    value = column.accessorFn(row);
  } else if (column.accessorKey) {
    value = row[column.accessorKey];
  } else {
    value = undefined;
  }

  // Create cell context for custom renderers
  const cellContext: CellContext<T> = {
    row,
    rowIndex,
    column,
    value,
    table,
  };

  // Render content
  let content: React.ReactNode;
  if (column.cell) {
    content = column.cell(cellContext);
  } else if (value === null || value === undefined) {
    content = <span className="text-muted-foreground">-</span>;
  } else if (typeof value === 'boolean') {
    content = value ? 'Yes' : 'No';
  } else if (value instanceof Date) {
    content = value.toLocaleDateString();
  } else {
    content = String(value);
  }

  return (
    <TableCell
      className={cn(
        densityClasses.cell,
        column.className,
        column.align === 'center' && 'text-center',
        column.align === 'right' && 'text-right'
      )}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
      }}
    >
      {content}
    </TableCell>
  );
}
