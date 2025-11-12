import { useNoteStatistics } from '@/api/hooks/useNotes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Archive, Pin, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const NotesInsights = () => {
  const { data: stats, isLoading } = useNoteStatistics();

  if (isLoading) {
    return <Skeleton className="h-20 rounded-2xl" />;
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: FileText,
      label: 'Total',
      value: stats.total_notes,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Pin,
      label: 'Pinned',
      value: stats.total_pinned,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      icon: Archive,
      label: 'Archived',
      value: stats.total_archived,
      iconColor: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
    },
    {
      icon: TrendingUp,
      label: 'This Week',
      value: stats.notes_this_week,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  return (
    <div className="flex items-center gap-5">
      {statItems.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-2.5">
          {index > 0 && <div className="h-5 w-px bg-border/50" />}
          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-semibold">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
