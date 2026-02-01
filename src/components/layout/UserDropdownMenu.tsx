import { useState } from 'react';
import { User, UserCog, Check, Loader2, Settings, LogOut, ChevronRight, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTestUsers, useImpersonateUser, useStopImpersonation } from '@/api/hooks/useImpersonation';

interface TestUser {
  id: number;
  email: string;
  displayName: string;
  role: string;
  roleLabel: string;
  department: string | null;
  departmentName: string | null;
}

const roleColors: Record<string, string> = {
  guest: 'bg-slate-100 text-slate-700',
  administrator: 'bg-purple-100 text-purple-700',
  digital_manager: 'bg-blue-100 text-blue-700',
  digital_employee: 'bg-blue-50 text-blue-600',
  sales_manager: 'bg-green-100 text-green-700',
  sales_employee: 'bg-green-50 text-green-600',
  publishing_manager: 'bg-orange-100 text-orange-700',
  publishing_employee: 'bg-orange-50 text-orange-600',
};

export function UserDropdownMenu() {
  const { user, isAdmin, checkAuth, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch test users and impersonation mutations
  const { data: testUsersData, isLoading } = useTestUsers(isAdmin());
  const impersonateMutation = useImpersonateUser();
  const stopImpersonationMutation = useStopImpersonation();

  // Map test users data
  const testUsers = testUsersData?.test_users?.map((u: any) => ({
    id: u.id,
    email: u.email,
    displayName: u.full_name || `${u.first_name} ${u.last_name}`.trim() || u.email,
    role: u.role?.code || 'guest',
    roleLabel: u.role?.name || 'Guest',
    department: u.department?.code || null,
    departmentName: u.department?.name || null,
  })) || [];

  const handleImpersonate = async (testUser: TestUser) => {
    impersonateMutation.mutate({ userId: testUser.id }, {
      onSuccess: async () => {
        // Refresh auth state to get impersonated user data
        await checkAuth();

        toast({
          title: 'Role Testing Started',
          description: `Now testing as ${testUser.displayName} (${testUser.roleLabel})`,
        });

        // Reload the page to refresh all data with new role
        window.location.reload();
      },
      onError: (error: any) => {
        console.error('Failed to start impersonation:', error);
        toast({
          title: 'Failed to Start Testing',
          description: error.response?.data?.error || 'An error occurred',
          variant: 'destructive',
        });
      },
    });
  };

  const handleStopImpersonation = async () => {
    stopImpersonationMutation.mutate(undefined, {
      onSuccess: async () => {
        // Refresh auth state to get real user data
        await checkAuth();

        toast({
          title: 'Role Testing Stopped',
          description: 'Returned to your admin account',
        });

        // Reload the page to refresh all data with real role
        window.location.reload();
      },
      onError: (error: any) => {
        console.error('Failed to stop impersonation:', error);
        toast({
          title: 'Failed to Stop Testing',
          description: error.response?.data?.error || 'An error occurred',
          variant: 'destructive',
        });
      },
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred while logging out',
        variant: 'destructive',
      });
    }
  };

  const isCurrentlyImpersonating = user?.email?.startsWith('test.');
  const impersonating = impersonateMutation.isPending || stopImpersonationMutation.isPending;

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 rounded-2xl hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 p-0"
        >
          {isCurrentlyImpersonating ? (
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-orange-500 rounded-full border-2 border-background animate-pulse" />
            </div>
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={isCurrentlyImpersonating
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm"
                : "bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm"
              }>
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.full_name || user?.email}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              {isCurrentlyImpersonating && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs mt-1">
                  Testing Mode
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Regular User Actions */}
        <DropdownMenuItem
          onClick={() => navigate('/profile')}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          My Profile
        </DropdownMenuItem>

        {/* Theme Switcher */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
            {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
            {theme === 'system' && <Monitor className="mr-2 h-4 w-4" />}
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              onClick={() => setTheme('light')}
              className="cursor-pointer"
            >
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
              {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('dark')}
              className="cursor-pointer"
            >
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
              {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('system')}
              className="cursor-pointer"
            >
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
              {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Admin-Only Test as Role Submenu */}
        {isAdmin() && !isCurrentlyImpersonating && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <UserCog className="mr-2 h-4 w-4" />
                <span>Test as Role</span>
                {impersonating && (
                  <Loader2 className="ml-auto h-3 w-3 animate-spin" />
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                  Test the application as different roles
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isLoading && testUsers.length === 0 && (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    No test users found
                  </div>
                )}

                {!isLoading && testUsers.map((testUser) => {
                  const isActive = user?.email === testUser.email;
                  return (
                    <DropdownMenuItem
                      key={testUser.email}
                      onClick={() => handleImpersonate(testUser)}
                      disabled={impersonating}
                      className="cursor-pointer flex items-center justify-between py-2"
                    >
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{testUser.roleLabel}</span>
                        <span className="text-xs text-muted-foreground">
                          {testUser.departmentName || 'No Department'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && <Check className="h-3 w-3 text-primary" />}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {/* Stop Testing Option (when impersonating) */}
        {isCurrentlyImpersonating && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleStopImpersonation}
              disabled={impersonating}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              {impersonating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <UserCog className="mr-2 h-4 w-4" />
                  Stop Testing
                </>
              )}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}