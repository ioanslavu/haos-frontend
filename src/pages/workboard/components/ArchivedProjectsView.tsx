import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Search, RotateCcw, Trash2, Archive, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivateProject, useDeleteProject } from '@/api/hooks/useProjects';
import { PROJECT_TYPE_CONFIG, type Project } from '@/types/projects';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface ArchivedProjectsViewProps {
  projects: Project[];
  isLoading: boolean;
  onProjectClick: (project: Project) => void;
}

export function ArchivedProjectsView({
  projects,
  isLoading,
  onProjectClick,
}: ArchivedProjectsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const activateProject = useActivateProject();
  const deleteProject = useDeleteProject();

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestore = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    activateProject.mutate(project.id);
  };

  const handleDelete = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject.mutate(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Archive className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Archived Projects</h2>
          <Badge variant="secondary">{projects.length}</Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search archived projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 rounded-xl bg-background/50 border-white/10"
        />
      </div>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-500/10 to-slate-500/10 mb-4">
            <Archive className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {searchTerm ? 'No matches found' : 'Archive is empty'}
          </h3>
          <p className="text-sm max-w-sm mx-auto">
            {searchTerm
              ? 'No archived projects match your search. Try a different keyword.'
              : 'Projects you archive will appear here. You can restore them anytime or delete them permanently.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project) => {
            const typeConfig = PROJECT_TYPE_CONFIG[project.project_type];

            return (
              <div
                key={project.id}
                onClick={() => onProjectClick(project)}
                className={cn(
                  "group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
                  "bg-white/30 dark:bg-white/5 backdrop-blur-sm",
                  "border border-white/10 hover:border-white/20",
                  "hover:bg-white/50 dark:hover:bg-white/10"
                )}
              >
                {/* Type Icon */}
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl text-base flex-shrink-0 opacity-60",
                  "bg-gradient-to-br",
                  typeConfig.color.replace('bg-', 'from-') + '/20',
                  typeConfig.color.replace('bg-', 'to-') + '/10'
                )}>
                  {typeConfig.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{project.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{typeConfig.label}</span>
                    <span>{project.task_count} tasks</span>
                    {project.updated_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Archived {format(new Date(project.updated_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleRestore(e, project)}
                    className="rounded-lg text-green-600 hover:text-green-700 hover:bg-green-500/10"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDelete(e, project)}
                    className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{projectToDelete?.name}"? This action cannot be undone and all associated tasks will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ArchivedProjectsView;
