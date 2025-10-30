import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const BackgroundVisualizer: React.FC = () => {
  const bars = useMemo(() => {
    const barCount = 12;
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

    </div>
  );
};