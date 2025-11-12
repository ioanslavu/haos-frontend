import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS } from '@/api/types/tasks';

interface InlinePrioritySelectProps {
  value: number;
  onSave: (value: number) => Promise<void> | void;
  className?: string;
}

const PRIORITY_CHOICES = [4, 3, 2, 1];

export function InlinePrioritySelect({
  value,
  onSave,
  className,
}: InlinePrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4:
        return 'text-red-600';
      case 3:
        return 'text-orange-600';
      case 2:
        return 'text-blue-600';
      case 1:
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant={TASK_PRIORITY_COLORS[value] as any || 'secondary'}
          className={cn(
            'cursor-pointer transition-all duration-200',
            'hover:scale-105 hover:shadow-md',
            'animate-in fade-in duration-200',
            className
          )}
        >
          <Flag className={cn('h-3 w-3 mr-1', getPriorityColor(value))} />
          {TASK_PRIORITY_LABELS[value]}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-2" align="start">
        <div className="space-y-1">
          {PRIORITY_CHOICES.map((priority) => (
            <button
              key={priority}
              onClick={() => handleChange(priority)}
              disabled={isSaving}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md',
                'hover:bg-accent transition-colors duration-150',
                priority === value && 'bg-accent font-medium'
              )}
            >
              <Flag className={cn('h-4 w-4', getPriorityColor(priority))} />
              {TASK_PRIORITY_LABELS[priority]}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
