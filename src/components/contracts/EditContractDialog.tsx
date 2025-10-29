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
import { Loader2, FileText } from 'lucide-react';
import { Contract } from '@/api/services/contracts.service';
import { useUpdateContract } from '@/api/hooks/useContracts';

interface EditContractDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditContractDialog: React.FC<EditContractDialogProps> = ({
  contract,
  open,
  onOpenChange,
}) => {
  const updateContract = useUpdateContract();
  const [title, setTitle] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (contract) {
      setTitle(contract.title);
      setPlaceholderValues(contract.placeholder_values || {});
    }
  }, [contract]);

  const handlePlaceholderChange = (key: string, value: any) => {
    setPlaceholderValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract) return;

    try {
      await updateContract.mutateAsync({
        id: contract.id,
        payload: {
          title,
          placeholder_values: placeholderValues,
        },
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update contract:', error);
    }
  };

  if (!contract) return null;

  // Check if contract can be edited
  const canEdit = contract.status === 'draft';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Contract
          </DialogTitle>
          <DialogDescription>
            {canEdit
              ? 'Update the contract title and placeholder values.'
              : 'Only draft contracts can be edited. This contract is already signed or pending signature.'}
          </DialogDescription>
        </DialogHeader>

        {!canEdit ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              This contract cannot be edited because it's in "{contract.status}" status.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contract-title" className="text-sm font-medium">
                Contract Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contract-title"
                placeholder="e.g., John Doe Employment Contract"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Placeholder Values</h4>
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
                onClick={() => onOpenChange(false)}
                disabled={updateContract.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateContract.isPending}>
                {updateContract.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Contract'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
