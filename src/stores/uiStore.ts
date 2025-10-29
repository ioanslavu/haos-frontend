import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/constants';

export type Theme = 'light' | 'dark' | 'system';

export interface Notification {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  createdAt: Date;
}

export interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  // Insights Panel
  insightsPanelOpen: boolean;
  setInsightsPanelOpen: (open: boolean) => void;
  toggleInsightsPanel: () => void;
  
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Modals
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Sidebar
        sidebarCollapsed: false,
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        
        // Insights Panel
        insightsPanelOpen: false,
        setInsightsPanelOpen: (open) => set({ insightsPanelOpen: open }),
        toggleInsightsPanel: () => set((state) => ({ insightsPanelOpen: !state.insightsPanelOpen })),
        
        // Theme
        theme: 'system',
        setTheme: (theme) => {
          set({ theme });
          if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        },
        
        // Notifications
        notifications: [],
        addNotification: (notification) => {
          const id = Math.random().toString(36).substring(7);
          const newNotification: Notification = {
            ...notification,
            id,
            createdAt: new Date(),
          };
          
          set((state) => ({
            notifications: [...state.notifications, newNotification],
          }));
          
          if (notification.duration !== 0) {
            setTimeout(() => {
              get().removeNotification(id);
            }, notification.duration || 5000);
          }
        },
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        },
        clearNotifications: () => set({ notifications: [] }),
        
        // Loading states
        globalLoading: false,
        setGlobalLoading: (loading) => set({ globalLoading: loading }),
        
        // Modals
        activeModal: null,
        setActiveModal: (modal) => set({ activeModal: modal }),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
        }),
      }
    )
  )
);