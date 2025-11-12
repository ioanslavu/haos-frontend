import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useCreateEntityRequest } from '@/api/hooks/useEntityRequests';
import { EntityRequestType } from '@/api/types/entityRequests';
import { AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const entityRequestFormSchema = z.object({
  message: z
    .string()
    .min(10, 'Please provide at least 10 characters explaining your request')
    .max(1000, 'Message must be 1000 characters or less'),
});

type EntityRequestFormData = z.infer<typeof entityRequestFormSchema>;

interface EntityRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: {
    id: number;
    display_name: string;
  };
  requestType: EntityRequestType;
}

export function EntityRequestDialog({
  open,
  onOpenChange,
  entity,
  requestType,
}: EntityRequestDialogProps) {
  const createEntityRequest = useCreateEntityRequest();

  const form = useForm<EntityRequestFormData>({
    resolver: zodResolver(entityRequestFormSchema),
    defaultValues: {
      message: '',
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        message: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (data: EntityRequestFormData) => {
    try {
      await createEntityRequest.mutateAsync({
        entity: entity.id,
        request_type: requestType,
        message: data.message,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error('Failed to create entity request:', error);
    }
  };

  const title =
    requestType === 'edit'
      ? `Request to Edit ${entity.display_name}`
      : `Request to Delete ${entity.display_name}`;

  const description =
    requestType === 'edit'
      ? 'Explain what changes you need to make to this entity. An admin will review your request.'
      : 'Explain why this entity should be deleted. An admin will review your request.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {requestType === 'edit' ? (
              <Pencil className="h-5 w-5" />
            ) : (
              <Trash2 className="h-5 w-5 text-destructive" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your request will be sent to all administrators who will receive a
            notification. You can track the status of your request and see any admin
            notes once it's reviewed.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Explanation{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        requestType === 'edit'
                          ? 'Describe what needs to be changed and why...\n\nExample: I need to update the contact phone number because the artist changed their primary number. The new number is +1234567890.'
                          : 'Explain why this entity should be deleted...\n\nExample: This is a duplicate entry for the same artist. The correct entry is Entity #123.'
                      }
                      className="resize-none min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide detailed information to help admins understand and process
                    your request (minimum 10 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createEntityRequest.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEntityRequest.isPending}
                variant={requestType === 'delete' ? 'destructive' : 'default'}
              >
                {createEntityRequest.isPending
                  ? 'Submitting...'
                  : `Submit ${requestType === 'edit' ? 'Edit' : 'Delete'} Request`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
