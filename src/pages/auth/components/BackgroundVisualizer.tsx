import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const BackgroundVisualizer: React.FC = () => {
  const bars = useMemo(() => {
    const barCount = 20;
    return Array.from({ length: barCount }, (_, i) => ({
      id: i,
      height: Math.random() * 100 + 50,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 1,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1 px-4">
        {bars.map((bar) => (
          <motion.div
            key={bar.id}
            className="equalizer-bar w-2 md:w-3 rounded-t-sm"
            initial={{ scaleY: 0.1 }}
            animate={{
              scaleY: [0.1, 1, 0.3, 0.8, 0.2, 0.9, 0.1],
              opacity: [0.3, 1, 0.8, 1, 0.6, 1, 0.3],
            }}
            transition={{
              duration: bar.duration,
              delay: bar.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              height: `${bar.height}px`,
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>

      {/* Additional ambient bars on the sides */}
      <div className="absolute top-0 left-0 h-full flex flex-col justify-center gap-2">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`left-${i}`}
            className="h-1 bg-gradient-to-r from-purple-500/20 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: `${Math.random() * 100 + 50}px`,
              transformOrigin: 'left',
            }}
          />
        ))}
      </div>

      <div className="absolute top-0 right-0 h-full flex flex-col justify-center gap-2 items-end">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`right-${i}`}
            className="h-1 bg-gradient-to-l from-cyan-500/20 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.3 + 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: `${Math.random() * 100 + 50}px`,
              transformOrigin: 'right',
            }}
          />
        ))}
      </div>
    </div>
  );
};