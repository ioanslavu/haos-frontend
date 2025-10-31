
import React from 'react';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDropdownMenu } from './UserDropdownMenu';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useCommandPalette } from '@/components/command-palette';

interface TopBarProps {
  onToggleSidebar: () => void;
  onToggleInsights: () => void;
  insightsPanelOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  onToggleInsights,
  insightsPanelOpen
}) => {
  const { setOpen } = useCommandPalette();

  return (
    <header className="h-16 backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border-b border-white/20 dark:border-white/10 px-6 flex items-center justify-between m-4 rounded-3xl shadow-2xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="lg:hidden h-12 w-12 rounded-2xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300"
          aria-label="Toggle sidebar navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
          HaOS Platform
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-6">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open command palette to search"
          className="w-full h-12 rounded-2xl bg-background/50 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:border-blue-500/50 transition-all duration-300 shadow-inner flex items-center px-4 gap-3 text-left group"
        >
          <Search className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
          <span className="flex-1 text-sm text-muted-foreground">
            Search contracts, artists, tracks...
          </span>
          <kbd className="hidden sm:inline-flex text-xs text-muted-foreground font-mono bg-muted/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        {/* User Dropdown Menu with integrated Role Testing for Admins */}
        <UserDropdownMenu />
      </div>
    </header>
  );
};
