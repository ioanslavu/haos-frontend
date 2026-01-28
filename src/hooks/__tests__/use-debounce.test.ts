import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value updates with default delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated' });

    // Value should not update immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by less than delay
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Fast-forward past delay
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Value should now be updated
    expect(result.current).toBe('updated');
  });

  it('should debounce with custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });

    // Should not update before custom delay
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toBe('initial');

    // Should update after custom delay
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // First change
    rerender({ value: 'change1' });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Second change before delay completes
    rerender({ value: 'change2' });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should still be initial (timer was reset)
    expect(result.current).toBe('initial');

    // Complete the delay from second change
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should now have the latest value
    expect(result.current).toBe('change2');
  });

  it('should handle multiple rapid changes and only update once', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Simulate typing
    rerender({ value: 't' });
    act(() => vi.advanceTimersByTime(50));

    rerender({ value: 'te' });
    act(() => vi.advanceTimersByTime(50));

    rerender({ value: 'tes' });
    act(() => vi.advanceTimersByTime(50));

    rerender({ value: 'test' });

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Fast-forward past delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should update to final value
    expect(result.current).toBe('test');
  });

  it('should work with different data types', () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    );

    numberRerender({ value: 42 });
    act(() => vi.advanceTimersByTime(300));
    expect(numberResult.current).toBe(42);

    // Test with boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: false } }
    );

    boolRerender({ value: true });
    act(() => vi.advanceTimersByTime(300));
    expect(boolResult.current).toBe(true);

    // Test with object
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: { key: 'initial' } } }
    );

    const newObj = { key: 'updated' };
    objRerender({ value: newObj });
    act(() => vi.advanceTimersByTime(300));
    expect(objResult.current).toEqual(newObj);

    // Test with array
    const { result: arrResult, rerender: arrRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: [1, 2] } }
    );

    const newArr = [3, 4, 5];
    arrRerender({ value: newArr });
    act(() => vi.advanceTimersByTime(300));
    expect(arrResult.current).toEqual(newArr);
  });

  it('should update delay dynamically', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    // Change value and delay
    rerender({ value: 'updated', delay: 500 });

    // Old delay should not trigger update
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    // New delay should trigger update
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });

  it('should use default delay when not specified', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Default delay is 300ms
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // With 0 delay, should update on next tick
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe('updated');
  });

  it('should cleanup timeout on unmount', () => {
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    // Unmount before delay completes
    unmount();

    // Fast-forward time - should not throw error
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(300);
      });
    }).not.toThrow();
  });

  it('should handle null and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce<string | null | undefined>(value, 300),
      { initialProps: { value: 'initial' as string | null | undefined } }
    );

    rerender({ value: null });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe(null);

    rerender({ value: undefined });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe(undefined);

    rerender({ value: 'back to string' });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('back to string');
  });
});
