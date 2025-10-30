import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ENABLE_MOCK_AUTH } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

export const LoginButton: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = () => {
    // Use the login function from authStore which handles both mock and real auth
    login();
  };

  return (
    <div className="relative z-50">
      {/* Glow effect behind button - won't block clicks */}
      <div
        className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none -z-10"
      />

      <Button
        onClick={handleLogin}
        size="lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden cursor-pointer"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Animated shimmer effect */}
        <div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none transition-transform duration-700 ease-out"
          style={{
            transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)'
          }}
        />

        {/* Button content */}
        <span className="relative flex items-center justify-center">
          {/* Google Logo */}
          <svg
            className="mr-2 h-5 w-5 transition-transform duration-300"
            style={{
              transform: isHovered ? 'rotate(360deg)' : 'rotate(0deg)'
            }}
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-medium">
            {ENABLE_MOCK_AUTH ? 'Sign in (Mock Mode)' : 'Sign in with Google'}
          </span>
        </span>
      </Button>
    </div>
  );
};