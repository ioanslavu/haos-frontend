import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Save, Eye, Trash2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTemplate, useUpdateTemplate } from '@/api/hooks/useContracts';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: template, isLoading, error } = useTemplate(Number(id));
  const updateTemplate = useUpdateTemplate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [series, setSeries] = useState('');
  const [originalSeries, setOriginalSeries] = useState('');
  const [updateExistingContracts, setUpdateExistingContracts] = useState(false);
  const [placeholders, setPlaceholders] = useState<Array<{ key: string; label: string; type: string; required: boolean; description?: string }>>([]);
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when template loads
  React.useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setSeries(template.series);
      setOriginalSeries(template.series);
      setPlaceholders(template.placeholders || []);
    }
  }, [template]);

  const handleSave = async () => {
    if (!template) return;

    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        payload: {
          name,
          description,
          series,
          placeholders,
          update_existing_contracts: updateExistingContracts,
        },
      });
      toast.success('Template updated successfully');
      setHasChanges(false);
      setOriginalSeries(series);
      setUpdateExistingContracts(false);
    } catch (error) {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleAddPlaceholder = () => {
    if (!newPlaceholder.trim()) return;

    // Clean the placeholder name (remove any {{ }} if user added them)
    const cleanName = newPlaceholder.trim().replace(/^\{\{|\}\}$/g, '').trim();

    if (placeholders.some(p => p.key === cleanName)) {
      toast.error('Placeholder already exists');
      return;
    }

    setPlaceholders([...placeholders, { key: cleanName, label: cleanName, type: 'text', required: false }]);
    setNewPlaceholder('');
    setHasChanges(true);
  };

  const handleRemovePlaceholder = (index: number) => {
    setPlaceholders(placeholders.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleEditPlaceholder = (index: number) => {
    setEditingIndex(index);
    setEditingValue(placeholders[index].key);
  };

  const handleSavePlaceholderEdit = () => {
    if (editingIndex === null || !editingValue.trim()) return;

    const cleanName = editingValue.trim().replace(/^\{\{|\}\}$/g, '').trim();

    // Check if new value is duplicate (excluding current one)
    if (placeholders.some((p, i) => i !== editingIndex && p.key === cleanName)) {
      toast.error('Placeholder already exists');
      return;
    }

    const updated = [...placeholders];
    updated[editingIndex] = { ...updated[editingIndex], key: cleanName, label: cleanName };
    setPlaceholders(updated);
    setEditingIndex(null);
    setEditingValue('');
    setHasChanges(true);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleFieldChange = (field: 'name' | 'description' | 'series', value: string) => {
    if (field === 'name') setName(value);
    else if (field === 'description') setDescription(value);
    else if (field === 'series') setSeries(value);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !template) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load template. Please try again.</p>
          <Button onClick={() => navigate('/templates')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Edit Template</h1>
              <p className="text-muted-foreground mt-1">
                Manage template details and placeholders
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(`https://docs.google.com/document/d/${template.gdrive_template_file_id}/edit`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View in Google Drive
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || updateTemplate.isPending}>
              {updateTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Template Information */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
            <CardDescription>Basic details about this contract template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Enter template description"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="series">Series Code *</Label>
                <Input
                  id="series"
                  value={series}
                  onChange={(e) => handleFieldChange('series', e.target.value.toUpperCase())}
                  placeholder="e.g., HAHM, HAND, HAHC"
                  maxLength={10}
                  className="font-mono uppercase"
                  pattern="[A-Z]+"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Contract numbering code (uppercase letters only).
                  <br />
                  Format: <code className="font-mono bg-muted px-1 py-0.5 rounded">{series || 'HAHM'}-1</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">{series || 'HAHM'}-2</code>, etc.
                  <br />
                  <span className="text-orange-600 dark:text-orange-400">Numbers reset every year on January 1st.</span>
                  {template.last_contract_number && (
                    <span className="block mt-1">
                      Last contract: <code className="font-mono">{template.last_contract_number}</code>
                    </span>
                  )}
                </p>
              </div>

              {series !== originalSeries && (
                <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                  <Checkbox
                    id="update-existing"
                    checked={updateExistingContracts}
                    onCheckedChange={(checked) => setUpdateExistingContracts(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="update-existing"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Update existing contracts
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Renumber all contracts from <code className="font-mono">{originalSeries}-X</code> to <code className="font-mono">{series}-X</code>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-muted-foreground">Created By</Label>
                <p className="font-medium">{template.created_by_email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="font-medium">{new Date(template.created_at).toLocaleString()}</p>
              </div>
            </div>

            {template.updated_at && (
              <div>
                <Label className="text-muted-foreground">Last Updated</Label>
                <p className="font-medium">{new Date(template.updated_at).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placeholders */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Placeholders</CardTitle>
                <CardDescription>
                  Available placeholders in this template ({placeholders.length} total)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new placeholder */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter placeholder name (e.g. client_name)"
                value={newPlaceholder}
                onChange={(e) => setNewPlaceholder(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddPlaceholder()}
              />
              <Button onClick={handleAddPlaceholder} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Placeholder list */}
            {placeholders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No placeholders in this template</p>
                <p className="text-sm mt-2">
                  Add placeholders above, or add them to your Google Doc using: {'{{placeholder_name}}'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {placeholders.map((placeholder, index) => (
                  <div
                    key={index}
                    className="group p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between gap-2"
                  >
                    {editingIndex === index ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSavePlaceholderEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="h-7 text-sm font-mono"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={handleSavePlaceholderEdit}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <code
                          className="text-sm font-mono text-foreground break-all cursor-pointer flex-1"
                          onClick={() => handleEditPlaceholder(index)}
                        >
                          {'{{'}{placeholder.key}{'}}'}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemovePlaceholder(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Drive Information */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle>Google Drive Integration</CardTitle>
            <CardDescription>Connected Google Drive files and folders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Template File ID</Label>
              <p className="font-mono text-sm">{template.gdrive_template_file_id}</p>
            </div>
            {template.gdrive_output_folder_id && (
              <div>
                <Label className="text-muted-foreground">Output Folder ID</Label>
                <p className="font-mono text-sm">{template.gdrive_output_folder_id}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
