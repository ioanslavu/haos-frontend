/**
 * SETUP PROGRESS HOOK
 *
 * Custom hook to track user's onboarding task completion.
 *
 * USAGE:
 * ```tsx
 * const { tasks, progress, isComplete } = useSetupProgress();
 *
 * <SetupProgressCard
 *   tasks={tasks}
 *   progress={progress}
 *   isComplete={isComplete}
 * />
 * ```
 *
 * DATA SOURCE:
 * Currently uses mock data. In production, this should fetch from:
 * - GET /api/v1/users/me/setup-stats/
 *
 * FUTURE ENHANCEMENTS:
 * - Real-time updates when tasks are completed
 * - WebSocket updates for instant progress
 * - Analytics tracking for task completion rates
 */

import { useState, useEffect } from 'react';
import {
  getSetupTasksForDepartment,
  calculateSetupProgress,
  SetupTask,
  SetupStats,
} from '@/config/setup-tasks';
import { useAuthStore } from '@/stores/authStore';

/**
 * Hook to manage setup progress
 */
export const useSetupProgress = () => {
  const user = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<SetupTask[]>([]);
  const [stats, setStats] = useState<SetupStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks for user's department
  useEffect(() => {
    if (!user?.department) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    const departmentTasks = getSetupTasksForDepartment(user.department);
    setTasks(departmentTasks);
  }, [user?.department]);

  // Fetch user stats
  useEffect(() => {
    if (!user) return;

    // TODO: Replace with real API call
    // const fetchStats = async () => {
    //   const response = await fetch('/api/v1/users/me/setup-stats/');
    //   const data = await response.json();
    //   setStats(data);
    //   setIsLoading(false);
    // };
    // fetchStats();

    // MOCK DATA for now
    const mockStats: SetupStats = {
      has_profile_picture: !!user.profile_picture,
      has_department: !!user.department,
      setup_completed: user.setup_completed || false,
      clients_count: 0,
      artists_count: 0,
      campaigns_count: 0,
      works_count: 0,
      recordings_count: 0,
      releases_count: 0,
      contracts_count: 0,
      templates_count: 0,
    };

    setStats(mockStats);
    setIsLoading(false);
  }, [user]);

  // Calculate progress
  const progress = stats && tasks.length > 0
    ? calculateSetupProgress(tasks, stats)
    : null;

  /**
   * Manually refresh stats (call after user completes a task)
   */
  const refreshStats = async () => {
    setIsLoading(true);
    // TODO: Re-fetch from API
    // const response = await fetch('/api/v1/users/me/setup-stats/');
    // const data = await response.json();
    // setStats(data);
    setIsLoading(false);
  };

  /**
   * Dismiss setup progress card (don't show again)
   */
  const dismissSetup = () => {
    localStorage.setItem('setup-progress-dismissed', 'true');
    // TODO: Update backend preference
    // updateUserPreferences({ setup_progress_dismissed: true });
  };

  /**
   * Check if setup card should be shown
   */
  const shouldShowSetup = () => {
    if (!user?.department) return false;
    if (!['digital', 'sales'].includes(user.department)) return false;
    if (progress?.isComplete) return false;

    const dismissed = localStorage.getItem('setup-progress-dismissed');
    return !dismissed;
  };

  return {
    tasks,
    stats,
    progress,
    isLoading,
    refreshStats,
    dismissSetup,
    shouldShowSetup: shouldShowSetup(),
  };
};
