import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberEditorProps {
  value: number | null;
  onSave: (value: number | null) => Promise<void>;
  onCancel: () => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function NumberEditor({
  value: initialValue,
  onSave,
  onCancel,
  min,
  max,
  step = 1,
  placeholder = 'Enter number...',
  className,
  autoFocus = true,
}: NumberEditorProps) {
  const [value, setValue] = useState(initialValue?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const numValue = value === '' ? null : Number(value);
    if (numValue === initialValue) {
      onCancel();
      return;
    }

    // Validate range
    if (numValue !== null) {
      if (min !== undefined && numValue < min) return;
      if (max !== undefined && numValue > max) return;
    }

    setIsSaving(true);
    try {
      await onSave(numValue);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [value, initialValue, isSaving, onSave, onCancel, min, max]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSave, onCancel]
  );

  const handleBlur = useCallback(() => {
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 150);
  }, [handleSave]);

  return (
    <Input
      ref={inputRef}
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={isSaving}
      min={min}
      max={max}
      step={step}
      className={cn(
        'h-7 px-2 text-sm',
        isSaving && 'opacity-50',
        className
      )}
    />
  );
}
