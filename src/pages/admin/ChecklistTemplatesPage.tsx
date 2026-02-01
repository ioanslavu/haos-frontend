import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Copy, Trash2, CheckSquare, Settings2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useChecklistTemplates, useCreateChecklistTemplate } from '@/api/hooks/useChecklistTemplates';

interface ChecklistTemplate {
  id: number;
  name: string;
  description: string;
  entity_type: string;
  stage: string;
  is_active: boolean;
  is_default: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  items: ChecklistTemplateItem[];
}

interface ChecklistTemplateItem {
  id: number;
  template: number;
  category: string;
  item_name: string;
  description: string;
  order: number;
  required: boolean;
  validation_type: string;
  validation_type_display: string;
  quantity: number;
  has_task_inputs: boolean;
  task_type: string;
  requires_review: boolean;
  input_fields: any[];
}

interface CreateTemplateFormData {
  name: string;
  description: string;
  entity_type: string;
  stage: string;
  is_active: boolean;
  is_default: boolean;
}

export default function ChecklistTemplatesPage() {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateTemplateFormData>({
    defaultValues: {
      name: '',
      description: '',
      entity_type: 'song',
      stage: 'publishing',
      is_active: true,
      is_default: false,
    },
  });

  // Fetch templates
  const { data: templatesData, isLoading } = useChecklistTemplates();

  // Handle both paginated and non-paginated responses
  const templates = Array.isArray(templatesData)
    ? templatesData
    : templatesData?.results || [];

  // Create template mutation
  const createMutation = useCreateChecklistTemplate();

  const onSubmit = (data: CreateTemplateFormData) => {
    createMutation.mutate(data, {
      onSuccess: (data) => {
        setCreateDialogOpen(false);
        form.reset();
        toast({
          title: 'Template created',
          description: `"${data.name}" has been created successfully.`,
        });
        // Navigate to editor to add items
        navigate(`/admin/checklist-templates/${data.id}`);
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to create template',
          description: error.response?.data?.detail || 'An error occurred',
          variant: 'destructive',
        });
      },
    });
  };

  // Group templates by stage
  const stages = [
    { value: 'all', label: 'All Templates' },
    { value: 'publishing', label: 'Publishing' },
    { value: 'label_recording', label: 'Label Recording' },
    { value: 'label_review', label: 'Label Review' },
    { value: 'marketing_assets', label: 'Marketing Assets' },
    { value: 'ready_for_digital', label: 'Ready for Digital' },
    { value: 'digital_distribution', label: 'Digital Distribution' },
  ];

  const filteredTemplates = selectedStage === 'all'
    ? templates
    : templates.filter(t => t.stage === selectedStage);

  return (
    <AppLayout
      header={{
        title: 'Checklist Templates',
        description: 'Manage checklist templates for song workflow stages',
        icon: CheckSquare,
      }}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <Tabs value={selectedStage} onValueChange={setSelectedStage}>
            <TabsList>
              {stages.map(stage => (
                <TabsTrigger key={stage.value} value={stage.value}>
                  {stage.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading templates...
          </div>
        ) : !filteredTemplates || filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No templates found for this stage.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {template.is_default && (
                        <Badge variant="default" className="text-xs">
                          Default
                        </Badge>
                      )}
                      {!template.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Stats */}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CheckSquare className="h-4 w-4" />
                      <span>{template.items.length} items</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings2 className="h-4 w-4" />
                      <span>
                        {template.items.filter(i => i.requires_review).length} with review
                      </span>
                    </div>
                  </div>

                  {/* Template Items Preview */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Items:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {template.items.slice(0, 5).map(item => (
                        <div
                          key={item.id}
                          className="text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <span className="w-6 text-right">{item.order}.</span>
                          <span className="flex-1 truncate">{item.item_name}</span>
                          {item.quantity > 1 && (
                            <Badge variant="outline" className="text-xs">
                              ×{item.quantity}
                            </Badge>
                          )}
                          {item.requires_review && (
                            <span className="text-orange-500">🔍</span>
                          )}
                          {item.has_task_inputs && (
                            <span className="text-blue-500">📝</span>
                          )}
                        </div>
                      ))}
                      {template.items.length > 5 && (
                        <div className="text-xs text-muted-foreground italic">
                          +{template.items.length - 5} more items...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/admin/checklist-templates/${template.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement duplicate functionality
                        console.log('Duplicate template', template.id);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold">{templates?.length || 0}</div>
                <div className="text-muted-foreground">Total Templates</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {templates?.filter(t => t.is_active).length || 0}
                </div>
                <div className="text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {templates?.reduce((sum, t) => sum + t.items.length, 0) || 0}
                </div>
                <div className="text-muted-foreground">Total Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {templates?.reduce(
                    (sum, t) => sum + t.items.filter(i => i.requires_review).length,
                    0
                  ) || 0}
                </div>
                <div className="text-muted-foreground">Items with Review</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to Edit Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Django Admin:</strong> Click "Edit" on any template to open the Django admin interface where you can:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Add, remove, or reorder checklist items</li>
              <li>Configure item quantities (e.g., "3 Instagram posts")</li>
              <li>Toggle review requirements and task inputs</li>
              <li>Set validation types and help text</li>
              <li>Add input field templates for structured data collection</li>
            </ul>
            <p className="pt-2">
              <strong>Legend:</strong> 🔍 = Requires manager review, 📝 = Has input fields, ×N = Multiple quantity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Checklist Template</DialogTitle>
            <DialogDescription>
              Create a new checklist template. After creation, you'll be redirected to the admin panel to add items.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Template name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Marketing Assets Checklist" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this template..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="entity_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entity Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select entity type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="song">Song</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="recording">Recording</SelectItem>
                          <SelectItem value="release">Release</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="publishing">Publishing</SelectItem>
                          <SelectItem value="label_recording">Label Recording</SelectItem>
                          <SelectItem value="label_review">Label Review</SelectItem>
                          <SelectItem value="marketing_assets">Marketing Assets</SelectItem>
                          <SelectItem value="ready_for_digital">Ready for Digital</SelectItem>
                          <SelectItem value="digital_distribution">Digital Distribution</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-xs">
                          Template can be used
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_default"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Default</FormLabel>
                        <FormDescription className="text-xs">
                          Use as default for stage
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Template'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
