import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Clock, XCircle, Eye, RefreshCw } from 'lucide-react';
import { ContractListItem } from '@/api/services/contracts.service';
import { useSignatureStatus, useContract } from '@/api/hooks/useContracts';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SignatureStatusDialogProps {
  contract: ContractListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getSignatureStatusIcon = (status: string) => {
  switch (status) {
    case 'signed':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'viewed':
      return <Eye className="h-4 w-4 text-blue-600" />;
    case 'declined':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'pending':
    default:
      return <Clock className="h-4 w-4 text-yellow-600" />;
  }
};

const getSignatureStatusColor = (status: string) => {
  switch (status) {
    case 'signed':
      return 'bg-green-100 text-green-800';
    case 'viewed':
      return 'bg-blue-100 text-blue-800';
    case 'declined':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

export const SignatureStatusDialog: React.FC<SignatureStatusDialogProps> = ({
  contract,
  open,
  onOpenChange,
}) => {
  // Fetch full contract to get signatures
  const { data: fullContract, isLoading: isLoadingContract, refetch: refetchContract } = useContract(contract?.id ?? 0);

  const shouldFetch = contract?.status === 'pending_signature';
  const { data: signatureStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = useSignatureStatus(
    contract?.id || 0,
    open && shouldFetch
  );

  if (!contract) return null;

  const isLoading = isLoadingContract || isLoadingStatus;
  const hasSignatures = fullContract?.signatures && fullContract.signatures.length > 0;

  const handleRefresh = () => {
    refetchContract();
    refetchStatus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Signature Status</DialogTitle>
          <DialogDescription>
            Track signature progress for "{contract.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Contract Status</p>
              <p className="text-xs text-muted-foreground mt-1">
                {contract.contract_number}
              </p>
            </div>
            <Badge className={getSignatureStatusColor(contract.status)}>
              {contract.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>

          {/* Loading State */}
          {isLoadingContract && (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading signature details...</span>
            </div>
          )}

          {/* Dropbox Sign Request ID */}
          {!isLoadingContract && fullContract?.dropbox_sign_request_id && (
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium mb-1">Dropbox Sign Request ID</p>
              <p className="text-xs text-muted-foreground font-mono">
                {fullContract.dropbox_sign_request_id}
              </p>
            </div>
          )}

          {/* Signatures List */}
          {!isLoadingContract && hasSignatures ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Signers</h4>
                {shouldFetch && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {fullContract.signatures.map((signature, index) => (
                <div
                  key={signature.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    {getSignatureStatusIcon(signature.status)}
                    <div>
                      <p className="font-medium text-sm">{signature.signer_name}</p>
                      <p className="text-xs text-muted-foreground">{signature.signer_email}</p>
                      {signature.signer_role && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Role: {signature.signer_role}
                        </p>
                      )}

                      {/* Timestamps */}
                      <div className="mt-2 space-y-1">
                        {signature.sent_at && (
                          <p className="text-xs text-muted-foreground">
                            Sent: {new Date(signature.sent_at).toLocaleString()}
                          </p>
                        )}
                        {signature.viewed_at && (
                          <p className="text-xs text-muted-foreground">
                            Viewed: {new Date(signature.viewed_at).toLocaleString()}
                          </p>
                        )}
                        {signature.signed_at && (
                          <p className="text-xs text-muted-foreground">
                            Signed: {new Date(signature.signed_at).toLocaleString()}
                          </p>
                        )}
                        {signature.declined_at && (
                          <p className="text-xs text-muted-foreground">
                            Declined: {new Date(signature.declined_at).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Decline Reason */}
                      {signature.decline_reason && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">
                            Reason: {signature.decline_reason}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <Badge className={getSignatureStatusColor(signature.status)}>
                    {signature.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : !isLoadingContract ? (
            <Alert>
              <AlertDescription>
                No signatures have been requested for this contract yet.
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
