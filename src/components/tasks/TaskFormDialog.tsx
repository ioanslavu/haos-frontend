import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { useCreateTask, useUpdateTask, useTasks } from '@/api/hooks/useTasks'
import { useCampaigns } from '@/api/hooks/useCampaigns'
import { useUsersList } from '@/api/hooks/useUsers'
import { useAuthStore } from '@/stores/authStore'
import {
  Task,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
  TASK_STATUS_CHOICES,
  TASK_PRIORITY_CHOICES,
  TASK_TYPE_CHOICES,
} from '@/api/types/tasks'
import { CalendarIcon, Clock, Flag, AlertCircle, CheckCircle, User, Link } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().or(z.literal('')).nullable(),
  task_type: z.enum(TASK_TYPE_CHOICES as [string, ...string[]]).optional().nullable(),
  priority: z.number().min(1).max(4).optional().nullable(),
  status: z.enum(TASK_STATUS_CHOICES as [string, ...string[]]).optional().nullable(),
  due_date: z.date().optional().nullable(),
  estimated_hours: z.number().min(0).optional().nullable(),
  actual_hours: z.number().min(0).optional().nullable(),
  assigned_to: z.number().optional().nullable(),
  entity: z.number().optional().nullable(),
  campaign: z.number().optional().nullable(),
  parent_task: z.number().optional().nullable(),
  dependencies: z.array(z.number()).optional().nullable(),
  is_milestone: z.boolean().optional().nullable(),
  completion_percentage: z.number().min(0).max(100).optional().nullable(),
  recurring_pattern: z.string().optional().nullable(),
  labels: z.array(z.string()).optional().nullable(),
})

type TaskFormData = z.infer<typeof taskFormSchema>

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  defaultValues?: Partial<TaskFormData>
  onSuccess?: (task: Task) => void
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultValues,
  onSuccess
}: TaskFormDialogProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [labelInput, setLabelInput] = useState('')

  const isEdit = !!task
  const currentUser = useAuthStore((state) => state.user)

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  // Fetch related data
  const { data: usersData } = useUsersList({ is_active: true })
  const { data: campaignsData } = useCampaigns()
  const { data: tasksData } = useTasks()

  const users = usersData?.results || []
  const campaigns = campaignsData?.results || []
  const allTasks = tasksData || []

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      task_type: 'general',
      priority: 2,
      status: 'todo',
      due_date: null,
      estimated_hours: null,
      actual_hours: null,
      assigned_to: null,
      entity: null,
      campaign: null,
      parent_task: null,
      dependencies: [],
      is_milestone: false,
      completion_percentage: 0,
      recurring_pattern: null,
      labels: [],
      ...defaultValues,
    },
  })

  const watchStatus = form.watch('status')
  const watchPriority = form.watch('priority')
  const watchTaskType = form.watch('task_type')
  const watchLabels = form.watch('labels') || []
  const watchIsMilestone = form.watch('is_milestone')

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        form.reset({
          title: task.title,
          description: task.description || '',
          task_type: task.task_type,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date ? new Date(task.due_date) : null,
          estimated_hours: task.estimated_hours,
          actual_hours: task.actual_hours,
          assigned_to: task.assigned_to,
          entity: task.entity,
          campaign: task.campaign,
          parent_task: task.parent_task,
          dependencies: task.dependencies || [],
          is_milestone: task.is_milestone,
          completion_percentage: task.completion_percentage || 0,
          recurring_pattern: task.recurring_pattern,
          labels: task.labels || [],
        })
      } else if (defaultValues) {
        form.reset(defaultValues)
      } else {
        form.reset()
      }
    }
  }, [open, task, defaultValues, form])

  // Auto-update completion percentage based on status
  useEffect(() => {
    if (watchStatus === 'done') {
      form.setValue('completion_percentage', 100)
    } else if (watchStatus === 'todo') {
      form.setValue('completion_percentage', 0)
    } else if (watchStatus === 'in_progress' && form.getValues('completion_percentage') === 0) {
      form.setValue('completion_percentage', 50)
    }
  }, [watchStatus, form])

  const onSubmit = async (data: TaskFormData) => {
    try {
      const payload = {
        ...data,
        due_date: data.due_date ? format(data.due_date, 'yyyy-MM-dd') : undefined,
        estimated_hours: data.estimated_hours || undefined,
        actual_hours: data.actual_hours || undefined,
        assigned_to: data.assigned_to || undefined,
        entity: data.entity || undefined,
        campaign: data.campaign || undefined,
        parent_task: data.parent_task || undefined,
        dependencies: data.dependencies?.length ? data.dependencies : undefined,
        labels: data.labels?.length ? data.labels : undefined,
      }

      let result: Task
      if (isEdit && task) {
        const response = await updateTask.mutateAsync({
          id: task.id,
          data: payload,
        })
        result = response
        toast.success('Task updated successfully')
      } else {
        const response = await createTask.mutateAsync(payload)
        result = response
        toast.success('Task created successfully')
      }

      onSuccess?.(result)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save task')
    }
  }

  const addLabel = () => {
    if (labelInput.trim() && !watchLabels.includes(labelInput.trim())) {
      form.setValue('labels', [...watchLabels, labelInput.trim()])
      setLabelInput('')
    }
  }

  const removeLabel = (label: string) => {
    form.setValue('labels', watchLabels.filter(l => l !== label))
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'text-red-600'
      case 3: return 'text-orange-600'
      case 2: return 'text-blue-600'
      case 1: return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Clock className="h-4 w-4" />
      case 'in_progress': return <AlertCircle className="h-4 w-4" />
      case 'blocked': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'review': return <Clock className="h-4 w-4 text-orange-500" />
      case 'done': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update task details and track progress.'
              : 'Create a new task with priority, timeline, and assignment.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline & Progress</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title..." {...field} />
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
                          placeholder="Add detailed description..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  {/* Task Type */}
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

                  {/* Priority */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(Number(v))}
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
                                <div className="flex items-center gap-2">
                                  <Flag className={cn("h-3 w-3", getPriorityColor(priority))} />
                                  {TASK_PRIORITY_LABELS[priority]}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
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
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(status)}
                                  {TASK_STATUS_LABELS[status]}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Assigned To */}
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === 'unassigned' ? null : Number(v))}
                        value={field.value?.toString() || 'unassigned'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              Unassigned
                            </div>
                          </SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.full_name || user.email}
                              {user.id === currentUser?.id && ' (You)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Labels */}
                <div className="space-y-2">
                  <FormLabel>Labels</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a label..."
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addLabel()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addLabel}>
                      Add
                    </Button>
                  </div>
                  {watchLabels.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchLabels.map((label) => (
                        <Badge
                          key={label}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeLabel(label)}
                        >
                          {label} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Is Milestone */}
                <FormField
                  control={form.control}
                  name="is_milestone"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Milestone Task</FormLabel>
                        <FormDescription>
                          Mark this task as a project milestone
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Timeline & Progress Tab */}
              <TabsContent value="timeline" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Due Date */}
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Recurring Pattern */}
                  <FormField
                    control={form.control}
                    name="recurring_pattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurring Pattern</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || 'none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pattern" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No recurrence</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Estimated Hours */}
                  <FormField
                    control={form.control}
                    name="estimated_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Actual Hours */}
                  <FormField
                    control={form.control}
                    name="actual_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual Hours</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Completion Percentage */}
                <FormField
                  control={form.control}
                  name="completion_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Progress</FormLabel>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <FormControl>
                            <Input
                              type="range"
                              min="0"
                              max="100"
                              step="10"
                              className="flex-1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <span className="w-12 text-sm font-medium">{field.value}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${field.value}%` }}
                          />
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Relationships Tab */}
              <TabsContent value="relationships" className="space-y-4 mt-4">
                {/* Entity */}
                <FormField
                  control={form.control}
                  name="entity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Client/Entity</FormLabel>
                      <FormControl>
                        <EntitySearchCombobox
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Search for entity..."
                        />
                      </FormControl>
                      <FormDescription>
                        Link this task to a client, artist, or brand
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campaign */}
                <FormField
                  control={form.control}
                  name="campaign"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Campaign</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === 'none' ? null : Number(v))}
                        value={field.value?.toString() || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No campaign</SelectItem>
                          {campaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id.toString()}>
                              {campaign.campaign_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Link this task to a specific campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Parent Task */}
                <FormField
                  control={form.control}
                  name="parent_task"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Task</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === 'none' ? null : Number(v))}
                        value={field.value?.toString() || 'none'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No parent task</SelectItem>
                          {allTasks
                            .filter(t => t.id !== task?.id)
                            .map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {t.title}
                                {t.is_milestone && ' (Milestone)'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Make this task a subtask of another task
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dependencies */}
                <FormField
                  control={form.control}
                  name="dependencies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Dependencies</FormLabel>
                      <div className="space-y-2">
                        {allTasks
                          .filter(t => t.id !== task?.id)
                          .map((t) => (
                            <div key={t.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`dep-${t.id}`}
                                checked={field.value?.includes(t.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...(field.value || []), t.id])
                                  } else {
                                    field.onChange((field.value || []).filter(id => id !== t.id))
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <label htmlFor={`dep-${t.id}`} className="text-sm">
                                {t.title}
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {TASK_STATUS_LABELS[t.status]}
                                </Badge>
                              </label>
                            </div>
                          ))}
                      </div>
                      <FormDescription>
                        Tasks that must be completed before this one
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
                {isEdit ? 'Update' : 'Create'} Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}