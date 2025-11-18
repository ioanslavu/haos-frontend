import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Repeat, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import {
  useCreateRecurringTaskTemplate,
  useUpdateRecurringTaskTemplate,
} from '@/api/hooks/useProjects';
import {
  TASK_PRIORITY_CONFIG,
  type RecurringTaskTemplate,
  type RecurringTaskTemplateCreatePayload,
  type TaskPriority,
} from '@/types/projects';

interface RecurringTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  template?: RecurringTaskTemplate; // For editing
}

type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface RecurrenceConfig {
  type: RecurrenceType;
  interval: number;
  daysOfWeek: number[]; // 0-6 for weekly
  dayOfMonth: number; // 1-31 for monthly
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'S', fullLabel: 'Sunday' },
  { value: 1, label: 'M', fullLabel: 'Monday' },
  { value: 2, label: 'T', fullLabel: 'Tuesday' },
  { value: 3, label: 'W', fullLabel: 'Wednesday' },
  { value: 4, label: 'T', fullLabel: 'Thursday' },
  { value: 5, label: 'F', fullLabel: 'Friday' },
  { value: 6, label: 'S', fullLabel: 'Saturday' },
];

export function RecurringTemplateDialog({
  isOpen,
  onClose,
  projectId,
  template,
}: RecurringTemplateDialogProps) {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    type: 'weekly',
    interval: 1,
    daysOfWeek: [1], // Monday
    dayOfMonth: 1,
  });

  const createTemplate = useCreateRecurringTaskTemplate();
  const updateTemplate = useUpdateRecurringTaskTemplate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{
    title: string;
    description: string;
    priority: TaskPriority;
  }>({
    defaultValues: {
      title: template?.title || '',
      description: template?.description || '',
      priority: template?.default_priority || 2,
    },
  });

  const priority = watch('priority');

  // Generate RRULE from recurrence config
  const generateRRule = (): string => {
    const parts = [`FREQ=${recurrence.type.toUpperCase()}`];

    if (recurrence.interval > 1) {
      parts.push(`INTERVAL=${recurrence.interval}`);
    }

    if (recurrence.type === 'weekly' && recurrence.daysOfWeek.length > 0) {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      const days = recurrence.daysOfWeek.map((d) => dayMap[d]).join(',');
      parts.push(`BYDAY=${days}`);
    }

    if (recurrence.type === 'monthly') {
      parts.push(`BYMONTHDAY=${recurrence.dayOfMonth}`);
    }

    return parts.join(';');
  };

  // Calculate next N occurrences for preview
  const nextOccurrences = useMemo(() => {
    const occurrences: Date[] = [];
    let current = new Date(startDate);

    for (let i = 0; i < 5; i++) {
      if (recurrence.type === 'daily') {
        occurrences.push(addDays(current, recurrence.interval * i));
      } else if (recurrence.type === 'weekly') {
        occurrences.push(addWeeks(current, recurrence.interval * i));
      } else if (recurrence.type === 'monthly') {
        occurrences.push(addMonths(current, recurrence.interval * i));
      } else if (recurrence.type === 'yearly') {
        occurrences.push(addYears(current, recurrence.interval * i));
      }
    }

    return occurrences;
  }, [startDate, recurrence]);

  const onSubmit = async (data: { title: string; description: string; priority: TaskPriority }) => {
    const payload: RecurringTaskTemplateCreatePayload = {
      project: projectId,
      title: data.title,
      description: data.description,
      recurrence_rule: generateRRule(),
      default_priority: data.priority,
      is_active: true,
    };

    try {
      if (template) {
        await updateTemplate.mutateAsync({ id: template.id, data: payload });
      } else {
        await createTemplate.mutateAsync(payload);
      }
      reset();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleDayOfWeek = (day: number) => {
    const current = recurrence.daysOfWeek;
    const newDays = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    setRecurrence({ ...recurrence, daysOfWeek: newDays });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-indigo-500" />
            {template ? 'Edit Recurring Task' : 'Create Recurring Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="e.g., Weekly Team Standup"
                className="rounded-xl"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Task details..."
                className="rounded-xl resize-none"
                rows={2}
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {([1, 2, 3, 4] as TaskPriority[]).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={priority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setValue('priority', p)}
                    className={cn(
                      "flex-1 rounded-lg",
                      priority === p && "bg-gradient-to-r from-indigo-500 to-purple-600"
                    )}
                  >
                    {TASK_PRIORITY_CONFIG[p].label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Recurrence Pattern */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recurrence Pattern
            </h3>

            {/* Recurrence Type */}
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrenceType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={recurrence.type === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRecurrence({ ...recurrence, type })}
                  className={cn(
                    "flex-1 rounded-lg capitalize",
                    recurrence.type === type && "bg-gradient-to-r from-indigo-500 to-purple-600"
                  )}
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Interval */}
            <div className="flex items-center gap-3">
              <span className="text-sm">Every</span>
              <Input
                type="number"
                min={1}
                max={99}
                value={recurrence.interval}
                onChange={(e) =>
                  setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })
                }
                className="w-16 rounded-lg text-center"
              />
              <span className="text-sm">
                {recurrence.type === 'daily' && (recurrence.interval === 1 ? 'day' : 'days')}
                {recurrence.type === 'weekly' && (recurrence.interval === 1 ? 'week' : 'weeks')}
                {recurrence.type === 'monthly' && (recurrence.interval === 1 ? 'month' : 'months')}
                {recurrence.type === 'yearly' && (recurrence.interval === 1 ? 'year' : 'years')}
              </span>
            </div>

            {/* Days of Week (for weekly) */}
            {recurrence.type === 'weekly' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">On these days</Label>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={recurrence.daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDayOfWeek(day.value)}
                      className={cn(
                        "w-9 h-9 p-0 rounded-lg",
                        recurrence.daysOfWeek.includes(day.value) &&
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
            {recurrence.type === 'monthly' && (
              <div className="flex items-center gap-3">
                <span className="text-sm">On day</span>
                <Select
                  value={recurrence.dayOfMonth.toString()}
                  onValueChange={(v) =>
                    setRecurrence({ ...recurrence, dayOfMonth: parseInt(v) })
                  }
                >
                  <SelectTrigger className="w-20 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-48">
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
              <Label className="text-xs text-muted-foreground">Starts on</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal rounded-xl"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Next 5 Occurrences</h3>
            <div className="space-y-1.5">
              {nextOccurrences.map((date, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Badge variant="secondary" className="w-6 h-6 p-0 justify-center rounded-md text-xs">
                    {i + 1}
                  </Badge>
                  <span>{format(date, 'EEEE, MMMM d, yyyy')}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isSubmitting
                ? template
                  ? 'Saving...'
                  : 'Creating...'
                : template
                ? 'Save Changes'
                : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RecurringTemplateDialog;
