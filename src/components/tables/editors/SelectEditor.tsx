import { useState, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FilterOption } from '../types';

interface SelectEditorProps {
  value: string | null;
  options: FilterOption[];
  onSave: (value: string | null) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
}

export function SelectEditor({
  value: initialValue,
  options,
  onSave,
  onCancel,
  placeholder = 'Select...',
  className,
  allowClear = true,
}: SelectEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback(async (newValue: string) => {
    if (isSaving) return;

    // Handle clear
    const finalValue = newValue === '__clear__' ? null : newValue;

    if (finalValue === initialValue) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(finalValue);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [initialValue, isSaving, onSave]);

  return (
    <Select
      value={initialValue || ''}
      onValueChange={handleChange}
      disabled={isSaving}
    >
      <SelectTrigger
        className={cn(
          'h-7 px-2 text-sm',
          isSaving && 'opacity-50',
          className
        )}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowClear && initialValue && (
          <SelectItem value="__clear__" className="text-muted-foreground">
            Clear selection
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
