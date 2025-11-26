import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InvoiceStatus } from '@/types/invoice';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
  },
  uploaded: {
    label: 'Uploaded',
    className: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  paid: {
    label: 'Paid',
    className: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  },
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
