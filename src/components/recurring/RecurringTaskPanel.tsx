import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateRecurringTaskTemplate,
  useUpdateRecurringTaskTemplate,
} from '@/api/hooks/useProjects';
import {
  TASK_PRIORITY_CONFIG,
  type RecurringTaskTemplate,
  type TaskPriority,
} from '@/types/projects';
import {
  Repeat,
  Clock,
  Flag,
  CalendarIcon,
  X,
  Check,
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { InlineAssigneeSelect } from '@/components/tasks/InlineAssigneeSelect';
import { InlineTeamSelect } from '@/components/tasks/InlineTeamSelect';

interface RecurringTaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  template?: RecurringTaskTemplate;
}

type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

const DAYS_OF_WEEK = [
  { value: 0, label: 'S', fullLabel: 'Sunday' },
  { value: 1, label: 'M', fullLabel: 'Monday' },
  { value: 2, label: 'T', fullLabel: 'Tuesday' },
  { value: 3, label: 'W', fullLabel: 'Wednesday' },
  { value: 4, label: 'T', fullLabel: 'Thursday' },
  { value: 5, label: 'F', fullLabel: 'Friday' },
  { value: 6, label: 'S', fullLabel: 'Saturday' },
];

export function RecurringTaskPanel({
  isOpen,
  onClose,
  projectId,
  template,
}: RecurringTaskPanelProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(2);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly');
  const [interval, setInterval] = useState(1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [assignedTeamId, setAssignedTeamId] = useState<number | null>(null);

  // Autosave state
  const [createdTemplateId, setCreatedTemplateId] = useState<number | null>(null);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const createTemplate = useCreateRecurringTaskTemplate();
  const updateTemplate = useUpdateRecurringTaskTemplate();

  const isEdit = !!template;
  const isCreateMode = !template && !createdTemplateId;

  // Initialize form when template changes
  useEffect(() => {
    if (isOpen) {
      if (template) {
        setTitle(template.title);
        setDescription(template.description || '');
        setPriority(template.default_priority);
        // Load multiple users
        const userIds = (template as any).assigned_to_users?.map((u: any) => u.id) || [];
        setAssignedUserIds(userIds);
        setAssignedTeamId((template as any).assigned_team?.id || null);
        // Parse RRULE to set recurrence options
        parseRRule(template.recurrence_rule);
      } else {
        // Reset to defaults
        setTitle('');
        setDescription('');
        setPriority(2);
        setStartDate(new Date());
        setHasEndDate(false);
        setEndDate(undefined);
        setRecurrenceType('weekly');
        setInterval(1);
        setDaysOfWeek([1]);
        setDayOfMonth(1);
        setAssignedUserIds([]);
        setAssignedTeamId(null);
        setCreatedTemplateId(null);
        setShowSavedIndicator(false);
      }
    }
  }, [isOpen, template]);

  // Parse RRULE string to set form state
  const parseRRule = (rrule: string) => {
    const parts = rrule.split(';');
    const ruleMap: Record<string, string> = {};

    parts.forEach(part => {
      const [key, value] = part.split('=');
      ruleMap[key] = value;
    });

    // Parse frequency
    if (ruleMap.FREQ) {
      setRecurrenceType(ruleMap.FREQ.toLowerCase() as RecurrenceType);
    }

    // Parse interval
    if (ruleMap.INTERVAL) {
      setInterval(parseInt(ruleMap.INTERVAL));
    }

    // Parse days of week
    if (ruleMap.BYDAY) {
      const dayMap: Record<string, number> = {
        'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
      };
      const days = ruleMap.BYDAY.split(',').map(d => dayMap[d]);
      setDaysOfWeek(days);
    }

    // Parse day of month
    if (ruleMap.BYMONTHDAY) {
      setDayOfMonth(parseInt(ruleMap.BYMONTHDAY));
    }
  };

  // Generate RRULE from form state
  const generateRRule = (): string => {
    const parts = [`FREQ=${recurrenceType.toUpperCase()}`];

    if (interval > 1) {
      parts.push(`INTERVAL=${interval}`);
    }

    if (recurrenceType === 'weekly' && daysOfWeek.length > 0) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const days = daysOfWeek.map((d) => dayMap[d]).join(',');
      parts.push(`BYDAY=${days}`);
    }

    if (recurrenceType === 'monthly') {
      parts.push(`BYMONTHDAY=${dayOfMonth}`);
    }

    return parts.join(';');
  };

  // Calculate next occurrences for preview
  const nextOccurrences = useMemo(() => {
    const occurrences: Date[] = [];
    let current = new Date(startDate);

    for (let i = 0; i < 5; i++) {
      let nextDate: Date;
      if (recurrenceType === 'daily') {
        nextDate = addDays(current, interval * i);
      } else if (recurrenceType === 'weekly') {
        nextDate = addWeeks(current, interval * i);
      } else if (recurrenceType === 'monthly') {
        nextDate = addMonths(current, interval * i);
      } else {
        nextDate = addYears(current, interval * i);
      }

      // Check if past end date
      if (hasEndDate && endDate && nextDate > endDate) {
        break;
      }

      occurrences.push(nextDate);
    }

    return occurrences;
  }, [startDate, recurrenceType, interval, hasEndDate, endDate]);

  // Autosave effect
  useEffect(() => {
    if (!isOpen) return;
    if (!title.trim()) return; // Don't save without title

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for auto-save
    debounceTimerRef.current = setTimeout(() => {
      const payload: any = {
        project: projectId,
        title: title.trim(),
        description: description.trim(),
        recurrence_rule: generateRRule(),
        default_priority: priority,
        is_active: true,
      };

      // Add assignment fields
      if (assignedUserIds.length > 0) {
        payload.assigned_to_user_ids = assignedUserIds;
      }
      if (assignedTeamId) {
        payload.assigned_team_id = assignedTeamId;
      }

      const templateId = template?.id || createdTemplateId;

      if (templateId) {
        // Update existing
        updateTemplate.mutate(
          { id: templateId, data: payload },
          {
            onSuccess: () => {
              setShowSavedIndicator(true);
              setTimeout(() => setShowSavedIndicator(false), 2000);
            },
          }
        );
      } else {
        // Create new
        createTemplate.mutate(payload, {
          onSuccess: (data) => {
            setCreatedTemplateId(data.id);
            setShowSavedIndicator(true);
            setTimeout(() => setShowSavedIndicator(false), 2000);
          },
        });
      }
    }, 1000); // 1 second debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    isOpen, title, description, priority, recurrenceType, interval,
    daysOfWeek, dayOfMonth, assignedUserIds, assignedTeamId,
    template, createdTemplateId, projectId
  ]);

  // Handle close with save
  const handleClose = async () => {
    // Clear pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Save if we have a title and pending changes
    if (title.trim()) {
      const payload: any = {
        project: projectId,
        title: title.trim(),
        description: description.trim(),
        recurrence_rule: generateRRule(),
        default_priority: priority,
        is_active: true,
      };

      if (assignedUserIds.length > 0) {
        payload.assigned_to_user_ids = assignedUserIds;
      }
      if (assignedTeamId) {
        payload.assigned_team_id = assignedTeamId;
      }

      const templateId = template?.id || createdTemplateId;

      if (templateId) {
        updateTemplate.mutate(
          { id: templateId, data: payload },
          { onSettled: () => onClose() }
        );
        return;
      } else if (isCreateMode) {
        createTemplate.mutate(payload, {
          onSuccess: (data) => {
            setCreatedTemplateId(data.id);
            onClose();
          },
          onError: () => onClose(),
        });
        return;
      }
    }

    onClose();
  };

  const toggleDayOfWeek = (day: number) => {
    const newDays = daysOfWeek.includes(day)
      ? daysOfWeek.filter((d) => d !== day)
      : [...daysOfWeek, day].sort();
    setDaysOfWeek(newDays.length > 0 ? newDays : [day]); // Keep at least one day
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 4: return 'text-red-600';
      case 3: return 'text-orange-600';
      case 2: return 'text-blue-600';
      case 1: return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10">
                <Repeat className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {isEdit || createdTemplateId ? 'Edit Recurring Task' : 'New Recurring Task'}
              </span>
              {/* Saved indicator */}
              {showSavedIndicator && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <Check className="h-3 w-3" />
                  Saved
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              className="w-full text-lg font-semibold bg-transparent placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Description */}
          <div>
            <textarea
              placeholder="Add description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              className="w-full resize-none bg-transparent placeholder:text-muted-foreground/50 text-sm"
            />
          </div>

          <Separator />

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Priority
            </label>
            <div className="flex gap-2">
              {([1, 2, 3, 4] as TaskPriority[]).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1",
                    priority === p && "bg-gradient-to-r from-indigo-500 to-purple-600"
                  )}
                >
                  {TASK_PRIORITY_CONFIG[p].label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Assignment */}
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Assignees</span>
              <InlineAssigneeSelect
                value={assignedUserIds}
                onSave={(ids) => setAssignedUserIds(ids)}
                placeholder="Add assignees"
                multiple={true}
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Team</span>
              <InlineTeamSelect
                value={assignedTeamId}
                onSave={(id) => setAssignedTeamId(id)}
                placeholder="Add team"
              />
            </div>
          </div>

          <Separator />

          {/* Recurrence Pattern */}
          <div className="space-y-4">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recurrence Pattern
            </label>

            {/* Recurrence Type */}
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrenceType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={recurrenceType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecurrenceType(type)}
                  className={cn(
                    "flex-1 capitalize",
                    recurrenceType === type && "bg-gradient-to-r from-indigo-500 to-purple-600"
                  )}
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Interval */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Every</span>
              <Input
                type="number"
                min={1}
                max={99}
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                className="w-12 text-center h-8 px-1 border-muted bg-muted/30"
              />
              <span className="text-sm text-muted-foreground">
                {recurrenceType === 'daily' && (interval === 1 ? 'day' : 'days')}
                {recurrenceType === 'weekly' && (interval === 1 ? 'week' : 'weeks')}
                {recurrenceType === 'monthly' && (interval === 1 ? 'month' : 'months')}
                {recurrenceType === 'yearly' && (interval === 1 ? 'year' : 'years')}
              </span>
            </div>

            {/* Days of Week (for weekly) */}
            {recurrenceType === 'weekly' && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">On these days</span>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDayOfWeek(day.value)}
                      className={cn(
                        "w-9 h-9 p-0",
                        daysOfWeek.includes(day.value) &&
                          "bg-gradient-to-r from-indigo-500 to-purple-600"
                      )}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Day of Month (for monthly) */}
            {recurrenceType === 'monthly' && (
              <div className="flex items-center gap-3">
                <span className="text-sm">On day</span>
                <Select
                  value={dayOfMonth.toString()}
                  onValueChange={(v) => setDayOfMonth(parseInt(v))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Start Date */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Starts on</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date (Stop On) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has-end-date"
                  checked={hasEndDate}
                  onCheckedChange={(checked) => setHasEndDate(checked as boolean)}
                />
                <label htmlFor="has-end-date" className="text-sm cursor-pointer">
                  Stop on specific date
                </label>
              </div>

              {hasEndDate && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'MMMM d, yyyy') : 'Select end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-3">
            <span className="text-sm font-medium">Next Occurrences</span>
            <div className="space-y-1.5">
              {nextOccurrences.map((date, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Badge variant="secondary" className="w-6 h-6 p-0 justify-center text-xs">
                    {i + 1}
                  </Badge>
                  <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
                </div>
              ))}
              {nextOccurrences.length === 0 && (
                <span className="text-sm text-muted-foreground">No occurrences</span>
              )}
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}

export default RecurringTaskPanel;
