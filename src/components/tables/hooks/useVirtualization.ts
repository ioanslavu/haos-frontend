import { useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualizationOptions<T> {
  data: T[];
  enabled?: boolean;
  estimateSize?: number;
  overscan?: number;
  getItemKey?: (index: number, item: T) => string | number;
}

export function useVirtualization<T>({
  data,
  enabled = true,
  estimateSize = 40,
  overscan = 5,
  getItemKey,
}: UseVirtualizationOptions<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const getKey = useCallback((index: number) => {
    if (getItemKey && data[index]) {
      return getItemKey(index, data[index]);
    }
    return index;
  }, [data, getItemKey]);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: getKey,
    enabled,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Calculate padding for virtual scroll
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? totalSize - (virtualItems[virtualItems.length - 1]?.end || 0)
    : 0;

  // Get visible data items
  const visibleData = useMemo(() => {
    if (!enabled) return data;
    return virtualItems.map((virtualItem) => ({
      item: data[virtualItem.index],
      index: virtualItem.index,
      virtualItem,
    }));
  }, [data, virtualItems, enabled]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => {
    virtualizer.scrollToIndex(index, options);
  }, [virtualizer]);

  // Scroll to specific offset
  const scrollToOffset = useCallback((offset: number) => {
    virtualizer.scrollToOffset(offset);
  }, [virtualizer]);

  // Measure element at index
  const measureElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      virtualizer.measureElement(element);
    }
  }, [virtualizer]);

  return {
    parentRef,
    virtualItems,
    visibleData,
    totalSize,
    paddingTop,
    paddingBottom,
    scrollToIndex,
    scrollToOffset,
    measureElement,
    isVirtualized: enabled,
  };
}
