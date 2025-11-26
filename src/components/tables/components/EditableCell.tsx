import { useState, useCallback } from 'react';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TextEditor, NumberEditor, SelectEditor, DateEditor, CheckboxEditor, MultiSelectEditor } from '../editors';
import type { ColumnDef, CellContext, RowDensity, DENSITY_CLASSES, TableInstance } from '../types';

interface EditableCellProps<T> {
  column: ColumnDef<T>;
  row: T;
  rowIndex: number;
  table: TableInstance<T>;
  densityClasses: typeof DENSITY_CLASSES[RowDensity];
  onSave?: (row: T, columnId: string, value: unknown) => Promise<void>;
}

export function EditableCell<T>({
  column,
  row,
  rowIndex,
  table,
  densityClasses,
  onSave,
}: EditableCellProps<T>) {
  const [isEditing, setIsEditing] = useState(false);

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

  const handleSave = useCallback(async (newValue: unknown) => {
    if (onSave) {
      await onSave(row, column.id, newValue);
    }
    setIsEditing(false);
  }, [row, column.id, onSave]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleStartEdit = useCallback(() => {
    if (column.editable && column.editorType) {
      setIsEditing(true);
    }
  }, [column.editable, column.editorType]);

  // Check if cell is editable using the column's editable function if provided
  const isEditable = column.editable === true ||
    (typeof column.editable === 'function' && column.editable(row));

  // Render editor based on type
  const renderEditor = () => {
    if (!column.editorType) return null;

    const editorProps = column.editorProps || {};

    switch (column.editorType) {
      case 'text':
        return (
          <TextEditor
            value={value as string || ''}
            onSave={handleSave as (value: string) => Promise<void>}
            onCancel={handleCancel}
            placeholder={editorProps.placeholder}
            maxLength={editorProps.maxLength}
            className="w-full"
          />
        );

      case 'number':
        return (
          <NumberEditor
            value={value as number | null}
            onSave={handleSave as (value: number | null) => Promise<void>}
            onCancel={handleCancel}
            min={editorProps.min}
            max={editorProps.max}
            step={editorProps.step}
            placeholder={editorProps.placeholder}
            className="w-full"
          />
        );

      case 'select':
        return (
          <SelectEditor
            value={value as string | null}
            options={column.filterOptions || []}
            onSave={handleSave as (value: string | null) => Promise<void>}
            onCancel={handleCancel}
            placeholder={editorProps.placeholder}
            allowClear={editorProps.allowClear}
            className="w-full"
          />
        );

      case 'multiselect':
        return (
          <MultiSelectEditor
            value={(value as string[]) || []}
            options={column.filterOptions || []}
            onSave={handleSave as (value: string[]) => Promise<void>}
            onCancel={handleCancel}
            placeholder={editorProps.placeholder}
            maxDisplay={editorProps.maxDisplay}
            className="w-full"
          />
        );

      case 'date':
        return (
          <DateEditor
            value={value as string | null}
            onSave={handleSave as (value: string | null) => Promise<void>}
            onCancel={handleCancel}
            placeholder={editorProps.placeholder}
            allowClear={editorProps.allowClear}
            className="w-full"
          />
        );

      case 'checkbox':
        return (
          <CheckboxEditor
            value={value as boolean}
            onSave={handleSave as (value: boolean) => Promise<void>}
            onCancel={handleCancel}
          />
        );

      default:
        return null;
    }
  };

  // Render display content
  const renderContent = () => {
    if (column.cell) {
      return column.cell(cellContext);
    }

    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return String(value);
  };

  return (
    <TableCell
      className={cn(
        densityClasses.cell,
        column.className,
        column.align === 'center' && 'text-center',
        column.align === 'right' && 'text-right',
        isEditable && !isEditing && 'cursor-pointer hover:bg-muted/50 transition-colors'
      )}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
      }}
      onClick={!isEditing && isEditable ? handleStartEdit : undefined}
      onKeyDown={
        !isEditing && isEditable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleStartEdit();
              }
            }
          : undefined
      }
      tabIndex={isEditable && !isEditing ? 0 : undefined}
      role={isEditable && !isEditing ? 'button' : undefined}
    >
      {isEditing ? renderEditor() : renderContent()}
    </TableCell>
  );
}
