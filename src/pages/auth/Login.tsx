import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { APP_NAME } from '@/lib/constants';
import { LoginButton } from './components/LoginButton';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 text-white overflow-hidden relative">
      {/* Background layers */}
      <StudioLighting />
      <ParticleField />
      <BackgroundVisualizer />
      
      {/* 3D Elements */}
      <VinylRecord3D />

      {/* Main content - Hero Style */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Top: Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              type: "spring",
              stiffness: 100
            }}
          >
            {APP_NAME}
          </motion.h1>
          <motion.p
            className="text-gray-400 text-xl mt-2 tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Music Industry ERP System
          </motion.p>
        </motion.div>

        {/* Center: Animated GIF with glow */}
        <motion.div
          className="relative mb-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            type: "spring",
            stiffness: 60
          }}
        >
          {/* Glow behind GIF */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-cyan-500/30 rounded-full blur-3xl scale-110" />

          <motion.img
            src="/Schimbare-fundal-video-la-cod--unscreen.gif"
            alt={`${APP_NAME} Logo`}
            className="relative w-80 h-80 md:w-96 md:h-96 object-contain"
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Bottom: Login Card */}
        <motion.div
          className="relative w-full max-w-sm"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {/* Glass card */}
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            {/* Inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <p className="text-center text-gray-300 mb-4">
                Sign in to access your music empire
              </p>

              <LoginButton />

              <div className="text-center text-xs text-gray-500 mt-4">
                <p>By signing in, you agree to our</p>
                <p className="text-purple-400/80">Terms of Service & Privacy Policy</p>
              </div>
            </div>
          </div>

          {/* Domain restriction badge */}
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs">
              @hahahaproduction.com only
            </span>
          </motion.div>
        </motion.div>
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