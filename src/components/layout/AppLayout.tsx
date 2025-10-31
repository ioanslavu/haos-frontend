import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { InsightsPanel } from './InsightsPanel';
import { ImpersonationBanner } from './ImpersonationBanner';
import { ProductTour } from '@/components/onboarding/ProductTour';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    toggleSidebar,
    insightsPanelOpen,
    setInsightsPanelOpen,
    toggleInsightsPanel
  } = useUIStore();

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/30" />

      {/* Animated floating orbs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-pink-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-cyan-400/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }} />

      <div className="relative z-10 h-screen flex flex-col">
        <TopBar
          onToggleSidebar={toggleSidebar}
          onToggleInsights={toggleInsightsPanel}
          insightsPanelOpen={insightsPanelOpen}
        />

        {/* Impersonation Banner - only shown when testing as a different role */}
        <ImpersonationBanner />

        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile sidebar overlay */}
          {!sidebarCollapsed && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Close sidebar"
            />
          )}

          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
          />

          <main className={cn(
            "flex-1 overflow-auto transition-all duration-300",
            "backdrop-blur-sm"
          )}>
            <div className="h-full p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>

          <InsightsPanel
            isOpen={insightsPanelOpen}
            onClose={() => setInsightsPanelOpen(false)}
          />
        </div>

        {/* Onboarding Product Tour */}
        <ProductTour />
      </div>
    </div>
  );
};