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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText, CheckCircle2, XCircle, User, Calendar } from 'lucide-react';
import { ContractTemplate, FormSchemaField } from '@/api/services/contracts.service';
import { useGenerateContract, useCheckContractStatus } from '@/api/hooks/useContracts';
import { useEntityPlaceholders } from '@/api/hooks/useEntities';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EntitySearchCombobox } from '@/components/entities/EntitySearchCombobox';

interface GenerateContractDialogProps {
  template: ContractTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentContractId?: number; // For creating annexes
}

export const GenerateContractDialog: React.FC<GenerateContractDialogProps> = ({
  template,
  open,
  onOpenChange,
  parentContractId,
}) => {
  const navigate = useNavigate();
  const generateContract = useGenerateContract();

  // Required fields
  const [counterpartyEntityId, setCounterpartyEntityId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Optional fields
  const [title, setTitle] = useState('');
  const [labelEntityId, setLabelEntityId] = useState<number | null>(null);

  // Form data (dynamic fields from template)
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Processing state
  const [processingContractId, setProcessingContractId] = useState<number | null>(null);
  const [shouldPoll, setShouldPoll] = useState(false);

  // Fetch entity placeholders when counterparty is selected
  const { data: entityPlaceholders, isLoading: isLoadingPlaceholders } = useEntityPlaceholders(
    counterpartyEntityId || 0,
    !!counterpartyEntityId
  );

  // Poll for contract status while processing
  const { data: statusData } = useCheckContractStatus(
    processingContractId,
    shouldPoll && open
  );

  // Get form schema fields
  const formFields = template?.form_schema?.fields || [];

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open) {
      setShouldPoll(false);
      setProcessingContractId(null);
      setCounterpartyEntityId(null);
      setLabelEntityId(null);
      setStartDate('');
      setEndDate('');
      setTitle('');
      setFormData({});
    }
  }, [open]);

  // Auto-populate form data when entity data is loaded
  useEffect(() => {
    if (entityPlaceholders && counterpartyEntityId && template) {
      const newValues: Record<string, any> = { ...formData };

      formFields.forEach((field) => {
        // Try to find a match in entity placeholders using entity_field or name
        const entityFieldName = field.entity_field || field.name;

        if (entityPlaceholders[entityFieldName] !== undefined && entityPlaceholders[entityFieldName] !== null) {
          newValues[field.name] = entityPlaceholders[entityFieldName];
        }
      });

      setFormData(newValues);
    }
  }, [entityPlaceholders, counterpartyEntityId, template]);

  // Handle status changes
  useEffect(() => {
    if (!statusData || !processingContractId) return;

    if (statusData.status === 'draft') {
      setShouldPoll(false);
      resetForm();
      onOpenChange(false);
      navigate('/contracts');
    } else if (statusData.status === 'failed') {
      setShouldPoll(false);
      setProcessingContractId(null);
    }
  }, [statusData, processingContractId, navigate, onOpenChange]);

  const resetForm = () => {
    setCounterpartyEntityId(null);
    setLabelEntityId(null);
    setStartDate('');
    setEndDate('');
    setTitle('');
    setFormData({});
    setProcessingContractId(null);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template) return;

    // Validate required fields
    if (!counterpartyEntityId) {
      alert('Please select a counterparty entity');
      return;
    }

    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    // Validate required form fields
    const missingFields = formFields
      .filter(f => f.required && (formData[f.name] === undefined || formData[f.name] === ''))
      .map(f => f.label);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      const contract = await generateContract.mutateAsync({
        template_id: template.id,
        counterparty_entity_id: counterpartyEntityId,
        start_date: startDate,
        end_date: endDate || null,
        parent_contract_id: parentContractId || null,
        label_entity_id: labelEntityId || null,
        title: title || null,
        form_data: formData,
      });

      setProcessingContractId(contract.id);
      setShouldPoll(true);
    } catch (error) {
      console.error('Failed to generate contract:', error);
    }
  };

  const renderField = (field: FormSchemaField, index: number) => {
    const value = formData[field.name] ?? field.default_value ?? '';
    const fieldId = `field-${index}`;

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            placeholder={field.placeholder || field.description || `Enter ${field.label}`}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            placeholder={field.placeholder || field.description || `Enter ${field.label}`}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value ? Number(e.target.value) : '')}
            required={field.required}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return (
          <Input
            id={fieldId}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      case 'select':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => handleFieldChange(field.name, val)}
            required={field.required}
          >
            <SelectTrigger id={fieldId}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={fieldId} className="text-sm font-normal">
              {field.description || field.label}
            </Label>
          </div>
        );

      case 'email':
        return (
          <Input
            id={fieldId}
            type="email"
            placeholder={field.placeholder || field.description || `Enter ${field.label}`}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      case 'phone':
        return (
          <Input
            id={fieldId}
            type="tel"
            placeholder={field.placeholder || field.description || `Enter ${field.label}`}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      default: // text
        return (
          <Input
            id={fieldId}
            placeholder={field.placeholder || field.description || `Enter ${field.label}`}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  const isProcessing = processingContractId !== null && shouldPoll;
  const isFailed = statusData?.status === 'failed';
  const autoPopulatedCount = Object.keys(formData).length;

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {parentContractId ? 'Create Annex' : 'Generate Contract'} from {template.name}
          </DialogTitle>
          <DialogDescription>
            {parentContractId
              ? 'Create an annex linked to the parent contract.'
              : 'Fill in the required information to generate a new contract.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Counterparty Entity (Required) */}
          <div className="space-y-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Counterparty <span className="text-red-500">*</span></h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="counterparty-search" className="text-sm">
                Select the counterparty for this contract
              </Label>
              <EntitySearchCombobox
                value={counterpartyEntityId}
                onValueChange={setCounterpartyEntityId}
                placeholder="Search by name, email, or company..."
              />
              {isLoadingPlaceholders && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading entity data...
                </p>
              )}
              {counterpartyEntityId && !isLoadingPlaceholders && autoPopulatedCount > 0 && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {autoPopulatedCount} field{autoPopulatedCount !== 1 ? 's' : ''} auto-populated from entity data
                </p>
              )}
            </div>
          </div>

          {/* Contract Dates */}
          <div className="space-y-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Contract Period</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm">
                  End Date <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
                <p className="text-xs text-muted-foreground">Leave empty for perpetual contracts</p>
              </div>
            </div>
          </div>

          {/* Optional: Title and Label Entity */}
          <div className="space-y-4 pb-4 border-b">
            <h4 className="font-medium">Additional Information <span className="text-muted-foreground text-sm font-normal">(optional)</span></h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract-title" className="text-sm">
                  Custom Title
                </Label>
                <Input
                  id="contract-title"
                  placeholder="Leave empty for auto-generated title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  If not provided, a title will be generated automatically
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label-entity" className="text-sm">
                  Label Entity
                </Label>
                <EntitySearchCombobox
                  value={labelEntityId}
                  onValueChange={setLabelEntityId}
                  placeholder="Select label entity (optional)..."
                  filter={{ entity_type: 'PJ' }}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Form Fields */}
          {formFields.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Contract Details</h4>
              {formFields.map((field, index) => (
                <div key={field.name} className="space-y-2">
                  {field.type !== 'checkbox' && (
                    <Label htmlFor={`field-${index}`} className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  )}
                  {renderField(field, index)}
                  {field.description && field.type !== 'checkbox' && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

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
              disabled={generateContract.isPending || isProcessing || !counterpartyEntityId || !startDate}
            >
              {generateContract.isPending || isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {generateContract.isPending ? 'Starting...' : 'Generating...'}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {parentContractId ? 'Create Annex' : 'Generate Contract'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
