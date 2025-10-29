import React from 'react';
import { useCurrentUserSessions, useUserSessions } from '@/api/hooks/useSessions';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bug } from 'lucide-react';

export function SessionDebug({ userId }: { userId?: string }) {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserSessions = useCurrentUserSessions();
  const userSessions = userId ? useUserSessions(userId) : { data: null };

  const debugInfo = {
    currentUser: {
      id: currentUser?.id,
      idType: typeof currentUser?.id,
      email: currentUser?.email,
      roles: currentUser?.roles,
    },
    targetUserId: userId,
    targetUserIdType: typeof userId,
    isOwnProfile: String(currentUser?.id) === String(userId),
    sessionQueries: {
      currentUserSessions: {
        loading: currentUserSessions.isLoading,
        error: currentUserSessions.error?.message,
        data: currentUserSessions.data,
      },
      userSessions: userId ? {
        loading: userSessions.isLoading,
        error: userSessions.error?.message,
        data: userSessions.data,
      } : null,
    },
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="border-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600">
          <Bug className="h-5 w-5" />
          Session Debug Info (Dev Only)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}