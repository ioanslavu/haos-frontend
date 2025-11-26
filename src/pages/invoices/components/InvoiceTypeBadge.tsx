import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { InvoiceType } from '@/types/invoice';

interface InvoiceTypeBadgeProps {
  type: InvoiceType;
  className?: string;
  showIcon?: boolean;
}

const typeConfig: Record<InvoiceType, { label: string; className: string; icon: typeof ArrowDownLeft }> = {
  income: {
    label: 'Income',
    className: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: ArrowDownLeft,
  },
  expense: {
    label: 'Expense',
    className: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
    icon: ArrowUpRight,
  },
};

export function InvoiceTypeBadge({ type, className, showIcon = true }: InvoiceTypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.expense;
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
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
