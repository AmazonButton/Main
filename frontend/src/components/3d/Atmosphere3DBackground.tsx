import React from 'react';

export type AtmosphereVariant = 'hero' | 'showcase' | 'auth' | 'dashboard' | 'device-config';

interface Atmosphere3DBackgroundProps {
  variant?: AtmosphereVariant;
  interactive?: boolean;
  className?: string;
  configState?: 'idle' | 'changed' | 'saved';
}

export const Atmosphere3DBackground: React.FC<Atmosphere3DBackgroundProps> = ({
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#F8FAFC] transition-colors ${className}`}
    >
      {/* 1. Ultra-Subtle Blue Engineering Grid (Opacity extremely low: felt, not noticed) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #2563EB 1px, transparent 1px), linear-gradient(to bottom, #2563EB 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 10%, black 30%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 10%, black 30%, transparent 90%)',
        }}
      />

      {/* 2. Soft Light Sky Blue Horizon Warmth (Pure gentle daylight glow at top) */}
      <div 
        className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[900px] h-[360px] rounded-full bg-gradient-to-b from-blue-100/50 via-sky-50/20 to-transparent blur-[90px] pointer-events-none" 
      />

      {/* 3. Subtle Floating Ambient Dots (Gentle breathing, non-distracting) */}
      <div 
        className="absolute top-1/4 -right-16 w-96 h-96 rounded-full bg-blue-50/40 blur-[110px] pointer-events-none animate-ambient-breathe" 
      />
      <div 
        className="absolute bottom-16 -left-20 w-[420px] h-[420px] rounded-full bg-sky-50/35 blur-[120px] pointer-events-none animate-ambient-breathe" 
        style={{ animationDelay: '-6s' }}
      />
    </div>
  );
};
