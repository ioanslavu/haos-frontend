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
import { Separator } from '@/components/ui/separator';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';
import { useCreateTask, useUpdateTask } from '@/api/hooks/useTasks';
import { useCampaigns } from '@/api/hooks/useCampaigns';
import { useUsersList } from '@/api/hooks/useUsers';
import { useAuthStore } from '@/stores/authStore';
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
import { CalendarIcon, X, UserPlus, Users } from 'lucide-react';
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

  // Get current user
  const currentUser = useAuthStore((state) => state.user);

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
                      onValueChange={field.onChange}
                      placeholder="Search for a client..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Assigned Users (Multiple) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assign To (Optional)
                  </FormLabel>
                  <FormDescription className="text-xs mt-1">
                    Assign this task to one or more team members
                  </FormDescription>
                </div>
                <div className="flex gap-2">
                  {currentUser && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = form.getValues('assigned_to_users') || [];
                        if (!current.includes(Number(currentUser.id))) {
                          form.setValue('assigned_to_users', [...current, Number(currentUser.id)]);
                        }
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Me
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = form.getValues('assigned_to_users') || [];
                      form.setValue('assigned_to_users', [...current, undefined as any]);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add User
                  </Button>
                </div>
              </div>

              {((form.watch('assigned_to_users') as any[]) || []).length > 0 && (
                <div className="space-y-2">
                  {((form.watch('assigned_to_users') as any[]) || []).map((_, index) => (
                    <div
                      key={index}
                      className="flex gap-2 items-start border rounded-md p-3 bg-muted/30"
                    >
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`assigned_to_users.${index}` as any}
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={(value) => {
                                  const current = form.getValues('assigned_to_users') || [];
                                  const newValue = [...current];
                                  newValue[index] = Number(value);
                                  form.setValue('assigned_to_users', newValue);
                                }}
                                value={field.value ? field.value.toString() : ''}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select user" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users.length > 0 ? (
                                    users.map((user: any) => (
                                      <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.full_name || user.email}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="no-users" disabled>
                                      No users available
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const current = form.getValues('assigned_to_users') || [];
                          const newValue = current.filter((_, i) => i !== index);
                          form.setValue('assigned_to_users', newValue);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {((form.watch('assigned_to_users') as any[]) || []).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-muted/20">
                  No users assigned yet. Click "Add User" to assign team members.
                </div>
              )}
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? field.value.split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminder_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Reminder (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? field.value.split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                      />
                    </FormControl>
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
