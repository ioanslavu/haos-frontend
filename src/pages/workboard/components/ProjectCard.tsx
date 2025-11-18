import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, Pin, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  type Project,
} from '@/types/projects';
import { useArchiveProject, useActivateProject, useUpdateProject } from '@/api/hooks/useProjects';
import { format } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

export const ProjectCard = memo(function ProjectCard({ project, onClick }: ProjectCardProps) {
  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type];
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  const archiveProject = useArchiveProject();
  const activateProject = useActivateProject();
  const updateProject = useUpdateProject();

  const isPinned = project.metadata?.pinned;

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateProject.mutate({
      id: project.id,
      data: {
        metadata: {
          ...project.metadata,
          pinned: !isPinned,
        },
      },
    });
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.status === 'archived') {
      activateProject.mutate(project.id);
    } else {
      archiveProject.mutate(project.id);
    }
  };

  return (
    <div
      onClick={() => onClick(project)}
      className={cn(
        "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300",
        "bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-white/5",
        "backdrop-blur-xl border border-white/20 dark:border-white/10",
        "shadow-lg hover:shadow-2xl hover:scale-[1.02]",
        "hover:border-indigo-500/30 dark:hover:border-indigo-400/30"
      )}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Pinned indicator */}
      {isPinned && (
        <div className="absolute top-3 right-3 z-20">
          <Pin className="h-4 w-4 text-indigo-500 fill-indigo-500" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl text-lg",
              "bg-gradient-to-br shadow-sm",
              typeConfig.color.replace('bg-', 'from-') + '/20',
              typeConfig.color.replace('bg-', 'to-') + '/10'
            )}>
              {typeConfig.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {typeConfig.label}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={handlePin}>
                <Pin className={cn("h-4 w-4 mr-2", isPinned && "fill-current")} />
                {isPinned ? 'Unpin' : 'Pin to top'}
              </DropdownMenuItem>
              {/* Hide archive for projects with "general" in name */}
              {!project.name.toLowerCase().includes('general') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleArchive} className="text-red-600">
                    {project.status === 'archived' ? 'Restore' : 'Archive'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium">{project.completion_percentage}%</span>
          </div>
          <Progress
            value={project.completion_percentage}
            className="h-1.5 bg-black/5 dark:bg-white/10"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          {project.end_date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(project.end_date), 'MMM d')}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{project.completed_task_count}</span>
            <span>/</span>
            <span>{project.task_count} tasks</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Status Badge */}
          <Badge
            variant="secondary"
            className={cn(
              "rounded-lg text-xs font-medium",
              statusConfig.bgColor,
              statusConfig.color
            )}
          >
            {statusConfig.label}
          </Badge>

          {/* Creator Avatar */}
          {project.created_by && (
            <Avatar className="h-6 w-6 border border-white/20">
              <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                {project.created_by.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1 opacity-50 group-hover:opacity-100 transition-opacity",
          typeConfig.color
        )}
      />
    </div>
  );
});

export default ProjectCard;
