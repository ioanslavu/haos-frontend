/**
 * OpportunityActivityTab - Activity timeline tab
 */

import { formatDistanceToNow } from 'date-fns'
import { Activity, CheckCircle, Edit2, Mail, MessageSquare, PlusCircle, UserPlus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getInitials } from '@/lib/utils'
import type { OpportunityActivity } from '@/types/opportunities'

interface OpportunityActivityTabProps {
  activities: OpportunityActivity[]
}

export function OpportunityActivityTab({ activities }: OpportunityActivityTabProps) {
  if (activities.length === 0) {
    return (
      <Card className="p-8 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm text-center">
        <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-muted-foreground">No activity yet</p>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border-white/10 bg-background/50 backdrop-blur-sm">
      <CardContent className="py-4">
        <div className="space-y-0">
          {activities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === activities.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({
  activity,
  isLast,
}: {
  activity: OpportunityActivity
  isLast: boolean
}) {
  const { icon: Icon, bgColor, textColor } = getActivityStyle(activity.action)

  return (
    <div className="relative pb-4">
      {/* Timeline line */}
      {!isLast && (
        <span
          className="absolute left-5 top-10 -ml-px h-full w-0.5 bg-border"
          aria-hidden="true"
        />
      )}

      <div className="relative flex items-start space-x-3">
        {/* Icon */}
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', bgColor)}>
          <Icon className={cn('h-5 w-5', textColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{activity.description}</p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
          </div>
          {activity.user && (
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {getInitials(activity.user.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{activity.user.full_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getActivityStyle(action: string) {
  switch (action) {
    case 'created':
      return {
        icon: PlusCircle,
        bgColor: 'bg-emerald-500/20',
        textColor: 'text-emerald-500',
      }
    case 'stage_changed':
      return {
        icon: CheckCircle,
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-500',
      }
    case 'updated':
      return {
        icon: Edit2,
        bgColor: 'bg-amber-500/20',
        textColor: 'text-amber-500',
      }
    case 'email_sent':
      return {
        icon: Mail,
        bgColor: 'bg-purple-500/20',
        textColor: 'text-purple-500',
      }
    case 'comment_added':
      return {
        icon: MessageSquare,
        bgColor: 'bg-cyan-500/20',
        textColor: 'text-cyan-500',
      }
    case 'artist_added':
    case 'deliverable_added':
      return {
        icon: UserPlus,
        bgColor: 'bg-pink-500/20',
        textColor: 'text-pink-500',
      }
    default:
      return {
        icon: Activity,
        bgColor: 'bg-muted',
        textColor: 'text-muted-foreground',
      }
  }
}
