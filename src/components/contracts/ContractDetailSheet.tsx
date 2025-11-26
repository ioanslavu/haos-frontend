import React from 'react';
import { Link } from 'react-router-dom';
import { useContract, useRefreshSignatureStatus, useRefreshContractGeneration, useContractAnnexes } from '@/api/hooks/useContracts';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/badge-examples';
import { ContractAuditTrail } from './ContractAuditTrail';
import { cn } from '@/lib/utils';
import {
  FileText,
  ExternalLink,
  Calendar,
  User,
  Hash,
  Share2,
  Eye,
  Link2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  EyeOff,
  Users,
  Tag,
  GitBranch,
  RefreshCw,
  Copy,
  History,
  PenTool,
  ChevronRight,
  Megaphone,
  LinkIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Sensitive field patterns that should be hidden/redacted
// Based on ACTUAL fields from identity/models.py get_placeholders()
const SENSITIVE_FIELD_PATTERNS = [
  // Romanian Personal ID (CNP)
  'cnp',           // entity.cnp
  'id_number',     // id.number from ID card
  'id_series',     // id.series from ID card
  'id_primary_number',

  // Romanian Company ID
  'cui',           // entity.cui
  'vat_number',    // entity.vat_number, entity.vat

  // Passport
  'passport_number',   // entity.passport_number
  'passport_country',  // entity.passport_country

  // Banking
  'iban',          // entity.iban
  'bank_account',  // entity.bank_account

  // Contact
  'phone',         // entity.phone

  // Address
  'address',       // entity.address
  'city',          // entity.city
  'zip_code',      // entity.zip_code

  // Birth (if added in future)
  'date_of_birth', 'birth_date', 'place_of_birth', 'birthplace',

  // Security
  'password', 'secret', 'api_key', 'token',
];

// Check if a field key is sensitive
const isSensitiveField = (key: string): boolean => {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_FIELD_PATTERNS.some(pattern => lowerKey.includes(pattern));
};

// Redact sensitive value
const redactValue = (value: any): string => {
  if (typeof value === 'string' && value.length > 0) {
    // Show first 2 and last 2 characters if long enough, otherwise just show asterisks
    if (value.length > 4) {
      return `${value.substring(0, 2)}${'*'.repeat(Math.min(value.length - 4, 8))}${value.substring(value.length - 2)}`;
    }
    return '*'.repeat(value.length);
  }
  return '***';
};

// Mask email address for privacy
const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  // Show first 2 chars of local part, mask the rest
  const maskedLocal = localPart.length > 2
    ? `${localPart.substring(0, 2)}${'*'.repeat(Math.min(localPart.length - 2, 6))}`
    : localPart;

  return `${maskedLocal}@${domain}`;
};

interface ContractDetailSheetProps {
  contractId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnnexClick?: (annexId: number) => void;
}

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

const getSignatureIcon = (status: string) => {
  switch (status) {
    case 'signed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'viewed':
      return <Eye className="h-4 w-4 text-blue-500" />;
    case 'declined':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

export function ContractDetailSheet({
  contractId,
  open,
  onOpenChange,
  onAnnexClick,
}: ContractDetailSheetProps) {
  const { data: contract, isLoading, error } = useContract(contractId ?? 0);
  const refreshSignatureStatus = useRefreshSignatureStatus();
  const refreshContractGeneration = useRefreshContractGeneration();

  // Fetch annexes only for master contracts
  const { data: annexes, isLoading: annexesLoading } = useContractAnnexes(
    contract?.is_master_contract ? contractId ?? 0 : 0
  );

  if (!contractId) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto p-0" hideCloseButton>
        {isLoading ? (
          <div className="px-6 py-6 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Failed to load contract</p>
            </div>
          </div>
        ) : contract ? (
          <div className="px-6 py-6 space-y-6">
            {/* Title Section */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">{contract.title}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs">
                  {contract.contract_number}
                </Badge>
                <StatusBadge status={mapContractStatus(contract.status)} variant="subtle" />
                {contract.is_annex && (
                  <Badge variant="secondary" className="text-xs">
                    <GitBranch className="h-3 w-3 mr-1" />
                    Annex
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 flex-wrap">
              {contract.gdrive_file_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(contract.gdrive_file_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Drive
                </Button>
              )}
              {contract.is_public && contract.public_share_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(contract.public_share_url, '_blank')}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Public Link
                </Button>
              )}
              {contract.status === 'processing' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshContractGeneration.mutate(contract.id)}
                  disabled={refreshContractGeneration.isPending}
                >
                  <RefreshCw className={cn(
                    "h-4 w-4 mr-2",
                    refreshContractGeneration.isPending && "animate-spin"
                  )} />
                  Check Status
                </Button>
              )}
              {contract.status === 'pending_signature' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshSignatureStatus.mutate(contract.id)}
                  disabled={refreshSignatureStatus.isPending}
                >
                  <RefreshCw className={cn(
                    "h-4 w-4 mr-2",
                    refreshSignatureStatus.isPending && "animate-spin"
                  )} />
                  Refresh Status
                </Button>
              )}
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="details" className="w-full">
              {(() => {
                // Calculate number of tabs dynamically
                const hasAnnexes = contract.is_master_contract && contract.annexes_count > 0;
                const hasOrigins = contract.has_origins;
                const tabCount = 3 + (hasAnnexes ? 1 : 0) + (hasOrigins ? 1 : 0);
                const gridCols = tabCount === 3 ? "grid-cols-3" : tabCount === 4 ? "grid-cols-4" : "grid-cols-5";

                return (
                  <TabsList className={cn(
                    "grid w-full p-1.5 bg-muted/50 backdrop-blur-xl rounded-2xl border border-white/10 h-11 shadow-lg",
                    gridCols
                  )}>
                    <TabsTrigger
                      value="details"
                      className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
                    >
                      <FileText className="h-4 w-4" />
                      Details
                    </TabsTrigger>
                    {hasAnnexes && (
                      <TabsTrigger
                        value="annexes"
                        className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
                      >
                        <GitBranch className="h-4 w-4" />
                        Annexes
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {contract.annexes_count}
                        </Badge>
                      </TabsTrigger>
                    )}
                    {hasOrigins && (
                      <TabsTrigger
                        value="origins"
                        className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Origins
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {contract.origin_count}
                        </Badge>
                      </TabsTrigger>
                    )}
                    <TabsTrigger
                      value="signatures"
                      className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
                    >
                      <PenTool className="h-4 w-4" />
                      Signatures
                      {contract.signatures?.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {contract.signatures.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="audit"
                      className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-xs"
                    >
                      <History className="h-4 w-4" />
                      History
                    </TabsTrigger>
                  </TabsList>
                );
              })()}

              {/* Details Tab */}
              <TabsContent value="details" className="mt-6 space-y-6">
                {/* Template Info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Template
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Name</span>
                      </div>
                      <span className="text-sm">{contract.template_name}</span>
                    </div>
                    {contract.template_version_number && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                          <Hash className="h-4 w-4" />
                          <span>Version</span>
                        </div>
                        <span className="text-sm">v{contract.template_version_number}</span>
                      </div>
                    )}
                    {contract.is_annex && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                          <GitBranch className="h-4 w-4" />
                          <span>Parent</span>
                        </div>
                        <span className="text-sm font-mono">
                          {contract.parent_contract_number || `#${contract.parent_contract}`}
                        </span>
                      </div>
                    )}
                    {contract.is_master_contract && contract.annexes_count > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                          <GitBranch className="h-4 w-4" />
                          <span>Annexes</span>
                        </div>
                        <span className="text-sm">{contract.annexes_count} annex(es)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Counterparty */}
                {contract.counterparty && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Counterparty
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Name</span>
                          </div>
                          <span className="text-sm font-medium">{contract.counterparty.display_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Type</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {contract.counterparty.entity_type === 'PF' ? 'Individual' : 'Legal Entity'}
                          </Badge>
                        </div>
                        {contract.counterparty.email && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                              <span className="w-4" />
                              <span>Email</span>
                            </div>
                            <span className="text-sm">{maskEmail(contract.counterparty.email)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Label */}
                {contract.label && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Label
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                          <Tag className="h-4 w-4" />
                          <span>Name</span>
                        </div>
                        <span className="text-sm font-medium">{contract.label.display_name}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Contract Period */}
                {(contract.start_date || contract.end_date) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Period
                      </h4>
                      <div className="space-y-2">
                        {contract.start_date && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Start</span>
                            </div>
                            <span className="text-sm">
                              {format(new Date(contract.start_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>End</span>
                          </div>
                          {contract.end_date ? (
                            <span className="text-sm">
                              {format(new Date(contract.end_date), 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-xs">Perpetual</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Timeline */}
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Timeline
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Created</span>
                      </div>
                      <span className="text-sm">
                        {format(new Date(contract.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated</span>
                      </div>
                      <span className="text-sm">
                        {format(new Date(contract.updated_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    {contract.signed_at && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Signed</span>
                        </div>
                        <span className="text-sm text-green-600">
                          {format(new Date(contract.signed_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Created by</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {maskEmail(contract.created_by_email)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Public Access */}
                {contract.is_public && contract.public_share_url && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Public Access
                      </h4>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-accent/50 p-2 rounded truncate">
                          {contract.public_share_url}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(contract.public_share_url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Contract Data */}
                {contract.data && Object.keys(contract.data).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          Contract Data
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          Sensitive fields redacted
                        </span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(contract.data).map(([key, value]) => {
                          const isSensitive = isSensitiveField(key);
                          const displayValue = isSensitive
                            ? redactValue(value)
                            : (typeof value === 'object' ? JSON.stringify(value) : String(value));

                          return (
                            <div key={key} className="flex items-start gap-3">
                              <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground shrink-0">
                                {isSensitive ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <span className="w-4" />
                                )}
                                <span className="capitalize truncate">{key.replace(/_/g, ' ')}</span>
                              </div>
                              <span className={cn(
                                "text-sm break-all",
                                isSensitive && "text-muted-foreground"
                              )}>
                                {displayValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Error Message */}
                {contract.error_message && (
                  <>
                    <Separator />
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Error</span>
                      </div>
                      <p className="text-sm text-destructive">{contract.error_message}</p>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Annexes Tab */}
              {contract.is_master_contract && contract.annexes_count > 0 && (
                <TabsContent value="annexes" className="mt-6">
                  {annexesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : annexes && annexes.length > 0 ? (
                    <div className="space-y-3">
                      {annexes.map((annex) => (
                        <div
                          key={annex.id}
                          className={cn(
                            "p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors",
                            onAnnexClick && "cursor-pointer"
                          )}
                          onClick={() => onAnnexClick?.(annex.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="font-mono text-xs shrink-0">
                                  {annex.contract_number}
                                </Badge>
                                <StatusBadge status={mapContractStatus(annex.status)} variant="subtle" />
                              </div>
                              <h4 className="font-medium text-sm truncate">{annex.title}</h4>
                              {annex.counterparty_name && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {annex.counterparty_name}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                {annex.start_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(annex.start_date), 'MMM dd, yyyy')}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{format(new Date(annex.created_at), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>
                            </div>
                            {onAnnexClick && (
                              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <GitBranch className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">No annexes found</p>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Origins Tab */}
              {contract.has_origins && (
                <TabsContent value="origins" className="mt-6">
                  <div className="space-y-3">
                    {contract.origins.map((origin, index) => (
                      <Link
                        key={`${origin.origin_type}-${origin.source_id}-${index}`}
                        to={origin.url || '#'}
                        className="block p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                        onClick={(e) => {
                          if (!origin.url) e.preventDefault();
                          onOpenChange(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              {/* Icon based on origin type */}
                              <div className="p-2 rounded-lg bg-primary/10">
                                {origin.origin_type === 'campaign' ? (
                                  <Megaphone className="h-4 w-4 text-primary" />
                                ) : (
                                  <LinkIcon className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{origin.display_name}</h4>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {origin.origin_type}
                                </p>
                              </div>
                            </div>

                            {/* Status badge */}
                            {origin.extra?.status_display && (
                              <div className="ml-11 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {origin.extra.status_display}
                                </Badge>
                              </div>
                            )}

                            {/* Additional info */}
                            <div className="flex items-center gap-4 ml-11 text-xs text-muted-foreground">
                              {origin.extra?.entity_name && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{origin.extra.entity_name}</span>
                                </div>
                              )}
                              {origin.extra?.department_name && (
                                <div className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  <span>{origin.extra.department_name}</span>
                                </div>
                              )}
                              {origin.extra?.linked_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Linked {format(new Date(origin.extra.linked_at), 'MMM dd, yyyy')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {origin.url && (
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* Signatures Tab */}
              <TabsContent value="signatures" className="mt-6">
                {contract.signatures && contract.signatures.length > 0 ? (
                  <div className="space-y-4">
                    {contract.signatures.map((signature) => (
                      <div
                        key={signature.id}
                        className="p-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              {getSignatureIcon(signature.status)}
                              <span className="font-medium">{signature.signer_name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {maskEmail(signature.signer_email)}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs">
                            {signature.status}
                          </Badge>
                        </div>

                        {signature.signer_role && (
                          <div className="text-sm mb-3">
                            <span className="text-muted-foreground">Role: </span>
                            <span>{signature.signer_role}</span>
                          </div>
                        )}

                        <div className="space-y-1 text-xs text-muted-foreground pt-3 border-t border-border/50">
                          {signature.sent_at && (
                            <div className="flex justify-between">
                              <span>Sent</span>
                              <span>{format(new Date(signature.sent_at), 'MMM dd, yyyy HH:mm')}</span>
                            </div>
                          )}
                          {signature.viewed_at && (
                            <div className="flex justify-between">
                              <span>Viewed</span>
                              <span>{format(new Date(signature.viewed_at), 'MMM dd, yyyy HH:mm')}</span>
                            </div>
                          )}
                          {signature.signed_at && (
                            <div className="flex justify-between text-green-600">
                              <span>Signed</span>
                              <span>{format(new Date(signature.signed_at), 'MMM dd, yyyy HH:mm')}</span>
                            </div>
                          )}
                          {signature.declined_at && (
                            <div className="flex justify-between text-red-600">
                              <span>Declined</span>
                              <span>{format(new Date(signature.declined_at), 'MMM dd, yyyy HH:mm')}</span>
                            </div>
                          )}
                        </div>

                        {signature.decline_reason && (
                          <div className="text-sm bg-destructive/10 p-3 rounded mt-3">
                            <span className="text-muted-foreground">Decline reason: </span>
                            <span className="text-destructive">{signature.decline_reason}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No signatures yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Audit Trail Tab */}
              <TabsContent value="audit" className="mt-6">
                <ContractAuditTrail contractId={contract.id} />
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
