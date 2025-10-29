
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            My Tasks
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-600">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => {
            const TypeIcon = getTypeIcon(task.type);
            return (
              <div 
                key={task.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  task.completed 
                    ? 'border-slate-200 bg-slate-50/50 opacity-60' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Checkbox 
                  checked={task.completed}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <TypeIcon className="h-4 w-4 text-slate-500" />
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <h4 className={`font-medium text-sm mb-1 ${
                    task.completed ? 'line-through text-slate-500' : 'text-slate-900'
                  }`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>👤 {task.assignee}</span>
                    <span>📅 {task.dueDate}</span>
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
