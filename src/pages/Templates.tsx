import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Loader2, Eye, Edit, Trash2, MoreVertical, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { NoTemplatesEmptyState, NoSearchResultsEmptyState, ErrorEmptyState } from '@/components/ui/empty-states-presets';
import { useTemplates, useDeleteTemplate } from '@/api/hooks/useContracts';
import { ContractTemplate } from '@/api/services/contracts.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export default function Templates() {
  const navigate = useNavigate();
  const { data: templates, isLoading, error } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ContractTemplate | null>(null);

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplate.mutateAsync(templateToDelete.id);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && template.is_active;
  }) || [];

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Glassmorphic Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-fuchsia-400/30 to-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Contract Templates
                </h1>
                <p className="text-muted-foreground text-lg mt-2">
                  Manage contract templates stored in Google Drive
                </p>
              </div>
              <Button onClick={() => navigate('/templates/import')} className="shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Import from Google Drive
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader>
            <h3 className="text-lg font-semibold">Search & Filters</h3>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-10 backdrop-blur-sm bg-background/50 border-white/20 dark:border-white/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State with Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="hover-lift">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full mt-3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 w-full" />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorEmptyState
            errorMessage="Failed to load templates"
            onRetry={() => window.location.reload()}
          />
        )}

        {/* Templates Grid */}
        {!isLoading && !error && filteredTemplates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-2xl">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm">
                        <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="subtle-success" icon={CheckCircle2} size="sm">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-3">
                    {template.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Series:</span>
                      <Badge variant="secondary" className="font-mono">{template.series}</Badge>
                    </div>
                    {template.last_contract_number && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Contract:</span>
                        <span className="font-mono text-xs">{template.last_contract_number}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Author:</span>
                      <span className="font-medium">{template.created_by_email}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Placeholders:</span>
                      <span className="font-medium">{template.placeholders?.length ?? 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`https://docs.google.com/document/d/${template.gdrive_template_file_id}/edit`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/templates/${template.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setTemplateToDelete(template);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTemplates.length === 0 && (
          searchTerm ? (
            <NoSearchResultsEmptyState
              searchQuery={searchTerm}
              onClearSearch={() => setSearchTerm('')}
            />
          ) : (
            <NoTemplatesEmptyState
              onSecondaryAction={() => navigate('/templates/import')}
            />
          )
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
              {' '}Note: You cannot delete templates that have existing contracts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
