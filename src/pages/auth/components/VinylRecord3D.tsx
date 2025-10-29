import React from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

export const VinylRecord3D: React.FC = () => {
  return (
    <div className="absolute top-10 right-10 md:top-20 md:right-20 perspective-container">
      <motion.div
        className="relative w-32 h-32 md:w-48 md:h-48"
        initial={{ 
          rotateY: -90,
          scale: 0,
          opacity: 0 
        }}
        animate={{ 
          rotateY: 0,
          scale: 1,
          opacity: 1 
        }}
        transition={{
          duration: 1.2,
          delay: 0.5,
          type: "spring",
          stiffness: 100,
        }}
      >
        {/* Outer vinyl disc */}
        <motion.div
          className="absolute inset-0 rounded-full vinyl-3d animate-spin-3d"
          whileHover={{ 
            scale: 1.1,
            rotateZ: 5,
          }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {/* Grooves */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border border-gray-700/30"
              style={{
                width: `${100 - i * 10}%`,
                height: `${100 - i * 10}%`,
                top: `${i * 5}%`,
                left: `${i * 5}%`,
              }}
            />
          ))}
          
          {/* Center label */}
          <div className="absolute inset-0 m-auto w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/50 flex items-center justify-center">
              <Music className="w-6 h-6 md:w-8 md:h-8 text-white animate-pulse-neon" />
            </div>
          </div>
          
          {/* Highlight/reflection */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        </motion.div>

        {/* Shadow */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-28 h-4 md:w-40 md:h-6 bg-black/20 rounded-full blur-xl" />
      </motion.div>

      {/* Second smaller vinyl for depth */}
      <motion.div
        className="absolute -bottom-10 -left-10 w-20 h-20 md:w-28 md:h-28"
        initial={{ 
          rotateY: 90,
          scale: 0,
          opacity: 0 
        }}
        animate={{ 
          rotateY: 0,
          scale: 1,
          opacity: 0.5 
        }}
        transition={{
          duration: 1.2,
          delay: 0.8,
          type: "spring",
          stiffness: 100,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 animate-spin-3d opacity-50">
          <div className="absolute inset-0 m-auto w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600" />
        </div>
      </motion.div>
    </div>
  );
};