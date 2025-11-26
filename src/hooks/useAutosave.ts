import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'error';

/** Extract error message from various error types */
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    // Try to get message from response data
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    // Fall back to status text
    if (err.response?.statusText) return err.response.statusText;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Failed to save';
}

interface UseAutosaveOptions<T> {
  /** The current value to watch for changes */
  value: T;
  /** Function to save the value - should return a promise */
  onSave: (value: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 2000) */
  debounceMs?: number;
  /** Whether autosave is enabled (default: true) */
  enabled?: boolean;
  /** Compare function to detect changes (default: JSON.stringify comparison) */
  hasChanged?: (current: T, initial: T) => boolean;
  /** Key to reset initial value when it changes (e.g., server data version) */
  resetKey?: unknown;
}

interface UseAutosaveReturn {
  /** Current save state: 'idle' | 'dirty' | 'saving' | 'error' */
  saveState: SaveState;
  /** Whether the "Saved" indicator should be shown */
  showSavedIndicator: boolean;
  /** Error message if save failed */
  error: string | null;
  /** Force an immediate save */
  saveNow: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook for autosaving content with debounce and save state tracking.
 *
 * Features:
 * - Debounced saves (waits for user to stop typing)
 * - Save state tracking (idle/dirty/saving)
 * - "Saved" indicator that shows briefly after save
 * - Smart change detection to avoid unnecessary saves
 * - Race condition handling
 */
export function useAutosave<T>({
  value,
  onSave,
  debounceMs = 2000,
  enabled = true,
  hasChanged,
  resetKey,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setSaveState('idle');
  }, []);

  // Track the initial/last-saved value to detect changes
  const initialValueRef = useRef<T>(value);
  const isSavingRef = useRef(false);
  const pendingValueRef = useRef<T | null>(null);
  const lastResetKeyRef = useRef(resetKey);

  // Default change detection
  const defaultHasChanged = useCallback((current: T, initial: T) => {
    return JSON.stringify(current) !== JSON.stringify(initial);
  }, []);

  const detectChange = hasChanged || defaultHasChanged;

  // Reset initial value when resetKey changes (e.g., server data reloaded)
  useEffect(() => {
    if (resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey;
      initialValueRef.current = value;
      setSaveState('idle');
    }
  }, [resetKey, value]);

  // Force immediate save
  const saveNow = useCallback(async () => {
    if (isSavingRef.current) return;

    const hasChanges = detectChange(value, initialValueRef.current);
    if (!hasChanges) return;

    isSavingRef.current = true;
    setSaveState('saving');

    try {
      await onSave(value);
      initialValueRef.current = value;
      setError(null);
      setSaveState('idle');
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 2000);
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      setSaveState('error');
    } finally {
      isSavingRef.current = false;

      // Flush pending changes if any (but not if we hit an error)
      if (pendingValueRef.current !== null && !error) {
        const pending = pendingValueRef.current;
        pendingValueRef.current = null;
        if (detectChange(pending, initialValueRef.current)) {
          setSaveState('dirty');
        }
      }
    }
  }, [value, onSave, detectChange, error]);

  // Autosave effect with debounce
  useEffect(() => {
    if (!enabled) return;

    // Check if value has actually changed from initial
    const hasChanges = detectChange(value, initialValueRef.current);
    if (!hasChanges) {
      return;
    }

    // Mark as dirty
    setSaveState('dirty');

    // If currently saving, buffer this value
    if (isSavingRef.current) {
      pendingValueRef.current = value;
      return;
    }

    // Debounce save
    const timer = setTimeout(async () => {
      // Double-check changes before saving
      const stillHasChanges = detectChange(value, initialValueRef.current);
      if (!stillHasChanges) return;

      isSavingRef.current = true;
      setSaveState('saving');

      try {
        await onSave(value);
        initialValueRef.current = value;
        setError(null);
        setSaveState('idle');
        setShowSavedIndicator(true);
        setTimeout(() => setShowSavedIndicator(false), 2000);
      } catch (err) {
        const message = extractErrorMessage(err);
        setError(message);
        setSaveState('error');
      } finally {
        isSavingRef.current = false;

        // Don't flush pending changes if we hit an error
        if (pendingValueRef.current !== null) {
          pendingValueRef.current = null;
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled, debounceMs, onSave, detectChange]);

  return {
    saveState,
    showSavedIndicator,
    error,
    saveNow,
    clearError,
  };
}
