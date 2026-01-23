/**
 * Add Task Modal for Campaigns
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
import { useCreateCampaignTask } from '@/api/hooks/useCampaigns';
import { useDepartmentUsers } from '@/api/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  task_type: z.string(),
  priority: z.string(),
  assigned_to: z.number().optional().nullable(),
  due_date: z.string().optional().nullable(),
});

type TaskFormData = z.infer<typeof taskSchema>;

// Campaign-specific task types based on CampaignTask model
const TASK_TYPES: { value: string; label: string }[] = [
  // Planning
  { value: 'strategy_planning', label: 'Strategy Planning' },
  { value: 'budget_planning', label: 'Budget Planning' },
  { value: 'timeline_creation', label: 'Timeline Creation' },
  // Content
  { value: 'content_creation', label: 'Content Creation' },
  { value: 'content_review', label: 'Content Review' },
  { value: 'asset_delivery', label: 'Asset Delivery' },
  // Platform
  { value: 'platform_setup', label: 'Platform Setup' },
  { value: 'ad_creation', label: 'Ad Creation' },
  { value: 'targeting_setup', label: 'Targeting Setup' },
  // Execution
  { value: 'campaign_launch', label: 'Campaign Launch' },
  { value: 'optimization', label: 'Optimization' },
  { value: 'reporting', label: 'Reporting' },
  // Client
  { value: 'client_meeting', label: 'Client Meeting' },
  { value: 'client_approval', label: 'Client Approval' },
  { value: 'feedback_implementation', label: 'Feedback Implementation' },
  // Financial
  { value: 'invoice_creation', label: 'Invoice Creation' },
  { value: 'payment_followup', label: 'Payment Follow-up' },
  // General
  { value: 'review', label: 'Review' },
  { value: 'approval', label: 'Approval' },
  { value: 'other', label: 'Other' },
];

const TASK_PRIORITIES: { value: string; label: string }[] = [
  { value: '1', label: 'Low' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'High' },
  { value: '4', label: 'Urgent' },
];

interface CampaignTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: number;
  subcampaignId?: number;
}

export function CampaignTaskModal({ open, onOpenChange, campaignId, subcampaignId }: CampaignTaskModalProps) {
  const { user } = useAuthStore();
  const { data: departmentUsers } = useDepartmentUsers(user?.department?.id);
  const createMutation = useCreateCampaignTask();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      task_type: 'other',
      priority: '2',
      assigned_to: user?.id || null,
      due_date: '',
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        priority: parseInt(data.priority),
        campaign: campaignId,
        subcampaign: subcampaignId,
      });
      onOpenChange(false);
      form.reset();
      toast.success('Task created successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create task');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Campaign Task</DialogTitle>
          <DialogDescription>
            Create a new task for this campaign
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Review campaign assets" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Task details..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="task_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_TYPES.map((type) => (
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigned_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                      value={field.value?.toString() || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentUsers?.results?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.full_name}
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
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
