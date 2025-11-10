/**
 * Request Approval Modal
 * For requesting client approvals on deliverables or stages
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateApproval } from '@/api/hooks/useOpportunities';
import { toast } from 'sonner';

const approvalSchema = z.object({
  stage: z.string().min(1, 'Stage is required'),
  version: z.number().default(1),
  notes: z.string().optional(),
  file_url: z.string().url().optional().or(z.literal('')),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

const APPROVAL_STAGES = [
  { value: 'concept', label: 'Concept' },
  { value: 'script', label: 'Script' },
  { value: 'storyboard', label: 'Storyboard' },
  { value: 'rough_cut', label: 'Rough Cut' },
  { value: 'final_cut', label: 'Final Cut' },
  { value: 'caption', label: 'Caption/Copy' },
  { value: 'static_kv', label: 'Static Key Visual' },
  { value: 'usage_extension', label: 'Usage Extension Request' },
  { value: 'other', label: 'Other' },
];

interface ApprovalRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: number;
}

export function ApprovalRequestModal({ open, onOpenChange, opportunityId }: ApprovalRequestModalProps) {
  const createMutation = useCreateApproval();

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      stage: '',
      version: 1,
      notes: '',
      file_url: '',
    },
  });

  const onSubmit = async (data: ApprovalFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        opportunity: opportunityId,
        status: 'pending',
      });
      onOpenChange(false);
      form.reset();
      toast.success('Approval request created');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create approval request');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Approval</DialogTitle>
          <DialogDescription>
            Submit deliverables or content for client approval
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approval Stage *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select approval stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APPROVAL_STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    What type of approval is needed?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Version</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    Version number of the content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://drive.google.com/... or https://dropbox.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to file on Google Drive, Dropbox, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any context or instructions for the approver..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Approval
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
