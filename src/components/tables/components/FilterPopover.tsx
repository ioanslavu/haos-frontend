import { useState, useCallback } from 'react';
import { Filter, X, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { FilterType, FilterOption } from '../types';

interface FilterPopoverProps {
  columnId: string;
  filterType: FilterType;
  filterOptions?: FilterOption[];
  filterPlaceholder?: string;
  currentValue: unknown;
  onFilterChange: (columnId: string, value: unknown) => void;
}

export function FilterPopover({
  columnId,
  filterType,
  filterOptions = [],
  filterPlaceholder,
  currentValue,
  onFilterChange,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [textValue, setTextValue] = useState(
    typeof currentValue === 'string' ? currentValue : ''
  );

  const hasValue = currentValue !== undefined && currentValue !== null && currentValue !== '' &&
    !(Array.isArray(currentValue) && currentValue.length === 0);

  const handleTextSubmit = useCallback(() => {
    onFilterChange(columnId, textValue || null);
    setOpen(false);
  }, [columnId, textValue, onFilterChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFilterChange(columnId, null);
    setTextValue('');
  }, [columnId, onFilterChange]);

  const handleSelectOption = useCallback((value: string) => {
    if (filterType === 'multi-select') {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      const newValue = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];
      onFilterChange(columnId, newValue.length > 0 ? newValue : null);
    } else {
      onFilterChange(columnId, value === currentValue ? null : value);
      setOpen(false);
    }
  }, [columnId, currentValue, filterType, onFilterChange]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    onFilterChange(columnId, date ? format(date, 'yyyy-MM-dd') : null);
    setOpen(false);
  }, [columnId, onFilterChange]);

  // Render filter content based on type
  const renderFilterContent = () => {
    switch (filterType) {
      case 'text':
        return (
          <div className="p-2 space-y-2">
            <Input
              placeholder={filterPlaceholder || 'Search...'}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTextSubmit();
                }
              }}
              className="h-8"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={handleTextSubmit}>
                Apply
              </Button>
            </div>
          </div>
        );

      case 'select':
      case 'multi-select':
        return (
          <Command shouldFilter={false}>
            <CommandInput placeholder={filterPlaceholder || 'Search...'} />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {filterOptions.map((option) => {
                  const isSelected = filterType === 'multi-select'
                    ? Array.isArray(currentValue) && currentValue.includes(option.value)
                    : currentValue === option.value;

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelectOption(option.value)}
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      {option.icon && <span className="mr-2">{option.icon}</span>}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        );

      case 'date-range':
        const dateValue = typeof currentValue === 'string' ? new Date(currentValue) : undefined;
        return (
          <div className="p-2">
            <CalendarComponent
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
              initialFocus
            />
          </div>
        );

      case 'number-range':
        return (
          <div className="p-2 space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={(currentValue as { min?: number })?.min ?? ''}
                onChange={(e) => {
                  const min = e.target.value ? Number(e.target.value) : undefined;
                  const current = currentValue as { min?: number; max?: number } | undefined;
                  onFilterChange(columnId, { ...current, min });
                }}
                className="h-8"
              />
              <Input
                type="number"
                placeholder="Max"
                value={(currentValue as { max?: number })?.max ?? ''}
                onChange={(e) => {
                  const max = e.target.value ? Number(e.target.value) : undefined;
                  const current = currentValue as { min?: number; max?: number } | undefined;
                  onFilterChange(columnId, { ...current, max });
                }}
                className="h-8"
              />
            </div>
            <Button size="sm" className="w-full" onClick={() => setOpen(false)}>
              Apply
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Get display value for badge
  const getDisplayValue = () => {
    if (!hasValue) return null;

    if (filterType === 'multi-select' && Array.isArray(currentValue)) {
      return `${currentValue.length} selected`;
    }

    if (filterType === 'select') {
      const option = filterOptions.find((o) => o.value === currentValue);
      return option?.label || String(currentValue);
    }

    if (filterType === 'date-range' && typeof currentValue === 'string') {
      return format(new Date(currentValue), 'MMM d, yyyy');
    }

    return String(currentValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-6 w-6 p-0 ml-1',
            hasValue && 'text-primary'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
        onClick={(e) => e.stopPropagation()}
        sideOffset={4}
      >
        <div className="flex items-center justify-between p-2 border-b">
          <span className="text-sm font-medium">Filter</span>
          {hasValue && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
        </div>
        {renderFilterContent()}
      </PopoverContent>
    </Popover>
  );
}

// Active Filters Display
interface ActiveFiltersProps {
  filters: Record<string, unknown>;
  columns: { id: string; header: string; filterOptions?: FilterOption[] }[];
  onRemove: (columnId: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, columns, onRemove, onClearAll }: ActiveFiltersProps) {
  const activeFilters = Object.entries(filters).filter(([_, value]) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  if (activeFilters.length === 0) return null;

  const getFilterLabel = (columnId: string, value: unknown) => {
    const column = columns.find((c) => c.id === columnId);
    const columnLabel = typeof column?.header === 'string' ? column.header : columnId;

    if (Array.isArray(value)) {
      return `${columnLabel}: ${value.length} selected`;
    }

    if (column?.filterOptions) {
      const option = column.filterOptions.find((o) => o.value === value);
      if (option) return `${columnLabel}: ${option.label}`;
    }

    return `${columnLabel}: ${String(value)}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map(([columnId, value]) => (
        <Badge
          key={columnId}
          variant="secondary"
          className="gap-1 pr-1"
        >
          <span className="text-xs">{getFilterLabel(columnId, value)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemove(columnId)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={onClearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
