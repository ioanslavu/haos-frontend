import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TaskInputFields } from './TaskInputFields';
import { CheckCircle2, Send } from 'lucide-react';
import { useTask, useTaskInputFields, useSubmitTaskForReview, useUpdateTask } from '@/api/hooks/useTasks';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  needs_review?: boolean;
}

interface TaskCompletionModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCompletionModal({ task, open, onOpenChange }: TaskCompletionModalProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch input field templates for this task
  const { data: inputFields } = useTaskInputFields(task?.id);

  // Fetch existing input values (if task was previously submitted)
  const { data: taskData } = useTask(task?.id || 0);
  const existingValues = taskData?.input_values;

  // Mutations
  const submitForReviewMutation = useSubmitTaskForReview();
  const updateTaskMutation = useUpdateTask();

  // Populate form with existing values
  useEffect(() => {
    if (existingValues && existingValues.length > 0) {
      const values: Record<string, any> = {};
      existingValues.forEach((inputValue: any) => {
        values[inputValue.field_template.field_name] = inputValue.value;
      });
      setFormValues(values);
    }
  }, [existingValues]);

  const hasInputFields = (inputFields?.length || 0) > 0;
  const requiresReview = !!(taskData?.needs_review ?? task?.needs_review);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    inputFields?.forEach((field: any) => {
      if (field.required && !formValues[field.field_name]) {
        newErrors[field.field_name] = `${field.field_label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!task) return;

    if (hasInputFields && !validateForm()) {
      return;
    }

    if (requiresReview) {
      // Prepare input values payload
      const inputValuesPayload = inputFields?.map((field: any) => {
        const value = formValues[field.field_name];
        const payload: any = {
          field_template: field.id,
        };

        // Map value to appropriate field based on type
        switch (field.field_type) {
          case 'text':
          case 'textarea':
          case 'url':
          case 'select':
            payload.value_text = value || '';
            break;
          case 'number':
            payload.value_number = value || 0;
            break;
          case 'checkbox':
            payload.value_boolean = !!value;
            break;
          case 'date':
            payload.value_date = value || null;
            break;
          case 'file_upload':
            payload.value_text = value?.name || value || '';
            break;
        }

        return payload;
      }) || [];

      submitForReviewMutation.mutate(
        { taskId: task.id, inputValues: inputValuesPayload },
        {
          onSuccess: () => {
            onOpenChange(false);
            setFormValues({});
          },
        }
      );
    } else {
      updateTaskMutation.mutate(
        { id: task.id, data: { status: 'done' } },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            {task.description || 'Complete this task'}
            {requiresReview && (
              <span className="block mt-2 text-orange-600 font-medium">
                ⚠️ This task requires manager review
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {hasInputFields && inputFields && inputFields.length > 0 ? (
            <TaskInputFields
              fields={inputFields}
              values={formValues}
              onChange={handleFieldChange}
              errors={errors}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No input fields required for this task.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitForReviewMutation.isPending || updateTaskMutation.isPending}
          >
            {submitForReviewMutation.isPending || updateTaskMutation.isPending ? (
              'Processing...'
            ) : requiresReview ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
