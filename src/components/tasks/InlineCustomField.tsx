import { useState, useEffect, useRef } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { InlineDatePicker } from './InlineDatePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { TaskFieldWithDefinition } from '@/api/types/customFields';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface InlineCustomFieldProps {
  fieldWithDefinition: TaskFieldWithDefinition;
  taskId: number;
  projectId: number;
  onUpdateValue: (valueId: number, value: string | null) => void;
  onCreateValue?: (definitionId: number, value: string | null) => void;
  onDeleteDefinition: (definitionId: number) => void;
  onPendingChange?: (valueId: number, value: string | null) => void;
}

export function InlineCustomField({
  fieldWithDefinition,
  taskId,
  projectId,
  onUpdateValue,
  onCreateValue,
  onDeleteDefinition,
  onPendingChange,
}: InlineCustomFieldProps) {
  const { definition, value, display_value } = fieldWithDefinition;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localValue, setLocalValue] = useState<string>(value?.value || '');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSyncedValueRef = useRef<string | null>(value?.value || null);

  // Sync local value when field updates from server (only if actually changed)
  useEffect(() => {
    const serverValue = value?.value || '';
    if (serverValue !== lastSyncedValueRef.current) {
      lastSyncedValueRef.current = serverValue;
      setLocalValue(serverValue);
      // Clear pending at parent since server has the latest value
      if (value?.id) {
        onPendingChange?.(value.id, null);
      }
    }
  }, [value?.value, value?.id, onPendingChange]);

  const handleValueChange = (newValue: string) => {
    // Update local state immediately
    setLocalValue(newValue);

    // Debounce the API call
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (value?.id) {
        // Update existing value
        onUpdateValue(value.id, newValue || null);
        onPendingChange?.(value.id, null);
      } else {
        // Create new value using bulk update
        onCreateValue?.(definition.id, newValue || null);
      }
    }, 500); // 500ms debounce

    // Report pending change to parent for save-on-close (only if value exists)
    if (value?.id) {
      onPendingChange?.(value.id, newValue);
    }
  };

  // Save immediately when field loses focus
  const handleBlur = () => {
    // If there's a pending debounce, cancel it and save immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = undefined;
    }

    // Check if value changed from server value
    if (localValue !== lastSyncedValueRef.current) {
      if (value?.id) {
        onUpdateValue(value.id, localValue || null);
        onPendingChange?.(value.id, null);
      } else {
        // Create new value
        onCreateValue?.(definition.id, localValue || null);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const formatDisplayValue = (val: string | number | boolean | null): string => {
    if (val === null || val === undefined || val === '') return '';
    if (definition.field_type === 'number' && typeof val === 'number') {
      return new Intl.NumberFormat().format(val);
    }
    if (definition.field_type === 'checkbox') {
      return val ? 'Yes' : 'No';
    }
    if (definition.field_type === 'date' && val) {
      try {
        return format(new Date(String(val)), 'PPP');
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  return (
    <>
      <div
        className="grid grid-cols-[100px_1fr] gap-2 items-center group py-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Label/Name */}
        <div className="flex items-center gap-1">
          {isHovered && (
            <>
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-destructive" />
              </button>
            </>
          )}
          <span className="text-xs text-muted-foreground truncate">
            {definition.field_name}
          </span>
        </div>

        {/* Value */}
        <div className="flex-1">
          {definition.field_type === 'text' && (
            <Input
              type="text"
              value={localValue || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              onBlur={handleBlur}
              placeholder="Empty"
              className="h-7 text-sm border-none bg-transparent hover:bg-muted/30 focus:bg-background focus:border-input"
            />
          )}

          {definition.field_type === 'number' && (
            <Input
              type="number"
              value={localValue || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              onBlur={handleBlur}
              placeholder="Empty"
              className="h-7 text-sm border-none bg-transparent hover:bg-muted/30 focus:bg-background focus:border-input"
            />
          )}

          {definition.field_type === 'date' && (
            <InlineDatePicker
              value={localValue || null}
              onSave={(date) => {
                setLocalValue(date || '');
                if (value?.id) {
                  onUpdateValue(value.id, date);
                  onPendingChange?.(value.id, null);
                } else {
                  onCreateValue?.(definition.id, date);
                }
              }}
              placeholder="Select date..."
              className="h-7 text-sm border-none bg-transparent hover:bg-muted/30"
            />
          )}

          {definition.field_type === 'checkbox' && (
            <div className="flex items-center h-7">
              <Checkbox
                checked={localValue === 'true'}
                onCheckedChange={(checked) => {
                  const newValue = checked ? 'true' : 'false';
                  setLocalValue(newValue);
                  if (value?.id) {
                    onUpdateValue(value.id, newValue);
                    onPendingChange?.(value.id, null);
                  } else {
                    onCreateValue?.(definition.id, newValue);
                  }
                }}
              />
            </div>
          )}

          {definition.field_type === 'single_select' && (
            <Select
              value={localValue || ''}
              onValueChange={(val) => {
                setLocalValue(val);
                if (value?.id) {
                  onUpdateValue(value.id, val);
                  onPendingChange?.(value.id, null);
                } else {
                  onCreateValue?.(definition.id, val);
                }
              }}
            >
              <SelectTrigger className="h-7 text-sm border-none bg-transparent hover:bg-muted/30 data-[state=open]:bg-background data-[state=open]:border-input">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {definition.select_options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{definition.field_name}" from this project? This will remove it from all tasks in the project. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDeleteDefinition(definition.id);
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
