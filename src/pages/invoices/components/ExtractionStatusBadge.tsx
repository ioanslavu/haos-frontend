import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Clock, PenLine } from 'lucide-react';
import { ExtractionStatus } from '@/types/invoice';

interface ExtractionStatusBadgeProps {
  status: ExtractionStatus;
  className?: string;
}

const statusConfig: Record<ExtractionStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: {
    label: 'Pending',
    className: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    icon: Loader2,
  },
  success: {
    label: 'Extracted',
    className: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    icon: XCircle,
  },
  manual: {
    label: 'Manual',
    className: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    icon: PenLine,
  },
};

export function ExtractionStatusBadge({ status, className }: ExtractionStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border gap-1',
        config.className,
        className
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'processing' && 'animate-spin')} />
      {config.label}
    </Badge>
  );
}
