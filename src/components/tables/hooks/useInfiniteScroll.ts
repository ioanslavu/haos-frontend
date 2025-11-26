import { useRef, useEffect, useCallback } from 'react';
import type { InfiniteScrollConfig } from '../types';

interface UseInfiniteScrollOptions {
  config?: InfiniteScrollConfig;
}

interface UseInfiniteScrollReturn {
  /** Ref to attach to the sentinel element at the bottom */
  sentinelRef: React.RefObject<HTMLDivElement>;
  /** Whether currently fetching more data */
  isFetching: boolean;
  /** Whether there's more data to load */
  hasMore: boolean;
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const { config } = options;
  const sentinelRef = useRef<HTMLDivElement>(null);

  const enabled = config?.enabled ?? false;
  const hasNextPage = config?.hasNextPage ?? false;
  const isFetching = config?.isFetching ?? false;
  const fetchNextPage = config?.fetchNextPage;
  const threshold = config?.threshold ?? 100;

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetching && fetchNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetching, fetchNextPage]
  );

  useEffect(() => {
    if (!enabled) return;

    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, handleIntersection, threshold]);

  return {
    sentinelRef,
    isFetching,
    hasMore: hasNextPage,
  };
}
