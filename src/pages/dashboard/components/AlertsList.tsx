
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, DollarSign, FileText } from 'lucide-react';

export const AlertsList: React.FC = () => {
  const alerts = [
    {
      id: 1,
      type: 'contract',
      priority: 'high',
      title: 'Contract Expiring Soon',
      description: 'Artist XYZ recording contract expires in 3 days',
      time: '2 hours ago',
      icon: FileText,
    },
    {
      id: 2,
      type: 'payment',
      priority: 'medium',
      title: 'Overdue Payment',
      description: 'Royalty payment to Artist ABC is 5 days overdue',
      time: '1 day ago',
      icon: DollarSign,
    },
    {
      id: 3,
      type: 'system',
      priority: 'low',
      title: 'Statement Processing',
      description: 'Monthly streaming statement ready for review',
      time: '2 days ago',
      icon: Clock,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Alerts & Notifications
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-600">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <alert.icon className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={getPriorityColor(alert.priority)}>
                    {alert.priority}
                  </Badge>
                  <span className="text-xs text-slate-500">{alert.time}</span>
                </div>
                <h4 className="font-medium text-slate-900 text-sm">{alert.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
