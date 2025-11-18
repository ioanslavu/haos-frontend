import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, FileEdit, Eye, CheckCircle2 } from 'lucide-react';
import apiClient from '@/api/client';
import { addTemplateToSong } from '@/api/songApi';
import { useToast } from '@/hooks/use-toast';
import { SongStage } from '@/types/song';

interface ChecklistTemplate {
  id: number;
  name: string;
  description: string;
  entity_type: string;
  stage: SongStage | null;
  is_active: boolean;
  is_default: boolean;
  item_count: number;
  created_at: string;
  updated_at: string;
}

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songId: number;
  currentStage: SongStage;
  recordingId?: number;
}

export function AddTemplateDialog({
  open,
  onOpenChange,
  songId,
  currentStage,
  recordingId,
}: AddTemplateDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  // Fetch available templates for current stage
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['checklist-templates', currentStage],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/checklist-templates/', {
        params: {
          stage: currentStage,
          is_active: true,
        },
      });
      return response.data;
    },
    enabled: open,
  });

  const templates: ChecklistTemplate[] = Array.isArray(templatesData)
    ? templatesData
    : templatesData?.results || [];

  // Mutation to add template
  const addTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const response = await addTemplateToSong(songId, {
        template_id: templateId,
        recording_id: recordingId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['song-checklist', songId] });
      queryClient.invalidateQueries({ queryKey: ['song', songId] });
      toast({
        title: 'Template Added',
        description: `${data.created_count} checklist items added successfully.`,
      });
      onOpenChange(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add template',
        variant: 'destructive',
      });
    },
  });

  const handleAddTemplate = () => {
    if (selectedTemplate) {
      addTemplateMutation.mutate(selectedTemplate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Checklist Template</DialogTitle>
          <DialogDescription>
            Select a checklist template to add to this song's {currentStage} stage.
            {recordingId && ' This will be added to the specific recording.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No templates available for this stage.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Templates can be created in the Admin section.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all ${
                  selectedTemplate === template.id
                    ? 'ring-2 ring-primary bg-accent'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.is_default && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    {selectedTemplate === template.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileEdit className="h-4 w-4" />
                    <span>{template.item_count} checklist items</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedTemplate(null);
            }}
            disabled={addTemplateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddTemplate}
            disabled={!selectedTemplate || addTemplateMutation.isPending}
          >
            {addTemplateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {addTemplateMutation.isPending ? 'Adding...' : 'Add Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
