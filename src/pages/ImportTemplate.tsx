import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { GoogleDrivePickerButton } from '@/components/contracts/GoogleDrivePickerButton';
import { useImportTemplate } from '@/api/hooks/useContracts';

interface PlaceholderInput {
  key: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
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
  const [placeholders, setPlaceholders] = useState<PlaceholderInput[]>([
    { key: '', label: '', type: 'text', required: false },
  ]);

  const addPlaceholder = () => {
    setPlaceholders([...placeholders, { key: '', label: '', type: 'text', required: false }]);
  };

  const removePlaceholder = (index: number) => {
    setPlaceholders(placeholders.filter((_, i) => i !== index));
  };

  const updatePlaceholder = (index: number, field: keyof PlaceholderInput, value: any) => {
    const updated = [...placeholders];
    updated[index] = { ...updated[index], [field]: value };
    setPlaceholders(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!name || !series || !gdriveFileId || !gdriveOutputFolderId) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate series format (only uppercase letters)
    if (!/^[A-Z]+$/.test(series)) {
      alert('Series must contain only uppercase letters (e.g., HAHM, HAND, HAHC)');
      return;
    }

    // Filter out empty placeholders
    const validPlaceholders = placeholders.filter(p => p.key && p.label);

    if (validPlaceholders.length === 0) {
      alert('Please add at least one placeholder');
      return;
    }

    try {
      await importTemplate.mutateAsync({
        name,
        description,
        series,
        gdrive_file_id: gdriveFileId,
        gdrive_output_folder_id: gdriveOutputFolderId,
        placeholders: validPlaceholders,
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

          {/* Placeholders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Placeholders</CardTitle>
                  <CardDescription>
                    Define the placeholders that will be filled when generating contracts. Use &#123;&#123;key&#125;&#125; format in your Google Doc.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addPlaceholder}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Placeholder
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {placeholders.map((placeholder, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Placeholder {index + 1}</span>
                      {placeholders.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlaceholder(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Key</Label>
                        <Input
                          placeholder="e.g., employee_name"
                          value={placeholder.key}
                          onChange={(e) => updatePlaceholder(index, 'key', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Use in template as: &#123;&#123;{placeholder.key || 'key'}&#125;&#125;
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          placeholder="e.g., Employee Name"
                          value={placeholder.label}
                          onChange={(e) => updatePlaceholder(index, 'label', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={placeholder.type}
                          onValueChange={(value) => updatePlaceholder(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Required</Label>
                        <Select
                          value={placeholder.required ? 'yes' : 'no'}
                          onValueChange={(value) =>
                            updatePlaceholder(index, 'required', value === 'yes')
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Input
                        placeholder="Helper text for this field"
                        value={placeholder.description || ''}
                        onChange={(e) => updatePlaceholder(index, 'description', e.target.value)}
                      />
                    </div>
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
