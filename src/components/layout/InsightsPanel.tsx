
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Play, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ isOpen, onClose }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showOutro, setShowOutro] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Show intro animation every time panel opens
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setShowIntro(true);
      const timer = setTimeout(() => setShowIntro(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle close with outro animation
  const handleClose = useCallback(() => {
    setShowOutro(true);
    setTimeout(() => {
      setShowOutro(false);
      setIsVisible(false);
      onClose();
    }, 2000);
  }, [onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen && !isVisible) return null;

  return (
    <>
      {/* Intro Animation Overlay */}
      {showIntro && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          style={{ animation: 'overlayFadeOut 0.3s ease-in 1.7s forwards' }}
        >
          <div className="relative">
            {/* Explosion particles */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
                  style={{
                    animation: `explode 0.8s ease-out forwards`,
                    animationDelay: `${i * 0.05}s`,
                    transform: `rotate(${i * 30}deg) translateY(-20px)`
                  }}
                />
              ))}
            </div>

            {/* Main text */}
            <h1
              className="text-6xl sm:text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 tracking-tighter"
              style={{
                animation: 'zoomIn 0.5s ease-out forwards, shake 0.5s ease-in-out 0.5s, fadeOut 0.5s ease-in 1.5s forwards',
                textShadow: '0 0 80px rgba(255, 100, 0, 0.5)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              BRAINROT
            </h1>

            {/* Subtitle */}
            <p
              className="text-center text-2xl sm:text-3xl text-white/80 mt-4 font-bold"
              style={{
                animation: 'slideUp 0.5s ease-out 0.3s forwards, fadeOut 0.5s ease-in 1.5s forwards',
                opacity: 0
              }}
            >
              WELCOME TO THE VOID
            </p>
          </div>

          <style>{`
            @keyframes explode {
              0% { transform: rotate(var(--rotate, 0deg)) translateY(-20px) scale(1); opacity: 1; }
              100% { transform: rotate(var(--rotate, 0deg)) translateY(-150px) scale(0); opacity: 0; }
            }
            @keyframes zoomIn {
              0% { transform: scale(0) rotate(-10deg); opacity: 0; }
              50% { transform: scale(1.2) rotate(5deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-10px) rotate(-2deg); }
              75% { transform: translateX(10px) rotate(2deg); }
            }
            @keyframes slideUp {
              0% { transform: translateY(20px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeOut {
              0% { opacity: 1; }
              100% { opacity: 0; }
            }
            @keyframes overlayFadeOut {
              0% { opacity: 1; pointer-events: auto; }
              100% { opacity: 0; pointer-events: none; }
            }
          `}</style>
        </div>
      )}

      {/* Outro Animation Overlay */}
      {showOutro && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          style={{ animation: 'overlayFadeOut 0.3s ease-in 1.7s forwards' }}
        >
          <div className="relative text-center">
            {/* Imploding particles */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full"
                  style={{
                    animation: `implode 0.8s ease-in forwards`,
                    animationDelay: `${i * 0.05}s`,
                    transform: `rotate(${i * 30}deg) translateY(-150px)`
                  }}
                />
              ))}
            </div>

            {/* Main text */}
            <h1
              className="text-5xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-500 to-cyan-400 tracking-tighter"
              style={{
                animation: 'zoomIn 0.5s ease-out forwards, shake 0.5s ease-in-out 0.5s, fadeOut 0.5s ease-in 1.5s forwards',
                textShadow: '0 0 80px rgba(100, 100, 255, 0.5)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              GOODBYE
            </h1>

            {/* Subtitle */}
            <p
              className="text-center text-xl sm:text-2xl text-white/80 mt-4 font-bold"
              style={{
                animation: 'slideUp 0.5s ease-out 0.3s forwards, fadeOut 0.5s ease-in 1.5s forwards',
                opacity: 0
              }}
            >
              TO THE REAL WORLD, NPC
            </p>
          </div>

          <style>{`
            @keyframes implode {
              0% { transform: rotate(var(--rotate, 0deg)) translateY(-150px) scale(0); opacity: 0; }
              100% { transform: rotate(var(--rotate, 0deg)) translateY(-20px) scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      <aside
      className="fixed w-80 h-[500px] bg-background border rounded-xl shadow-2xl flex flex-col dark:bg-card z-50 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div
        className="p-3 border-b flex items-center justify-between cursor-grab active:cursor-grabbing bg-muted/50"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <Play className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Stream</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
          <span className="sr-only">Close stream panel</span>
        </Button>
      </div>

      <div className="flex-1 bg-black">
        <iframe
          src="https://www.youtube.com/embed/videoseries?list=PLDtG156FV00AxYp6Q4ya0BPd-GQe6GcT2&autoplay=1&mute=1&loop=1"
          width="100%"
          height="100%"
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="border-0"
          title="Video Stream"
        />
      </div>
    </aside>
    </>
  );
};
