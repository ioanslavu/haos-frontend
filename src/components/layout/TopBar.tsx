
import React from 'react';
import { Search, Plus, Bell, User, BarChart3, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RoleImpersonator } from './RoleImpersonator';
import { cn } from '@/lib/utils';

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
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        <div className="font-semibold text-slate-900 hidden sm:block">
          Music Studio OS
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search contracts, artists, tracks... (⌘K)"
            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
          />
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">New</span>
        </Button>

        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 bg-red-500">
            3
          </Badge>
        </Button>

        {/* Role Impersonator - Admin Only */}
        <RoleImpersonator />

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleInsights}
          className={cn(insightsPanelOpen && "bg-slate-100")}
        >
          <BarChart3 className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};
