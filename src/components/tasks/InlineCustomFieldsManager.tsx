import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Plus, Type, Hash, List, X, Calendar, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { InlineCustomField } from './InlineCustomField';
import type {
  CustomFieldType,
  CreateProjectCustomFieldDefinitionDto,
  TaskFieldWithDefinition,
} from '@/api/types/customFields';
import {
  useProjectCustomFieldDefinitions,
  useCreateProjectCustomFieldDefinition,
  useTaskFieldsWithDefinitions,
  useUpdateTaskCustomFieldValue,
  useBulkUpdateTaskCustomFieldValues,
  useDeleteProjectCustomFieldDefinition,
} from '@/api/hooks/useCustomFields';
import { useQueryClient } from '@tanstack/react-query';

interface InlineCustomFieldsManagerProps {
  taskId: number;
  projectId?: number;
}

export interface InlineCustomFieldsManagerHandle {
  flushPendingChanges: () => Promise<void>;
  hasPendingChanges: () => boolean;
}

export const InlineCustomFieldsManager = forwardRef<InlineCustomFieldsManagerHandle, InlineCustomFieldsManagerProps>(
  ({ taskId, projectId }, ref) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CustomFieldType | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  // Track pending changes for all fields (keyed by value ID)
  const pendingChangesRef = useRef<Map<number, string | null>>(new Map());

  // Fetch project-level field definitions and task field values combined
  const { data: fieldsWithDefinitions = [], isLoading } = useTaskFieldsWithDefinitions(taskId);
  const { data: definitions = [] } = useProjectCustomFieldDefinitions(projectId);

  const queryClient = useQueryClient();
  const createDefinitionMutation = useCreateProjectCustomFieldDefinition();
  const updateValueMutation = useUpdateTaskCustomFieldValue();
  const bulkUpdateMutation = useBulkUpdateTaskCustomFieldValues();
  const deleteDefinitionMutation = useDeleteProjectCustomFieldDefinition();

  // Handle creating a new value (when no value record exists yet)
  const handleCreateValue = useCallback((definitionId: number, value: string | null) => {
    bulkUpdateMutation.mutate(
      {
        taskId,
        values: [{ field_definition_id: definitionId, value }],
      },
      {
        onSuccess: () => {
          // Refetch all relevant queries to sync modal and inline
          queryClient.refetchQueries({ queryKey: ['tasks', taskId, 'fieldsWithDefinitions'] });
          queryClient.refetchQueries({ queryKey: ['project-tasks'] });
        },
      }
    );
  }, [taskId, bulkUpdateMutation, queryClient]);

  // Handle pending change from child fields
  const handlePendingChange = useCallback((valueId: number, value: string | null) => {
    if (value === null) {
      pendingChangesRef.current.delete(valueId);
    } else {
      pendingChangesRef.current.set(valueId, value);
    }
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    hasPendingChanges: () => pendingChangesRef.current.size > 0,
    flushPendingChanges: async () => {
      const pending = Array.from(pendingChangesRef.current.entries());
      if (pending.length === 0) return;

      // Save all pending changes
      const promises = pending.map(([valueId, value]) => {
        return new Promise<void>((resolve) => {
          updateValueMutation.mutate(
            { taskId, valueId, data: { value } },
            { onSettled: () => resolve() }
          );
        });
      });

      // Clear pending changes
      pendingChangesRef.current.clear();

      // Wait for all to complete
      await Promise.all(promises);
    },
  }), [updateValueMutation, taskId]);

  const propertyTypes: Array<{
    type: CustomFieldType;
    label: string;
    icon: React.ReactNode;
  }> = [
    { type: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
    { type: 'number', label: 'Number', icon: <Hash className="h-4 w-4" /> },
    { type: 'single_select', label: 'Select', icon: <List className="h-4 w-4" /> },
    { type: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" /> },
    { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" /> },
  ];

  const handleTypeSelect = (type: CustomFieldType) => {
    setSelectedType(type);
  };

  const handleCreate = () => {
    if (!selectedType || !fieldName.trim() || !projectId) return;

    // Auto-add any pending option that wasn't explicitly added
    let finalOptions = selectOptions;
    if (selectedType === 'single_select' && newOption.trim() && !selectOptions.includes(newOption.trim())) {
      finalOptions = [...selectOptions, newOption.trim()];
    }

    const data: CreateProjectCustomFieldDefinitionDto = {
      field_name: fieldName.trim(),
      field_type: selectedType,
      select_options: selectedType === 'single_select' ? finalOptions : undefined,
      show_in_table: true,
    };

    createDefinitionMutation.mutate(
      { projectId, data },
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

  // Don't render if no project ID (can't manage project-level fields)
  if (!projectId) {
    return null;
  }

  return (
    <>
      {/* Existing custom fields from project definitions */}
      {fieldsWithDefinitions.map((fieldWithDef) => (
        <InlineCustomField
          key={fieldWithDef.definition.id}
          fieldWithDefinition={fieldWithDef}
          taskId={taskId}
          projectId={projectId}
          onUpdateValue={(valueId, value) => {
            updateValueMutation.mutate(
              { taskId, valueId, data: { value } },
              {
                onSuccess: () => {
                  // Refetch all relevant queries to sync modal and inline
                  queryClient.refetchQueries({ queryKey: ['tasks', taskId, 'fieldsWithDefinitions'] });
                  queryClient.refetchQueries({ queryKey: ['project-tasks'] });
                },
              }
            );
          }}
          onCreateValue={handleCreateValue}
          onDeleteDefinition={(definitionId) => {
            deleteDefinitionMutation.mutate({ projectId, id: definitionId });
          }}
          onPendingChange={handlePendingChange}
        />
      ))}

      {/* Add property button */}
      {definitions.length < 20 && (
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
                      createDefinitionMutation.isPending
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
