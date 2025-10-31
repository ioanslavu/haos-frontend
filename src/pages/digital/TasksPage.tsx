import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, CalendarIcon, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TasksTab } from '../digital-dashboard/tabs/TasksTab';
import { TaskFormDialog } from './components/TaskFormDialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DigitalTasksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  // Clear custom date range
  const clearDateRange = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Clear all more filters
  const clearMoreFilters = () => {
    setFilterPriority('all');
    clearDateRange();
  };

  // Count active filters
  const activeFiltersCount = [
    startDate || endDate ? 1 : 0,
    filterPriority !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Digital Tasks
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Track and manage all digital tasks
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              onClick={() => setTaskFormOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Modern Glassmorphic Filters */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-12 h-12 rounded-xl bg-background/50 border-white/10 focus:border-blue-500/50 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Sheet open={showMoreFilters} onOpenChange={setShowMoreFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-12 rounded-xl relative">
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">More Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center" variant="default">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Additional Filters</SheetTitle>
                  <SheetDescription>
                    Filter tasks by due date and priority
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Due Date Range Filters */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Due Date Range</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'PP') : 'From date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'PP') : 'To date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            disabled={(date) => startDate ? date < startDate : false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {(startDate || endDate) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDateRange}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear dates
                      </Button>
                    )}
                  </div>

                  {/* Priority Filter */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Priority</h3>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear All Button */}
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearMoreFilters}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear all filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Tab Content */}
        <TasksTab
          searchQuery={searchQuery}
          filterStatus={filterStatus}
          filterPriority={filterPriority}
          startDate={startDate}
          endDate={endDate}
          onNewTask={() => setTaskFormOpen(true)}
        />

        {/* Task Form Dialog */}
        <TaskFormDialog
          open={taskFormOpen}
          onOpenChange={setTaskFormOpen}
          task={null}
        />
      </div>
    </AppLayout>
  );
}
