import React from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

export const VinylRecord3D: React.FC = () => {
  return (
    <div className="absolute top-10 right-10 md:top-20 md:right-20 pointer-events-none">
      <motion.div
        className="relative w-32 h-32 md:w-48 md:h-48"
        initial={{
          scale: 0,
          opacity: 0
        }}
        animate={{
          scale: 1,
          opacity: 1
        }}
        transition={{
          duration: 0.8,
          delay: 0.5,
          ease: "easeOut"
        }}
      >
        {/* Outer vinyl disc - simplified animation */}
        <div className="absolute inset-0 rounded-full vinyl-3d animate-spin-slow">
          {/* Simplified grooves - fewer for better performance */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border border-gray-700/30"
              style={{
                width: `${100 - i * 20}%`,
                height: `${100 - i * 20}%`,
                top: `${i * 10}%`,
                left: `${i * 10}%`,
              }}
            />
          ))}

          {/* Center label */}
          <div className="absolute inset-0 m-auto w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/50 flex items-center justify-center">
              <Music className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          </div>

          {/* Highlight/reflection */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </div>

        {/* Shadow */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-28 h-4 md:w-40 md:h-6 bg-black/20 rounded-full blur-xl" />
      </motion.div>
    </div>
  );
};