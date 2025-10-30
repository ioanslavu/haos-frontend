/**
 * ONBOARDING TOUR HOOK
 *
 * Custom hook to manage the onboarding tour state.
 *
 * USAGE:
 * ```tsx
 * const { run, steps } = useOnboardingTour();
 *
 * // Tour will automatically start for new users
 * // User can dismiss and it won't show again
 * ```
 *
 * PERSISTENCE:
 * Tour completion is stored in localStorage with key: 'onboarding-tour-completed'
 * To reset for testing: localStorage.removeItem('onboarding-tour-completed')
 *
 * FUTURE ENHANCEMENTS:
 * - Store completion in backend user preferences
 * - Add tour analytics tracking
 * - Support multiple tours (feature-specific)
 */

import { useState, useEffect } from 'react';
import { CallBackProps, Step, STATUS } from 'react-joyride';
import { getTourForUser } from '@/config/onboarding-tours';
import { useAuthStore } from '@/stores/authStore';

const TOUR_COMPLETED_KEY = 'onboarding-tour-completed';

export const useOnboardingTour = () => {
  const user = useAuthStore((state) => state.user);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);

  // Load tour steps based on user role/department
  useEffect(() => {
    if (user) {
      const userSteps = getTourForUser(user.role, user.department);
      setSteps(userSteps);
    }
  }, [user]);

  // Check if tour should run
  // DISABLED AUTO-START - User must manually trigger tour
  // This prevents auth polling loops and gives users control
  useEffect(() => {
    if (!user) return;

    // const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    // const isNewUser = !tourCompleted;

    // Only show tour to new users who have completed basic onboarding
    // const shouldShowTour = isNewUser && user.setup_completed;

    // if (shouldShowTour && steps.length > 0) {
    //   // Delay to allow page to render
    //   setTimeout(() => setRun(true), 1000);
    // }
  }, [user, steps]);

  /**
   * Handle tour events
   */
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    // Tour finished or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');

      // TODO: Send completion to backend
      // updateUserPreferences({ onboarding_tour_completed: true });
    }

    // Update step index
    if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  /**
   * Manually start the tour (e.g., from help menu)
   */
  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  /**
   * Manually stop the tour
   */
  const stopTour = () => {
    setRun(false);
  };

  /**
   * Reset tour (for testing or if user wants to replay)
   */
  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setStepIndex(0);
    setRun(true);
  };

  return {
    run,
    steps,
    stepIndex,
    handleJoyrideCallback,
    startTour,
    stopTour,
    resetTour,
  };
};
