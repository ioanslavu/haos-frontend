import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, FileText, CheckCircle2, XCircle, User } from 'lucide-react';
import { ContractTemplate } from '@/api/services/contracts.service';
import { useGenerateContract, useCheckContractStatus } from '@/api/hooks/useContracts';
import { useEntityPlaceholders } from '@/api/hooks/useEntities';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';

interface GenerateContractDialogProps {
  template: ContractTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GenerateContractDialog: React.FC<GenerateContractDialogProps> = ({
  template,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const generateContract = useGenerateContract();
  const [title, setTitle] = useState('');
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [processingContractId, setProcessingContractId] = useState<number | null>(null);
  const [shouldPoll, setShouldPoll] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  // Fetch entity placeholders when an entity is selected
  const { data: entityPlaceholders, isLoading: isLoadingPlaceholders } = useEntityPlaceholders(
    selectedEntityId || 0,
    !!selectedEntityId
  );

  // Poll for contract status while processing
  const { data: statusData, isLoading: isPolling } = useCheckContractStatus(
    processingContractId,
    shouldPoll && open // Only poll when dialog is open
  );

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      setShouldPoll(false);
      setProcessingContractId(null);
      setSelectedEntityId(null);
      setPlaceholderValues({});
      setTitle('');
    }
  }, [open]);

  // Auto-populate placeholders when entity data is loaded
  useEffect(() => {
    if (entityPlaceholders && selectedEntityId && template) {
      // Convert entity placeholders to string values
      const newValues: Record<string, string> = {};

      // For each template placeholder, try to find a matching value from entity data
      template.placeholders.forEach((placeholder) => {
        const templateKey = placeholder.key;

        // Strip {{ and }} from the template key to match entity data keys
        const cleanKey = templateKey.replace(/\{\{|\}\}/g, '').trim();

        // Try to find a match in entity placeholders
        if (entityPlaceholders[cleanKey] !== undefined && entityPlaceholders[cleanKey] !== null) {
          newValues[templateKey] = String(entityPlaceholders[cleanKey]);
        }
      });

      // Set the values
      setPlaceholderValues(newValues);
    }
  }, [entityPlaceholders, selectedEntityId, template]);

  // Handle status changes
  useEffect(() => {
    if (!statusData || !processingContractId) return;

    if (statusData.status === 'draft') {
      // Success! Contract is ready
      setShouldPoll(false); // Stop polling
      setTitle('');
      setPlaceholderValues({});
      setProcessingContractId(null);
      onOpenChange(false);
      navigate('/contracts');
    } else if (statusData.status === 'failed') {
      // Generation failed
      setShouldPoll(false); // Stop polling
      setProcessingContractId(null);
      // Error is shown in the UI via statusData
    }
  }, [statusData, processingContractId, navigate, onOpenChange]);

  const handlePlaceholderChange = (key: string, value: string) => {
    setPlaceholderValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template) return;

    // Validate required fields
    const missingFields = template.placeholders
      .filter(p => p.required && !placeholderValues[p.key])
      .map(p => p.label);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const contract = await generateContract.mutateAsync({
        template_id: template.id,
        title,
        placeholder_values: placeholderValues,
      });

      // Start polling for status
      setProcessingContractId(contract.id);
      setShouldPoll(true);
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to generate contract:', error);
    }
  };

  const isProcessing = processingContractId !== null && shouldPoll;
  const isFailed = statusData?.status === 'failed';

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Contract from {template.name}
          </DialogTitle>
          <DialogDescription>
            Fill in the placeholder values to generate a new contract from this template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entity Search Section */}
          <div className="space-y-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Auto-fill from Entity (Optional)</h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entity-search" className="text-sm">
                Search for an entity to auto-populate placeholder values
              </Label>
              <EntitySearchCombobox
                value={selectedEntityId}
                onValueChange={setSelectedEntityId}
                placeholder="Search by name, email, or company..."
                filter={{ has_role: 'client' }}
              />
              {isLoadingPlaceholders && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading entity data...
                </p>
              )}
              {selectedEntityId && !isLoadingPlaceholders && entityPlaceholders && Object.keys(placeholderValues).length > 0 && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {Object.keys(placeholderValues).length} field{Object.keys(placeholderValues).length !== 1 ? 's' : ''} auto-populated from entity data
                </p>
              )}
            </div>
          </div>
          {/* Processing Status */}
          {isProcessing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Generating contract in Google Drive... This may take a few moments.
              </AlertDescription>
            </Alert>
          )}

          {/* Failed Status */}
          {isFailed && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {statusData?.error_message || 'Failed to generate contract. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Contract Title */}
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
            <p className="text-xs text-muted-foreground">
              This will be used as the contract's title
            </p>
          </div>

          {/* Placeholders */}
          <div className="space-y-4">
            <h4 className="font-medium">Template Placeholders</h4>
            {template.placeholders.map((placeholder, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`placeholder-${index}`} className="text-sm font-medium">
                  {placeholder.label}
                  {placeholder.required && <span className="text-red-500 ml-1">*</span>}
                </Label>

                {(placeholder.type === 'text' || !placeholder.type) && (
                  <Input
                    id={`placeholder-${index}`}
                    placeholder={placeholder.description || `Enter ${placeholder.label}`}
                    value={placeholderValues[placeholder.key] || ''}
                    onChange={(e) => handlePlaceholderChange(placeholder.key, e.target.value)}
                    required={placeholder.required}
                  />
                )}

                {placeholder.type === 'number' && (
                  <Input
                    id={`placeholder-${index}`}
                    type="number"
                    placeholder={placeholder.description || `Enter ${placeholder.label}`}
                    value={placeholderValues[placeholder.key] || ''}
                    onChange={(e) => handlePlaceholderChange(placeholder.key, e.target.value)}
                    required={placeholder.required}
                  />
                )}

                {placeholder.type === 'date' && (
                  <Input
                    id={`placeholder-${index}`}
                    type="date"
                    value={placeholderValues[placeholder.key] || ''}
                    onChange={(e) => handlePlaceholderChange(placeholder.key, e.target.value)}
                    required={placeholder.required}
                  />
                )}

                {placeholder.description && (
                  <p className="text-xs text-muted-foreground">{placeholder.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
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
              disabled={generateContract.isPending || (isProcessing && !isFailed)}
            >
              {isProcessing && !isFailed ? 'Please wait...' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={generateContract.isPending || isProcessing}
            >
              {generateContract.isPending || isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {generateContract.isPending ? 'Starting...' : 'Generating...'}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Contract
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
