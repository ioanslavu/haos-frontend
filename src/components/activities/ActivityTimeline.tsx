import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ActivityFormDialog } from './ActivityFormDialog'
import { useActivities, useActivitiesByEntity, useDeleteActivity } from '@/api/hooks/useActivities'
import { useTasks } from '@/api/hooks/useTasks'
import {
  Activity,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_SENTIMENT_LABELS,
} from '@/api/types/activities'
import {
  Phone,
  Mail,
  MessageSquare,
  Video,
  Users,
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Link2,
  Smile,
  Meh,
  Frown,
  MoreHorizontal,
  ChevronRight,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ActivityTimelineProps {
  entityId?: number
  campaignId?: number
  taskId?: number
  limit?: number
  showHeader?: boolean
  onActivityClick?: (activity: Activity) => void
}

export function ActivityTimeline({
  entityId,
  campaignId,
  taskId,
  limit,
  showHeader = true,
  onActivityClick
}: ActivityTimelineProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSentiment, setFilterSentiment] = useState<string>('all')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [createFollowUpTaskId, setCreateFollowUpTaskId] = useState<number | null>(null)

  // Fetch activities
  const { data: activitiesData, isLoading } = entityId
    ? useActivitiesByEntity(entityId)
    : useActivities({
        campaign: campaignId,
        task: taskId,
        activity_type: filterType !== 'all' ? filterType : undefined,
        sentiment: filterSentiment !== 'all' ? filterSentiment : undefined,
      })

  const activities = activitiesData || []
  const deleteActivity = useDeleteActivity()

  // Filter activities based on search
  const filteredActivities = activities.filter(activity => {
    if (searchQuery && !activity.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!activity.description || !activity.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false
    }
    return true
  }).slice(0, limit)

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = parseISO(activity.activity_date)
    let dateLabel = format(date, 'MMMM d, yyyy')

    if (isToday(date)) dateLabel = 'Today'
    else if (isYesterday(date)) dateLabel = 'Yesterday'

    if (!groups[dateLabel]) {
      groups[dateLabel] = []
    }
    groups[dateLabel].push(activity)
    return groups
  }, {} as Record<string, Activity[]>)

  const handleActivityEdit = (activity: Activity) => {
    setSelectedActivity(activity)
    setActivityDialogOpen(true)
  }

  const handleActivityDelete = async (activity: Activity) => {
    if (confirm(`Delete activity "${activity.subject}"?`)) {
      try {
        await deleteActivity.mutateAsync(activity.id)
        toast.success('Activity deleted successfully')
      } catch {
        toast.error('Failed to delete activity')
      }
    }
  }

  const handleCreateFollowUpTask = async (activity: Activity) => {
    // This would open the task dialog with pre-filled data
    // For now just show a toast
    toast.info('Opening task creation dialog...')
    // You would call the TaskFormDialog with defaultValues based on the activity
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
      default: return null
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'phone': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'meeting': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'video_call': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
      case 'message': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'note': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Activity Timeline</h3>
              <p className="text-sm text-muted-foreground">
                Track all interactions and communications
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelectedActivity(null)
                setActivityDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="video_call">Video Call</SelectItem>
                <SelectItem value="message">Message</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSentiment} onValueChange={setFilterSentiment}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-secondary rounded w-1/4" />
                  <div className="h-3 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No activities found</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSelectedActivity(null)
                  setActivityDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Log First Activity
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([dateLabel, activities]) => (
              <div key={dateLabel} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs font-medium text-muted-foreground px-2">
                    {dateLabel}
                  </span>
                  <div className="h-px bg-border flex-1" />
                </div>

                <div className="space-y-3">
                  {activities.map((activity) => (
                    <Card
                      key={activity.id}
                      className={cn(
                        "relative overflow-hidden transition-all hover:shadow-md",
                        onActivityClick && "cursor-pointer"
                      )}
                      onClick={() => onActivityClick?.(activity)}
                    >
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1", getActivityColor(activity.activity_type))} />

                      <CardContent className="p-4 pl-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                              <div className={cn("p-2 rounded-lg", getActivityColor(activity.activity_type))}>
                                {getActivityIcon(activity.activity_type)}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium">{activity.subject}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                                  </Badge>
                                  {activity.sentiment && getSentimentIcon(activity.sentiment)}
                                  {activity.follow_up_required && (
                                    <Badge variant="secondary" className="text-xs">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Follow-up required
                                    </Badge>
                                  )}
                                </div>

                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {activity.description}
                                  </p>
                                )}

                                {/* Metadata */}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(parseISO(activity.activity_date), { addSuffix: true })}
                                  </div>

                                  {activity.duration_minutes && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {activity.duration_minutes} min
                                    </div>
                                  )}

                                  {activity.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {activity.location}
                                    </div>
                                  )}

                                  {activity.meeting_link && (
                                    <a
                                      href={activity.meeting_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 hover:text-primary"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Link2 className="h-3 w-3" />
                                      Meeting link
                                    </a>
                                  )}

                                  {activity.created_by_detail && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {activity.created_by_detail.full_name}
                                    </div>
                                  )}
                                </div>

                                {/* Related entities */}
                                <div className="flex items-center gap-2 mt-2">
                                  {activity.entity_detail && (
                                    <Badge variant="outline" className="text-xs">
                                      {activity.entity_detail.display_name}
                                    </Badge>
                                  )}
                                  {activity.campaign_detail && (
                                    <Badge variant="outline" className="text-xs">
                                      {activity.campaign_detail.name}
                                    </Badge>
                                  )}
                                  {activity.task_detail && (
                                    <Badge variant="outline" className="text-xs">
                                      Task: {activity.task_detail.title}
                                    </Badge>
                                  )}
                                </div>

                                {/* Tags */}
                                {activity.tags && activity.tags.length > 0 && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <Tag className="h-3 w-3 text-muted-foreground" />
                                    {activity.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Outcome */}
                                {activity.outcome && (
                                  <div className="mt-3 p-2 bg-secondary/50 rounded-lg">
                                    <p className="text-xs font-medium mb-1">Outcome:</p>
                                    <p className="text-xs text-muted-foreground">{activity.outcome}</p>
                                  </div>
                                )}

                                {/* Next Steps */}
                                {activity.next_steps && (
                                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-xs font-medium mb-1">Next Steps:</p>
                                    <p className="text-xs">{activity.next_steps}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleActivityEdit(activity)
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              {activity.follow_up_required && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCreateFollowUpTask(activity)
                                  }}
                                >
                                  Create Follow-up Task
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleActivityDelete(activity)
                                }}
                                className="text-red-600"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Form Dialog */}
      <ActivityFormDialog
        open={activityDialogOpen}
        onOpenChange={setActivityDialogOpen}
        activity={selectedActivity}
        defaultValues={
          entityId ? { entity: entityId } :
          campaignId ? { campaign: campaignId } :
          taskId ? { task: taskId } :
          undefined
        }
      />
    </div>
  )
}