import { useState, useCallback } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface DateEditorProps {
  value: string | null; // ISO date string
  onSave: (value: string | null) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
}

export function DateEditor({
  value: initialValue,
  onSave,
  onCancel,
  placeholder = 'Select date...',
  className,
  allowClear = true,
}: DateEditorProps) {
  const [open, setOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const dateValue = initialValue ? parseISO(initialValue) : undefined;

  const handleSelect = useCallback(async (date: Date | undefined) => {
    if (isSaving) return;

    const newValue = date ? format(date, 'yyyy-MM-dd') : null;

    if (newValue === initialValue) {
      setOpen(false);
      onCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [initialValue, isSaving, onSave, onCancel]);

  const handleClear = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!initialValue) return;

    setIsSaving(true);
    try {
      await onSave(null);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [initialValue, onSave]);

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) onCancel();
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-7 px-2 text-sm justify-start text-left font-normal',
            !dateValue && 'text-muted-foreground',
            isSaving && 'opacity-50',
            className
          )}
          disabled={isSaving}
        >
          <Calendar className="mr-2 h-3 w-3" />
          {dateValue ? format(dateValue, 'MMM d, yyyy') : placeholder}
          {allowClear && dateValue && (
            <X
              className="ml-auto h-3 w-3 hover:text-destructive"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          initialFocus
          disabled={isSaving}
        />
      </PopoverContent>
    </Popover>
  );
}
