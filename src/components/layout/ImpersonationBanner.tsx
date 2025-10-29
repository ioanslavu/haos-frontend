import { useState } from 'react';
import { AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/api/client';
import { useToast } from '@/hooks/use-toast';

export function ImpersonationBanner() {
  const { user, checkAuth } = useAuthStore();
  const [stopping, setStopping] = useState(false);
  const { toast } = useToast();

  // Check if currently impersonating (test user)
  const isImpersonating = user?.email?.includes('test-');

  if (!isImpersonating) {
    return null;
  }

  const roleLabels: Record<string, string> = {
    guest: 'Guest',
    administrator: 'Administrator',
    digital_manager: 'Digital Manager',
    digital_employee: 'Digital Employee',
    sales_manager: 'Sales Manager',
    sales_employee: 'Sales Employee',
  };

  const roleName = user?.role ? roleLabels[user.role] || user.role : 'Unknown Role';

  const handleStopImpersonation = async () => {
    setStopping(true);
    try {
      // Call backend API to stop impersonation
      await apiClient.post('/api/v1/impersonate/stop/');

      // Refresh auth state
      await checkAuth();

      toast({
        title: 'Role Testing Stopped',
        description: 'Returned to your admin account',
      });

      // Reload page to refresh all data
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to stop impersonation:', error);
      toast({
        title: 'Failed to Stop Testing',
        description: error.response?.data?.error || 'An error occurred',
        variant: 'destructive',
      });
      setStopping(false);
    }
  };

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 border-b-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-amber-900">
            Testing as: {user?.first_name} {user?.last_name}
          </span>
          <span className="text-xs text-amber-700">
            ({roleName} • {user?.department || 'No Department'})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStopImpersonation}
          disabled={stopping}
          className="h-7 text-xs gap-1 bg-white hover:bg-amber-100 border-amber-300"
        >
          {stopping ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Stopping...
            </>
          ) : (
            <>
              <X className="h-3 w-3" />
              Stop Testing
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
