
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
    <Card className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Alerts & Notifications
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-amber-600 dark:text-amber-400 hover:bg-white/20 dark:hover:bg-white/10">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all duration-300 hover:scale-[1.01]">
              <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <alert.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="rounded-full backdrop-blur-sm border-0 font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300">
                    {alert.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">{alert.time}</span>
                </div>
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
