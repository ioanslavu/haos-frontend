import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TextEditorProps {
  value: string;
  onSave: (value: string | null) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function TextEditor({
  value: initialValue,
  onSave,
  onCancel,
  placeholder = 'Enter value...',
  className,
  autoFocus = true,
}: TextEditorProps) {
  const [value, setValue] = useState(initialValue || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const trimmedValue = value.trim();
    if (trimmedValue === initialValue) {
      onCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmedValue || null);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [value, initialValue, isSaving, onSave, onCancel]);

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
    // Debounce to allow click events to fire first
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 150);
  }, [handleSave]);

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={isSaving}
      className={cn(
        'h-7 px-2 text-sm',
        isSaving && 'opacity-50',
        className
      )}
    />
  );
}
