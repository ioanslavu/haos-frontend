import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const musicalSymbols = ['♪', '♫', '♬', '♭', '♮', '♯', '𝄞', '𝄢'];

interface Particle {
  id: number;
  symbol: string;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export const ParticleField: React.FC = () => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      symbol: musicalSymbols[Math.floor(Math.random() * musicalSymbols.length)],
      x: Math.random() * 100,
      size: Math.random() * 20 + 15,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="particle text-purple-400/50"
          initial={{
            x: `${particle.x}%`,
            y: '110vh',
            rotate: 0,
            scale: 0,
          }}
          animate={{
            y: '-10vh',
            rotate: 360,
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            fontSize: `${particle.size}px`,
            opacity: particle.opacity,
            filter: 'blur(0.5px)',
            textShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
          }}
        >
          {particle.symbol}
        </motion.div>
      ))}

      {/* Sound wave particles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full border border-purple-500/20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 2, 4],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 4,
              delay: i * 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

    </div>
  );
};