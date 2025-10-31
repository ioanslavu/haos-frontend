
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, User, Calendar, FileText } from 'lucide-react';

export const TasksList: React.FC = () => {
  const tasks = [
    {
      id: 1,
      title: 'Review and approve Artist XYZ contract amendments',
      assignee: 'You',
      dueDate: 'Today',
      priority: 'high',
      type: 'contract',
      completed: false,
    },
    {
      id: 2,
      title: 'Process Q2 streaming royalty statements',
      assignee: 'Sarah J.',
      dueDate: 'Tomorrow',
      priority: 'medium',
      type: 'finance',
      completed: false,
    },
    {
      id: 3,
      title: 'Update artist contact information in CRM',
      assignee: 'Mike D.',
      dueDate: 'This week',
      priority: 'low',
      type: 'crm',
      completed: true,
    },
    {
      id: 4,
      title: 'Schedule studio session for new recording',
      assignee: 'You',
      dueDate: 'Next week',
      priority: 'medium',
      type: 'studio',
      completed: false,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return FileText;
      case 'finance':
        return CheckSquare;
      case 'studio':
        return Calendar;
      default:
        return User;
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-transparent" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            My Tasks
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:bg-white/20 dark:hover:bg-white/10">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-3">
          {tasks.map((task) => {
            const TypeIcon = getTypeIcon(task.type);
            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-xl border border-white/20 dark:border-white/10 backdrop-blur-sm transition-all duration-300 ${
                  task.completed
                    ? 'bg-white/20 dark:bg-slate-900/20 opacity-60'
                    : 'bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 hover:scale-[1.01]'
                }`}
              >
                <Checkbox
                  checked={task.completed}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                      <TypeIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <Badge variant="outline" className="rounded-full backdrop-blur-sm border-0 font-semibold bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-700 dark:text-indigo-300">
                      {task.priority}
                    </Badge>
                  </div>
                  <h4 className={`font-semibold text-sm mb-1 ${
                    task.completed ? 'line-through text-muted-foreground' : ''
                  }`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
