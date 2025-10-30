import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { useContract } from '@/api/hooks/useContracts';
import { ContractAuditTrail } from './ContractAuditTrail';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Contract } from '@/api/services/contracts.service';

interface ContractDetailDialogProps {
  contractId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractDetailDialog({
  contractId,
  open,
  onOpenChange,
}: ContractDetailDialogProps) {
  const { data: contract, isLoading, error } = useContract(contractId ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Details
          </DialogTitle>
          {contract && (
            <DialogDescription>
              {contract.contract_number} - {contract.title}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load contract details. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {contract && (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="signatures">Signatures</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contract Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Contract Number
                      </p>
                      <p className="text-sm font-mono">{contract.contract_number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge>{contract.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Template
                      </p>
                      <p className="text-sm">{contract.template_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Template Version
                      </p>
                      <p className="text-sm">
                        {contract.template_version_number
                          ? `v${contract.template_version_number}`
                          : 'N/A'}
                      </p>
                    </div>
                    {contract.contract_type && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Contract Type
                        </p>
                        <p className="text-sm">{contract.contract_type}</p>
                      </div>
                    )}
                    {contract.department && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Department
                        </p>
                        <p className="text-sm">{contract.department}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Created By
                      </p>
                      <p className="text-sm">{contract.created_by_email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Created At
                      </p>
                      <p className="text-sm">
                        {format(new Date(contract.created_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    {contract.signed_at && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Signed At
                        </p>
                        <p className="text-sm">
                          {format(new Date(contract.signed_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>

                  {contract.gdrive_file_url && (
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(contract.gdrive_file_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Google Drive
                      </Button>
                    </div>
                  )}

                  {contract.is_public && contract.public_share_url && (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(contract.public_share_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Public Link
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signatures" className="space-y-4">
              {contract.signatures && contract.signatures.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Signature Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contract.signatures.map((sig) => (
                        <div
                          key={sig.id}
                          className="flex items-start justify-between p-3 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">{sig.signer_name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {sig.signer_email}
                            </p>
                            {sig.signer_role && (
                              <p className="text-xs text-muted-foreground">
                                Role: {sig.signer_role}
                              </p>
                            )}
                            {sig.signed_at && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Signed: {format(new Date(sig.signed_at), 'MMM d, yyyy HH:mm')}
                              </div>
                            )}
                            {sig.viewed_at && !sig.signed_at && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Viewed: {format(new Date(sig.viewed_at), 'MMM d, yyyy HH:mm')}
                              </div>
                            )}
                            {sig.declined_at && (
                              <>
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                  <Calendar className="h-3 w-3" />
                                  Declined: {format(new Date(sig.declined_at), 'MMM d, yyyy HH:mm')}
                                </div>
                                {sig.decline_reason && (
                                  <p className="text-xs text-muted-foreground">
                                    Reason: {sig.decline_reason}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                          <Badge variant={sig.status === 'signed' ? 'default' : 'secondary'}>
                            {sig.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-center text-sm text-muted-foreground">
                      No signatures requested yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="audit">
              <ContractAuditTrail contractId={contract.id} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
