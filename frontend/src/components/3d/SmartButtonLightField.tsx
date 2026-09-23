import React from 'react';

export type ButtonLightState = 'idle' | 'press' | 'connecting' | 'success' | 'error' | 'offline';

interface SmartButtonLightFieldProps {
  state?: ButtonLightState;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SmartButtonLightField: React.FC<SmartButtonLightFieldProps> = ({
  state = 'idle',
  className = '',
  size = 'lg',
}) => {
  const sizeMap = {
    sm: 'w-64 h-64',
    md: 'w-80 h-80',
    lg: 'w-96 h-96 sm:w-[440px] sm:h-[440px]',
  }[size];

  // Colors and glow intensity tailored strictly to section 12 & 19 (soft, diffused, subtle daylight glow)
  const config = {
    idle: {
      color: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(59, 130, 246, 0.08) 45%, transparent 70%)',
      opacity: 'opacity-80',
      pulse: true,
      scale: 'scale-100',
    },
    press: {
      color: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 75%)',
      opacity: 'opacity-90',
      pulse: false,
      scale: 'scale-105',
    },
    connecting: {
      color: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(37, 99, 235, 0.12) 45%, transparent 70%)',
      opacity: 'opacity-85',
      pulse: true,
      scale: 'scale-102',
    },
    success: {
      color: 'radial-gradient(circle, rgba(16, 185, 129, 0.20) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 75%)',
      opacity: 'opacity-85',
      pulse: false,
      scale: 'scale-108',
    },
    error: {
      color: 'radial-gradient(circle, rgba(239, 68, 68, 0.18) 0%, transparent 65%)',
      opacity: 'opacity-80',
      pulse: true,
      scale: 'scale-100',
    },
    offline: {
      color: 'radial-gradient(circle, rgba(148, 163, 184, 0.05) 0%, transparent 50%)',
      opacity: 'opacity-20',
      pulse: false,
      scale: 'scale-90',
    },
  }[state];

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 m-auto ${sizeMap} rounded-full pointer-events-none transition-all duration-700 ease-out blur-[65px] ${config.opacity} ${config.scale} ${
        config.pulse ? 'animate-pulse-slow' : ''
      } ${className}`}
    >
      <div
        className="w-full h-full rounded-full transition-all duration-500"
        style={{ background: config.color }}
      />
    </div>
  );
};
