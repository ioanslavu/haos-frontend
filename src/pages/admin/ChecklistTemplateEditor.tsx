import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Save,
  Trash2,
  GripVertical,
  Settings,
  ArrowLeft,
  CheckSquare,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/api/client';

interface ChecklistTemplate {
  id: number;
  name: string;
  description: string;
  entity_type: string;
  stage: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface ChecklistTemplateItem {
  id?: number;
  template?: number;
  category: string;
  item_name: string;
  description: string;
  order: number;
  required: boolean;
  validation_type: string;
  quantity: number;
  has_task_inputs: boolean;
  task_type: string;
  requires_review: boolean;
}

export default function ChecklistTemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<ChecklistTemplateItem | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  // Fetch template
  const { data: template, isLoading } = useQuery({
    queryKey: ['checklist-template', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/checklist-templates/${id}/`);
      return response.data;
    },
  });

  // Fetch template items
  const { data: itemsData } = useQuery({
    queryKey: ['checklist-template-items', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/checklist-template-items/?template=${id}`);
      return response.data;
    },
  });

  const items = Array.isArray(itemsData) ? itemsData : itemsData?.results || [];

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: Partial<ChecklistTemplate>) => {
      const response = await apiClient.patch(`/api/v1/checklist-templates/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-template', id] });
      toast({ title: 'Template updated successfully' });
    },
  });

  // Create/Update item mutation
  const saveItemMutation = useMutation({
    mutationFn: async (data: ChecklistTemplateItem) => {
      if (data.id) {
        const response = await apiClient.patch(
          `/api/v1/checklist-template-items/${data.id}/`,
          data
        );
        return response.data;
      } else {
        const response = await apiClient.post('/api/v1/checklist-template-items/', {
          ...data,
          template: id,
        });
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-template-items', id] });
      setItemDialogOpen(false);
      setEditingItem(null);
      toast({ title: 'Item saved successfully' });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiClient.delete(`/api/v1/checklist-template-items/${itemId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-template-items', id] });
      toast({ title: 'Item deleted successfully' });
    },
  });

  const handleAddItem = () => {
    setEditingItem({
      category: 'General',
      item_name: '',
      description: '',
      order: items.length + 1,
      required: true,
      validation_type: 'manual',
      quantity: 1,
      has_task_inputs: false,
      task_type: 'general',
      requires_review: false,
    });
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: ChecklistTemplateItem) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (editingItem) {
      saveItemMutation.mutate(editingItem);
    }
  };

  if (isLoading) {
    return (
      <AppLayout
        header={{
          title: 'Loading...',
          icon: CheckSquare,
        }}
      >
        <div className="text-center py-12">Loading template...</div>
      </AppLayout>
    );
  }

  if (!template) {
    return (
      <AppLayout
        header={{
          title: 'Not Found',
          icon: CheckSquare,
        }}
      >
        <div className="text-center py-12">Template not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      header={{
        title: template.name,
        description: 'Edit checklist template',
        icon: CheckSquare,
        actions: (
          <Button variant="outline" onClick={() => navigate('/admin/checklist-templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        ),
      }}
    >
      <div className="space-y-6">
        {/* Template Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Template Settings</CardTitle>
            <CardDescription>Configure template metadata and behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={template.name}
                  onChange={(e) =>
                    updateTemplateMutation.mutate({ name: e.target.value })
                  }
                  placeholder="e.g., Marketing Assets Checklist"
                />
              </div>

              <div className="space-y-2">
                <Label>Stage</Label>
                <Select
                  value={template.stage}
                  onValueChange={(value) =>
                    updateTemplateMutation.mutate({ stage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publishing">Publishing</SelectItem>
                    <SelectItem value="label_recording">Label Recording</SelectItem>
                    <SelectItem value="label_review">Label Review</SelectItem>
                    <SelectItem value="marketing_assets">Marketing Assets</SelectItem>
                    <SelectItem value="ready_for_digital">Ready for Digital</SelectItem>
                    <SelectItem value="digital_distribution">
                      Digital Distribution
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={template.description}
                onChange={(e) =>
                  updateTemplateMutation.mutate({ description: e.target.value })
                }
                placeholder="Brief description of this template..."
                rows={3}
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={template.is_active}
                  onCheckedChange={(checked) =>
                    updateTemplateMutation.mutate({ is_active: checked })
                  }
                />
                <Label htmlFor="is-active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={template.is_default}
                  onCheckedChange={(checked) =>
                    updateTemplateMutation.mutate({ is_default: checked })
                  }
                />
                <Label htmlFor="is-default">Default for this stage</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Checklist Items</CardTitle>
                <CardDescription>
                  {items.length} items in this template
                </CardDescription>
              </div>
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No items yet. Click "Add Item" to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {items
                  .sort((a: ChecklistTemplateItem, b: ChecklistTemplateItem) => a.order - b.order)
                  .map((item: ChecklistTemplateItem) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.item_name}</span>
                          {item.required && (
                            <Badge variant="secondary" className="text-xs">
                              Required
                            </Badge>
                          )}
                          {item.quantity > 1 && (
                            <Badge variant="outline" className="text-xs">
                              ×{item.quantity}
                            </Badge>
                          )}
                          {item.requires_review && (
                            <Badge className="text-xs bg-orange-500">
                              Review
                            </Badge>
                          )}
                          {item.has_task_inputs && (
                            <Badge className="text-xs bg-blue-500">
                              Inputs
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Category: {item.category}</span>
                          <span>Order: {item.order}</span>
                          <span>Validation: {item.validation_type}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                `Delete "${item.item_name}"? This cannot be undone.`
                              )
                            ) {
                              deleteItemMutation.mutate(item.id!);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Item Editor Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id ? 'Edit Item' : 'Add Item'}
            </DialogTitle>
            <DialogDescription>
              Configure checklist item settings
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name *</Label>
                  <Input
                    value={editingItem.item_name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, item_name: e.target.value })
                    }
                    placeholder="e.g., Upload cover artwork"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, category: e.target.value })
                    }
                    placeholder="e.g., Marketing"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  placeholder="Optional description..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={editingItem.order}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        order: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingItem.quantity}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Validation Type</Label>
                  <Select
                    value={editingItem.validation_type}
                    onValueChange={(value) =>
                      setEditingItem({ ...editingItem, validation_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="auto_entity_exists">
                        Auto - Entity Exists
                      </SelectItem>
                      <SelectItem value="auto_field_complete">
                        Auto - Field Complete
                      </SelectItem>
                      <SelectItem value="auto_count">Auto - Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="required">Required</Label>
                  <Switch
                    id="required"
                    checked={editingItem.required}
                    onCheckedChange={(checked) =>
                      setEditingItem({ ...editingItem, required: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="has-inputs">Has Input Fields</Label>
                  <Switch
                    id="has-inputs"
                    checked={editingItem.has_task_inputs}
                    onCheckedChange={(checked) =>
                      setEditingItem({ ...editingItem, has_task_inputs: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="requires-review">Requires Review</Label>
                  <Switch
                    id="requires-review"
                    checked={editingItem.requires_review}
                    onCheckedChange={(checked) =>
                      setEditingItem({ ...editingItem, requires_review: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setItemDialogOpen(false);
                setEditingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={saveItemMutation.isPending}>
              {saveItemMutation.isPending ? 'Saving...' : 'Save Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
