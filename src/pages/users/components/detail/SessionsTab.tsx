import React from 'react';
import { User } from '@/stores/authStore';
import { useUserSessions, useAdminRevokeUserSessions, useAdminRevokeUserSession } from '@/api/hooks/useSessions';
import { SessionManagementPanel } from '@/components/sessions/SessionManagementPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SessionsTabProps {
  user: User;
  userId: string;
}

export function SessionsTab({ user, userId }: SessionsTabProps) {
  const { data: sessionsData, isLoading, error } = useUserSessions(userId);
  const adminRevokeUserSessions = useAdminRevokeUserSessions();
  const adminRevokeUserSession = useAdminRevokeUserSession();

  const handleRevokeSession = (sessionKey: string) => {
    adminRevokeUserSession.mutate({ userId, sessionKey });
  };

  const handleRevokeAllSessions = () => {
    adminRevokeUserSessions.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load user sessions. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!sessionsData) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          No session data available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          View and manage all active sessions for {user.full_name}. Sessions expire automatically after 30 days of inactivity.
        </AlertDescription>
      </Alert>

      <SessionManagementPanel
        sessions={sessionsData.sessions}
        maxSessions={sessionsData.max_allowed || sessionsData.max_sessions || 5}
        onRevokeSession={handleRevokeSession}
        onRevokeAllSessions={handleRevokeAllSessions}
        isRevokingSingle={adminRevokeUserSession.isPending}
        isRevokingAll={adminRevokeUserSessions.isPending}
        isLoading={false}
        error={null}
        isAdmin={true}
        userName={user.full_name}
      />
    </div>
  );
}