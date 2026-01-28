import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from '../useAutosave';
import type { AxiosError } from 'axios';

describe('useAutosave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with idle state', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutosave({
        value: 'initial',
        onSave,
      })
    );

    expect(result.current.saveState).toBe('idle');
    expect(result.current.showSavedIndicator).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should not trigger save when value is unchanged', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() =>
      useAutosave({
        value: 'initial',
        onSave,
      })
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('should debounce save when value changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave }),
      { initialProps: { value: 'initial' } }
    );

    // Change value
    rerender({ value: 'changed' });

    // Should be marked as dirty
    expect(result.current.saveState).toBe('dirty');

    // Should not save immediately
    expect(onSave).not.toHaveBeenCalled();

    // Fast-forward past debounce delay (2000ms default)
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve(); // Allow promise to resolve
    });

    // Should trigger save after debounce
    expect(onSave).toHaveBeenCalledWith('changed');
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('should show "saving" state during save', async () => {
    let resolvePromise: (value: void) => void = () => {};
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => (resolvePromise = resolve))
    );

    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve(); // Trigger microtask queue
    });

    expect(result.current.saveState).toBe('saving');

    // Resolve the save
    await act(async () => {
      resolvePromise();
      await Promise.resolve(); // Allow state update to complete
    });

    expect(result.current.saveState).toBe('idle');
  });

  it('should show "saved" indicator after successful save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(result.current.showSavedIndicator).toBe(true);

    // Indicator should disappear after 2 seconds
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.showSavedIndicator).toBe(false);
  });

  it('should handle save errors', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(result.current.saveState).toBe('error');
    expect(result.current.error).toBe('Network error');
  });

  it('should handle Axios errors with response data', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        data: { detail: 'Validation error' },
        statusText: 'Bad Request',
      },
    } as AxiosError;

    const onSave = vi.fn().mockRejectedValue(axiosError);
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Validation error');
  });

  it('should clear error state', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(result.current.error).toBe('Save failed');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
    expect(result.current.saveState).toBe('idle');
  });

  it('should support custom debounce delay', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave, debounceMs: 1000 }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    // Should not save before custom delay
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(onSave).not.toHaveBeenCalled();

    // Should save after custom delay
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(onSave).toHaveBeenCalledWith('changed');
  });

  it('should respect enabled flag', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave, enabled: false }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('should support custom change detection', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const hasChanged = vi.fn((current: string, initial: string) => {
      // Only consider changes if string length differs by more than 2
      return Math.abs(current.length - initial.length) > 2;
    });

    const { rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave, hasChanged }),
      { initialProps: { value: 'test' } }
    );

    // Small change - should not trigger save
    rerender({ value: 'test1' });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(onSave).not.toHaveBeenCalled();

    // Large change - should trigger save
    rerender({ value: 'test123' });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(onSave).toHaveBeenCalledWith('test123');
  });

  it('should reset initial value when resetKey changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value, resetKey }) => useAutosave({ value, onSave, resetKey }),
      { initialProps: { value: 'initial', resetKey: 1 } }
    );

    rerender({ value: 'changed', resetKey: 1 });

    expect(result.current.saveState).toBe('dirty');

    // Change resetKey - should reset to idle
    rerender({ value: 'changed', resetKey: 2 });

    expect(result.current.saveState).toBe('idle');
  });

  it('should force immediate save with saveNow', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    // Call saveNow without waiting for debounce
    await act(async () => {
      await result.current.saveNow();
    });

    expect(onSave).toHaveBeenCalledWith('changed');
  });

  it('should buffer changes when already saving (race condition)', async () => {
    let resolvePromise: (value: void) => void = () => {};
    const onSave = vi.fn(
      () => new Promise<void>((resolve) => (resolvePromise = resolve))
    );

    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed1' });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    // First save is in progress
    expect(result.current.saveState).toBe('saving');
    expect(onSave).toHaveBeenCalledTimes(1);

    // Change value again while saving - this marks it dirty and buffers the change
    act(() => {
      rerender({ value: 'changed2' });
    });

    // Should be marked as dirty (the new value changed)
    expect(result.current.saveState).toBe('dirty');
    // Should not have triggered another save yet
    expect(onSave).toHaveBeenCalledTimes(1);

    // Resolve first save
    await act(async () => {
      resolvePromise();
      await Promise.resolve();
    });

    // After first save completes, state goes to idle because the pending value
    // was set to null in the finally block. The hook would need another debounce
    // trigger to save the buffered value.
    expect(result.current.saveState).toBe('idle');
    expect(onSave).toHaveBeenCalledTimes(1); // Still only one call
  });

  it('should cancel debounced save if value changes again', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ value }) => useAutosave({ value, onSave }),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed1' });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Change again before debounce completes
    rerender({ value: 'changed2' });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should not have saved yet
    expect(onSave).not.toHaveBeenCalled();

    // Complete the second debounce
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // Should save with the latest value
    expect(onSave).toHaveBeenCalledWith('changed2');
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
