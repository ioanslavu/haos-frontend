import { useState } from 'react';
import { Plus, Trash2, Pencil, X, GripVertical, Type, Hash, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import type { TaskCustomField, CustomFieldType, CreateCustomFieldDto, UpdateCustomFieldDto } from '@/api/types/customFields';
import {
  useTaskCustomFields,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
} from '@/api/hooks/useCustomFields';

// Helper function to format custom field values for display
const formatCustomFieldValue = (field: TaskCustomField): string => {
  const value = field.display_value;

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  switch (field.field_type) {
    case 'number':
      return new Intl.NumberFormat().format(Number(value));
    case 'text':
    case 'single_select':
      return String(value);
    default:
      return String(value);
  }
};

// Helper function to get icon for field type
const getFieldTypeIcon = (type: CustomFieldType) => {
  switch (type) {
    case 'text':
      return <Type className="w-4 h-4" />;
    case 'number':
      return <Hash className="w-4 h-4" />;
    case 'single_select':
      return <List className="w-4 h-4" />;
  }
};

// ===== OptionsEditor Component =====
interface OptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
}

const OptionsEditor = ({ options, onChange }: OptionsEditorProps) => {
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    const trimmed = newOption.trim();
    if (trimmed && !options.includes(trimmed)) {
      onChange([...options, trimmed]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>Options</Label>

      {/* Existing options */}
      <div className="space-y-1">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input value={option} disabled className="flex-1 text-sm" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => removeOption(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new option */}
      <div className="flex items-center gap-2">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="New option..."
          className="flex-1 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addOption();
            }
          }}
        />
        <Button type="button" onClick={addOption} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// ===== CustomFieldInput Component =====
interface CustomFieldInputProps {
  type: CustomFieldType;
  value: any;
  options?: string[];
  onChange: (value: any) => void;
  onSave?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

const CustomFieldInput = ({
  type,
  value,
  options,
  onChange,
  onSave,
  onCancel,
  placeholder,
}: CustomFieldInputProps) => {
  switch (type) {
    case 'text':
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSave) onSave();
            if (e.key === 'Escape' && onCancel) onCancel();
          }}
          className="h-8 text-sm"
        />
      );

    case 'number':
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSave) onSave();
            if (e.key === 'Escape' && onCancel) onCancel();
          }}
          className="h-8 text-sm"
        />
      );

    case 'single_select':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={placeholder || 'Select an option...'} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return null;
  }
};

// ===== CustomFieldRow Component =====
interface CustomFieldRowProps {
  field: TaskCustomField;
  editable: boolean;
  onUpdate: (data: UpdateCustomFieldDto) => void;
  onDelete: () => void;
}

const CustomFieldRow = ({ field, editable, onUpdate, onDelete }: CustomFieldRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.display_value);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSave = () => {
    onUpdate({ value: editValue as string | number });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(field.display_value);
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group">
        {/* Drag handle (visual only for now) */}
        {editable && (
          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
        )}

        {/* Field type icon */}
        <div className="text-muted-foreground">{getFieldTypeIcon(field.field_type)}</div>

        {/* Field name */}
        <span className="text-sm font-medium text-muted-foreground min-w-[120px]">
          {field.field_name}:
        </span>

        {/* Value (editable or display) */}
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <CustomFieldInput
              type={field.field_type}
              value={editValue}
              options={field.select_options}
              onChange={setEditValue}
              onSave={handleSave}
              onCancel={handleCancel}
            />
            <Button variant="ghost" size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <span className="text-sm flex-1">{formatCustomFieldValue(field)}</span>
        )}

        {/* Actions */}
        {editable && !isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete custom field?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{field.field_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ===== AddCustomFieldForm Component =====
interface AddCustomFieldFormProps {
  taskId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddCustomFieldForm = ({ taskId, onSuccess, onCancel }: AddCustomFieldFormProps) => {
  const createMutation = useCreateCustomField();

  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldType>('text');
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [initialValue, setInitialValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fieldName.trim()) {
      return;
    }

    const data: CreateCustomFieldDto = {
      task: taskId,
      field_name: fieldName.trim(),
      field_type: fieldType,
      select_options: fieldType === 'single_select' ? selectOptions : undefined,
      value: initialValue || undefined,
    };

    createMutation.mutate(
      { taskId, data },
      {
        onSuccess: () => {
          setFieldName('');
          setFieldType('text');
          setSelectOptions([]);
          setInitialValue('');
          onSuccess();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-3 bg-muted/30">
      {/* Field Name */}
      <div className="space-y-1.5">
        <Label className="text-sm">Field Name</Label>
        <Input
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          placeholder="e.g., Client Budget"
          autoFocus
          maxLength={100}
          className="text-sm"
          required
        />
      </div>

      {/* Field Type */}
      <div className="space-y-1.5">
        <Label className="text-sm">Field Type</Label>
        <Select
          value={fieldType}
          onValueChange={(value) => setFieldType(value as CustomFieldType)}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="single_select">Single Select</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Options (for single_select) */}
      {fieldType === 'single_select' && (
        <OptionsEditor options={selectOptions} onChange={setSelectOptions} />
      )}

      {/* Initial Value */}
      <div className="space-y-1.5">
        <Label className="text-sm">Initial Value (optional)</Label>
        <CustomFieldInput
          type={fieldType}
          value={initialValue}
          options={selectOptions}
          onChange={setInitialValue}
          placeholder="Leave blank to set later"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={
            createMutation.isPending ||
            !fieldName.trim() ||
            (fieldType === 'single_select' && selectOptions.length === 0)
          }
        >
          {createMutation.isPending ? 'Adding...' : 'Add Field'}
        </Button>
      </div>
    </form>
  );
};

// ===== Main CustomFieldsList Component =====
interface CustomFieldsListProps {
  taskId: number;
  editable: boolean;
}

export const CustomFieldsList = ({ taskId, editable }: CustomFieldsListProps) => {
  const [isAddingField, setIsAddingField] = useState(false);

  const { data: fields = [] } = useTaskCustomFields(taskId);
  const updateMutation = useUpdateCustomField();
  const deleteMutation = useDeleteCustomField();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Custom Fields</h3>
        {editable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingField(true)}
            disabled={fields.length >= 20}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Field
          </Button>
        )}
      </div>

      {/* Existing fields */}
      {fields.length > 0 && (
        <div className="space-y-1">
          {fields.map((field) => (
            <CustomFieldRow
              key={field.id}
              field={field}
              editable={editable}
              onUpdate={(data) => updateMutation.mutate({ id: field.id, data })}
              onDelete={() => deleteMutation.mutate({ id: field.id, taskId })}
            />
          ))}
        </div>
      )}

      {/* Add new field form */}
      {isAddingField && (
        <AddCustomFieldForm
          taskId={taskId}
          onSuccess={() => setIsAddingField(false)}
          onCancel={() => setIsAddingField(false)}
        />
      )}

      {/* Empty state */}
      {fields.length === 0 && !isAddingField && (
        <p className="text-sm text-muted-foreground italic py-2">
          No custom fields yet.
          {editable && " Click 'Add Field' to create one."}
        </p>
      )}

      {/* Max fields warning */}
      {fields.length >= 20 && (
        <p className="text-xs text-muted-foreground">
          Maximum of 20 custom fields reached.
        </p>
      )}
    </div>
  );
};
