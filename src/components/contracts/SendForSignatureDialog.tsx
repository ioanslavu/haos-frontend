import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, Send, Plus, X } from 'lucide-react';
import { ContractListItem } from '@/api/services/contracts.service';
import { useSendForSignature } from '@/api/hooks/useContracts';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SendForSignatureDialogProps {
  contract: ContractListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Signer {
  email: string;
  name: string;
  role: string;
}

export const SendForSignatureDialog: React.FC<SendForSignatureDialogProps> = ({
  contract,
  open,
  onOpenChange,
}) => {
  const sendForSignature = useSendForSignature();
  const [signers, setSigners] = useState<Signer[]>([
    { email: '', name: '', role: '' },
  ]);
  const [testMode, setTestMode] = useState(true);

  const handleAddSigner = () => {
    setSigners([...signers, { email: '', name: '', role: '' }]);
  };

  const handleRemoveSigner = (index: number) => {
    if (signers.length > 1) {
      setSigners(signers.filter((_, i) => i !== index));
    }
  };

  const handleSignerChange = (index: number, field: keyof Signer, value: string) => {
    const newSigners = [...signers];
    newSigners[index][field] = value;
    setSigners(newSigners);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract) return;

    // Validate signers
    const invalidSigners = signers.filter(s => !s.email || !s.name);
    if (invalidSigners.length > 0) {
      alert('Please fill in email and name for all signers.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = signers.filter(s => !emailRegex.test(s.email));
    if (invalidEmails.length > 0) {
      alert('Please enter valid email addresses for all signers.');
      return;
    }

    try {
      await sendForSignature.mutateAsync({
        id: contract.id,
        payload: {
          signers,
          test_mode: testMode,
        },
      });

      // Reset form
      setSigners([{ email: '', name: '', role: '' }]);
      setTestMode(true);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to send for signature:', error);
    }
  };

  if (!contract) return null;

  const canSendForSignature = contract.status === 'draft';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Contract for Signature
          </DialogTitle>
          <DialogDescription>
            Send "{contract.title}" to signers via Dropbox Sign.
          </DialogDescription>
        </DialogHeader>

        {!canSendForSignature ? (
          <div className="py-8">
            <Alert variant="destructive">
              <AlertDescription>
                Only draft contracts can be sent for signature. This contract is in "{contract.status}" status.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end mt-4">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Test Mode Toggle */}
            <Alert>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="test-mode" className="text-sm font-medium">
                      Test Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enables test mode for development (no real signatures sent)
                    </p>
                  </div>
                  <Switch
                    id="test-mode"
                    checked={testMode}
                    onCheckedChange={setTestMode}
                  />
                </div>
              </AlertDescription>
            </Alert>

            {/* Signers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Signers</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSigner}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Signer
                </Button>
              </div>

              {signers.map((signer, index) => (
                <div key={index} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Signer {index + 1}</Label>
                    {signers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSigner(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`signer-${index}-name`} className="text-sm">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`signer-${index}-name`}
                      placeholder="John Doe"
                      value={signer.name}
                      onChange={(e) => handleSignerChange(index, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`signer-${index}-email`} className="text-sm">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`signer-${index}-email`}
                      type="email"
                      placeholder="john@example.com"
                      value={signer.email}
                      onChange={(e) => handleSignerChange(index, 'email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`signer-${index}-role`} className="text-sm">
                      Role (Optional)
                    </Label>
                    <Input
                      id={`signer-${index}-role`}
                      placeholder="e.g., Artist, Producer, Client"
                      value={signer.role}
                      onChange={(e) => handleSignerChange(index, 'role', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sendForSignature.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendForSignature.isPending}>
                {sendForSignature.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send for Signature
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
