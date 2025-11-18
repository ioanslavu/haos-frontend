import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, ChevronRight, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  type Project,
} from '@/types/projects';
import { format } from 'date-fns';

interface ProjectListProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectList({ projects, onProjectClick }: ProjectListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  // For smaller lists, don't virtualize
  if (projects.length <= 50) {
    return (
      <div className="space-y-2">
        {projects.map((project) => (
          <ProjectListItem
            key={project.id}
            project={project}
            onClick={onProjectClick}
          />
        ))}
      </div>
    );
  }

  // Virtualized list for large project counts
  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-400px)] overflow-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
    >
      <div
        className="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const project = projects[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ProjectListItem
                project={project}
                onClick={onProjectClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProjectListItem({
  project,
  onClick,
}: {
  project: Project;
  onClick: (project: Project) => void;
}) {
  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type];
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];
  const isPinned = project.metadata?.pinned;

  return (
    <div
      onClick={() => onClick(project)}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
        "bg-white/50 dark:bg-white/5 backdrop-blur-sm",
        "border border-white/10 hover:border-indigo-500/30",
        "hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-lg"
      )}
    >
      {/* Type Icon */}
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-xl text-base flex-shrink-0",
        "bg-gradient-to-br",
        typeConfig.color.replace('bg-', 'from-') + '/20',
        typeConfig.color.replace('bg-', 'to-') + '/10'
      )}>
        {typeConfig.icon}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            {project.name}
          </h3>
          {isPinned && (
            <Pin className="h-3 w-3 text-indigo-500 fill-indigo-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
          <span className="text-xs text-muted-foreground">
            {project.completed_task_count}/{project.task_count} tasks
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-32 hidden md:block">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-medium">{project.completion_percentage}%</span>
        </div>
        <Progress
          value={project.completion_percentage}
          className="h-1.5 bg-black/5 dark:bg-white/10"
        />
      </div>

      {/* Due Date */}
      {project.end_date && (
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(new Date(project.end_date), 'MMM d, yyyy')}</span>
        </div>
      )}

      {/* Status */}
      <Badge
        variant="secondary"
        className={cn(
          "rounded-lg text-xs font-medium flex-shrink-0",
          statusConfig.bgColor,
          statusConfig.color
        )}
      >
        {statusConfig.label}
      </Badge>

      {/* Creator Avatar */}
      {project.created_by && (
        <Avatar className="h-7 w-7 border border-white/20 flex-shrink-0 hidden sm:flex">
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

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}

export default ProjectList;
