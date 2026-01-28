import { Calendar, CheckCircle2, ClipboardCheck } from 'lucide-react'
import type { Task } from '@/api/types/tasks'

interface TaskTimelineProps {
  task: Task
}

export function TaskTimeline({ task }: TaskTimelineProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      timeZone: 'Europe/Bucharest',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Timeline
      </h4>
      <div className="space-y-2 text-sm">
        {task.started_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>Started:</span>
            <span>{formatDate(task.started_at)}</span>
          </div>
        )}
        {task.submitted_for_review_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            <span>In Review:</span>
            <span>{formatDate(task.submitted_for_review_at)}</span>
          </div>
        )}
        {task.completed_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed:</span>
            <span>{formatDate(task.completed_at)}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created:</span>
          <span>{formatDate(task.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
