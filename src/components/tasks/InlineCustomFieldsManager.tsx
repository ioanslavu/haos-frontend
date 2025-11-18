import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Plus, Type, Hash, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { InlineCustomField } from './InlineCustomField';
import type { CustomFieldType, CreateCustomFieldDto, UpdateCustomFieldDto } from '@/api/types/customFields';
import {
  useTaskCustomFields,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
} from '@/api/hooks/useCustomFields';

interface InlineCustomFieldsManagerProps {
  taskId: number;
}

export interface InlineCustomFieldsManagerHandle {
  flushPendingChanges: () => Promise<void>;
  hasPendingChanges: () => boolean;
}

export const InlineCustomFieldsManager = forwardRef<InlineCustomFieldsManagerHandle, InlineCustomFieldsManagerProps>(
  ({ taskId }, ref) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CustomFieldType | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  // Track pending changes for all fields
  const pendingChangesRef = useRef<Map<number, string | number>>(new Map());

  const { data: fieldsData, isLoading, error } = useTaskCustomFields(taskId);
  const createMutation = useCreateCustomField();
  const updateMutation = useUpdateCustomField();
  const deleteMutation = useDeleteCustomField();

  // Handle both array and paginated responses from API
  const fields = Array.isArray(fieldsData)
    ? fieldsData
    : fieldsData?.results
    ? fieldsData.results
    : [];

  // Handle pending change from child fields
  const handlePendingChange = useCallback((fieldId: number, value: string | number | null) => {
    if (value === null) {
      pendingChangesRef.current.delete(fieldId);
    } else {
      pendingChangesRef.current.set(fieldId, value);
    }
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    hasPendingChanges: () => pendingChangesRef.current.size > 0,
    flushPendingChanges: async () => {
      const pending = Array.from(pendingChangesRef.current.entries());
      if (pending.length === 0) return;

      // Save all pending changes
      const promises = pending.map(([fieldId, value]) => {
        return new Promise<void>((resolve) => {
          updateMutation.mutate(
            { id: fieldId, data: { value }, taskId },
            { onSettled: () => resolve() }
          );
        });
      });

      // Clear pending changes
      pendingChangesRef.current.clear();

      // Wait for all to complete
      await Promise.all(promises);
    },
  }), [updateMutation, taskId]);

  const propertyTypes: Array<{
    type: CustomFieldType;
    label: string;
    icon: React.ReactNode;
  }> = [
    { type: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
    { type: 'number', label: 'Number', icon: <Hash className="h-4 w-4" /> },
    { type: 'single_select', label: 'Select', icon: <List className="h-4 w-4" /> },
  ];

  const handleTypeSelect = (type: CustomFieldType) => {
    setSelectedType(type);
  };

  const handleCreate = () => {
    if (!selectedType || !fieldName.trim()) return;

    // Auto-add any pending option that wasn't explicitly added
    let finalOptions = selectOptions;
    if (selectedType === 'single_select' && newOption.trim() && !selectOptions.includes(newOption.trim())) {
      finalOptions = [...selectOptions, newOption.trim()];
    }

    const data: CreateCustomFieldDto = {
      task: taskId,
      field_name: fieldName.trim(),
      field_type: selectedType,
      select_options: selectedType === 'single_select' ? finalOptions : undefined,
    };

    createMutation.mutate(
      { taskId, data },
      {
        onSuccess: () => {
          // Reset form
          setSelectedType(null);
          setFieldName('');
          setSelectOptions([]);
          setNewOption('');
          setPopoverOpen(false);
        },
      }
    );
  };

  const addOption = () => {
    if (newOption.trim() && !selectOptions.includes(newOption.trim())) {
      setSelectOptions([...selectOptions, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setSelectOptions(selectOptions.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setSelectedType(null);
    setFieldName('');
    setSelectOptions([]);
    setNewOption('');
    setPopoverOpen(false);
  };

  return (
    <>
      {/* Existing custom fields */}
      {fields.map((field) => (
        <InlineCustomField
          key={field.id}
          field={field}
          onUpdate={(data) => {
            updateMutation.mutate({ id: field.id, data, taskId });
          }}
          onUpdateName={(name) => {
            updateMutation.mutate({ id: field.id, data: { field_name: name }, taskId });
          }}
          onDelete={() => deleteMutation.mutate({ id: field.id, taskId })}
          onPendingChange={handlePendingChange}
        />
      ))}

      {/* Add property button */}
      {fields.length < 20 && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground justify-start pl-2 -ml-2"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add property
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-background border-border" align="start">
            {!selectedType ? (
              /* Type selection */
              <div className="p-1">
                {propertyTypes.map((propType) => (
                  <button
                    key={propType.type}
                    onClick={() => handleTypeSelect(propType.type)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded transition-colors"
                  >
                    {propType.icon}
                    <span>{propType.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* Field name input */
              <div className="p-3 space-y-3">
                <div className="space-y-1.5">
                  <Input
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="Property name"
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && fieldName.trim()) {
                        if (selectedType !== 'single_select' || selectOptions.length > 0) {
                          handleCreate();
                        }
                      }
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                </div>

                {/* Options editor for single_select */}
                {selectedType === 'single_select' && (
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground">Options</div>
                    {selectOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <Input value={option} disabled className="h-7 text-sm flex-1" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeOption(index)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <Input
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        placeholder="Add option..."
                        className="h-7 text-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addOption();
                          }
                        }}
                      />
                      <Button variant="outline" size="sm" className="h-7" onClick={addOption}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="h-7" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7"
                    onClick={handleCreate}
                    disabled={
                      !fieldName.trim() ||
                      (selectedType === 'single_select' && selectOptions.length === 0) ||
                      createMutation.isPending
                    }
                  >
                    Create
                  </Button>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
});

InlineCustomFieldsManager.displayName = 'InlineCustomFieldsManager';
