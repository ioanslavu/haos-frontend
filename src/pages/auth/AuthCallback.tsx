import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { AuthError } from './AuthError';
import authService from '@/services/auth.service';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { setUser, setCsrfToken } = useAuthStore();
  const { addNotification } = useUIStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check session and get user data from new backend
        const sessionData = await authService.checkSession();

        if (sessionData.authenticated && sessionData.user) {
          setUser(sessionData.user);
          setCsrfToken(sessionData.csrf_token);

          addNotification({
            type: 'success',
            title: 'Welcome!',
            description: 'You have successfully signed in.',
          });
          navigate('/');
        } else {
          throw new Error('Authentication failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to verify session';
        setError(errorMessage);
        addNotification({
          type: 'error',
          title: 'Authentication Failed',
          description: errorMessage,
        });
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [setUser, setCsrfToken, navigate, addNotification]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {error ? (
            <div className="space-y-4">
              <AuthError error={error} />
              <p className="text-center text-sm text-slate-500">
                Redirecting to login page...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <h2 className="text-lg font-semibold">Verifying authentication...</h2>
              <p className="text-sm text-slate-500">Please wait while we log you in.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;