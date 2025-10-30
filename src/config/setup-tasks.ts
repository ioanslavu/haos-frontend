/**
 * SETUP TASKS CONFIGURATION
 *
 * This file defines onboarding checklists for new users.
 * Tasks are department-specific and track user progress through initial setup.
 *
 * HOW TO ADD A NEW TASK:
 * 1. Add a new object to the appropriate department's task list
 * 2. Define id, label, description, and completion check
 * 3. Update the completion logic in useSetupProgress hook
 *
 * TASK PROPERTIES:
 * - id: Unique identifier (e.g., 'add_first_client')
 * - label: Short title shown in checklist
 * - description: Detailed explanation of what to do
 * - category: Group tasks by category ('profile', 'content', 'configuration')
 * - checkCompletion: Function that receives user data and returns boolean
 * - actionLabel: Text for action button (optional)
 * - actionPath: Route to navigate when action clicked (optional)
 * - priority: Order of display (1 = highest priority)
 *
 * EXAMPLE:
 * {
 *   id: 'upload_first_track',
 *   label: 'Upload your first track',
 *   description: 'Add a recording to the catalog with metadata',
 *   category: 'content',
 *   checkCompletion: (stats) => stats.recordings_count > 0,
 *   actionLabel: 'Add Recording',
 *   actionPath: '/catalog/recordings/create',
 *   priority: 2,
 * }
 */

export interface SetupTask {
  id: string;
  label: string;
  description: string;
  category: 'profile' | 'content' | 'configuration' | 'relationships';
  checkCompletion: (stats: SetupStats) => boolean;
  actionLabel?: string;
  actionPath?: string;
  priority: number;
}

/**
 * Statistics used to check task completion
 * This data should come from the backend API
 *
 * TO ADD NEW STATS:
 * 1. Add the property here
 * 2. Update the API response to include it
 * 3. Use it in checkCompletion functions below
 */
export interface SetupStats {
  // Profile
  has_profile_picture: boolean;
  has_department: boolean;
  setup_completed: boolean;

  // CRM (shared by digital & sales)
  clients_count: number;
  artists_count: number;
  campaigns_count: number;

  // Catalog (digital department)
  works_count: number;
  recordings_count: number;
  releases_count: number;

  // Contracts (sales department)
  contracts_count: number;
  templates_count: number;

  // Any additional custom stats
  [key: string]: any;
}

/**
 * Digital Department Setup Tasks
 * Focus: Catalog management and CRM
 */
const digitalSetupTasks: SetupTask[] = [
  {
    id: 'complete_profile',
    label: 'Complete your profile',
    description: 'Add your name and profile picture to personalize your account',
    category: 'profile',
    checkCompletion: (stats) => stats.setup_completed && stats.has_profile_picture,
    actionLabel: 'Edit Profile',
    actionPath: '/profile',
    priority: 1,
  },
  {
    id: 'join_department',
    label: 'Join the Digital department',
    description: 'Request access to your department to unlock full features',
    category: 'profile',
    checkCompletion: (stats) => stats.has_department,
    actionLabel: 'Select Department',
    actionPath: '/department-selection',
    priority: 1,
  },
  {
    id: 'add_first_work',
    label: 'Add your first musical work',
    description: 'Create a work entry with ISWC code and publishing splits',
    category: 'content',
    checkCompletion: (stats) => stats.works_count > 0,
    actionLabel: 'Create Work',
    actionPath: '/catalog/works/create',
    priority: 2,
  },
  {
    id: 'add_first_recording',
    label: 'Add your first recording',
    description: 'Upload a recording with ISRC code and metadata',
    category: 'content',
    checkCompletion: (stats) => stats.recordings_count > 0,
    actionLabel: 'Create Recording',
    actionPath: '/catalog/recordings/create',
    priority: 3,
  },
  {
    id: 'add_first_artist',
    label: 'Add an artist to CRM',
    description: 'Create your first artist profile in the CRM',
    category: 'relationships',
    checkCompletion: (stats) => stats.artists_count > 0,
    actionLabel: 'Add Artist',
    actionPath: '/crm?tab=artists',
    priority: 4,
  },
];

/**
 * Sales Department Setup Tasks
 * Focus: CRM and contracts
 */
const salesSetupTasks: SetupTask[] = [
  {
    id: 'complete_profile',
    label: 'Complete your profile',
    description: 'Add your name and profile picture to personalize your account',
    category: 'profile',
    checkCompletion: (stats) => stats.setup_completed && stats.has_profile_picture,
    actionLabel: 'Edit Profile',
    actionPath: '/profile',
    priority: 1,
  },
  {
    id: 'join_department',
    label: 'Join the Sales department',
    description: 'Request access to your department to unlock full features',
    category: 'profile',
    checkCompletion: (stats) => stats.has_department,
    actionLabel: 'Select Department',
    actionPath: '/department-selection',
    priority: 1,
  },
  {
    id: 'add_first_client',
    label: 'Add your first client',
    description: 'Create a client profile to start managing relationships',
    category: 'relationships',
    checkCompletion: (stats) => stats.clients_count > 0,
    actionLabel: 'Add Client',
    actionPath: '/crm?tab=clients',
    priority: 2,
  },
  {
    id: 'create_campaign',
    label: 'Create a campaign',
    description: 'Set up your first campaign to track deals and opportunities',
    category: 'relationships',
    checkCompletion: (stats) => stats.campaigns_count > 0,
    actionLabel: 'New Campaign',
    actionPath: '/crm?tab=campaigns',
    priority: 3,
  },
  {
    id: 'upload_template',
    label: 'Upload a contract template',
    description: 'Add a Google Docs template for contract generation',
    category: 'configuration',
    checkCompletion: (stats) => stats.templates_count > 0,
    actionLabel: 'Import Template',
    actionPath: '/templates/import',
    priority: 4,
  },
];

/**
 * Main configuration object
 * Maps departments to their setup task lists
 *
 * TO ADD A NEW DEPARTMENT:
 * 1. Create a new array of tasks (e.g., `marketingSetupTasks`)
 * 2. Add it to this object with the department name as key
 */
export const setupTasksByDepartment: Record<string, SetupTask[]> = {
  digital: digitalSetupTasks,
  sales: salesSetupTasks,
};

/**
 * Get setup tasks for a user's department
 *
 * @param department - User's department (e.g., 'digital', 'sales')
 * @returns Array of setup tasks, or empty array if no tasks for department
 */
export const getSetupTasksForDepartment = (
  department?: string
): SetupTask[] => {
  if (!department) return [];
  return setupTasksByDepartment[department] || [];
};

/**
 * Calculate setup progress
 *
 * @param tasks - List of setup tasks
 * @param stats - User's current stats
 * @returns Object with completion stats
 */
export const calculateSetupProgress = (
  tasks: SetupTask[],
  stats: SetupStats
) => {
  const completedTasks = tasks.filter((task) => task.checkCompletion(stats));
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedCount,
    percentage,
    isComplete: completedCount === totalTasks,
    remainingTasks: tasks.filter((task) => !task.checkCompletion(stats)),
  };
};

/**
 * Group tasks by category
 *
 * @param tasks - List of setup tasks
 * @returns Tasks grouped by category
 */
export const groupTasksByCategory = (tasks: SetupTask[]) => {
  return tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, SetupTask[]>);
};

/**
 * Category labels for display
 */
export const categoryLabels: Record<SetupTask['category'], string> = {
  profile: 'Profile Setup',
  content: 'Content Creation',
  configuration: 'Configuration',
  relationships: 'CRM & Relationships',
};
