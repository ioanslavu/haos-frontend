import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineDurationSelectProps {
  value: number | null; // hours
  onSave: (value: number | null) => Promise<void> | void;
  placeholder?: string;
  className?: string;
}

const DURATION_PRESETS = [
  { value: 0.25, label: '15 min', hours: 0.25 },
  { value: 0.5, label: '30 min', hours: 0.5 },
  { value: 1, label: '1 hour', hours: 1 },
  { value: 2, label: '2 hours', hours: 2 },
  { value: 4, label: '4 hours', hours: 4 },
  { value: 8, label: '8 hours', hours: 8 },
];

function formatDuration(hours: number | null): string {
  if (!hours) return 'Not set';

  if (hours < 1) {
    const minutes = hours * 60;
    return `${minutes} min`;
  }

  if (hours === 1) return '1 hour';

  // Check if it's a whole number
  if (hours % 1 === 0) {
    return `${hours} hours`;
  }

  // For decimal hours, show both hours and minutes
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours % 1) * 60);

  if (wholeHours === 0) {
    return `${minutes} min`;
  }

  return minutes > 0
    ? `${wholeHours}h ${minutes}m`
    : `${wholeHours} hours`;
}

export function InlineDurationSelect({
  value,
  onSave,
  placeholder = 'Set duration',
  className,
}: InlineDurationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customHours, setCustomHours] = useState<string>('0');
  const [customMinutes, setCustomMinutes] = useState<string>('0');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelectPreset = async (hours: number) => {
    if (hours === value) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(hours);
      setIsOpen(false);
      setShowCustomInput(false);
    } catch (error) {
      console.error('Failed to update duration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomSubmit = async () => {
    const hours = parseInt(customHours) || 0;
    const minutes = parseInt(customMinutes) || 0;

    // Convert to decimal hours
    const totalHours = hours + (minutes / 60);

    if (totalHours === 0) {
      return;
    }

    // Round to 2 decimal places
    const roundedHours = Math.round(totalHours * 100) / 100;

    setIsSaving(true);
    try {
      await onSave(roundedHours);
      setIsOpen(false);
      setShowCustomInput(false);
      setCustomHours('0');
      setCustomMinutes('0');
    } catch (error) {
      console.error('Failed to update duration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await onSave(null);
      setIsOpen(false);
      setShowCustomInput(false);
    } catch (error) {
      console.error('Failed to clear duration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setShowCustomInput(false);
        setCustomHours('0');
        setCustomMinutes('0');
      }
    }} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 px-2 gap-1.5 font-medium',
            'hover:bg-accent transition-colors',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs">{value ? formatDuration(value) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-2 z-[60]" align="start">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Estimated Duration
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-1">
            {DURATION_PRESETS.map((preset) => {
              const isSelected = preset.value === value;
              return (
                <button
                  key={preset.value}
                  onClick={() => handleSelectPreset(preset.value)}
                  disabled={isSaving}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-md',
                    'transition-colors duration-150',
                    'hover:bg-accent/70',
                    isSelected && 'bg-primary/10 font-medium border border-primary/20'
                  )}
                >
                  <span className={cn(isSelected && 'text-primary')}>{preset.label}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Input Toggle/Input */}
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full px-3 py-2 text-sm rounded-md hover:bg-accent/50 transition-colors text-left text-muted-foreground"
            >
              Custom...
            </button>
          ) : (
            <div className="space-y-2 pt-1 px-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Hours</label>
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="0"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomSubmit();
                        } else if (e.key === 'Escape') {
                          setShowCustomInput(false);
                          setCustomHours('0');
                          setCustomMinutes('0');
                        }
                      }}
                      className="h-9 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Minutes</label>
                    <Select value={customMinutes} onValueChange={setCustomMinutes}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleCustomSubmit}
                  disabled={isSaving}
                  className="w-full h-8"
                >
                  Set Duration
                </Button>
              </div>
            </div>
          )}

          {/* Clear Option */}
          {value !== null && (
            <>
              <div className="h-px bg-border my-1" />
              <button
                onClick={handleClear}
                disabled={isSaving}
                className="w-full px-3 py-2 text-sm rounded-md hover:bg-destructive/10 transition-colors text-left text-destructive"
              >
                Clear duration
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
