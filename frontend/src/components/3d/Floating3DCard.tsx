import React from 'react';

interface Floating3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  depth?: number;
  glareEffect?: boolean;
  statusGlow?: 'online' | 'pressing' | 'shipping' | 'warning' | 'none';
  isPressed?: boolean;
  onClick?: () => void;
}

export const Floating3DCard: React.FC<Floating3DCardProps> = ({
  children,
  className = '',
  statusGlow = 'none',
  isPressed = false,
  onClick,
}) => {
  // Clean, subtle status border indicators
  const getGlowStyles = () => {
    switch (statusGlow) {
      case 'online':
        return 'border-[#10B981] shadow-sm';
      case 'pressing':
        return 'border-[#F59E0B] ring-2 ring-amber-100 shadow-md';
      case 'shipping':
        return 'border-[#2563EB] shadow-sm';
      case 'warning':
        return 'border-[#EF4444] shadow-sm';
      default:
        return 'border-[#E2E8F0] hover:border-slate-300';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border transition-all duration-160 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${getGlowStyles()} ${
        isPressed ? 'translate-y-0.5 scale-[0.99]' : 'hover:-translate-y-0.5 hover:shadow-md'
      } ${className}`}
    >
      {children}
    </div>
  );
};
