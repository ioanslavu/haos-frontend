import { useState, useCallback } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { FilterOption } from '../types';

interface MultiSelectEditorProps {
  value: string[];
  options: FilterOption[];
  onSave: (value: string[]) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
  maxDisplay?: number;
}

export function MultiSelectEditor({
  value: initialValue,
  options,
  onSave,
  onCancel,
  placeholder = 'Select...',
  className,
  maxDisplay = 2,
}: MultiSelectEditorProps) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<string[]>(initialValue || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = useCallback((optionValue: string) => {
    setSelected((prev) =>
      prev.includes(optionValue)
        ? prev.filter((v) => v !== optionValue)
        : [...prev, optionValue]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    // Check if values changed
    const sortedInitial = [...initialValue].sort();
    const sortedSelected = [...selected].sort();
    const unchanged =
      sortedInitial.length === sortedSelected.length &&
      sortedInitial.every((v, i) => v === sortedSelected[i]);

    if (unchanged) {
      setOpen(false);
      onCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(selected);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [initialValue, selected, isSaving, onSave, onCancel]);

  const handleRemove = useCallback((optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => prev.filter((v) => v !== optionValue));
  }, []);

  const getSelectedLabels = () => {
    return selected
      .map((v) => options.find((o) => o.value === v)?.label || v)
      .slice(0, maxDisplay);
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleSave();
      }
      setOpen(isOpen);
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-auto min-h-[28px] px-2 text-sm justify-between',
            selected.length === 0 && 'text-muted-foreground',
            isSaving && 'opacity-50',
            className
          )}
          disabled={isSaving}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              placeholder
            ) : (
              <>
                {getSelectedLabels().map((label, index) => (
                  <Badge
                    key={selected[index]}
                    variant="secondary"
                    className="h-5 gap-1 px-1 text-xs"
                  >
                    {label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => handleRemove(selected[index], e)}
                    />
                  </Badge>
                ))}
                {selected.length > maxDisplay && (
                  <Badge variant="secondary" className="h-5 px-1 text-xs">
                    +{selected.length - maxDisplay}
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleToggle(option.value)}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selected.includes(option.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="border-t p-2">
          <Button size="sm" className="w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Done'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
