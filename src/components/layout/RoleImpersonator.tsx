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
import apiClient from '@/api/client';
import { useToast } from '@/hooks/use-toast';

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

export function RoleImpersonator() {
  const { user, isAdmin, checkAuth } = useAuthStore();
  const [testUsers, setTestUsers] = useState<TestUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);
  const { toast } = useToast();

  // Fetch test users from dedicated endpoint
  useEffect(() => {
    const fetchTestUsers = async () => {
      if (!isAdmin()) return;

      try {
        setIsLoading(true);
        const response = await apiClient.get('/api/v1/impersonate/test-users/');
        const users = response.data.test_users || [];

        const mapped = users.map((u: any) => ({
          id: u.id,
          email: u.email,
          displayName: u.full_name || `${u.first_name} ${u.last_name}`.trim() || u.email,
          role: u.role?.code || 'guest',
          roleLabel: u.role?.name || 'Guest',
          department: u.department?.code || null,
          departmentName: u.department?.name || null,
        }));

        setTestUsers(mapped);
      } catch (error) {
        console.error('Failed to fetch test users:', error);
        setTestUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestUsers();
  }, [isAdmin]);

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

  const isCurrentlyImpersonating = user?.email?.startsWith('test.');

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
                <span className="text-sm font-medium">{testUser.roleLabel}</span>
                <span className="text-xs text-muted-foreground">
                  {testUser.departmentName || 'No Department'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={roleColors[testUser.role]} variant="secondary">
                  {testUser.roleLabel}
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
