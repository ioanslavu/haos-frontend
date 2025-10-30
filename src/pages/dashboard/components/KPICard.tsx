
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
      "relative overflow-hidden rounded-2xl backdrop-blur-xl border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]",
      variant === 'warning'
        ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10"
        : "bg-gradient-to-br from-blue-500/10 to-purple-500/10"
    )}>
      {/* Gradient accent */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br to-transparent",
        variant === 'warning' ? "from-amber-400/20" : "from-blue-400/20"
      )} />

      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground mb-3">{title}</p>
            <div>
              <p className={cn(
                "text-3xl font-bold",
                variant === 'warning'
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              )}>{value}</p>
              {valueSubtext && (
                <p className="text-sm text-muted-foreground mt-1 font-medium">{valueSubtext}</p>
              )}
            </div>
          </div>
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg",
            variant === 'warning'
              ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20"
              : "bg-gradient-to-br from-blue-500/20 to-purple-500/20"
          )}>
            <Icon className={cn(
              "h-7 w-7",
              variant === 'warning' ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
            )} />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm font-semibold border-0",
              changeType === 'positive' && "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400",
              changeType === 'negative' && "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-600 dark:text-red-400",
              changeType === 'neutral' && "bg-muted/50 text-muted-foreground"
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {change}
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
};
