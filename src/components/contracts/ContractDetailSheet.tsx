import React from 'react';
import { useContract, useContractAuditTrail } from '@/api/hooks/useContracts';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/badge-examples';
import { ContractAuditTrail } from './ContractAuditTrail';
import {
  FileText,
  ExternalLink,
  Calendar,
  User,
  Building,
  Hash,
  Share2,
  Eye,
  Link2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';

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
}: ContractDetailSheetProps) {
  const { data: contract, isLoading, error } = useContract(contractId ?? 0);

  if (!contractId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Details
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Failed to load contract</p>
            </div>
          </div>
        ) : contract ? (
          <div className="mt-6">
            {/* Header Info */}
            <div className="space-y-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold">{contract.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="font-mono">
                    {contract.contract_number}
                  </Badge>
                  <StatusBadge status={mapContractStatus(contract.status)} variant="subtle" />
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
                    Open in Google Drive
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
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="signatures">
                  Signatures {contract.signatures?.length > 0 && `(${contract.signatures.length})`}
                </TabsTrigger>
                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Template</span>
                        <p className="font-medium mt-1">{contract.template_name}</p>
                      </div>
                      {contract.template_version_number && (
                        <div>
                          <span className="text-muted-foreground">Version</span>
                          <p className="font-medium mt-1">v{contract.template_version_number}</p>
                        </div>
                      )}
                      {contract.contract_type && (
                        <div>
                          <span className="text-muted-foreground">Type</span>
                          <p className="font-medium mt-1 capitalize">{contract.contract_type}</p>
                        </div>
                      )}
                      {contract.department && (
                        <div>
                          <span className="text-muted-foreground">Department</span>
                          <p className="font-medium mt-1 capitalize">{contract.department}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Dates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Important Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">
                        {format(new Date(contract.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="font-medium">
                        {format(new Date(contract.updated_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    {contract.signed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Signed</span>
                        <span className="font-medium text-green-600">
                          {format(new Date(contract.signed_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Creator Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Creator
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {maskEmail(contract.created_by_email)}
                    </p>
                  </CardContent>
                </Card>

                {/* Public Status */}
                {contract.is_public && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Public Access
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="subtle-success" icon={CheckCircle2}>
                          Publicly Accessible
                        </Badge>
                        {contract.public_share_url && (
                          <div className="flex items-center gap-2 mt-2">
                            <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                              {contract.public_share_url}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(contract.public_share_url);
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Placeholder Values - Non-sensitive only */}
                {contract.placeholder_values && Object.keys(contract.placeholder_values).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Contract Data
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sensitive information is redacted for security
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {Object.entries(contract.placeholder_values).map(([key, value]) => {
                          const isSensitive = isSensitiveField(key);
                          const displayValue = isSensitive
                            ? redactValue(value)
                            : (typeof value === 'object' ? JSON.stringify(value) : String(value));

                          return (
                            <div key={key} className="flex justify-between gap-4 py-1">
                              <span className="text-muted-foreground capitalize flex items-center gap-1">
                                {isSensitive && <EyeOff className="h-3 w-3" />}
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className={`font-medium text-right break-all ${isSensitive ? 'text-muted-foreground' : ''}`}>
                                {displayValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error Message */}
                {contract.error_message && (
                  <Card className="border-destructive">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        Error
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-destructive">{contract.error_message}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Signatures Tab */}
              <TabsContent value="signatures" className="space-y-4 mt-4">
                {contract.signatures && contract.signatures.length > 0 ? (
                  <div className="space-y-3">
                    {contract.signatures.map((signature) => (
                      <Card key={signature.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  {getSignatureIcon(signature.status)}
                                  <span className="font-semibold">{signature.signer_name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {maskEmail(signature.signer_email)}
                                </p>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {signature.status}
                              </Badge>
                            </div>

                            {signature.signer_role && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Role: </span>
                                <span className="font-medium">{signature.signer_role}</span>
                              </div>
                            )}

                            <div className="space-y-1 text-xs text-muted-foreground border-t pt-3">
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
                              <div className="text-sm bg-destructive/10 p-3 rounded">
                                <span className="text-muted-foreground">Decline reason: </span>
                                <span className="text-destructive">{signature.decline_reason}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No signatures yet</p>
                  </div>
                )}
              </TabsContent>

              {/* Audit Trail Tab */}
              <TabsContent value="audit" className="mt-4">
                <ContractAuditTrail contractId={contract.id} />
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
