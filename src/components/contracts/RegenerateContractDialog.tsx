import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Contract } from '@/api/services/contracts.service';
import { useRegenerateContract, useCheckContractStatus } from '@/api/hooks/useContracts';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RegenerateContractDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegenerateContractDialog: React.FC<RegenerateContractDialogProps> = ({
  contract,
  open,
  onOpenChange,
}) => {
  const regenerateContract = useRegenerateContract();
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, any>>({});
  const [processingContractId, setProcessingContractId] = useState<number | null>(null);
  const [shouldPoll, setShouldPoll] = useState(false);

  // Poll for contract status while processing
  const { data: statusData } = useCheckContractStatus(
    processingContractId,
    shouldPoll && open // Only poll when dialog is open
  );

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      setShouldPoll(false);
      setProcessingContractId(null);
    }
  }, [open]);

  useEffect(() => {
    if (contract) {
      setPlaceholderValues(contract.placeholder_values || {});
    }
  }, [contract]);

  // Handle status changes
  useEffect(() => {
    if (!statusData || !processingContractId) return;

    if (statusData.status === 'draft') {
      // Success! Contract regenerated
      setShouldPoll(false); // Stop polling
      setProcessingContractId(null);
      onOpenChange(false);
    } else if (statusData.status === 'failed') {
      // Regeneration failed
      setShouldPoll(false); // Stop polling
      setProcessingContractId(null);
      // Error is shown in the UI via statusData
    }
  }, [statusData, processingContractId, onOpenChange]);

  const handlePlaceholderChange = (key: string, value: any) => {
    setPlaceholderValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract) return;

    try {
      const updatedContract = await regenerateContract.mutateAsync({
        id: contract.id,
        payload: {
          placeholder_values: placeholderValues,
        },
      });

      // Start polling for status
      setProcessingContractId(updatedContract.id);
      setShouldPoll(true);
    } catch (error) {
      console.error('Failed to regenerate contract:', error);
    }
  };

  if (!contract) return null;

  const canRegenerate = contract.status === 'draft';
  const isProcessing = processingContractId !== null && shouldPoll;
  const isFailed = statusData?.status === 'failed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Regenerate Contract
          </DialogTitle>
          <DialogDescription>
            This will create a new Google Docs file with updated placeholder values.
          </DialogDescription>
        </DialogHeader>

        {!canRegenerate ? (
          <div className="py-8">
            <Alert variant="destructive">
              <AlertDescription>
                Only draft contracts can be regenerated. This contract is in "{contract.status}" status.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end mt-4">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <>
            <Alert>
              <AlertDescription>
                This will create a NEW Google Docs file with the updated values. The current contract file will remain unchanged.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Processing Status */}
              {isProcessing && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Regenerating contract in Google Drive... This may take a few moments.
                  </AlertDescription>
                </Alert>
              )}

              {/* Failed Status */}
              {isFailed && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {statusData?.error_message || 'Failed to regenerate contract. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                <h4 className="font-medium">Update Placeholder Values</h4>
                {Object.entries(placeholderValues).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`placeholder-${key}`} className="text-sm font-medium">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <Input
                      id={`placeholder-${key}`}
                      value={value || ''}
                      onChange={(e) => handlePlaceholderChange(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isFailed) {
                      setProcessingContractId(null);
                      setShouldPoll(false);
                    }
                    onOpenChange(false);
                  }}
                  disabled={regenerateContract.isPending || (isProcessing && !isFailed)}
                >
                  {isProcessing && !isFailed ? 'Please wait...' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={regenerateContract.isPending || isProcessing}
                >
                  {regenerateContract.isPending || isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {regenerateContract.isPending ? 'Starting...' : 'Regenerating...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Contract
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
