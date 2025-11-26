import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInvoices } from '@/api/hooks/useInvoices';
import { InvoiceFilters, InvoiceType, InvoiceStatus } from '@/types/invoice';
import { useDebounce } from '@/hooks/use-debounce';
import { InvoiceStatusBadge } from './components/InvoiceStatusBadge';
import { InvoiceTypeBadge } from './components/InvoiceTypeBadge';
import { formatDistanceToNow } from 'date-fns';

const typeOptions: { value: InvoiceType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

const statusOptions: { value: InvoiceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

const currencySymbols: Record<string, string> = {
  EUR: '\u20AC',
  USD: '$',
  GBP: '\u00A3',
  RON: 'RON',
};

function formatAmount(amount: string | null, currency: string): string {
  if (!amount) return '-';
  const num = parseFloat(amount);
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<InvoiceType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const filters: InvoiceFilters = {
    search: debouncedSearch || undefined,
    invoice_type: selectedType === 'all' ? undefined : selectedType,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    page: currentPage,
    page_size: 20,
  };

  const { data, isLoading, error } = useInvoices(filters);

  const invoices = data?.results || [];
  const totalCount = data?.count || 0;

  return (
    <AppLayout
      title="Invoices"
      actions={
        <Button onClick={() => navigate('/invoices/new')} className="shadow-lg">
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      }
    >
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4 sm:p-6 lg:p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Invoices
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                  Track income and expenses across your organization
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Glassmorphic Filters */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number or name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-12 rounded-xl bg-background/50 border-white/10"
                />
              </div>
            </div>
            <Select
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value as InvoiceType | 'all');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40 h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10">
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value as InvoiceStatus | 'all');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-44 h-12 rounded-xl bg-background/50 border-white/10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Invoices Table Card */}
        <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">All Invoices</CardTitle>
              <span className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'invoice' : 'invoices'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                Failed to load invoices. Please try again.
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {debouncedSearch || selectedType !== 'all' || selectedStatus !== 'all'
                    ? 'No invoices found matching your filters.'
                    : 'No invoices yet. Create your first invoice to get started.'}
                </p>
                {!debouncedSearch && selectedType === 'all' && selectedStatus === 'all' && (
                  <Button onClick={() => navigate('/invoices/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Invoice
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-white/10">
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-white/10"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <TableCell className="font-medium font-mono text-sm">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          <InvoiceTypeBadge type={invoice.invoice_type} />
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {invoice.name}
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.amount ? (
                            <span className={invoice.invoice_type === 'income' ? 'text-emerald-600' : 'text-orange-600'}>
                              {invoice.invoice_type === 'income' ? '+' : '-'}
                              {formatAmount(invoice.amount, invoice.currency)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm italic">
                              Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invoice.department_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(invoice.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalCount > 20 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(totalCount / 20)}
                </span>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={currentPage >= Math.ceil(totalCount / 20)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
