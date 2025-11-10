/**
 * Approval Action Modal
 * Modern modal for approve/reject/request changes actions
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const approvalActionSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
});

const approvalActionOptionalSchema = z.object({
  notes: z.string().optional(),
});

type ApprovalActionFormData = z.infer<typeof approvalActionSchema>;
type ApprovalActionOptionalFormData = z.infer<typeof approvalActionOptionalSchema>;

type ActionType = 'approve' | 'reject' | 'request_changes';

interface ApprovalActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: ActionType;
  onSubmit: (notes?: string) => Promise<void>;
  isPending: boolean;
}

const ACTION_CONFIG = {
  approve: {
    title: 'Approve',
    description: 'Approve this deliverable or content',
    submitLabel: 'Approve',
    submitVariant: 'default' as const,
    notesLabel: 'Approval Notes (optional)',
    notesPlaceholder: 'Add any comments or feedback...',
    required: false,
  },
  reject: {
    title: 'Reject',
    description: 'Reject this approval request',
    submitLabel: 'Reject',
    submitVariant: 'destructive' as const,
    notesLabel: 'Rejection Reason *',
    notesPlaceholder: 'Why is this being rejected?',
    required: true,
  },
  request_changes: {
    title: 'Request Changes',
    description: 'Request changes to this deliverable',
    submitLabel: 'Request Changes',
    submitVariant: 'outline' as const,
    notesLabel: 'Change Notes *',
    notesPlaceholder: 'What changes are needed?',
    required: true,
  },
};

export function ApprovalActionModal({
  open,
  onOpenChange,
  actionType,
  onSubmit,
  isPending,
}: ApprovalActionModalProps) {
  const config = ACTION_CONFIG[actionType];

  const form = useForm<ApprovalActionFormData | ApprovalActionOptionalFormData>({
    resolver: zodResolver(
      config.required ? approvalActionSchema : approvalActionOptionalSchema
    ),
    defaultValues: {
      notes: '',
    },
  });

  const handleSubmit = async (data: ApprovalActionFormData | ApprovalActionOptionalFormData) => {
    await onSubmit(data.notes);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{config.notesLabel}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={config.notesPlaceholder}
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  {!config.required && (
                    <FormDescription>
                      Optional feedback or comments
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" variant={config.submitVariant} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {config.submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
