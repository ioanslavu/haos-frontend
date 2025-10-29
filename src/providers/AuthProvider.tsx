import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ENABLE_MOCK_AUTH } from '@/lib/constants';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const pathname = window.location.pathname;
      
      // Skip auth check for public routes
      if (pathname === '/login' || pathname === '/auth/callback' || pathname === '/auth/error') {
        setLoading(false);
        return;
      }
      
      try {
        await checkAuth();
      } catch (error) {
        // If not authenticated and not on a public route, the ProtectedRoute will handle redirect
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for storage events to sync auth state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-storage') {
        if (!e.newValue) {
          // Logged out in another tab
          window.location.href = '/login';
        } else {
          // Auth state changed in another tab
          checkAuth().catch(console.error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth, setLoading]);

  return <>{children}</>;
};