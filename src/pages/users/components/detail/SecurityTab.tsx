import React, { useState } from 'react';
import { User } from '@/stores/authStore';
import { useLockUser, useUnlockUser } from '@/api/hooks/useUsers';
import {
  useCurrentUserSessions,
  useRevokeSession,
  useRevokeAllSessions,
  useUserSessions,
  useAdminRevokeUserSessions,
  useAdminRevokeUserSession,
} from '@/api/hooks/useSessions';
import { SessionManagementPanel } from '@/components/sessions/SessionManagementPanel';
import { SessionDebug } from '@/components/sessions/SessionDebug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
  Key,
  UserCheck,
  Clock,
  Calendar,
  Info,
  Loader2,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';

interface SecurityTabProps {
  user: User;
  userId: string;
}

export function SecurityTab({ user, userId }: SecurityTabProps) {
  const { addNotification } = useUIStore();
  const currentUser = useAuthStore((state) => state.user);
  const lockUser = useLockUser();
  const unlockUser = useUnlockUser();
  
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [lockDuration, setLockDuration] = useState(24);
  
  // Determine if viewing own profile or another user's profile
  // Convert both to strings for comparison since API may return number or string
  const isOwnProfile = String(currentUser?.id) === String(userId);
  const isAdmin = currentUser?.roles?.includes('SUPER_ADMIN') || 
                  currentUser?.roles?.includes('SYSTEM_ADMIN');
  
  // Session management hooks
  const currentUserSessionsQuery = useCurrentUserSessions();
  const userSessionsQuery = useUserSessions(userId);
  const revokeSession = useRevokeSession();
  const revokeAllSessions = useRevokeAllSessions();
  const adminRevokeUserSessions = useAdminRevokeUserSessions();
  const adminRevokeUserSession = useAdminRevokeUserSession();
  
  // Get the appropriate sessions data
  const sessionsData = isOwnProfile 
    ? currentUserSessionsQuery.data 
    : userSessionsQuery.data;
  const sessionsLoading = isOwnProfile 
    ? currentUserSessionsQuery.isLoading 
    : userSessionsQuery.isLoading;
  const sessionsError = isOwnProfile 
    ? currentUserSessionsQuery.error 
    : userSessionsQuery.error;
  
  const handleLockUser = async () => {
    if (!lockReason) {
      addNotification({
        type: 'error',
        title: 'Reason Required',
        description: 'Please provide a reason for locking the account.',
      });
      return;
    }
    
    try {
      await lockUser.mutateAsync({
        userId,
        reason: lockReason,
        duration_hours: lockDuration,
      });
      addNotification({
        type: 'warning',
        title: 'Account Locked',
        description: `Account has been locked for ${lockDuration} hours.`,
      });
      setShowLockDialog(false);
      setLockReason('');
      window.location.reload();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Lock Failed',
        description: 'Failed to lock the account.',
      });
    }
  };
  
  const handleRevokeSession = (sessionKey: string) => {
    if (isOwnProfile) {
      revokeSession.mutate(sessionKey);
    } else if (isAdmin) {
      adminRevokeUserSession.mutate({ userId, sessionKey });
    }
  };
  
  const handleRevokeAllSessions = () => {
    if (isOwnProfile) {
      revokeAllSessions.mutate();
    } else if (isAdmin) {
      adminRevokeUserSessions.mutate(userId);
    }
  };
  
  const handleUnlockUser = async () => {
    try {
      await unlockUser.mutateAsync(userId);
      addNotification({
        type: 'success',
        title: 'Account Unlocked',
        description: 'Account has been unlocked successfully.',
      });
      window.location.reload();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Unlock Failed',
        description: 'Failed to unlock the account.',
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Status</span>
                  <Badge
                    className={
                      user.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lock Status</span>
                  <Badge
                    className={
                      user.is_locked
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }
                  >
                    {user.is_locked ? 'Locked' : 'Unlocked'}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Verified</span>
                  <Badge variant="default">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Lock/Unlock Actions */}
            <div>
              <h4 className="font-medium mb-3">Account Lock Management</h4>
              {user.is_locked ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>This account is currently locked.</p>
                      <Button
                        onClick={handleUnlockUser}
                        disabled={unlockUser.isPending}
                        className="gap-2"
                      >
                        {unlockUser.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                        Unlock Account
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Locking an account prevents the user from logging in until the lock expires or is manually removed.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowLockDialog(true)}
                    className="gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Lock Account
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Password</Label>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-sm text-muted-foreground">
                    Password managed through Google OAuth
                  </p>
                </div>
              </div>
              
              <div>
                <Label>Two-Factor Authentication</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Managed by Google
                  </Badge>
                </div>
              </div>
              
              {user.last_login && (
                <div>
                  <Label>Last Login</Label>
                  <p className="text-sm font-medium mt-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(user.last_login), 'MMMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
              
              <div>
                <Label>Account Created</Label>
                <p className="text-sm font-medium mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(user.date_joined), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Session Management */}
      {(isOwnProfile || isAdmin) && (
        <SessionManagementPanel
          sessions={sessionsData?.sessions || []}
          maxSessions={sessionsData?.max_allowed || sessionsData?.max_sessions || 5}
          onRevokeSession={handleRevokeSession}
          onRevokeAllSessions={handleRevokeAllSessions}
          isRevokingSingle={
            revokeSession.isPending || adminRevokeUserSession.isPending
          }
          isRevokingAll={
            revokeAllSessions.isPending || adminRevokeUserSessions.isPending
          }
          isLoading={sessionsLoading}
          error={sessionsError as Error}
          isAdmin={!isOwnProfile && isAdmin}
          userName={user.full_name}
        />
      )}
      
      {/* Lock User Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock User Account</DialogTitle>
            <DialogDescription>
              Lock {user.full_name}'s account for security reasons. The user will not be
              able to login until the lock expires or is manually removed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lock-reason">Reason for locking</Label>
              <Textarea
                id="lock-reason"
                placeholder="Enter the reason for locking this account..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="lock-duration">Lock duration (hours)</Label>
              <Input
                id="lock-duration"
                type="number"
                min={1}
                max={720}
                value={lockDuration}
                onChange={(e) => setLockDuration(parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: 720 hours (30 days)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLockUser}
              disabled={lockUser.isPending || !lockReason}
            >
              {lockUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Locking...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}