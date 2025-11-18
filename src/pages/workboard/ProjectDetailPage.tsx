import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useProject } from '@/api/hooks/useProjects';
import { ProjectTasksView } from './components/ProjectTasksView';

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const projectId = parseInt(id || '0');
  const taskIdFromQuery = searchParams.get('taskId');

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);

  if (isLoadingProject) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading project...</div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-muted-foreground">Project not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/workboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ProjectTasksView
        project={project}
        showBackButton={true}
        initialTaskId={taskIdFromQuery ? parseInt(taskIdFromQuery) : undefined}
      />
    </AppLayout>
  );
}
