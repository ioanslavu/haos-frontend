import React from 'react';
import { Session } from '@/api/hooks/useSessions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Calendar,
  LogOut,
  Loader2,
  MapPin,
  Wifi,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface SessionCardProps {
  session: Session;
  onRevoke?: (sessionKey: string) => void;
  isRevoking?: boolean;
  showRevokeButton?: boolean;
  isAdmin?: boolean;
}

export function SessionCard({ 
  session, 
  onRevoke, 
  isRevoking = false, 
  showRevokeButton = true,
  isAdmin = false 
}: SessionCardProps) {
  const [showRevokeDialog, setShowRevokeDialog] = React.useState(false);

  const getDeviceIcon = (deviceName: string) => {
    const lowerName = deviceName.toLowerCase();
    if (lowerName.includes('mobile') || lowerName.includes('android') || lowerName.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (lowerName.includes('tablet') || lowerName.includes('ipad')) {
      return <Tablet className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const handleRevoke = () => {
    if (onRevoke) {
      onRevoke(session.session_key);
      setShowRevokeDialog(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'unknown';
    }
  };

  const expireDate = session.expires_at || session.expire_date;
  const isExpired = expireDate ? new Date(expireDate) < new Date() : false;

  return (
    <>
      <Card className={session.is_current ? 'ring-2 ring-primary' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-muted rounded-lg">
                {getDeviceIcon(session.device_name)}
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{session.device_name}</h4>
                    {session.is_current && (
                      <Badge variant="default" className="text-xs">
                        Current Session
                      </Badge>
                    )}
                    {isExpired && (
                      <Badge variant="destructive" className="text-xs">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      {session.ip_address}
                    </span>
                    {session.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created: {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last active: {getRelativeTime(session.last_activity)}
                  </span>
                </div>
                
                {!isExpired && expireDate && (
                  <div className="text-xs text-muted-foreground">
                    Expires: {format(new Date(expireDate), 'MMM dd, yyyy HH:mm')}
                  </div>
                )}
              </div>
            </div>
            
            {showRevokeButton && !session.is_current && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevokeDialog(true)}
                disabled={isRevoking || isExpired}
                className="gap-2"
              >
                {isRevoking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Revoke
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? {isAdmin ? 'The user' : 'You'} will be 
              logged out from {session.device_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke}>
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}