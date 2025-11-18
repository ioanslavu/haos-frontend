import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { type Project } from '@/types/projects';
import { ProjectTasksView } from './ProjectTasksView';

interface ProjectDetailSheetProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailSheet({ project, isOpen, onClose }: ProjectDetailSheetProps) {
  if (!project) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl p-4 overflow-hidden"
      >
        <ProjectTasksView
          project={project}
          showFullPageButton={true}
          onClose={onClose}
        />
      </SheetContent>
    </Sheet>
  );
}

export default ProjectDetailSheet;
