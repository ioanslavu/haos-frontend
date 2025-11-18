import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ProjectCard } from './ProjectCard';
import type { Project } from '@/types/projects';

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectGrid({ projects, onProjectClick }: ProjectGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate grid dimensions based on container width
  // We'll use CSS grid for responsiveness, but virtualize rows
  const columnCount = 4; // Assume 4 columns, CSS will handle responsiveness
  const rowHeight = 220; // Approximate height of a project card + gap
  const gap = 16;

  // Group projects into rows for virtualization
  const rows = useMemo(() => {
    const result: Project[][] = [];
    for (let i = 0; i < projects.length; i += columnCount) {
      result.push(projects.slice(i, i + columnCount));
    }
    return result;
  }, [projects, columnCount]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 3,
  });

  // For smaller project counts, don't virtualize
  if (projects.length <= 24) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={onProjectClick}
          />
        ))}
      </div>
    );
  }

  // Virtualized grid for large project counts
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
          const rowProjects = rows[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={onProjectClick}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectGrid;
