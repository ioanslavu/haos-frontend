import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginButton } from './LoginButton';

interface LoginCard3DProps {
  appName: string;
}

export const LoginCard3D: React.FC<LoginCard3DProps> = ({ appName }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className="absolute -inset-4 rounded-2xl opacity-0 pointer-events-none"
          animate={{
            opacity: isHovered ? 0.5 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.3), transparent)',
            filter: 'blur(20px)',
          }}
        />

        <Card className="relative glass-morphism border-purple-500/20 shadow-2xl overflow-hidden" style={{ pointerEvents: 'auto' }}>
          {/* Animated border gradient */}
          <div className="absolute inset-0 rounded-lg opacity-30 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 animate-gradient-shift" />
          </div>

          <CardHeader className="relative z-10 space-y-1">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 1, type: "spring" }}
            >
              <CardTitle className="text-2xl text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Welcome to {appName}
              </CardTitle>
            </motion.div>
            <CardDescription className="text-center text-gray-300">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                Sign in to access your music empire
              </motion.span>
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-20 space-y-4" style={{ pointerEvents: 'auto' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.2 }}
              className="relative z-30"
              style={{ pointerEvents: 'auto' }}
            >
              <LoginButton />
            </motion.div>

            <motion.div
              className="text-center text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.5 }}
            >
              <p>By signing in, you agree to our</p>
              <p className="text-purple-400">Terms of Service and Privacy Policy</p>
            </motion.div>
          </CardContent>

          {/* Inner glow effects */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
        </Card>

        {/* Depth shadow */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/40 rounded-full blur-2xl pointer-events-none" />
      </div>
    </motion.div>
  );
};