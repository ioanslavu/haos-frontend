import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { InsightsPanel } from './InsightsPanel';
import { ImpersonationBanner } from './ImpersonationBanner';
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
    <div className="h-screen flex flex-col bg-slate-50">
      <TopBar
        onToggleSidebar={toggleSidebar}
        onToggleInsights={toggleInsightsPanel}
        insightsPanelOpen={insightsPanelOpen}
      />

      {/* Impersonation Banner - only shown when testing as a different role */}
      <ImpersonationBanner />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />
        
        <main className={cn(
          "flex-1 overflow-auto bg-white transition-all duration-200",
          "border-r border-slate-200"
        )}>
          <div className="h-full p-6">
            {children}
          </div>
        </main>
        
        <InsightsPanel 
          isOpen={insightsPanelOpen}
          onClose={() => setInsightsPanelOpen(false)}
        />
      </div>
    </div>
  );
};