/**
 * ContractsTable - Table view for contracts with inline annexes
 *
 * Displays master contracts with their annexes in a hierarchical format.
 * Annexes are shown as child rows with tree line connectors.
 */

import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, MoreVertical, Eye, Edit, RefreshCw, Send, Trash2, Megaphone, LinkIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge-examples';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ContractListItem } from '@/api/services/contracts.service';
import { Loader2 } from 'lucide-react';

// Map contract status to StatusBadge status
const mapContractStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'processing': 'processing',
    'draft': 'draft',
    'pending_signature': 'pending',
    'signed': 'signed',
    'cancelled': 'cancelled',
    'failed': 'failed',
  };
  return statusMap[status] || 'inactive';
};

export interface ContractWithAnnexes extends ContractListItem {
  annexes: ContractListItem[];
}

interface ContractsTableProps {
  contracts: ContractWithAnnexes[];
  expandedContracts: Set<number>;
  onToggleExpand: (contractId: number) => void;
  onContractClick: (contract: ContractListItem) => void;
  onViewDetails: (contract: ContractListItem) => void;
  onEdit: (contract: ContractListItem) => void;
  onRegenerate: (contract: ContractListItem) => void;
  onSendForSignature: (contract: ContractListItem) => void;
  onDelete: (contract: ContractListItem) => void;
  canDo: (contract: ContractListItem, action: 'publish' | 'send' | 'update' | 'delete' | 'regenerate') => boolean;
}

export function ContractsTable({
  contracts,
  expandedContracts,
  onToggleExpand,
  onContractClick,
  onViewDetails,
  onEdit,
  onRegenerate,
  onSendForSignature,
  onDelete,
  canDo,
}: ContractsTableProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 hover:bg-transparent">
            <TableHead className="w-[40px] pl-4"></TableHead>
            <TableHead className="font-semibold">Contract #</TableHead>
            <TableHead className="font-semibold">Title</TableHead>
            <TableHead className="font-semibold w-[160px]">Counterparty</TableHead>
            <TableHead className="font-semibold w-[140px]">Template</TableHead>
            <TableHead className="font-semibold w-[140px]">Origin</TableHead>
            <TableHead className="font-semibold w-[150px]">Status</TableHead>
            <TableHead className="font-semibold w-[120px]">Start Date</TableHead>
            <TableHead className="font-semibold w-[120px]">Created</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => {
            const hasAnnexes = contract.annexes.length > 0;
            const isExpanded = expandedContracts.has(contract.id);

            return (
              <>
                <ContractRow
                  key={contract.id}
                  contract={contract}
                  hasAnnexes={hasAnnexes}
                  isExpanded={isExpanded}
                  onToggleExpand={() => onToggleExpand(contract.id)}
                  onClick={() => onContractClick(contract)}
                  onViewDetails={() => onViewDetails(contract)}
                  onEdit={() => onEdit(contract)}
                  onRegenerate={() => onRegenerate(contract)}
                  onSendForSignature={() => onSendForSignature(contract)}
                  onDelete={() => onDelete(contract)}
                  canDo={canDo}
                />
                {hasAnnexes && isExpanded && contract.annexes.map((annex, index) => (
                  <AnnexRow
                    key={annex.id}
                    annex={annex}
                    isLast={index === contract.annexes.length - 1}
                    onClick={() => onContractClick(annex)}
                    onViewDetails={() => onViewDetails(annex)}
                    onEdit={() => onEdit(annex)}
                    onRegenerate={() => onRegenerate(annex)}
                    onSendForSignature={() => onSendForSignature(annex)}
                    onDelete={() => onDelete(annex)}
                    canDo={canDo}
                  />
                ))}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface ContractRowProps {
  contract: ContractWithAnnexes;
  hasAnnexes: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onSendForSignature: () => void;
  onDelete: () => void;
  canDo: (contract: ContractListItem, action: 'publish' | 'send' | 'update' | 'delete' | 'regenerate') => boolean;
}

function ContractRow({
  contract,
  hasAnnexes,
  isExpanded,
  onToggleExpand,
  onClick,
  onViewDetails,
  onEdit,
  onRegenerate,
  onSendForSignature,
  onDelete,
  canDo,
}: ContractRowProps) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/40"
      onClick={onClick}
    >
      {/* Expand/Collapse or Status indicator */}
      <TableCell className="py-3 pl-4 pr-0">
        {hasAnnexes ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        ) : (
          <div className={cn(
            "w-1 h-8 rounded-full ml-2",
            contract.status === 'signed' ? 'bg-green-500' :
            contract.status === 'pending_signature' ? 'bg-amber-500' :
            contract.status === 'draft' ? 'bg-blue-500' :
            contract.status === 'processing' ? 'bg-purple-500' :
            contract.status === 'cancelled' ? 'bg-red-500' :
            contract.status === 'failed' ? 'bg-red-500' :
            'bg-gray-300'
          )} />
        )}
      </TableCell>

      {/* Contract Number */}
      <TableCell className="py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-sm font-medium">{contract.contract_number}</span>
          {hasAnnexes && (
            <span className="text-xs text-muted-foreground">
              {contract.annexes.length} annex{contract.annexes.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      </TableCell>

      {/* Title */}
      <TableCell className="py-3">
        <span className="font-medium text-sm">{contract.title}</span>
      </TableCell>

      {/* Counterparty */}
      <TableCell className="py-3">
        {contract.counterparty_name ? (
          contract.counterparty_entity ? (
            <Link
              to={`/entities/${contract.counterparty_entity}`}
              className="text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {contract.counterparty_name}
            </Link>
          ) : (
            <span className="text-sm">{contract.counterparty_name}</span>
          )
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {/* Template */}
      <TableCell className="py-3">
        <span className="text-sm text-muted-foreground">{contract.template_name}</span>
      </TableCell>

      {/* Origin */}
      <TableCell className="py-3">
        {contract.primary_origin ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={contract.primary_origin.url || '#'}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!contract.primary_origin?.url) e.preventDefault();
                  }}
                >
                  {contract.primary_origin.origin_type === 'campaign' ? (
                    <Megaphone className="h-3 w-3" />
                  ) : (
                    <LinkIcon className="h-3 w-3" />
                  )}
                  <span className="truncate max-w-[100px]">{contract.primary_origin.display_name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to {contract.primary_origin.origin_type}: {contract.primary_origin.display_name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={mapContractStatus(contract.status)} variant="subtle" />
          {contract.status === 'processing' && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
      </TableCell>

      {/* Start Date */}
      <TableCell className="py-3">
        {contract.start_date ? (
          <span className="text-sm">{new Date(contract.start_date).toLocaleDateString()}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {/* Created */}
      <TableCell className="py-3">
        <span className="text-sm">{new Date(contract.created_at).toLocaleDateString()}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-3">
        <ContractActions
          contract={contract}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
          onSendForSignature={onSendForSignature}
          onDelete={onDelete}
          canDo={canDo}
        />
      </TableCell>
    </TableRow>
  );
}

interface AnnexRowProps {
  annex: ContractListItem;
  isLast: boolean;
  onClick: () => void;
  onViewDetails: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onSendForSignature: () => void;
  onDelete: () => void;
  canDo: (contract: ContractListItem, action: 'publish' | 'send' | 'update' | 'delete' | 'regenerate') => boolean;
}

function AnnexRow({
  annex,
  isLast,
  onClick,
  onViewDetails,
  onEdit,
  onRegenerate,
  onSendForSignature,
  onDelete,
  canDo,
}: AnnexRowProps) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/20 bg-muted/5"
      onClick={onClick}
    >
      {/* Tree line connector - wider for more indentation */}
      <TableCell className="py-2 pl-4 pr-0" />

      {/* Contract Number with tree connector */}
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          {/* Tree line visual */}
          <div className="flex items-center h-6 -ml-2">
            <div className={cn(
              "w-px bg-muted-foreground/30",
              isLast ? "h-3" : "h-full"
            )} />
            <div className="w-6 h-px bg-muted-foreground/30" />
          </div>
          <span className="font-mono text-sm text-muted-foreground">{annex.contract_number}</span>
        </div>
      </TableCell>

      {/* Title */}
      <TableCell className="py-2">
        <span className="text-sm text-muted-foreground">{annex.title}</span>
      </TableCell>

      {/* Counterparty */}
      <TableCell className="py-2">
        {annex.counterparty_name ? (
          annex.counterparty_entity ? (
            <Link
              to={`/entities/${annex.counterparty_entity}`}
              className="text-sm text-primary/70 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {annex.counterparty_name}
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">{annex.counterparty_name}</span>
          )
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {/* Template */}
      <TableCell className="py-2">
        <span className="text-xs text-muted-foreground">{annex.template_name}</span>
      </TableCell>

      {/* Origin */}
      <TableCell className="py-2">
        {annex.primary_origin ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={annex.primary_origin.url || '#'}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!annex.primary_origin?.url) e.preventDefault();
                  }}
                >
                  {annex.primary_origin.origin_type === 'campaign' ? (
                    <Megaphone className="h-3 w-3" />
                  ) : (
                    <LinkIcon className="h-3 w-3" />
                  )}
                  <span className="truncate max-w-[80px]">{annex.primary_origin.display_name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to {annex.primary_origin.origin_type}: {annex.primary_origin.display_name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={mapContractStatus(annex.status)} variant="subtle" />
          {annex.status === 'processing' && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
      </TableCell>

      {/* Start Date */}
      <TableCell className="py-2">
        {annex.start_date ? (
          <span className="text-sm text-muted-foreground">{new Date(annex.start_date).toLocaleDateString()}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {/* Created */}
      <TableCell className="py-2">
        <span className="text-sm text-muted-foreground">{new Date(annex.created_at).toLocaleDateString()}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-2">
        <ContractActions
          contract={annex}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
          onSendForSignature={onSendForSignature}
          onDelete={onDelete}
          canDo={canDo}
        />
      </TableCell>
    </TableRow>
  );
}

interface ContractActionsProps {
  contract: ContractListItem;
  onViewDetails: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onSendForSignature: () => void;
  onDelete: () => void;
  canDo: (contract: ContractListItem, action: 'publish' | 'send' | 'update' | 'delete' | 'regenerate') => boolean;
}

function ContractActions({
  contract,
  onViewDetails,
  onEdit,
  onRegenerate,
  onSendForSignature,
  onDelete,
  canDo,
}: ContractActionsProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => {
          e.stopPropagation();
          onViewDetails();
        }}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          disabled={!canDo(contract, 'update')}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        {contract.status === 'draft' && (
          <>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate();
              }}
              disabled={!canDo(contract, 'regenerate')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSendForSignature();
              }}
              disabled={!canDo(contract, 'send')}
            >
              <Send className="h-4 w-4 mr-2" />
              Send for Signature
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={!canDo(contract, 'delete')}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ContractRow, AnnexRow, ContractActions };
