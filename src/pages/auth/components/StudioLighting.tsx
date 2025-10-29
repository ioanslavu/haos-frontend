import React from 'react';
import { motion } from 'framer-motion';

export const StudioLighting: React.FC = () => {
  return (
    <>
      {/* Main background gradient */}
      <div className="fixed inset-0 studio-gradient" />
      
      {/* Animated spotlight effects */}
      <div className="fixed inset-0 overflow-hidden">
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

        {/* Moving light beams */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`beam-${i}`}
            className="absolute top-0 w-1 h-full opacity-20"
            style={{
              left: `${33 * i}%`,
              background: `linear-gradient(180deg, transparent, rgba(139, 92, 246, 0.5), transparent)`,
              filter: 'blur(2px)',
            }}
            animate={{
              x: ['0%', '100%', '0%'],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* Ambient orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute w-32 h-32 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth,
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight,
              ],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              background: `radial-gradient(circle, ${
                ['rgba(139, 92, 246, 0.3)', 'rgba(6, 182, 212, 0.3)', 'rgba(245, 158, 11, 0.3)'][i % 3]
              }, transparent)`,
              filter: 'blur(40px)',
            }}
          />
        ))}
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