import React from 'react';
import { Session } from '@/api/hooks/useSessions';
import { SessionCard } from './SessionCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, AlertCircle } from 'lucide-react';

interface SessionListProps {
  sessions: Session[];
  maxSessions?: number;
  onRevoke?: (sessionKey: string) => void;
  isRevoking?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  showRevokeButtons?: boolean;
  isAdmin?: boolean;
}

export function SessionList({
  sessions,
  maxSessions = 5,
  onRevoke,
  isRevoking = false,
  isLoading = false,
  error = null,
  showRevokeButtons = true,
  isAdmin = false,
}: SessionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load sessions. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No active sessions found.
        </AlertDescription>
      </Alert>
    );
  }

  const activeSessions = sessions.filter(s => {
    const expireDate = s.expires_at || s.expire_date;
    return expireDate ? new Date(expireDate) > new Date() : true;
  });
  const expiredSessions = sessions.filter(s => {
    const expireDate = s.expires_at || s.expire_date;
    return expireDate ? new Date(expireDate) <= new Date() : false;
  });
  const currentSession = sessions.find(s => s.is_current);
  const otherSessions = sessions.filter(s => !s.is_current);

  return (
    <div className="space-y-6">
      {activeSessions.length >= maxSessions && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isAdmin ? 'This user has' : 'You have'} reached the maximum number of concurrent sessions ({maxSessions}). 
            To create a new session, please revoke an existing one.
          </AlertDescription>
        </Alert>
      )}

      {currentSession && !isAdmin && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Session</h4>
          <SessionCard
            session={currentSession}
            showRevokeButton={false}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {otherSessions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            {isAdmin ? 'Active Sessions' : 'Other Sessions'} ({otherSessions.length})
          </h4>
          <div className="space-y-3">
            {otherSessions.map((session) => (
              <SessionCard
                key={session.session_key}
                session={session}
                onRevoke={onRevoke}
                isRevoking={isRevoking}
                showRevokeButton={showRevokeButtons}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {expiredSessions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Expired Sessions ({expiredSessions.length})
          </h4>
          <div className="space-y-3 opacity-60">
            {expiredSessions.map((session) => (
              <SessionCard
                key={session.session_key}
                session={session}
                showRevokeButton={false}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Sessions expire after 30 days. Maximum {maxSessions} concurrent sessions allowed.
      </div>
    </div>
  );
}