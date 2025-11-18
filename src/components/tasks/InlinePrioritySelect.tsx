import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Flag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/api/types/tasks';

interface InlinePrioritySelectProps {
  value: number;
  onSave: (value: number) => Promise<void> | void;
  className?: string;
}

const PRIORITY_CHOICES = [
  { value: 4, label: 'Urgent', color: 'text-red-600 dark:text-red-400', bg: 'hover:bg-red-500/10' },
  { value: 3, label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'hover:bg-orange-500/10' },
  { value: 2, label: 'Normal', color: 'text-blue-600 dark:text-blue-400', bg: 'hover:bg-blue-500/10' },
  { value: 1, label: 'Low', color: 'text-gray-600 dark:text-gray-400', bg: 'hover:bg-gray-500/10' },
];

export function InlinePrioritySelect({
  value,
  onSave,
  className,
}: InlinePrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentPriority = PRIORITY_CHOICES.find(p => p.value === value) || PRIORITY_CHOICES[2];

  const handleChange = async (newValue: number) => {
    if (newValue === value) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 px-2 gap-1.5 font-medium',
            'hover:bg-accent transition-colors',
            className
          )}
        >
          <Flag className={cn('h-3.5 w-3.5', currentPriority.color)} />
          <span className="text-xs">{currentPriority.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1 bg-background border-border" align="start">
        <div className="space-y-0.5">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Set Priority
          </div>
          {PRIORITY_CHOICES.map((priority) => {
            const isSelected = priority.value === value;
            return (
              <button
                key={priority.value}
                onClick={() => handleChange(priority.value)}
                disabled={isSaving}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-2 py-2 text-sm rounded-md',
                  'transition-colors duration-150',
                  priority.bg,
                  isSelected && 'bg-accent/50 font-medium'
                )}
              >
                <div className="flex items-center gap-2">
                  <Flag className={cn('h-4 w-4', priority.color)} />
                  <span>{priority.label}</span>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
