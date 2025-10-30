import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { APP_NAME } from '@/lib/constants';
import { LoginCard3D } from './components/LoginCard3D';
import { BackgroundVisualizer } from './components/BackgroundVisualizer';
import { VinylRecord3D } from './components/VinylRecord3D';
import { ParticleField } from './components/ParticleField';
import { StudioLighting } from './components/StudioLighting';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background layers */}
      <StudioLighting />
      <ParticleField />
      <BackgroundVisualizer />
      
      {/* 3D Elements */}
      <VinylRecord3D />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and title */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.3,
                type: "spring",
                stiffness: 100 
              }}
            >
              {APP_NAME}
            </motion.h1>
            <motion.p
              className="text-gray-400 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Music Industry ERP System
            </motion.p>
          </motion.div>

          {/* 3D Login Card */}
          <LoginCard3D appName={APP_NAME} />

          {/* Footer */}
          <motion.div
            className="text-center mt-8 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.8 }}
          >
            <p className="animate-pulse-neon text-purple-400">
              Access restricted to @hahahaproduction.com domain
            </p>
          </motion.div>
        </div>
      </div>


      <motion.div
        className="absolute top-10 left-10 flex gap-2 pointer-events-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-8 bg-gradient-to-t from-purple-500 to-cyan-500 rounded-full animate-equalizer-dance"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default Login;