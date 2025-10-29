import React from 'react';
import { SessionList } from './SessionList';
import { Session } from '@/api/hooks/useSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SessionManagementPanelProps {
  sessions: Session[];
  maxSessions?: number;
  onRevokeSession?: (sessionKey: string) => void;
  onRevokeAllSessions?: () => void;
  isRevokingSingle?: boolean;
  isRevokingAll?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  isAdmin?: boolean;
  userName?: string;
}

export function SessionManagementPanel({
  sessions,
  maxSessions = 5,
  onRevokeSession,
  onRevokeAllSessions,
  isRevokingSingle = false,
  isRevokingAll = false,
  isLoading = false,
  error = null,
  isAdmin = false,
  userName,
}: SessionManagementPanelProps) {
  const [showRevokeAllDialog, setShowRevokeAllDialog] = React.useState(false);

  const otherSessions = sessions.filter(s => !s.is_current);
  const hasOtherSessions = otherSessions.length > 0;

  const handleRevokeAll = () => {
    if (onRevokeAllSessions) {
      onRevokeAllSessions();
      setShowRevokeAllDialog(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            {isAdmin 
              ? `Manage ${userName ? userName + "'s" : "user's"} active sessions across all devices`
              : 'Manage your active sessions across all devices'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {!isAdmin && onRevokeAllSessions && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Security Action</p>
                  <p className="text-sm text-muted-foreground">
                    Log out from all other devices
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowRevokeAllDialog(true)}
                  disabled={!hasOtherSessions || isRevokingAll}
                  className="gap-2"
                >
                  {isRevokingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Logout All Other
                </Button>
              </div>
            )}

            {isAdmin && onRevokeAllSessions && sessions.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Revoke all sessions for this user to force re-authentication.</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowRevokeAllDialog(true)}
                      disabled={isRevokingAll}
                      className="gap-2 ml-4"
                    >
                      {isRevokingAll ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      Revoke All
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <SessionList
              sessions={sessions}
              maxSessions={maxSessions}
              onRevoke={onRevokeSession}
              isRevoking={isRevokingSingle}
              isLoading={isLoading}
              error={error}
              showRevokeButtons={!!onRevokeSession}
              isAdmin={isAdmin}
            />
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All {isAdmin ? 'User' : 'Other'} Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin ? (
                <>
                  Are you sure you want to revoke all sessions for {userName || 'this user'}? 
                  They will be logged out from all devices and will need to sign in again.
                </>
              ) : (
                <>
                  Are you sure you want to log out from all other devices? 
                  You will remain logged in on this device only.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeAll} className="bg-destructive text-destructive-foreground">
              Revoke All Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}