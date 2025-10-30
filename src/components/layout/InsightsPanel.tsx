
import React from 'react';
import { X, TrendingUp, AlertCircle, Clock, DollarSign, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface InsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <aside className="w-80 bg-background border-l border flex flex-col dark:bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">AI Insights</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="touch-target">
            <X className="h-4 w-4" />
            <span className="sr-only">Close insights panel</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">$45,230</span>
                  <div className="flex items-center text-green-600 text-xs">
                    <ArrowUpRight className="h-3 w-3" />
                    12.5%
                  </div>
                </div>
              </div>
              <Progress value={75} className="h-1" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Contracts</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">127</span>
                  <div className="flex items-center text-green-600 text-xs">
                    <ArrowUpRight className="h-3 w-3" />
                    3
                  </div>
                </div>
              </div>
              <Progress value={63} className="h-1" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Royalties</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-warning">$8,450</span>
                  <div className="flex items-center text-red-600 text-xs">
                    <ArrowDownRight className="h-3 w-3" />
                    5.2%
                  </div>
                </div>
              </div>
              <Progress value={28} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                High
              </Badge>
              <div className="flex-1 text-sm">
                <p className="font-medium">Contract Expiring</p>
                <p className="text-slate-600 text-xs">Artist XYZ contract expires in 3 days</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Med
              </Badge>
              <div className="flex-1 text-sm">
                <p className="font-medium">Payment Overdue</p>
                <p className="text-slate-600 text-xs">Royalty payment 5 days overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-900">Contract signed by Artist ABC</span>
              </div>
              <div className="text-xs text-slate-500 ml-4">2 hours ago</div>
            </div>
            
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-900">New royalty statement uploaded</span>
              </div>
              <div className="text-xs text-slate-500 ml-4">4 hours ago</div>
            </div>
            
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-slate-900">Studio session booked</span>
              </div>
              <div className="text-xs text-slate-500 ml-4">6 hours ago</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
};
