import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InlineDatePickerProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void> | void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  allowClear?: boolean;
}

export function InlineDatePicker({
  value,
  onSave,
  placeholder = 'Add date',
  label,
  icon,
  className,
  allowClear = true,
}: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (date: Date | undefined) => {
    setIsSaving(true);
    try {
      await onSave(date ? format(date, 'yyyy-MM-dd') : null);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update date:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    try {
      await onSave(null);
    } catch (error) {
      console.error('Failed to clear date:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-auto py-1 px-2 justify-start text-left font-normal',
            'hover:bg-accent/50 transition-colors duration-200',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={isSaving}
        >
          {icon || <CalendarIcon className="mr-2 h-4 w-4" />}
          <span className="flex-1">
            {label && <span className="mr-2 text-xs font-medium">{label}</span>}
            {value ? format(new Date(value), 'MMM d, yyyy') : placeholder}
          </span>
          {allowClear && value && (
            <X
              className="h-3 w-3 ml-2 hover:bg-accent rounded-sm"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[60]" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
