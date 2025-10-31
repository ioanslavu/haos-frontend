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
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';
import { useCreateTask, useUpdateTask } from '@/api/hooks/useTasks';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { useUsersList } from '@/api/hooks/useUsers';
import {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TASK_STATUS_CHOICES,
  TASK_PRIORITY_CHOICES,
  TASK_TAG_CHOICES,
  TASK_TYPE_CHOICES,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TAG_LABELS,
  TASK_TYPE_LABELS,
} from '@/api/types/tasks';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  task_type: z.enum(TASK_TYPE_CHOICES as [string, ...string[]]).default('general'),
  status: z.enum(TASK_STATUS_CHOICES as [string, ...string[]]).default('todo'),
  priority: z.number().min(1).max(4).default(2),
  tag: z.enum(TASK_TAG_CHOICES as [string, ...string[]]).optional(),
  campaign: z.number().optional(),
  entity: z.number().optional(),
  assigned_to_users: z.array(z.number()).optional(),
  due_date: z.string().optional(),
  reminder_date: z.string().optional(),
  estimated_hours: z.number().optional(),
  actual_hours: z.number().optional(),
  notes: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultCampaign?: number;
  defaultEntity?: number;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultCampaign,
  defaultEntity,
}: TaskFormDialogProps) {
  const isEdit = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  // Fetch digital department users
  const { data: usersData } = useUsersList({ department: 'digital' });
  const users = usersData?.results || [];

  // Fetch campaigns for combobox
  const { data: campaignsData } = useCampaigns({ limit: 100 });
  const campaigns = campaignsData?.results || [];

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      task_type: 'general',
      status: 'todo',
      priority: 2,
      tag: undefined,
      campaign: defaultCampaign,
      entity: defaultEntity,
      assigned_to_users: [],
      due_date: undefined,
      reminder_date: undefined,
      estimated_hours: undefined,
      actual_hours: undefined,
      notes: '',
    },
  });

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open && task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        task_type: task.task_type,
        status: task.status,
        priority: task.priority,
        tag: task.tag,
        campaign: task.campaign,
        entity: task.entity,
        assigned_to_users: task.assigned_to_users || [],
        due_date: task.due_date,
        reminder_date: task.reminder_date,
        estimated_hours: task.estimated_hours,
        actual_hours: task.actual_hours,
        notes: task.notes || '',
      });
    } else if (open && !task) {
      form.reset({
        title: '',
        description: '',
        task_type: 'general',
        status: 'todo',
        priority: 2,
        tag: undefined,
        campaign: defaultCampaign,
        entity: defaultEntity,
        assigned_to_users: [],
        due_date: undefined,
        reminder_date: undefined,
        estimated_hours: undefined,
        actual_hours: undefined,
        notes: '',
      });
    }
  }, [open, task, defaultCampaign, defaultEntity, form]);

  const onSubmit = async (values: TaskFormValues) => {
    try {
      if (isEdit && task) {
        await updateTask.mutateAsync({
          id: task.id,
          data: values as TaskUpdateInput,
        });
      } else {
        await createTask.mutateAsync(values as TaskCreateInput);
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const selectedUsers = form.watch('assigned_to_users') || [];

  const toggleUser = (userId: number) => {
    const current = form.getValues('assigned_to_users') || [];
    if (current.includes(userId)) {
      form.setValue(
        'assigned_to_users',
        current.filter((id) => id !== userId)
      );
    } else {
      form.setValue('assigned_to_users', [...current, userId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update task details' : 'Create a new task for the digital department'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Task description and details..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row: Type, Status, Priority, Tag */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="task_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_TYPE_CHOICES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {TASK_TYPE_LABELS[type]}
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
                        {TASK_STATUS_CHOICES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {TASK_STATUS_LABELS[status]}
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
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_PRIORITY_CHOICES.map((priority) => (
                          <SelectItem key={priority} value={priority.toString()}>
                            {TASK_PRIORITY_LABELS[priority]}
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
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tag (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {TASK_TAG_CHOICES.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {TASK_TAG_LABELS[tag]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campaign Selection */}
            <FormField
              control={form.control}
              name="campaign"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign (optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? undefined : parseInt(value))}
                    value={field.value?.toString() || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No campaign</SelectItem>
                      {campaigns.map((campaign: any) => (
                        <SelectItem key={campaign.id} value={campaign.id.toString()}>
                          {campaign.campaign_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client/Entity Selection */}
            <FormField
              control={form.control}
              name="entity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client (optional)</FormLabel>
                  <FormControl>
                    <EntitySearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search for a client..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assigned Users (Multiple) */}
            <FormField
              control={form.control}
              name="assigned_to_users"
              render={() => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <FormDescription>Select one or more users</FormDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {users.map((user: any) => (
                      <Badge
                        key={user.id}
                        variant={selectedUsers.includes(user.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleUser(user.id)}
                      >
                        {user.full_name || user.email}
                        {selectedUsers.includes(user.id) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            field.onChange(date ? date.toISOString() : undefined)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminder_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Follow-up Reminder (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            field.onChange(date ? date.toISOString() : undefined)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Time Tracking */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimated_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEdit && (
                <FormField
                  control={form.control}
                  name="actual_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
                {(createTask.isPending || updateTask.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
