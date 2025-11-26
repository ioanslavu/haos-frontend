import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AppLayout } from '@/components/layout/AppLayout';
import { GoogleDrivePickerButton } from '@/components/contracts/GoogleDrivePickerButton';
import { useImportTemplate } from '@/api/hooks/useContracts';
import { FormSchemaField } from '@/api/services/contracts.service';

// Field types supported by the form schema
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Multi-line Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
] as const;

// Common entity fields for auto-population
const ENTITY_FIELDS = [
  { value: '', label: 'None (manual input)' },
  { value: 'display_name', label: 'Display Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'address', label: 'Address' },
  { value: 'cnp', label: 'CNP (Personal ID)' },
  { value: 'cui', label: 'CUI (Company ID)' },
  { value: 'bank_account', label: 'Bank Account' },
  { value: 'bank_name', label: 'Bank Name' },
];

interface FormFieldInput {
  name: string;
  label: string;
  type: FormSchemaField['type'];
  required: boolean;
  description?: string;
  placeholder?: string;
  entity_field?: string;
  options?: Array<{ value: string; label: string }>;
  default_value?: string;
  expanded?: boolean; // UI state for advanced options
}

export default function ImportTemplate() {
  const navigate = useNavigate();
  const importTemplate = useImportTemplate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [series, setSeries] = useState('');
  const [gdriveFileId, setGdriveFileId] = useState('');
  const [gdriveFileName, setGdriveFileName] = useState('');
  const [gdriveOutputFolderId, setGdriveOutputFolderId] = useState('');
  const [gdriveOutputFolderName, setGdriveOutputFolderName] = useState('');
  const [formFields, setFormFields] = useState<FormFieldInput[]>([
    { name: '', label: '', type: 'text', required: false, expanded: false },
  ]);

  const addFormField = () => {
    setFormFields([...formFields, { name: '', label: '', type: 'text', required: false, expanded: false }]);
  };

  const removeFormField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  const updateFormField = (index: number, field: keyof FormFieldInput, value: any) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], [field]: value };
    // If type changed to select, initialize options array
    if (field === 'type' && value === 'select' && !updated[index].options) {
      updated[index].options = [{ value: '', label: '' }];
    }
    setFormFields(updated);
  };

  const toggleFieldExpanded = (index: number) => {
    const updated = [...formFields];
    updated[index] = { ...updated[index], expanded: !updated[index].expanded };
    setFormFields(updated);
  };

  const addSelectOption = (fieldIndex: number) => {
    const updated = [...formFields];
    const options = updated[fieldIndex].options || [];
    updated[fieldIndex].options = [...options, { value: '', label: '' }];
    setFormFields(updated);
  };

  const removeSelectOption = (fieldIndex: number, optionIndex: number) => {
    const updated = [...formFields];
    const options = updated[fieldIndex].options || [];
    updated[fieldIndex].options = options.filter((_, i) => i !== optionIndex);
    setFormFields(updated);
  };

  const updateSelectOption = (fieldIndex: number, optionIndex: number, key: 'value' | 'label', value: string) => {
    const updated = [...formFields];
    const options = [...(updated[fieldIndex].options || [])];
    options[optionIndex] = { ...options[optionIndex], [key]: value };
    updated[fieldIndex].options = options;
    setFormFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!name || !series || !gdriveFileId || !gdriveOutputFolderId) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate series format (only uppercase letters)
    if (!/^[A-Z]+$/.test(series)) {
      alert('Series must contain only uppercase letters (e.g., HAHM, HAND, HAHC)');
      return;
    }

    // Filter out empty form fields
    const validFields = formFields.filter(f => f.name && f.label);

    if (validFields.length === 0) {
      alert('Please add at least one form field');
      return;
    }

    // Validate select fields have options
    const selectFieldsWithoutOptions = validFields.filter(
      f => f.type === 'select' && (!f.options || f.options.filter(o => o.value && o.label).length === 0)
    );
    if (selectFieldsWithoutOptions.length > 0) {
      alert(`Please add options for dropdown field(s): ${selectFieldsWithoutOptions.map(f => f.label).join(', ')}`);
      return;
    }

    // Build form_schema from fields
    const form_schema = {
      fields: validFields.map(field => {
        const schemaField: FormSchemaField = {
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
        };

        if (field.description) schemaField.description = field.description;
        if (field.placeholder) schemaField.placeholder = field.placeholder;
        if (field.entity_field) schemaField.entity_field = field.entity_field;
        if (field.default_value) schemaField.default_value = field.default_value;

        // For select fields, include filtered options
        if (field.type === 'select' && field.options) {
          schemaField.options = field.options.filter(o => o.value && o.label);
        }

        return schemaField;
      }),
    };

    try {
      await importTemplate.mutateAsync({
        name,
        description,
        series,
        gdrive_file_id: gdriveFileId,
        gdrive_output_folder_id: gdriveOutputFolderId,
        form_schema,
      });

      // Navigate back to templates page
      navigate('/templates');
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to import template:', error);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Import Template from Google Drive
          </h1>
          <p className="text-muted-foreground mt-1">
            Import a contract template from Google Drive. Select your template document and configure placeholders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide a name and description for this template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">
                  Template Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Employment Contract Template"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  placeholder="Brief description of what this template is for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-series">
                  Series Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="template-series"
                  placeholder="e.g., HAHM, HAND, HAHC"
                  value={series}
                  onChange={(e) => setSeries(e.target.value.toUpperCase())}
                  required
                  maxLength={10}
                  className="font-mono uppercase"
                  pattern="[A-Z]+"
                />
                <p className="text-xs text-muted-foreground">
                  Contract numbering code (uppercase letters only). Examples: HAHM, HAND, HAHC.
                  <br />
                  Contract numbers will be: <code className="font-mono bg-muted px-1 py-0.5 rounded">{series || 'HAHM'}-1</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">{series || 'HAHM'}-2</code>, etc.
                  <br />
                  <span className="text-orange-600 dark:text-orange-400">Numbers reset every year on January 1st.</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Drive Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Google Drive Configuration</CardTitle>
              <CardDescription>
                Select the template document and output folder from Google Drive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gdrive-file-id">
                  Template Document <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="gdrive-file-id"
                    placeholder="Select a document from Google Drive..."
                    value={gdriveFileName || gdriveFileId}
                    readOnly
                    required
                  />
                  <GoogleDrivePickerButton
                    type="document"
                    onSelect={(file) => {
                      setGdriveFileId(file.id);
                      setGdriveFileName(file.name);
                    }}
                  />
                </div>
                {gdriveFileId && (
                  <p className="text-xs text-muted-foreground font-mono">
                    File ID: {gdriveFileId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gdrive-output-folder-id">
                  Output Folder <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="gdrive-output-folder-id"
                    placeholder="Select output folder from Google Drive..."
                    value={gdriveOutputFolderName || gdriveOutputFolderId}
                    readOnly
                    required
                  />
                  <GoogleDrivePickerButton
                    type="folder"
                    onSelect={(folder) => {
                      setGdriveOutputFolderId(folder.id);
                      setGdriveOutputFolderName(folder.name);
                    }}
                  />
                </div>
                {gdriveOutputFolderId && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Folder ID: {gdriveOutputFolderId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Fields</CardTitle>
                  <CardDescription>
                    Define the fields that will be filled when generating contracts. Use &#123;&#123;field_name&#125;&#125; format in your Google Doc.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addFormField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formFields.map((field, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Field {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFieldExpanded(index)}
                        >
                          {field.expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="ml-1 text-xs">
                            {field.expanded ? 'Less' : 'More'}
                          </span>
                        </Button>
                        {formFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFormField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Basic fields - always visible */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Field Name</Label>
                        <Input
                          placeholder="e.g., employee_name"
                          value={field.name}
                          onChange={(e) => updateFormField(index, 'name', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Use in template as: &#123;&#123;{field.name || 'field_name'}&#125;&#125;
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Display Label</Label>
                        <Input
                          placeholder="e.g., Employee Name"
                          value={field.label}
                          onChange={(e) => updateFormField(index, 'label', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateFormField(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          Required
                        </Label>
                        <div className="flex items-center space-x-2 h-10">
                          <Checkbox
                            id={`required-${index}`}
                            checked={field.required}
                            onCheckedChange={(checked) => updateFormField(index, 'required', !!checked)}
                          />
                          <label
                            htmlFor={`required-${index}`}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            This field is required
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Select options - only for dropdown type */}
                    {field.type === 'select' && (
                      <div className="space-y-2 border-t pt-3">
                        <div className="flex items-center justify-between">
                          <Label>Dropdown Options</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSelectOption(index)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(field.options || []).map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-2 items-center">
                              <Input
                                placeholder="Value"
                                value={option.value}
                                onChange={(e) => updateSelectOption(index, optIndex, 'value', e.target.value)}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Display Label"
                                value={option.label}
                                onChange={(e) => updateSelectOption(index, optIndex, 'label', e.target.value)}
                                className="flex-1"
                              />
                              {(field.options?.length || 0) > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSelectOption(index, optIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Advanced options - collapsed by default */}
                    {field.expanded && (
                      <div className="space-y-3 border-t pt-3">
                        <p className="text-xs text-muted-foreground font-medium">Advanced Options</p>

                        <div className="space-y-2">
                          <Label>Description / Help Text</Label>
                          <Input
                            placeholder="Helper text shown below the field"
                            value={field.description || ''}
                            onChange={(e) => updateFormField(index, 'description', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Placeholder Text</Label>
                          <Input
                            placeholder="Placeholder shown inside the field"
                            value={field.placeholder || ''}
                            onChange={(e) => updateFormField(index, 'placeholder', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Default Value</Label>
                          <Input
                            placeholder="Pre-filled value (optional)"
                            value={field.default_value || ''}
                            onChange={(e) => updateFormField(index, 'default_value', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Auto-populate from Entity</Label>
                          <Select
                            value={field.entity_field || ''}
                            onValueChange={(value) => updateFormField(index, 'entity_field', value || undefined)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select entity field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ENTITY_FIELDS.map((entityField) => (
                                <SelectItem key={entityField.value || 'none'} value={entityField.value}>
                                  {entityField.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Automatically fill this field from the counterparty entity's data
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/templates')}
              disabled={importTemplate.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={importTemplate.isPending}>
              {importTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Template
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
