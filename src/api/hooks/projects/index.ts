// Types (re-exported from @/types/projects)
export type {
  Project,
  ProjectDetail,
  ProjectCreatePayload,
  ProjectUpdatePayload,
  ProjectFilterParams,
  ProjectTask,
  ProjectTaskDetail,
  ProjectTaskCreatePayload,
  ProjectTaskFilterParams,
  RecurringTaskTemplate,
  RecurringTaskTemplateCreatePayload,
  ProjectTemplate,
  AddMemberPayload,
  CreateFromTemplatePayload,
  ProjectStats,
} from './types';

// Query keys
export { projectKeys } from './keys';

// List queries
export {
  useProjects,
  useInfiniteProjects,
  useProjectTasks,
  useMyProjectTasks,
  useOverdueProjectTasks,
  useRecurringTaskTemplates,
  useProjectTemplates,
  useProjectStats,
} from './useProjects';

// Single item queries
export { useProject, useProjectTask, useRecurringTaskTemplate } from './useProject';

// Project mutations
export {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useArchiveProject,
  useActivateProject,
  useAddProjectMember,
  useRemoveProjectMember,
  useCreateProjectFromTemplate,
} from './useProjectMutations';

// Project task mutations
export {
  useCreateProjectTask,
  useUpdateProjectTask,
  useStartProjectTask,
  useCompleteProjectTask,
  useReopenProjectTask,
} from './useProjectTaskMutations';

// Recurring task mutations
export {
  useCreateRecurringTaskTemplate,
  useUpdateRecurringTaskTemplate,
  useDeleteRecurringTaskTemplate,
  useActivateRecurringTask,
  useDeactivateRecurringTask,
  useGenerateRecurringTaskNow,
} from './useRecurringTaskMutations';
