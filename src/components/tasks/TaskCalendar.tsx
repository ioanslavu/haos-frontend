import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Task, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/api/types/tasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateTask } from '@/api/hooks/useTasks';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import './TaskCalendar.css';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDateClick?: (date: Date) => void;
  onTaskReschedule?: (taskId: number, newDate: string) => void;
  className?: string;
}

export function TaskCalendar({ tasks, onTaskClick, onDateClick, onTaskReschedule, className }: TaskCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [currentTitle, setCurrentTitle] = useState('');
  const updateTask = useUpdateTask();

  // Filter states
  const [statusFilters, setStatusFilters] = useState<string[]>([
    'todo',
    'in_progress',
    'done',
    'blocked',
  ]);
  const [priorityFilters, setPriorityFilters] = useState<number[]>([1, 2, 3, 4]);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  // Apply filters and convert tasks to FullCalendar events
  const events = tasks
    .filter((task) => {
      if (!task.due_date) return false;
      if (!statusFilters.includes(task.status)) return false;
      if (!priorityFilters.includes(task.priority)) return false;
      if (showOverdueOnly && !task.is_overdue) return false;
      return true;
    })
    .map((task) => {
      // Get color based on status
      let backgroundColor = 'hsl(var(--primary))';
      let borderColor = 'hsl(var(--primary))';

      if (task.status === 'done') {
        backgroundColor = 'hsl(142.1 76.2% 36.3%)'; // success color
        borderColor = 'hsl(142.1 76.2% 36.3%)';
      } else if (task.status === 'in_progress') {
        backgroundColor = 'hsl(217.2 91.2% 59.8%)'; // info color
        borderColor = 'hsl(217.2 91.2% 59.8%)';
      } else if (task.is_overdue) {
        backgroundColor = 'hsl(0 84.2% 60.2%)'; // destructive color
        borderColor = 'hsl(0 84.2% 60.2%)';
      } else if (task.priority === 4) {
        backgroundColor = 'hsl(0 84.2% 60.2%)'; // urgent
        borderColor = 'hsl(0 84.2% 60.2%)';
      } else if (task.priority === 3) {
        backgroundColor = 'hsl(38 92% 50%)'; // high
        borderColor = 'hsl(38 92% 50%)';
      }

      return {
        id: task.id.toString(),
        title: task.title,
        start: task.due_date,
        allDay: true,
        backgroundColor,
        borderColor,
        classNames: !task.department ? ['task-no-department'] : [],
        extendedProps: {
          task,
          status: task.status,
          priority: task.priority,
          isOverdue: task.is_overdue,
          noDepartment: !task.department,
        },
      };
    });

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task;
    if (task) {
      onTaskClick(task);
    }
  };

  const handleDateClick = (info: any) => {
    if (onDateClick) {
      onDateClick(new Date(info.dateStr));
    }
  };

  const handlePrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  const handleNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  const handleToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
      setCurrentTitle(calendarApi.view.title);
    }
  };

  const handleViewChange = (view: string) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
      setCurrentView(view);
      setCurrentTitle(calendarApi.view.title);
    }
  };

  // Handle drag and drop to reschedule tasks
  const handleEventDrop = async (info: any) => {
    const task = info.event.extendedProps.task;
    const newDate = info.event.start;

    if (!task || !newDate) {
      info.revert();
      return;
    }

    // Format date as YYYY-MM-DD using local timezone (not UTC)
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    try {
      // Check if task has department (required by backend validation)
      if (!task.department) {
        info.revert();
        toast.error('Cannot reschedule: Task has no department', {
          description: 'Please edit the task and assign a department first',
        });
        return;
      }

      // Build update data with all required fields to pass backend validation
      const updateData: any = {
        title: task.title,
        task_type: task.task_type,
        status: task.status,
        priority: task.priority,
        department: task.department, // Required field
        due_date: formattedDate,
      };

      // Include all existing fields that are set
      if (task.description) updateData.description = task.description;
      if (task.tag) updateData.tag = task.tag;
      if (task.campaign) updateData.campaign = task.campaign;
      if (task.entity) updateData.entity = task.entity;
      if (task.contract) updateData.contract = task.contract;
      if (task.notes) updateData.notes = task.notes;
      if (task.reminder_date) updateData.reminder_date = task.reminder_date;
      if (task.parent_task) updateData.parent_task = task.parent_task;
      if (task.estimated_hours) updateData.estimated_hours = task.estimated_hours;
      if (task.actual_hours) updateData.actual_hours = task.actual_hours;
      if (task.metadata) updateData.metadata = task.metadata;

      await updateTask.mutateAsync({
        id: task.id,
        data: updateData,
      });

      // Optional callback
      if (onTaskReschedule) {
        onTaskReschedule(task.id, formattedDate);
      }

      toast.success('Task rescheduled successfully', {
        description: `"${task.title}" moved to ${formattedDate}`,
      });
    } catch (error: any) {
      // Revert the event back to its original position on error
      info.revert();
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.department?.[0] ||
        error.response?.data?.non_field_errors?.[0] ||
        'Failed to reschedule task';
      toast.error(errorMessage);
      console.error('Task reschedule error:', error.response?.data, 'Task:', task);
    }
  };

  // Handle event resize (for multi-day tasks in the future)
  const handleEventResize = async (info: any) => {
    const task = info.event.extendedProps.task;
    const newEndDate = info.event.end;

    if (!task || !newEndDate) {
      info.revert();
      return;
    }

    // For now, just revert since we're using allDay events
    // In the future, this could update task end_date or duration
    info.revert();
    toast.info('Multi-day tasks not yet supported');
  };

  // Filter toggle handlers
  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: number) => {
    setPriorityFilters((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setStatusFilters(['todo', 'in_progress', 'done', 'blocked']);
    setPriorityFilters([1, 2, 3, 4]);
    setShowOverdueOnly(false);
  };

  const hasActiveFilters =
    statusFilters.length < 4 || priorityFilters.length < 4 || showOverdueOnly;

  // Handle event drag start - disable default mirror and create custom one
  const handleEventDragStart = (info: any) => {
    // Get the original element dimensions
    const originalEl = info.el as HTMLElement;
    const rect = originalEl.getBoundingClientRect();

    // Create custom drag element
    const customMirror = originalEl.cloneNode(true) as HTMLElement;
    customMirror.id = 'custom-drag-mirror';
    customMirror.style.position = 'fixed';
    customMirror.style.zIndex = '9999';
    customMirror.style.pointerEvents = 'none';
    customMirror.style.opacity = '0.9';
    customMirror.style.width = `${rect.width}px`;
    customMirror.style.height = `${rect.height}px`;

    document.body.appendChild(customMirror);

    const offsetX = rect.width / 2;
    const offsetY = rect.height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      // Aggressively hide ALL FullCalendar mirrors
      document.querySelectorAll('.fc-event-mirror').forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });

      // Position our custom mirror centered on cursor
      customMirror.style.left = `${e.clientX - offsetX}px`;
      customMirror.style.top = `${e.clientY - offsetY}px`;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      customMirror.remove();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className={cn('bg-card rounded-xl border', className)}>
      {/* Custom Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-bold">{currentTitle}</h2>
          <Button variant="outline" onClick={handleToday} size="sm" className="ml-2">
            Today
          </Button>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex items-center gap-2">
          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={hasActiveFilters ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1">
                    Active
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Status Filters */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Status
                  </Label>
                  <div className="space-y-2">
                    {['todo', 'in_progress', 'done', 'blocked'].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={statusFilters.includes(status)}
                          onCheckedChange={() => toggleStatusFilter(status)}
                        />
                        <label
                          htmlFor={`status-${status}`}
                          className="text-sm font-normal capitalize cursor-pointer"
                        >
                          {status.replace('_', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Filters */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Priority
                  </Label>
                  <div className="space-y-2">
                    {[
                      { value: 4, label: 'Urgent' },
                      { value: 3, label: 'High' },
                      { value: 2, label: 'Medium' },
                      { value: 1, label: 'Low' },
                    ].map((priority) => (
                      <div key={priority.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${priority.value}`}
                          checked={priorityFilters.includes(priority.value)}
                          onCheckedChange={() => togglePriorityFilter(priority.value)}
                        />
                        <label
                          htmlFor={`priority-${priority.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {priority.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overdue Filter */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="overdue-only"
                      checked={showOverdueOnly}
                      onCheckedChange={(checked) =>
                        setShowOverdueOnly(checked as boolean)
                      }
                    />
                    <label
                      htmlFor="overdue-only"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Show overdue only
                    </label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* View Buttons */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={currentView === 'dayGridMonth' ? 'default' : 'ghost'}
              onClick={() => handleViewChange('dayGridMonth')}
              size="sm"
              className="h-7"
            >
              Month
            </Button>
            <Button
              variant={currentView === 'timeGridWeek' ? 'default' : 'ghost'}
              onClick={() => handleViewChange('timeGridWeek')}
              size="sm"
              className="h-7"
            >
              Week
            </Button>
            <Button
              variant={currentView === 'timeGridDay' ? 'default' : 'ghost'}
              onClick={() => handleViewChange('timeGridDay')}
              size="sm"
              className="h-7"
            >
              Day
            </Button>
            <Button
              variant={currentView === 'listWeek' ? 'default' : 'ghost'}
              onClick={() => handleViewChange('listWeek')}
              size="sm"
              className="h-7"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar - NO PADDING to avoid drag offset */}
      <div className="modern-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false} // We use custom header
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height="calc(100vh - 280px)"
          editable={true}
          droppable={true}
          eventDragStart={handleEventDragStart}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          eventDurationEditable={false}
          eventStartEditable={true}
          eventOverlap={true}
          dragScroll={false}
          longPressDelay={0}
          eventLongPressDelay={0}
          selectLongPressDelay={0}
          dragRevertDuration={200}
          datesSet={(info) => {
            setCurrentTitle(info.view.title);
          }}
          eventContent={(eventInfo) => {
            const { task, isOverdue, noDepartment } = eventInfo.event.extendedProps;
            return (
              <div className="fc-event-content-custom">
                <div className="fc-event-title-wrapper">
                  {noDepartment && <span className="text-yellow-500 mr-1" title="No department">⚠️</span>}
                  <span className="fc-event-title">{eventInfo.event.title}</span>
                  {isOverdue && (
                    <Badge variant="destructive" className="fc-event-badge">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            );
          }}
          eventDidMount={(info) => {
            const { task } = info.event.extendedProps;
            if (task) {
              // Create tooltip content
              const tooltipContent = `
                <div class="task-calendar-tooltip">
                  <div class="font-semibold mb-1">${task.title}</div>
                  <div class="text-xs space-y-1">
                    <div><span class="font-medium">Status:</span> ${task.status.replace('_', ' ')}</div>
                    <div><span class="font-medium">Priority:</span> ${
                      task.priority === 4 ? 'Urgent' :
                      task.priority === 3 ? 'High' :
                      task.priority === 2 ? 'Medium' : 'Low'
                    }</div>
                    ${task.assigned_to_users_detail?.length > 0
                      ? `<div><span class="font-medium">Assigned to:</span> ${task.assigned_to_users_detail.map(u => u.full_name || u.email).join(', ')}</div>`
                      : ''
                    }
                    ${task.description
                      ? `<div class="mt-1 pt-1 border-t"><span class="font-medium">Description:</span> ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}</div>`
                      : ''
                    }
                  </div>
                </div>
              `;

              // Set tooltip title
              info.el.setAttribute('title', tooltipContent);
              info.el.setAttribute('data-tooltip', 'true');
            }
          }}
        />
      </div>
    </div>
  );
}
