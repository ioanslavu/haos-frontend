import { useState, useCallback, useMemo } from 'react';

export interface GroupedData<T> {
  key: string;
  label: string;
  items: T[];
  isExpanded: boolean;
}

interface UseGroupingOptions<T> {
  data: T[];
  groupBy?: keyof T | ((item: T) => string);
  getGroupLabel?: (key: string) => string;
  initialExpanded?: boolean;
  persistKey?: string;
}

export function useGrouping<T>({
  data,
  groupBy,
  getGroupLabel,
  initialExpanded = true,
  persistKey,
}: UseGroupingOptions<T>) {
  // Load expanded state from localStorage if persistKey is provided
  const loadExpandedState = (): Record<string, boolean> => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`table-groups-${persistKey}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore parse errors
      }
    }
    return {};
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(loadExpandedState);

  // Save expanded state to localStorage
  const saveExpandedState = useCallback((state: Record<string, boolean>) => {
    if (persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`table-groups-${persistKey}`, JSON.stringify(state));
      } catch {
        // Ignore storage errors
      }
    }
  }, [persistKey]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const newState = {
        ...prev,
        [groupKey]: prev[groupKey] !== undefined ? !prev[groupKey] : !initialExpanded,
      };
      saveExpandedState(newState);
      return newState;
    });
  }, [initialExpanded, saveExpandedState]);

  // Expand all groups
  const expandAll = useCallback(() => {
    const allExpanded: Record<string, boolean> = {};
    data.forEach((item) => {
      const key = getGroupKey(item);
      allExpanded[key] = true;
    });
    setExpandedGroups(allExpanded);
    saveExpandedState(allExpanded);
  }, [data, saveExpandedState]);

  // Collapse all groups
  const collapseAll = useCallback(() => {
    const allCollapsed: Record<string, boolean> = {};
    data.forEach((item) => {
      const key = getGroupKey(item);
      allCollapsed[key] = false;
    });
    setExpandedGroups(allCollapsed);
    saveExpandedState(allCollapsed);
  }, [data, saveExpandedState]);

  // Get group key for an item
  const getGroupKey = useCallback((item: T): string => {
    if (!groupBy) return 'default';

    if (typeof groupBy === 'function') {
      return groupBy(item);
    }

    const value = item[groupBy];
    return value !== null && value !== undefined ? String(value) : 'undefined';
  }, [groupBy]);

  // Group the data
  const groupedData = useMemo((): GroupedData<T>[] => {
    if (!groupBy) {
      return [{
        key: 'all',
        label: 'All Items',
        items: data,
        isExpanded: true,
      }];
    }

    const groups = new Map<string, T[]>();

    data.forEach((item) => {
      const key = getGroupKey(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: getGroupLabel ? getGroupLabel(key) : key,
      items,
      isExpanded: expandedGroups[key] !== undefined ? expandedGroups[key] : initialExpanded,
    }));
  }, [data, groupBy, getGroupKey, getGroupLabel, expandedGroups, initialExpanded]);

  // Check if a group is expanded
  const isGroupExpanded = useCallback((groupKey: string): boolean => {
    return expandedGroups[groupKey] !== undefined ? expandedGroups[groupKey] : initialExpanded;
  }, [expandedGroups, initialExpanded]);

  // Get visible items (flat list of items from expanded groups)
  const visibleItems = useMemo((): T[] => {
    return groupedData
      .filter((group) => group.isExpanded)
      .flatMap((group) => group.items);
  }, [groupedData]);

  return {
    groupedData,
    visibleItems,
    toggleGroup,
    expandAll,
    collapseAll,
    isGroupExpanded,
    hasGroups: !!groupBy,
  };
}
