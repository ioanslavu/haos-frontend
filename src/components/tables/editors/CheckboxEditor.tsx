import { useState, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface CheckboxEditorProps {
  value: boolean;
  onSave: (value: boolean) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function CheckboxEditor({
  value: initialValue,
  onSave,
  onCancel,
  className,
}: CheckboxEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = useCallback(async (checked: boolean) => {
    if (isSaving) return;

    if (checked === initialValue) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(checked);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [initialValue, isSaving, onSave]);

  return (
    <Checkbox
      checked={initialValue}
      onCheckedChange={handleChange}
      disabled={isSaving}
      className={cn(
        isSaving && 'opacity-50',
        className
      )}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
    />
  );
}
