import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  type?: 'text' | 'textarea';
  placeholder?: string;
  className?: string;
  editClassName?: string;
  displayClassName?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  showEditIcon?: boolean;
  alwaysShowEdit?: boolean;
}

export function InlineEditableField({
  value,
  onSave,
  type = 'text',
  placeholder = 'Click to edit...',
  className = '',
  editClassName = '',
  displayClassName = '',
  multiline = false,
  autoFocus = false,
  showEditIcon = true,
  alwaysShowEdit = false,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text') {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, type]);

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn('relative group', className)}>
        {multiline || type === 'textarea' ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder={placeholder}
            className={cn(
              'min-h-[100px] resize-none transition-all duration-200',
              'focus:ring-2 focus:ring-primary/20 focus:border-primary',
              editClassName
            )}
            disabled={isSaving}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder={placeholder}
            className={cn(
              'transition-all duration-200',
              'focus:ring-2 focus:ring-primary/20 focus:border-primary',
              editClassName
            )}
            disabled={isSaving}
          />
        )}
        {multiline && (
          <div className="mt-1 text-xs text-muted-foreground">
            Press Cmd/Ctrl+Enter to save, Esc to cancel
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative cursor-text transition-all duration-200 rounded-md',
        'hover:bg-accent/50 hover:px-2 hover:-mx-2 py-1',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsEditing(true)}
    >
      <div className={cn('flex items-start gap-2', displayClassName)}>
        <div className="flex-1">
          {value ? (
            <span className={cn(multiline && 'whitespace-pre-wrap')}>{value}</span>
          ) : (
            <span className="text-muted-foreground italic">{placeholder}</span>
          )}
        </div>
        {showEditIcon && (isHovered || alwaysShowEdit) && (
          <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
}
