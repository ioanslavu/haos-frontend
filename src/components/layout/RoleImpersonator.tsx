import { useState, useEffect } from 'react';
import { UserCog, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useUsersList } from '@/api/hooks/useUsers';
import apiClient from '@/api/client';
import { useToast } from '@/hooks/use-toast';

interface TestUser {
  id: number;
  email: string;
  displayName: string;
  role: string;
  roleLabel: string;
  department: string | null;
}

const roleLabels: Record<string, string> = {
  guest: 'Guest',
  administrator: 'Administrator',
  digital_manager: 'Digital Manager',
  digital_employee: 'Digital Employee',
  sales_manager: 'Sales Manager',
  sales_employee: 'Sales Employee',
};

const roleColors: Record<string, string> = {
  guest: 'bg-slate-100 text-slate-700',
  administrator: 'bg-purple-100 text-purple-700',
  digital_manager: 'bg-blue-100 text-blue-700',
  digital_employee: 'bg-blue-50 text-blue-600',
  sales_manager: 'bg-green-100 text-green-700',
  sales_employee: 'bg-green-50 text-green-600',
};

export function RoleImpersonator() {
  const { user, isAdmin, checkAuth } = useAuthStore();
  const { data: usersData, isLoading } = useUsersList();
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [impersonating, setImpersonating] = useState(false);
  const { toast } = useToast();

  // Filter test users from the users list
  useEffect(() => {
    if (usersData) {
      const users = Array.isArray(usersData) ? usersData : usersData.results || [];
      const filtered = users
        .filter((u: any) => u.email?.includes('test-') && u.email?.includes('@hahahaproduction.com'))
        .map((u: any) => ({
          id: u.id,
          email: u.email,
          displayName: `${u.first_name} ${u.last_name}`.trim() || u.email,
          role: u.role || 'guest',
          roleLabel: roleLabels[u.role] || u.role,
          department: u.department,
        }));
      setTestUsers(filtered);
    }
  }, [usersData]);

  // Only show for administrators
  if (!isAdmin()) {
    return null;
  }

  const handleImpersonate = async (testUser: TestUser) => {
    setImpersonating(true);
    try {
      // Call backend API to start impersonation
      await apiClient.post('/api/v1/impersonate/start/', {
        user_id: testUser.id,
      });

      // Refresh auth state to get impersonated user data
      await checkAuth();

      toast({
        title: 'Role Testing Started',
        description: `Now testing as ${testUser.displayName} (${testUser.roleLabel})`,
      });

      // Reload the page to refresh all data with new role
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to start impersonation:', error);
      toast({
        title: 'Failed to Start Testing',
        description: error.response?.data?.error || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setImpersonating(false);
    }
  };

  const handleStopImpersonation = async () => {
    setImpersonating(true);
    try {
      // Call backend API to stop impersonation
      await apiClient.post('/api/v1/impersonate/stop/');

      // Refresh auth state to get real user data
      await checkAuth();

      toast({
        title: 'Role Testing Stopped',
        description: 'Returned to your admin account',
      });

      // Reload the page to refresh all data with real role
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to stop impersonation:', error);
      toast({
        title: 'Failed to Stop Testing',
        description: error.response?.data?.error || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setImpersonating(false);
    }
  };

  const isCurrentlyImpersonating = user?.email?.includes('test-');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isCurrentlyImpersonating ? 'default' : 'outline'}
          size="sm"
          className="gap-2"
          disabled={impersonating}
        >
          {impersonating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserCog className="h-4 w-4" />
          )}
          {isCurrentlyImpersonating ? 'Testing Role' : 'Test as Role'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Role Testing</p>
            <p className="text-xs leading-none text-muted-foreground">
              Test the app as different roles
            </p>
          </div>
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
              className="cursor-pointer flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{testUser.displayName}</span>
                <span className="text-xs text-muted-foreground">{testUser.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={roleColors[testUser.role]} variant="secondary">
                  {testUser.department ? testUser.department.charAt(0).toUpperCase() : 'No Dept'}
                </Badge>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </div>
            </DropdownMenuItem>
          );
        })}

        {isCurrentlyImpersonating && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleStopImpersonation}
              disabled={impersonating}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              {impersonating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Stopping...
                </div>
              ) : (
                'Stop Testing'
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
