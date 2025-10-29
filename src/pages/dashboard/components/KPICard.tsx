
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  valueSubtext?: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  variant?: 'default' | 'warning';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  valueSubtext,
  change,
  changeType,
  icon: Icon,
  variant = 'default'
}) => {
  const getTrendIcon = () => {
    switch (changeType) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      variant === 'warning' && "border-amber-200 bg-amber-50/30"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{value}</p>
              {valueSubtext && (
                <p className="text-sm text-slate-500 mt-1">{valueSubtext}</p>
              )}
            </div>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            variant === 'warning' 
              ? "bg-amber-100 text-amber-600" 
              : "bg-blue-100 text-blue-600"
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1",
              changeType === 'positive' && "border-green-200 bg-green-50 text-green-700",
              changeType === 'negative' && "border-red-200 bg-red-50 text-red-700",
              changeType === 'neutral' && "border-slate-200 bg-slate-50 text-slate-700"
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {change}
          </Badge>
          <span className="text-xs text-slate-500">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
};
