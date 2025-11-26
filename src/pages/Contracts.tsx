import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Search, X, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { NoContractsEmptyState, ErrorEmptyState } from '@/components/ui/empty-states-presets';
import { EditContractDialog } from '@/components/contracts/EditContractDialog';
import { RegenerateContractDialog } from '@/components/contracts/RegenerateContractDialog';
import { SendForSignatureDialog } from '@/components/contracts/SendForSignatureDialog';
import { SignatureStatusDialog } from '@/components/contracts/SignatureStatusDialog';
import { ContractDetailSheet } from '@/components/contracts/ContractDetailSheet';
import { ContractsTable, type ContractWithAnnexes } from './contracts/components';
import { useContracts, useDeleteContract } from '@/api/hooks/useContracts';
import { useAuthStore } from '@/stores/authStore';
import { useMyContractsMatrix } from '@/api/hooks/useContractsRBAC';
import { ContractListItem } from '@/api/services/contracts.service';
import { useDebounce } from '@/hooks/use-debounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

export default function ContractsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Expansion state - default all expanded
  const [expandedContracts, setExpandedContracts] = useState<Set<number>>(new Set());
  const [initialExpansionDone, setInitialExpansionDone] = useState(false);

  const [editContract, setEditContract] = useState<ContractListItem | null>(null);
  const [regenerateContract, setRegenerateContract] = useState<ContractListItem | null>(null);
  const [sendForSignatureContract, setSendForSignatureContract] = useState<ContractListItem | null>(null);
  const [signatureStatusContract, setSignatureStatusContract] = useState<ContractListItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<ContractListItem | null>(null);
  const [detailSheetContractId, setDetailSheetContractId] = useState<number | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Build API params
  const apiParams = useMemo(() => {
    const params: Record<string, unknown> = {};

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (statusFilter && statusFilter !== 'all') {
      params.status = statusFilter;
    }

    params.ordering = '-created_at';

    return params;
  }, [debouncedSearch, statusFilter]);

  const { data: contracts, isLoading, error, refetch } = useContracts(apiParams);

  // Group contracts with their annexes
  const groupedContracts = useMemo(() => {
    if (!contracts) return [];

    // Separate master contracts and annexes
    const masters: ContractListItem[] = [];
    const annexesByParent: Map<number, ContractListItem[]> = new Map();

    contracts.forEach(contract => {
      if (contract.is_annex && contract.parent_contract) {
        // It's an annex - group it by parent
        const existing = annexesByParent.get(contract.parent_contract) || [];
        existing.push(contract);
        annexesByParent.set(contract.parent_contract, existing);
      } else {
        // It's a master contract (or standalone)
        masters.push(contract);
      }
    });

    // Combine masters with their annexes
    const result: ContractWithAnnexes[] = masters.map(master => ({
      ...master,
      annexes: annexesByParent.get(master.id) || [],
    }));

    // Sort annexes by created_at within each group
    result.forEach(contract => {
      contract.annexes.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return result;
  }, [contracts]);

  // Default expand all contracts with annexes on initial load
  useEffect(() => {
    if (!initialExpansionDone && groupedContracts.length > 0) {
      const contractsWithAnnexes = groupedContracts
        .filter(c => c.annexes.length > 0)
        .map(c => c.id);
      setExpandedContracts(new Set(contractsWithAnnexes));
      setInitialExpansionDone(true);
    }
  }, [groupedContracts, initialExpansionDone]);

  // Handle URL param for opening specific contract detail
  useEffect(() => {
    const contractParam = searchParams.get('contract');
    if (contractParam && contracts) {
      const contractId = parseInt(contractParam, 10);
      if (!isNaN(contractId)) {
        setDetailSheetContractId(contractId);
        setDetailSheetOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, contracts, setSearchParams]);

  const deleteContractMutation = useDeleteContract();
  const currentUser = useAuthStore((s) => s.user);
  const { data: myMatrix } = useMyContractsMatrix(currentUser?.id);

  // Safety cleanup: Remove pointer-events: none from body when all dialogs are closed
  useEffect(() => {
    const allDialogsClosed = !editContract && !regenerateContract && !sendForSignatureContract && !signatureStatusContract && !deleteDialogOpen && !detailSheetOpen;

    if (allDialogsClosed) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [editContract, regenerateContract, sendForSignatureContract, signatureStatusContract, deleteDialogOpen, detailSheetOpen]);

  const canDo = useCallback((contract: ContractListItem, action: 'publish' | 'send' | 'update' | 'delete' | 'regenerate') => {
    if (currentUser?.role === 'administrator') return true;
    if (!myMatrix || !myMatrix.policies) return false;
    const templateName = contract.template_name || '';
    const row = myMatrix.policies.find(p => p.contract_type === templateName);
    if (!row) return false;
    switch (action) {
      case 'publish': return !!row.can_publish;
      case 'send': return !!row.can_send;
      case 'update': return !!row.can_update;
      case 'delete': return !!row.can_delete;
      case 'regenerate': return !!row.can_regenerate;
    }
  }, [currentUser, myMatrix]);

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    try {
      await deleteContractMutation.mutateAsync(contractToDelete.id);
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error) {
      console.error('Failed to delete contract:', error);
    }
  };

  // Expansion handlers
  const toggleExpanded = useCallback((contractId: number) => {
    setExpandedContracts(prev => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
      } else {
        next.add(contractId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allWithAnnexes = groupedContracts
      .filter(c => c.annexes.length > 0)
      .map(c => c.id);
    setExpandedContracts(new Set(allWithAnnexes));
  }, [groupedContracts]);

  const collapseAll = useCallback(() => {
    setExpandedContracts(new Set());
  }, []);

  const hasActiveFilters = statusFilter !== 'all' || search;
  const contractsWithAnnexes = groupedContracts.filter(c => c.annexes.length > 0);
  const allExpanded = contractsWithAnnexes.length > 0 &&
    contractsWithAnnexes.every(c => expandedContracts.has(c.id));
  const totalCount = contracts?.length || 0;
  const annexCount = contracts?.filter(c => c.is_annex).length || 0;
  const masterCount = totalCount - annexCount;

  return (
    <AppLayout>
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
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
                <span className="text-sm text-muted-foreground">
                  {masterCount} contract{masterCount !== 1 ? 's' : ''}
                  {annexCount > 0 && ` + ${annexCount} annex${annexCount !== 1 ? 'es' : ''}`}
                </span>
              </div>

              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
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

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-9 rounded-xl backdrop-blur-sm bg-background/50 border-white/10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_signature">Pending Signature</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setSearch(''); setStatusFilter('all'); }}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <ErrorEmptyState
            errorMessage="Failed to load contracts"
            onRetry={() => refetch()}
          />
        )}

        {/* Contracts Table */}
        {!error && (
          <>
            {isLoading ? (
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden p-4">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ) : groupedContracts.length === 0 && !hasActiveFilters ? (
              <NoContractsEmptyState
                onPrimaryAction={() => {
                  window.location.href = '/templates';
                }}
              />
            ) : groupedContracts.length === 0 ? (
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No contracts found matching your filters.</p>
                </div>
              </Card>
            ) : (
              <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
                {/* Expand/Collapse All Toolbar */}
                {contractsWithAnnexes.length > 0 && (
                  <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-border/40">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={allExpanded ? collapseAll : expandAll}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {allExpanded ? (
                        <>
                          <ChevronsDownUp className="h-3.5 w-3.5 mr-1.5" />
                          Collapse All
                        </>
                      ) : (
                        <>
                          <ChevronsUpDown className="h-3.5 w-3.5 mr-1.5" />
                          Expand All
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <ContractsTable
                  contracts={groupedContracts}
                  expandedContracts={expandedContracts}
                  onToggleExpand={toggleExpanded}
                  onContractClick={(contract) => {
                    setDetailSheetContractId(contract.id);
                    setDetailSheetOpen(true);
                  }}
                  onViewDetails={(contract) => {
                    setDetailSheetContractId(contract.id);
                    setDetailSheetOpen(true);
                  }}
                  onEdit={(contract) => setEditContract(contract)}
                  onRegenerate={(contract) => setRegenerateContract(contract)}
                  onSendForSignature={(contract) => setSendForSignatureContract(contract)}
                  onDelete={(contract) => {
                    setContractToDelete(contract);
                    setDeleteDialogOpen(true);
                  }}
                  canDo={canDo}
                />
              </Card>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <EditContractDialog
        contract={editContract}
        open={!!editContract}
        onOpenChange={(open) => {
          if (!open) {
            setTimeout(() => setEditContract(null), 200);
          }
        }}
      />
      <RegenerateContractDialog
        contract={regenerateContract}
        open={!!regenerateContract}
        onOpenChange={(open) => {
          if (!open) {
            setTimeout(() => setRegenerateContract(null), 200);
          }
        }}
      />
      <SendForSignatureDialog
        contract={sendForSignatureContract}
        open={!!sendForSignatureContract}
        onOpenChange={(open) => {
          if (!open) {
            setTimeout(() => setSendForSignatureContract(null), 200);
          }
        }}
      />
      <SignatureStatusDialog
        contract={signatureStatusContract}
        open={!!signatureStatusContract}
        onOpenChange={(open) => {
          if (!open) {
            setTimeout(() => setSignatureStatusContract(null), 200);
          }
        }}
      />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contractToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContract}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteContractMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contract Detail Sheet */}
      <ContractDetailSheet
        contractId={detailSheetContractId}
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) {
            setTimeout(() => setDetailSheetContractId(null), 200);
          }
        }}
        onAnnexClick={(annexId) => {
          setDetailSheetContractId(annexId);
        }}
      />
    </AppLayout>
  );
}
