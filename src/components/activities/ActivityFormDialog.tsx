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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox'
import { useCreateActivity, useUpdateActivity } from '@/api/hooks/useActivities'
import { useCampaigns } from '@/api/hooks/useCampaigns'
import { useTasks } from '@/api/hooks/useTasks'
import { useUsersList } from '@/api/hooks/useUsers'
import { useAuthStore } from '@/stores/authStore'
import {
  Activity,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_SENTIMENT_LABELS,
  ACTIVITY_TYPE_CHOICES,
  ACTIVITY_STATUS_CHOICES,
  ACTIVITY_SENTIMENT_CHOICES,
} from '@/api/types/activities'
import {
  Phone,
  Mail,
  MessageSquare,
  Video,
  Users,
  FileText,
  Plus,
  X,
  Calendar,
  MapPin,
  Link,
  Smile,
  Meh,
  Frown,
} from 'lucide-react'
import { toast } from 'sonner'

const activityFormSchema = z.object({
  activity_type: z.enum(ACTIVITY_TYPE_CHOICES as [string, ...string[]]),
  subject: z.string().min(1, 'Subject is required').max(200),
  description: z.string().optional(),
  status: z.enum(ACTIVITY_STATUS_CHOICES as [string, ...string[]]),
  entity: z.number().optional().nullable(),
  campaign: z.number().optional().nullable(),
  task: z.number().optional().nullable(),
  contact_person: z.number().optional().nullable(),
  participants: z.array(z.number()).optional(),
  activity_date: z.string(),
  duration_minutes: z.number().min(0).optional().nullable(),
  outcome: z.string().optional(),
  next_steps: z.string().optional(),
  location: z.string().optional(),
  meeting_link: z.string().url().optional().or(z.literal('')),
  sentiment: z.enum(ACTIVITY_SENTIMENT_CHOICES as [string, ...string[]]).optional().nullable(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().optional().nullable(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

type ActivityFormData = z.infer<typeof activityFormSchema>

interface ActivityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activity?: Activity | null
  defaultValues?: Partial<ActivityFormData>
  onSuccess?: (activity: Activity) => void
}

export function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  defaultValues,
  onSuccess
}: ActivityFormDialogProps) {
  const [tagInput, setTagInput] = useState('')
  const isEdit = !!activity

  const currentUser = useAuthStore((state) => state.user)
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()

  // Fetch related data
  const { data: usersData } = useUsersList({ is_active: true })
  const { data: campaignsData } = useCampaigns()
  const { data: tasksData } = useTasks()

  const users = usersData?.results || []
  const campaigns = campaignsData?.results || []
  const tasks = tasksData || []

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activity_type: 'email',
      subject: '',
      description: '',
      status: 'completed',
      entity: null,
      campaign: null,
      task: null,
      contact_person: null,
      participants: [],
      activity_date: new Date().toISOString().split('T')[0],
      duration_minutes: null,
      outcome: '',
      next_steps: '',
      location: '',
      meeting_link: '',
      sentiment: null,
      follow_up_required: false,
      follow_up_date: null,
      attachments: [],
      tags: [],
      ...defaultValues,
    },
  })

  const watchActivityType = form.watch('activity_type')
  const watchFollowUpRequired = form.watch('follow_up_required')
  const watchTags = form.watch('tags') || []
  const watchSentiment = form.watch('sentiment')

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (activity) {
        form.reset({
          activity_type: activity.activity_type,
          subject: activity.subject,
          description: activity.description || '',
          status: activity.status,
          entity: activity.entity,
          campaign: activity.campaign,
          task: activity.task,
          contact_person: activity.contact_person,
          participants: activity.participants || [],
          activity_date: activity.activity_date,
          duration_minutes: activity.duration_minutes,
          outcome: activity.outcome || '',
          next_steps: activity.next_steps || '',
          location: activity.location || '',
          meeting_link: activity.meeting_link || '',
          sentiment: activity.sentiment,
          follow_up_required: activity.follow_up_required,
          follow_up_date: activity.follow_up_date,
          attachments: activity.attachments || [],
          tags: activity.tags || [],
        })
      } else if (defaultValues) {
        form.reset(defaultValues)
      } else {
        form.reset()
      }
    }
  }, [open, activity, defaultValues, form])

  const onSubmit = async (data: ActivityFormData) => {
    try {
      const payload = {
        ...data,
        meeting_link: data.meeting_link || undefined,
        duration_minutes: data.duration_minutes || undefined,
        outcome: data.outcome || undefined,
        next_steps: data.next_steps || undefined,
        location: data.location || undefined,
        sentiment: data.sentiment || undefined,
        follow_up_date: data.follow_up_required && data.follow_up_date ? data.follow_up_date : undefined,
        participants: data.participants?.length ? data.participants : undefined,
        attachments: data.attachments?.length ? data.attachments : undefined,
        tags: data.tags?.length ? data.tags : undefined,
      }

      let result: Activity
      if (isEdit && activity) {
        result = await updateActivity.mutateAsync({
          id: activity.id,
          data: payload,
        })
        toast.success('Activity updated successfully')
      } else {
        result = await createActivity.mutateAsync(payload)
        toast.success('Activity logged successfully')
      }

      onSuccess?.(result)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save activity')
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'phone': return <Phone className="h-4 w-4" />
      case 'meeting': return <Users className="h-4 w-4" />
      case 'video_call': return <Video className="h-4 w-4" />
      case 'message': return <MessageSquare className="h-4 w-4" />
      case 'note': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-4 w-4 text-green-600" />
      case 'neutral': return <Meh className="h-4 w-4 text-gray-600" />
      case 'negative': return <Frown className="h-4 w-4 text-red-600" />
      default: return <Meh className="h-4 w-4 text-gray-400" />
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !watchTags.includes(tagInput.trim())) {
      form.setValue('tags', [...watchTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    form.setValue('tags', watchTags.filter(t => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Activity' : 'Log Activity'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update activity details and communication log.'
              : 'Record a new activity or communication with clients and teams.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Activity Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_TYPE_CHOICES.map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              {getActivityIcon(type)}
                              {ACTIVITY_TYPE_LABELS[type]}
                            </div>
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
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_STATUS_CHOICES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {ACTIVITY_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief subject or title..." {...field} />
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
                      placeholder="Detailed description of the activity..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activity_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location/Meeting Link (conditional) */}
            {(watchActivityType === 'meeting' || watchActivityType === 'video_call') && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Location
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Meeting location..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meeting_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Link className="h-3 w-3 inline mr-1" />
                        Meeting Link
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://meet.google.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Related Entities */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                          placeholder="Search entity..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="task"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Task</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'none' ? null : Number(v))}
                      value={field.value?.toString() || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No task</SelectItem>
                        {tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id.toString()}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Participants */}
            <FormField
              control={form.control}
              name="participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Participants</FormLabel>
                  <FormDescription className="text-xs">
                    Select team members who participated in this activity
                  </FormDescription>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`participant-${user.id}`}
                          checked={field.value?.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              field.onChange([...(field.value || []), user.id])
                            } else {
                              field.onChange((field.value || []).filter(id => id !== user.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`participant-${user.id}`} className="text-sm">
                          {user.full_name || user.email}
                          {user.id === currentUser?.id && ' (You)'}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Outcome and Sentiment */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outcome</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What was the result or outcome?"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sentiment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sentiment</FormLabel>
                    <div className="flex gap-2">
                      {ACTIVITY_SENTIMENT_CHOICES.map((sentiment) => (
                        <Button
                          key={sentiment}
                          type="button"
                          variant={field.value === sentiment ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => field.onChange(sentiment)}
                        >
                          {getSentimentIcon(sentiment)}
                          <span className="ml-1">{ACTIVITY_SENTIMENT_LABELS[sentiment]}</span>
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Next Steps */}
            <FormField
              control={form.control}
              name="next_steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Steps</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What are the next action items?"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Follow-up */}
            <Card className="p-4">
              <FormField
                control={form.control}
                name="follow_up_required"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Follow-up Required</FormLabel>
                      <FormDescription className="text-xs">
                        Mark if this activity requires a follow-up
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

              {watchFollowUpRequired && (
                <FormField
                  control={form.control}
                  name="follow_up_date"
                  render={({ field }) => (
                    <FormItem className="mt-3">
                      <FormLabel>Follow-up Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </Card>

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {watchTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createActivity.isPending || updateActivity.isPending}>
                {isEdit ? 'Update' : 'Log'} Activity
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}