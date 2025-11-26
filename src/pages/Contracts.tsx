import React, { useState, useMemo, useEffect } from 'react';
import { Send, Eye, Edit, Trash2, RefreshCw, MoreVertical } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge-examples';
import { NoContractsEmptyState, NoSearchResultsEmptyState, ErrorEmptyState } from '@/components/ui/empty-states-presets';
import { GenerateContractDialog } from '@/components/contracts/GenerateContractDialog';
import { EditContractDialog } from '@/components/contracts/EditContractDialog';
import { RegenerateContractDialog } from '@/components/contracts/RegenerateContractDialog';
import { SendForSignatureDialog } from '@/components/contracts/SendForSignatureDialog';
import { SignatureStatusDialog } from '@/components/contracts/SignatureStatusDialog';
import { ContractDetailSheet } from '@/components/contracts/ContractDetailSheet';
import { useContracts, useTemplates, useDeleteContract } from '@/api/hooks/useContracts';
import { useAuthStore } from '@/stores/authStore';
import { useMyContractsMatrix } from '@/api/hooks/useContractsRBAC';
import { Contract, ContractListItem, ContractTemplate } from '@/api/services/contracts.service';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Map contract status to our StatusBadge component status
const mapContractStatus = (status: string): any => {
  const statusMap: Record<string, any> = {
    'processing': 'processing',
    'draft': 'draft',
    'pending_signature': 'pending',
    'signed': 'signed',
    'cancelled': 'cancelled',
    'failed': 'failed',
  };
  return statusMap[status] || 'inactive';
};

export default function ContractsModern() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [editContract, setEditContract] = useState<ContractListItem | null>(null);
  const [regenerateContract, setRegenerateContract] = useState<ContractListItem | null>(null);
  const [sendForSignatureContract, setSendForSignatureContract] = useState<ContractListItem | null>(null);
  const [signatureStatusContract, setSignatureStatusContract] = useState<ContractListItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<ContractListItem | null>(null);
  const [selectedRows, setSelectedRows] = useState<ContractListItem[]>([]);
  const [detailSheetContractId, setDetailSheetContractId] = useState<number | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const { data: contracts, isLoading, error, refetch } = useContracts();
  const { data: templates } = useTemplates();
  const deleteContractMutation = useDeleteContract();
  const currentUser = useAuthStore((s) => s.user);
  const { data: myMatrix } = useMyContractsMatrix(currentUser?.id);

  // Safety cleanup: Remove pointer-events: none from body when all dialogs are closed
  useEffect(() => {
    const allDialogsClosed = !editContract && !regenerateContract && !sendForSignatureContract && !signatureStatusContract && !deleteDialogOpen && !detailSheetOpen;

    if (allDialogsClosed) {
      // Small delay to let animations finish
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [editContract, regenerateContract, sendForSignatureContract, signatureStatusContract, deleteDialogOpen, detailSheetOpen]);

  const canDo = (contract: ContractListItem, action: 'publish' | 'send' | 'update' | 'delete' | 'regenerate') => {
    // Admin override
    if (currentUser?.role === 'administrator') return true;
    if (!myMatrix || !myMatrix.policies) return false;
    // Use template name for permission matching since contract_type no longer exists
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
  };

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

  const handleGenerateFromTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setShowGenerateDialog(true);
  };

  const handleBulkDelete = () => {
    // Bulk delete implementation
  };

  // Filter contracts
  const filteredContracts = contracts?.filter(contract => {
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesStatus;
  }) || [];

  // Define columns for DataTable (memoized to prevent infinite re-renders)
  const columns: ColumnDef<ContractListItem>[] = useMemo(() => [
    {
      accessorKey: 'contract_number',
      header: 'Contract #',
      cell: ({ row }) => {
        const contract = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-mono text-sm">{row.getValue('contract_number')}</span>
            {contract.is_annex && (
              <span className="text-xs text-muted-foreground">
                Annex of {contract.parent_contract_number}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('title')}</span>
      ),
    },
    {
      accessorKey: 'counterparty_name',
      header: 'Counterparty',
      cell: ({ row }) => {
        const name = row.getValue('counterparty_name') as string | null;
        return name ? (
          <span className="text-sm">{name}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: 'template_name',
      header: 'Template',
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('template_name')}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={mapContractStatus(status)} variant="subtle" />
            {status === 'processing' && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'start_date',
      header: 'Start Date',
      cell: ({ row }) => {
        const date = row.getValue('start_date') as string | null;
        return date ? (
          <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return <span>{date.toLocaleDateString()}</span>;
      },
    },
    {
      accessorKey: 'created_by_email',
      header: 'Creator',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const contract = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setDetailSheetContractId(contract.id);
                  setDetailSheetOpen(true);
                }}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditContract(contract)} disabled={!canDo(contract, 'update')}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {contract.status === 'draft' && (
                  <>
                    <DropdownMenuItem onClick={() => setRegenerateContract(contract)} disabled={!canDo(contract, 'regenerate')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSendForSignatureContract(contract)} disabled={!canDo(contract, 'send')}>
                      <Send className="h-4 w-4 mr-2" />
                      Send for Signature
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setContractToDelete(contract);
                    setDeleteDialogOpen(true);
                  }}
                  disabled={!canDo(contract, 'delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [currentUser, myMatrix]);

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Contracts
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                  Manage generated contracts and signatures
                </p>
              </div>
              <div className="flex gap-3">
                {templates && templates.length > 0 && (
                  <Select onValueChange={(value) => {
                    const template = templates.find(t => t.id.toString() === value);
                    if (template) handleGenerateFromTemplate(template);
                  }}>
                    <SelectTrigger className="w-[200px] backdrop-blur-sm bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 border-white/20">
                      <SelectValue placeholder="Generate from template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.filter(t => t.is_active).map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl p-4">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-semibold">Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] backdrop-blur-sm bg-background/50 border-white/20 dark:border-white/10">
                <SelectValue />
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
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <ErrorEmptyState
            errorMessage="Failed to load contracts"
            onRetry={() => refetch()}
          />
        )}

        {/* Contracts Table or Empty State */}
        {!error && (
          contracts && contracts.length === 0 ? (
            <NoContractsEmptyState
              onPrimaryAction={() => {
                if (templates && templates[0]) {
                  handleGenerateFromTemplate(templates[0]);
                }
              }}
              onSecondaryAction={() => {
                window.location.href = '/templates';
              }}
            />
          ) : (
            <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
              <DataTable
                columns={columns}
                data={filteredContracts}
                isLoading={isLoading}
                searchKey="title"
                searchPlaceholder="Search contracts..."
                showDensityToggle
                showColumnToggle
                pagination
                pageSize={20}
                ariaLabel="Contracts table"
                onRowSelectionChange={(rows) => {
                  setSelectedRows(rows.map(r => r.original));
                }}
                bulkActions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-6 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </Button>
                }
                emptyState={
                  <NoSearchResultsEmptyState
                    onClearSearch={() => {
                      // Clear handled by DataTable
                    }}
                  />
                }
              />
            </Card>
          )
        )}
      </div>

      {/* Dialogs */}
      <GenerateContractDialog
        template={selectedTemplate}
        open={showGenerateDialog}
        onOpenChange={(open) => {
          setShowGenerateDialog(open);
          if (!open) {
            setTimeout(() => setSelectedTemplate(null), 200);
          }
        }}
      />
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
      />
    </AppLayout>
  );
}
