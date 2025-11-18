import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Clock, Activity, AlertTriangle, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineStatusBadgeProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  labels: Record<string, string>;
  colors?: Record<string, string>;
  className?: string;
}

const STATUS_ICONS: Record<string, any> = {
  todo: Clock,
  in_progress: Activity,
  blocked: AlertTriangle,
  review: AlertCircle,
  done: CheckCircle,
  cancelled: XCircle,
};

export function InlineStatusBadge({
  value,
  onSave,
  labels,
  colors = {},
  className,
}: InlineStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const Icon = STATUS_ICONS[value] || Clock;

  const handleChange = async (newValue: string) => {
    if (newValue === value) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        <Badge
          variant={colors[value] as any || 'secondary'}
          className={cn(
            'cursor-pointer transition-all duration-200',
            'hover:scale-105 hover:shadow-md',
            'animate-in fade-in duration-200',
            className
          )}
        >
          <Icon className="h-3 w-3 mr-1" />
          {labels[value]}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2 bg-background border-border" align="start">
        <div className="space-y-1">
          {Object.entries(labels).map(([key, label]) => {
            const ItemIcon = STATUS_ICONS[key] || Clock;
            return (
              <button
                key={key}
                onClick={() => handleChange(key)}
                disabled={isSaving}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md',
                  'hover:bg-accent transition-colors duration-150',
                  key === value && 'bg-accent font-medium'
                )}
              >
                <ItemIcon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
