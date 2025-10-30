/**
 * ONBOARDING TOURS CONFIGURATION
 *
 * This file defines interactive product tours for new users.
 * Tours are role-specific and guide users through key features.
 *
 * HOW TO ADD A NEW TOUR:
 * 1. Add a new key to the `onboardingTours` object
 * 2. Define steps with target selectors and content
 * 3. Use data-tour attributes in components for targeting
 *
 * STEP PROPERTIES:
 * - target: CSS selector or data-tour attribute (e.g., '[data-tour="contracts-nav"]')
 * - content: Text to display in the tooltip
 * - title: Optional title for the step
 * - placement: Where to position the tooltip ('top', 'bottom', 'left', 'right', 'auto')
 * - disableBeacon: If true, skips the pulsing beacon animation
 * - spotlightClicks: If true, allows clicking the highlighted element
 *
 * EXAMPLE:
 * {
 *   target: '[data-tour="create-contract"]',
 *   content: 'Click here to create your first contract',
 *   title: 'Create Contracts',
 *   placement: 'right',
 * }
 */

import { Step } from 'react-joyride';

export type UserRole = 'admin' | 'digital' | 'sales' | 'default';

/**
 * Common steps shared across multiple tours
 */
const commonSteps: Step[] = [
  {
    target: '[data-tour="dashboard-nav"]',
    content: 'This is your dashboard where you can see an overview of all activities and key metrics.',
    title: 'Welcome to HaHaHa Production!',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile-menu"]',
    content: 'Access your profile settings, preferences, and logout from here.',
    title: 'Your Profile',
    placement: 'bottom',
  },
];

/**
 * Digital Department Tour
 * Focus: Catalog management, metadata, ISRC codes
 */
const digitalTourSteps: Step[] = [
  ...commonSteps,
  {
    target: '[data-tour="catalog-nav"]',
    content: 'Manage your music catalog here. Add works, recordings, and releases with proper metadata.',
    title: 'Music Catalog',
    placement: 'right',
  },
  {
    target: '[data-tour="works-nav"]',
    content: 'Musical works are compositions. Add ISWC codes, credits, and publishing splits here.',
    title: 'Musical Works',
    placement: 'right',
  },
  {
    target: '[data-tour="recordings-nav"]',
    content: 'Recordings are specific versions of works. Track ISRC codes, masters, and releases.',
    title: 'Recordings',
    placement: 'right',
  },
  {
    target: '[data-tour="crm-nav"]',
    content: 'Manage relationships with artists, clients, and brands in the CRM.',
    title: 'CRM & Contacts',
    placement: 'right',
  },
];

/**
 * Sales Department Tour
 * Focus: CRM, analytics, revenue tracking
 */
const salesTourSteps: Step[] = [
  ...commonSteps,
  {
    target: '[data-tour="crm-nav"]',
    content: 'Your main workspace. Manage campaigns, clients, artists, and brand partnerships here.',
    title: 'CRM Hub',
    placement: 'right',
  },
  {
    target: '[data-tour="analytics-nav"]',
    content: 'Track revenue, performance metrics, and business intelligence.',
    title: 'Analytics & Reports',
    placement: 'right',
  },
  {
    target: '[data-tour="contracts-nav"]',
    content: 'View and manage contracts with artists and clients. Track signatures and status.',
    title: 'Contracts',
    placement: 'right',
  },
  {
    target: '[data-tour="entities-nav"]',
    content: 'Browse all entities (artists, labels, publishers) and generate contracts.',
    title: 'Entities',
    placement: 'right',
  },
];

/**
 * Admin Tour
 * Focus: User management, system settings, roles
 */
const adminTourSteps: Step[] = [
  ...commonSteps,
  {
    target: '[data-tour="users-nav"]',
    content: 'Manage team members, review department requests, and control access.',
    title: 'User Management',
    placement: 'right',
  },
  {
    target: '[data-tour="roles-nav"]',
    content: 'Define roles and permissions to control what users can access.',
    title: 'Roles & Permissions',
    placement: 'right',
  },
  {
    target: '[data-tour="settings-nav"]',
    content: 'Configure system settings, integrations, and company preferences.',
    title: 'Settings',
    placement: 'right',
  },
];

/**
 * Default Tour (fallback for users without specific role)
 * Focus: Basic navigation and core features
 */
const defaultTourSteps: Step[] = [
  ...commonSteps,
  {
    target: '[data-tour="contracts-nav"]',
    content: 'Browse contracts and track their status.',
    title: 'Contracts',
    placement: 'right',
  },
  {
    target: '[data-tour="catalog-nav"]',
    content: 'Explore the music catalog.',
    title: 'Catalog',
    placement: 'right',
  },
];

/**
 * Main configuration object
 * Maps user roles to their respective tours
 *
 * TO ADD A NEW ROLE:
 * 1. Create a new array of steps (e.g., `managerTourSteps`)
 * 2. Add it to this object with the role name as key
 */
export const onboardingTours: Record<UserRole, Step[]> = {
  admin: adminTourSteps,
  digital: digitalTourSteps,
  sales: salesTourSteps,
  default: defaultTourSteps,
};

/**
 * Get the appropriate tour for a user's role/department
 *
 * @param role - User's role (e.g., 'admin')
 * @param department - User's department (e.g., 'digital', 'sales')
 * @returns Array of tour steps
 */
export const getTourForUser = (
  role?: string,
  department?: string
): Step[] => {
  // Prioritize role over department
  if (role === 'admin') {
    return onboardingTours.admin;
  }

  // Map department to tour
  if (department === 'digital') {
    return onboardingTours.digital;
  }
  if (department === 'sales') {
    return onboardingTours.sales;
  }

  // Default fallback
  return onboardingTours.default;
};

/**
 * Tour display options
 * Customize the appearance and behavior of the tour
 */
export const tourOptions = {
  styles: {
    options: {
      primaryColor: 'hsl(var(--primary))',
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: 'var(--radius)',
      fontSize: '14px',
    },
    buttonNext: {
      borderRadius: 'var(--radius)',
      fontSize: '14px',
      padding: '8px 16px',
    },
    buttonBack: {
      borderRadius: 'var(--radius)',
      fontSize: '14px',
      padding: '8px 16px',
      marginRight: '8px',
    },
  },
  locale: {
    back: 'Back',
    close: 'Close',
    last: 'Finish',
    next: 'Next',
    skip: 'Skip Tour',
  },
  floaterProps: {
    disableAnimation: false,
  },
  spotlightClicks: true,
  disableOverlayClose: false,
  showProgress: true,
  showSkipButton: true,
  continuous: true,
};
