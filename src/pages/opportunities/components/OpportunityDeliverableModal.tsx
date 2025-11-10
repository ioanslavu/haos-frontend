/**
 * Add Deliverable Modal for Opportunities
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
import { useCreateOpportunityDeliverable } from '@/api/hooks/useOpportunities';

const deliverableSchema = z.object({
  deliverable_type: z.string().min(1, 'Type is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  description: z.string().optional(),
  due_date: z.string().optional().nullable(),
  status: z.string(),
});

type DeliverableFormData = z.infer<typeof deliverableSchema>;

const DELIVERABLE_TYPES = [
  { value: 'ig_post', label: 'Instagram Post' },
  { value: 'ig_story', label: 'Instagram Story' },
  { value: 'ig_reel', label: 'Instagram Reel' },
  { value: 'tiktok_video', label: 'TikTok Video' },
  { value: 'youtube_video', label: 'YouTube Video' },
  { value: 'youtube_short', label: 'YouTube Short' },
  { value: 'tvc', label: 'TV Commercial' },
  { value: 'radio_spot', label: 'Radio Spot' },
  { value: 'event', label: 'Event Appearance' },
  { value: 'ooh', label: 'Out of Home (OOH)' },
  { value: 'billboard', label: 'Billboard' },
  { value: 'packaging', label: 'Product Packaging' },
  { value: 'print_ad', label: 'Print Advertisement' },
  { value: 'digital_banner', label: 'Digital Banner' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'livestream', label: 'Livestream' },
  { value: 'other', label: 'Other' },
];

const DELIVERABLE_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'revision_requested', label: 'Revision Requested' },
  { value: 'completed', label: 'Completed' },
];

interface OpportunityDeliverableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: number;
}

export function OpportunityDeliverableModal({ open, onOpenChange, opportunityId }: OpportunityDeliverableModalProps) {
  const createDeliverable = useCreateOpportunityDeliverable();

  const form = useForm<DeliverableFormData>({
    resolver: zodResolver(deliverableSchema),
    defaultValues: {
      deliverable_type: 'ig_post',
      quantity: 1,
      description: '',
      due_date: '',
      status: 'planned',
    },
  });

  const onSubmit = async (data: DeliverableFormData) => {
    await createDeliverable.mutateAsync({
      ...data,
      opportunity: opportunityId,
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Deliverable</DialogTitle>
          <DialogDescription>
            Add a deliverable to track for this opportunity
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deliverable_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DELIVERABLE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deliverable details..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DELIVERABLE_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createDeliverable.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createDeliverable.isPending}>
                {createDeliverable.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Deliverable
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
