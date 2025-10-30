import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewDensity = 'compact' | 'comfortable' | 'spacious';
export type Theme = 'light' | 'dark' | 'system';

interface UserPreferences {
  // Display preferences
  theme: Theme;
  density: ViewDensity;
  sidebarCollapsed: boolean;
  insightsPanelOpen: boolean;

  // Data preferences
  defaultPageSize: number;
  dateFormat: string;
  numberFormat: string;
  currency: string;

  // Notification preferences
  desktopNotifications: boolean;
  soundEnabled: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';

  // Dashboard preferences
  dashboardLayout?: string; // JSON string for customizable layout

  // Actions
  setTheme: (theme: Theme) => void;
  setDensity: (density: ViewDensity) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setInsightsPanelOpen: (open: boolean) => void;
  setDefaultPageSize: (size: number) => void;
  setDesktopNotifications: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setEmailDigest: (frequency: 'daily' | 'weekly' | 'never') => void;
  setDashboardLayout: (layout: string) => void;
  resetToDefaults: () => void;
}

const defaultPreferences = {
  theme: 'system' as Theme,
  density: 'comfortable' as ViewDensity,
  sidebarCollapsed: false,
  insightsPanelOpen: false,
  defaultPageSize: 20,
  dateFormat: 'MMM d, yyyy',
  numberFormat: 'en-US',
  currency: 'USD',
  desktopNotifications: true,
  soundEnabled: true,
  emailDigest: 'weekly' as const,
  dashboardLayout: undefined,
};

export const usePreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setInsightsPanelOpen: (open) => set({ insightsPanelOpen: open }),
      setDefaultPageSize: (size) => set({ defaultPageSize: size }),
      setDesktopNotifications: (enabled) => set({ desktopNotifications: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setEmailDigest: (frequency) => set({ emailDigest: frequency }),
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      resetToDefaults: () => set(defaultPreferences),
    }),
    {
      name: 'user-preferences',
      version: 1,
    }
  )
);
