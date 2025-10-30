import React from 'react';
import { motion } from 'framer-motion';

export const StudioLighting: React.FC = () => {
  return (
    <>
      {/* Main background gradient */}
      <div className="fixed inset-0 studio-gradient pointer-events-none" />

      {/* Animated spotlight effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Top left spotlight */}
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="w-full h-full bg-gradient-radial from-purple-600/20 via-transparent to-transparent" />
        </motion.div>

        {/* Bottom right spotlight */}
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full"
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="w-full h-full bg-gradient-radial from-cyan-600/20 via-transparent to-transparent" />
        </motion.div>

        {/* Center pulsing light */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-full h-full bg-gradient-radial from-pink-600/30 via-purple-600/20 to-transparent rounded-full blur-3xl" />
        </motion.div>


        {/* Simplified ambient orbs with CSS animations */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-purple-600/20 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-cyan-600/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Noise texture overlay for depth */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
    </>
  );
};