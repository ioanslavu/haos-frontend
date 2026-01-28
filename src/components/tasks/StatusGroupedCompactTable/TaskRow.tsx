import { memo, useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { InlineStatusBadge } from '@/components/tasks/InlineStatusBadge'
import { InlineAssigneeSelect } from '@/components/tasks/InlineAssigneeSelect'
import { InlinePrioritySelect } from '@/components/tasks/InlinePrioritySelect'
import { InlineDatePicker } from '@/components/tasks/InlineDatePicker'
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS, type Task } from '@/api/types/tasks'
import type { ProjectCustomFieldDefinition } from '@/api/types/customFields'
import { User, Briefcase, Music, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLATFORM_ICONS, PLATFORM_TEXT_COLORS } from '@/lib/platform-icons'
import type { Platform } from '@/types/campaign'
import { getColumnWidth, type ColumnId, type TaskRowProps } from './types'

// Related Entity Component
export const RelatedEntity = memo(({ task, onClick }: { task: Task; onClick: (e: React.MouseEvent, path: string) => void }) => {
  if (task.domain_info) {
    const { domain_type, entity_id, entity_name, extra } = task.domain_info;

    if (domain_type === 'campaign' && extra?.subcampaign?.platform) {
      const platform = extra.subcampaign.platform as Platform;
      const PlatformIcon = PLATFORM_ICONS[platform];
      const colorClass = PLATFORM_TEXT_COLORS[platform] || 'text-muted-foreground';

      return (
        <div
          onClick={(e) => onClick(e, `/campaigns/${entity_id}`)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          {PlatformIcon && <PlatformIcon className={cn("h-2.5 w-2.5 flex-shrink-0", colorClass)} />}
          <span className="truncate group-hover:underline max-w-[100px]">{entity_name}</span>
        </div>
      );
    }

    const domainConfig: Record<string, { icon: React.ReactNode; path: string }> = {
      campaign: { icon: <Link2 className="h-2.5 w-2.5 flex-shrink-0" />, path: `/campaigns/${entity_id}` },
      distribution: { icon: <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />, path: `/distributions/${entity_id}` },
      opportunity: { icon: <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />, path: `/sales/opportunities/${entity_id}` },
      song: { icon: <Music className="h-2.5 w-2.5 flex-shrink-0" />, path: `/songs/${entity_id}` },
      entity: { icon: <User className="h-2.5 w-2.5 flex-shrink-0" />, path: `/entities/${entity_id}` },
    };

    const config = domainConfig[domain_type];
    if (config) {
      return (
        <div
          onClick={(e) => onClick(e, config.path)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          {config.icon}
          <span className="truncate group-hover:underline max-w-[100px]">{entity_name}</span>
        </div>
      );
    }
  }

  // Fallback to legacy fields
  if (task.opportunity && task.opportunity_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/sales/opportunities/${task.opportunity}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Briefcase className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline max-w-[100px]">{task.opportunity_detail.title}</span>
      </div>
    )
  }

  if (task.song && task.song_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/songs/${task.song}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Music className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline max-w-[100px]">{task.song_detail.title}</span>
      </div>
    )
  }

  if (task.entity && task.entity_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/entities/${task.entity}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <User className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline max-w-[100px]">{task.entity_detail.display_name}</span>
      </div>
    )
  }

  if (task.campaign && task.campaign_detail) {
    return (
      <div
        onClick={(e) => onClick(e, `/campaigns/${task.campaign}`)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
      >
        <Link2 className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="truncate group-hover:underline max-w-[100px]">{task.campaign_detail.name}</span>
      </div>
    )
  }

  return null
})

RelatedEntity.displayName = 'RelatedEntity'

// Inline Editable Input for custom fields
export const InlineEditableInput = memo(({
  value,
  type,
  onSave,
  placeholder = '-',
  className,
}: {
  value: string
  type: 'text' | 'number'
  onSave: (value: string | null) => void
  placeholder?: string
  className?: string
}) => {
  const [localValue, setLocalValue] = useState(value)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      onSave(newValue || null)
    }, 500)
  }

  const handleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = undefined
    }
    if (localValue !== value) {
      onSave(localValue || null)
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Input
      type={type}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
    />
  )
})

InlineEditableInput.displayName = 'InlineEditableInput'

// Memoized Task Row Component
export const TaskRow = memo(({
  task,
  columnOrder,
  customFields,
  onTaskClick,
  onStatusUpdate,
  onPriorityUpdate,
  onAssigneeUpdate,
  onDateUpdate,
  onRelatedEntityClick,
  onCustomFieldUpdate,
}: TaskRowProps) => {
  const renderCell = (columnId: ColumnId) => {
    const width = getColumnWidth(columnId)
    switch (columnId) {
      case 'checkbox':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)}>
            <Checkbox
              checked={task.status === 'done'}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5"
            />
          </TableCell>
        )
      case 'task':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)}>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <div className={cn(
                "w-1 h-5 rounded-full flex-shrink-0",
                task.priority === 4 ? 'bg-red-500' :
                task.priority === 3 ? 'bg-orange-500' :
                task.priority === 2 ? 'bg-blue-500' :
                'bg-gray-500'
              )} />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-xs truncate">{task.title}</span>
                <RelatedEntity task={task} onClick={onRelatedEntityClick} />
              </div>
            </div>
          </TableCell>
        )
      case 'type':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <Badge variant="outline" className="text-[10px] font-normal border-border/60 bg-background/50 px-1.5 py-0 whitespace-nowrap">
              {TASK_TYPE_LABELS[task.task_type]}
            </Badge>
          </TableCell>
        )
      case 'priority':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <InlinePrioritySelect
              value={task.priority}
              onSave={(priority) => onPriorityUpdate(task.id, priority)}
              className="h-6 text-[10px] whitespace-nowrap hover:bg-accent/50 rounded transition-colors"
            />
          </TableCell>
        )
      case 'status':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <InlineStatusBadge
              value={task.status}
              onSave={(status) => onStatusUpdate(task.id, status)}
              labels={TASK_STATUS_LABELS}
              className="text-[10px] py-0.5 px-2 h-auto whitespace-nowrap hover:ring-2 hover:ring-primary/50 hover:brightness-110 transition-all cursor-pointer select-none"
            />
          </TableCell>
        )
      case 'assigned': {
        const assignedUsers = task.assigned_to_users_detail || [];
        const assignedUserIds = assignedUsers.length
          ? assignedUsers.map(u => u.id)
          : task.assigned_to_users || task.assignments?.map(a => a.user) || [];

        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <InlineAssigneeSelect
              value={assignedUserIds}
              onSave={(users) => onAssigneeUpdate(task.id, users)}
              className="h-6 px-1 text-[10px]"
              placeholder="Assign"
              compact
            />
          </TableCell>
        )
      }
      case 'due':
        return (
          <TableCell key={columnId} className={cn("py-1.5", width)} onClick={(e) => e.stopPropagation()}>
            <InlineDatePicker
              value={task.due_date}
              onSave={(date) => onDateUpdate(task.id, date)}
              placeholder="Set date"
              className="h-6 px-1 text-[10px]"
            />
          </TableCell>
        )
      default:
        return null
    }
  }

  return (
    <TableRow className="hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 group">
      {renderCell('checkbox')}
      {renderCell('task')}
      {columnOrder
        .filter(id => id !== 'checkbox' && id !== 'task')
        .map(renderCell)}
      {customFields.map((field) => {
        const fieldValue = task.custom_field_values?.[field.id]
        const currentValue = fieldValue?.value || ''

        return (
          <TableCell
            key={`custom-${field.id}`}
            className="py-1.5 w-[120px]"
            onClick={(e) => e.stopPropagation()}
          >
            {field.field_type === 'single_select' ? (
              <Select
                value={currentValue || undefined}
                onValueChange={(value) => onCustomFieldUpdate?.(task.id, field.id, value || null)}
              >
                <SelectTrigger className="h-6 text-[10px] border-none bg-transparent hover:bg-accent/50">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  {field.select_options?.map((option) => (
                    <SelectItem key={option} value={option} className="text-xs">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.field_type === 'checkbox' ? (
              <Checkbox
                checked={currentValue === 'true'}
                onCheckedChange={(checked) => onCustomFieldUpdate?.(task.id, field.id, checked ? 'true' : 'false')}
                className="h-4 w-4"
              />
            ) : field.field_type === 'date' ? (
              <InlineDatePicker
                value={currentValue || null}
                onSave={(date) => onCustomFieldUpdate?.(task.id, field.id, date)}
                placeholder="-"
                className="h-6 px-1 text-[10px]"
              />
            ) : field.field_type === 'number' ? (
              <InlineEditableInput
                type="number"
                value={currentValue}
                onSave={(value) => onCustomFieldUpdate?.(task.id, field.id, value)}
                className="h-6 text-[10px] border-none bg-transparent hover:bg-accent/50 focus:bg-background"
                placeholder="-"
              />
            ) : (
              <InlineEditableInput
                type="text"
                value={currentValue}
                onSave={(value) => onCustomFieldUpdate?.(task.id, field.id, value)}
                className="h-6 text-[10px] border-none bg-transparent hover:bg-accent/50 focus:bg-background"
                placeholder="-"
              />
            )}
          </TableCell>
        )
      })}
    </TableRow>
  )
}, (prevProps, nextProps) => {
  return prevProps.task.updated_at === nextProps.task.updated_at &&
         prevProps.task.status === nextProps.task.status &&
         prevProps.task.priority === nextProps.task.priority &&
         prevProps.task.due_date === nextProps.task.due_date &&
         JSON.stringify(prevProps.task.assigned_to_users) === JSON.stringify(nextProps.task.assigned_to_users) &&
         JSON.stringify(prevProps.columnOrder) === JSON.stringify(nextProps.columnOrder) &&
         JSON.stringify(prevProps.task.custom_field_values) === JSON.stringify(nextProps.task.custom_field_values) &&
         JSON.stringify(prevProps.customFields) === JSON.stringify(nextProps.customFields)
})

TaskRow.displayName = 'TaskRow'
