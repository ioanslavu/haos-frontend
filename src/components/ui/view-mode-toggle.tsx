import React from 'react';
import { LayoutGrid, LayoutList, Columns3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'grid' | 'kanban';

interface ViewModeToggleProps {
  value: ViewMode;
  onValueChange: (mode: ViewMode) => void;
  availableModes?: ViewMode[];
  className?: string;
}

const modeConfig = {
  table: {
    icon: LayoutList,
    label: 'Table',
  },
  grid: {
    icon: LayoutGrid,
    label: 'Grid',
  },
  kanban: {
    icon: Columns3,
    label: 'Kanban',
  },
};

export function ViewModeToggle({
  value,
  onValueChange,
  availableModes = ['table', 'grid'],
  className,
}: ViewModeToggleProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as ViewMode)} className={cn("w-auto", className)}>
      <TabsList>
        {availableModes.map((mode) => {
          const Icon = modeConfig[mode].icon;
          return (
            <TabsTrigger
              key={mode}
              value={mode}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{modeConfig[mode].label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

// Hook to persist view mode preference
export function useViewMode(pageKey: string, defaultMode: ViewMode = 'table'): [ViewMode, (mode: ViewMode) => void] {
  const storageKey = `viewMode_${pageKey}`;

  const [viewMode, setViewModeState] = React.useState<ViewMode>(() => {
    const saved = localStorage.getItem(storageKey);
    return (saved as ViewMode) || defaultMode;
  });

  const setViewMode = React.useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(storageKey, mode);
  }, [storageKey]);

  return [viewMode, setViewMode];
}
