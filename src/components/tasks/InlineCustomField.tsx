import { useState, useEffect, useRef } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import type { TaskCustomField, UpdateCustomFieldDto } from '@/api/types/customFields';
import { cn } from '@/lib/utils';

interface InlineCustomFieldProps {
  field: TaskCustomField;
  onUpdate: (data: UpdateCustomFieldDto) => void;
  onDelete: () => void;
  onUpdateName: (name: string) => void;
}

export function InlineCustomField({ field, onUpdate, onDelete, onUpdateName }: InlineCustomFieldProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(field.field_name);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localValue, setLocalValue] = useState<string | number>(field.display_value || '');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Sync local value when field updates from server
  useEffect(() => {
    setLocalValue(field.display_value || '');
  }, [field.display_value]);

  const handleSaveName = () => {
    if (nameValue.trim() && nameValue !== field.field_name) {
      onUpdateName(nameValue.trim());
    }
    setIsEditingName(false);
  };

  const handleValueChange = (value: string | number) => {
    // Update local state immediately
    setLocalValue(value);

    // Debounce the API call
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onUpdate({ value });
    }, 500); // 500ms debounce
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const formatValue = (val: string | number | null): string => {
    if (val === null || val === undefined || val === '') return '';
    if (field.field_type === 'number') {
      return new Intl.NumberFormat().format(Number(val));
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
          {isEditingName ? (
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setNameValue(field.field_name);
                  setIsEditingName(false);
                }
              }}
              className="h-6 text-xs text-muted-foreground"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left truncate"
            >
              {field.field_name}
            </button>
          )}
        </div>

        {/* Value */}
        <div className="flex-1">
          {field.field_type === 'text' && (
            <Input
              type="text"
              value={localValue || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Empty"
              className="h-7 text-sm border-none bg-transparent hover:bg-muted/30 focus:bg-background focus:border-input"
            />
          )}

          {field.field_type === 'number' && (
            <Input
              type="number"
              value={localValue || ''}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Empty"
              className="h-7 text-sm border-none bg-transparent hover:bg-muted/30 focus:bg-background focus:border-input"
            />
          )}

          {field.field_type === 'single_select' && (
            <Select
              value={localValue?.toString() || ''}
              onValueChange={handleValueChange}
            >
              <SelectTrigger className="h-7 text-sm border-none bg-transparent hover:bg-muted/30 data-[state=open]:bg-background data-[state=open]:border-input">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {field.select_options?.map((option) => (
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
              Delete "{field.field_name}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
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
