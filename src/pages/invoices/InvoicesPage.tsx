import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Receipt, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { GenericTable, type ColumnDef, type SortState, type FilterState } from '@/components/tables';
import { useInvoices } from '@/api/hooks/useInvoices';
import { Invoice, InvoiceFilters, InvoiceType, InvoiceStatus, InvoiceViewMode, InvoiceOriginFilter } from '@/types/invoice';
import { useDebounce } from '@/hooks/use-debounce';
import { InvoiceStatusBadge } from './components/InvoiceStatusBadge';
import { InvoiceTypeBadge } from './components/InvoiceTypeBadge';
import { InvoiceViewToggle } from './components/InvoiceViewToggle';
import { InvoiceOriginTabs } from './components/InvoiceOriginTabs';
import { InvoiceClientCell } from './components/InvoiceClientCell';
import { InvoicesGroupedView } from './components/InvoicesGroupedView';
import { InvoicesKanbanView } from './components/InvoicesKanbanView';
import { formatDistanceToNow } from 'date-fns';

const typeFilterOptions = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

const statusFilterOptions = [
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

// Load view mode from localStorage
function getInitialViewMode(): InvoiceViewMode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('invoices-view-mode');
    if (stored === 'table' || stored === 'grouped' || stored === 'kanban') {
      return stored;
    }
  }
  return 'table';
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<SortState | null>({ columnId: 'created_at', direction: 'desc' });
  const [filterState, setFilterState] = useState<FilterState>({});
  const [viewMode, setViewMode] = useState<InvoiceViewMode>(getInitialViewMode);
  const [originFilter, setOriginFilter] = useState<InvoiceOriginFilter>('all');

  const debouncedSearch = useDebounce(search, 300);

  // Handle view mode change and persist
  const handleViewModeChange = useCallback((mode: InvoiceViewMode) => {
    setViewMode(mode);
    localStorage.setItem('invoices-view-mode', mode);
  }, []);

  // Build API params from state
  const apiParams = useMemo(() => {
    const params: InvoiceFilters = {
      page_size: 100,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (filterState.invoice_type) {
      params.invoice_type = filterState.invoice_type as InvoiceType;
    }

    if (filterState.status) {
      params.status = filterState.status as InvoiceStatus;
    }

    if (sortState) {
      params.ordering = sortState.direction === 'desc' ? `-${sortState.columnId}` : sortState.columnId;
    }

    // Apply origin filter
    if (originFilter === 'campaigns') {
      // Use combined 'campaigns' filter (includes both campaign and subcampaign)
      params.origin = 'campaigns';
    } else if (originFilter === 'distributions') {
      params.origin = 'distribution';
    }

    return params;
  }, [debouncedSearch, filterState, sortState, originFilter]);

  const { data, isLoading } = useInvoices(apiParams);

  const invoices = data?.results || [];
  const totalCount = data?.count || 0;

  // Calculate counts for origin tabs (client-side filtering for now)
  const originCounts = useMemo(() => {
    const all = invoices.length;
    const campaigns = invoices.filter(
      (inv) => inv.origin_type === 'campaign' || inv.origin_type === 'subcampaign'
    ).length;
    const distributions = invoices.filter(
      (inv) => inv.origin_type === 'distribution'
    ).length;
    return { all, campaigns, distributions };
  }, [invoices]);

  // Handle sort
  const handleSort = useCallback((columnId: string, direction: 'asc' | 'desc' | null) => {
    if (direction) {
      setSortState({ columnId, direction });
    } else {
      setSortState(null);
    }
  }, []);

  // Handle filter
  const handleFilter = useCallback((filters: FilterState) => {
    setFilterState(filters);
  }, []);

  // Count active filters
  const activeFiltersCount = Object.keys(filterState).length;
  const hasActiveFilters = activeFiltersCount > 0 || search || originFilter !== 'all';

  // Define columns with client column
  const columns: ColumnDef<Invoice>[] = useMemo(() => [
    {
      id: 'invoice_number',
      accessorKey: 'invoice_number',
      header: 'Invoice #',
      sortable: true,
      filterable: true,
      filterType: 'text',
      filterPlaceholder: 'Filter by number...',
      minWidth: 130,
      cell: ({ value }) => (
        <span className="font-medium font-mono text-sm">{value as string}</span>
      ),
    },
    {
      id: 'invoice_type',
      accessorKey: 'invoice_type',
      header: 'Type',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: typeFilterOptions,
      width: 100,
      cell: ({ row }) => <InvoiceTypeBadge type={row.invoice_type} />,
    },
    {
      id: 'client_name',
      accessorKey: 'client_name',
      header: 'Client',
      sortable: false,
      minWidth: 150,
      cell: ({ row }) => <InvoiceClientCell invoice={row} />,
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      sortable: true,
      filterable: true,
      filterType: 'text',
      filterPlaceholder: 'Filter by name...',
      minWidth: 180,
      cell: ({ value }) => (
        <span className="max-w-[200px] truncate block">{value as string}</span>
      ),
    },
    {
      id: 'amount',
      accessorKey: 'amount',
      header: 'Amount',
      sortable: true,
      width: 130,
      align: 'right',
      cell: ({ row }) => {
        if (!row.amount) {
          return (
            <span className="text-muted-foreground text-sm italic">Pending</span>
          );
        }
        return (
          <span className={row.invoice_type === 'income' ? 'text-emerald-600 font-medium' : 'text-orange-600 font-medium'}>
            {row.invoice_type === 'income' ? '+' : '-'}
            {formatAmount(row.amount, row.currency)}
          </span>
        );
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: statusFilterOptions,
      width: 110,
      cell: ({ row }) => <InvoiceStatusBadge status={row.status} />,
    },
    {
      id: 'department__name',
      accessorFn: (row) => row.department_name,
      header: 'Department',
      sortable: true,
      width: 120,
      cell: ({ value }) => (
        <span className="text-muted-foreground">{value as string}</span>
      ),
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Created',
      sortable: true,
      width: 120,
      cell: ({ value }) => (
        <span className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(value as string), { addSuffix: true })}
        </span>
      ),
    },
  ], []);

  // Empty state component
  const emptyState = (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground mb-4">
        {hasActiveFilters
          ? 'No invoices found matching your filters.'
          : 'No invoices yet. Create your first invoice to get started.'}
      </p>
      {!hasActiveFilters && (
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create First Invoice
        </Button>
      )}
    </div>
  );

  // Render the appropriate view
  const renderContent = () => {
    if (viewMode === 'grouped') {
      return <InvoicesGroupedView invoices={invoices} loading={isLoading} />;
    }

    if (viewMode === 'kanban') {
      return <InvoicesKanbanView invoices={invoices} loading={isLoading} />;
    }

    // Default: Table view
    return (
      <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
        <GenericTable
          columns={columns}
          data={invoices}
          getRowId={(row) => row.id}
          sortState={sortState}
          filterState={filterState}
          onSort={handleSort}
          onFilter={handleFilter}
          onRowClick={(row) => navigate(`/invoices/${row.id}`)}
          loading={isLoading}
          emptyState={emptyState}
          density="comfortable"
          stickyHeader
          stripedRows
          persistKey="invoices-table"
        />
      </Card>
    );
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 px-6 py-4 shadow-xl">
          {/* Gradient Orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-400/30 to-teal-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Title + Stats */}
              <div className="flex items-center gap-3 mr-auto">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
                <span className="text-sm text-muted-foreground">
                  {totalCount} {totalCount === 1 ? 'invoice' : 'invoices'}
                </span>
              </div>

              {/* Origin Tabs */}
              <InvoiceOriginTabs
                value={originFilter}
                onChange={setOriginFilter}
                counts={originCounts}
              />

              {/* View Mode Toggle */}
              <InvoiceViewToggle
                value={viewMode}
                onChange={handleViewModeChange}
              />

              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 rounded-xl border-white/10 bg-background/50 backdrop-blur-sm text-sm"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearch('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setSearch(''); setFilterState({}); setOriginFilter('all'); }}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </AppLayout>
  );
}
