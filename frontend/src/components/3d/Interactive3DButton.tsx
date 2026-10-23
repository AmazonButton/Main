import React, { useState } from 'react';
import { Radio, CheckCircle2, Wifi, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Interactive3DButtonProps {
  onPress?: () => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTelemetry?: boolean;
  label?: string;
  subLabel?: string;
  hideFeedbackFooter?: boolean;
  overrideLedState?: 'off' | 'blue' | 'yellow' | 'green' | 'red';
  overrideStatusText?: string;
}

export const Interactive3DButton: React.FC<Interactive3DButtonProps> = ({
  onPress,
  interactive = true,
  size = 'lg',
  label,
  subLabel,
  hideFeedbackFooter = false,
  overrideLedState,
  overrideStatusText,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [internalLedState, setInternalLedState] = useState<'off' | 'blue' | 'yellow' | 'green' | 'red'>('blue');
  const [internalStatusText, setInternalStatusText] = useState('Đang hoạt động • Sẵn sàng nhấn');

  const activeLedState = overrideLedState !== undefined ? overrideLedState : internalLedState;
  const activeStatusText = overrideStatusText !== undefined ? overrideStatusText : internalStatusText;

  // Real tactile click audio (soft mechanical switch)
  const playTactileClick = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  };

  const playSuccessChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } catch {}
  };

  const handlePress = () => {
    if (isPressed || !interactive) return;
    setIsPressed(true);
    playTactileClick();
    setInternalLedState('blue');
    setInternalStatusText('Đang gửi tín hiệu qua Wi-Fi...');
    onPress?.();

    setTimeout(() => {
      setInternalLedState('yellow');
      setInternalStatusText('Xác thực bảo mật HMAC & tạo đơn...');
    }, 600);

    setTimeout(() => {
      setInternalLedState('green');
      setInternalStatusText('Đặt hàng thành công! Đã gửi tới cửa hàng.');
      playSuccessChime();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#2563EB', '#3B82F6', '#10B981'],
        });
      } catch {}
    }, 1300);

    setTimeout(() => {
      setInternalLedState('blue');
      setIsPressed(false);
      setInternalStatusText('Đang hoạt động • Sẵn sàng nhấn');
    }, 3800);
  };

  // Dimensions based on size
  const housingDimensions = {
    sm: 'w-44 h-44',
    md: 'w-56 h-56',
    lg: 'w-64 h-64 sm:w-72 sm:h-72',
  }[size];

  const buttonCapDimensions = {
    sm: 'w-28 h-28',
    md: 'w-36 h-36',
    lg: 'w-44 h-44 sm:w-48 sm:h-48',
  }[size];

  // LED soft glow styles (No neon, gentle physical diffuser)
  const getLedStyles = () => {
    switch (activeLedState) {
      case 'green':
        return 'border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.35)]';
      case 'yellow':
        return 'border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.35)]';
      case 'blue':
        return 'border-[#2563EB] shadow-[0_0_14px_rgba(37,99,235,0.3)] animate-pulse';
      case 'red':
        return 'border-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.35)]';
      default:
        return 'border-[#E2E8F0] shadow-none';
    }
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Physical Hardware Puck Housing */}
      <div
        className={`relative ${housingDimensions} rounded-full bg-gradient-to-b from-slate-50 to-slate-100 p-3.5 border border-[#E2E8F0] shadow-[0_12px_28px_-6px_rgba(15,23,42,0.08)] flex items-center justify-center transition-transform duration-200 hover:-translate-y-0.5`}
      >
        {/* Soft LED Ring Diffuser Channel */}
        <div
          className={`absolute inset-2.5 rounded-full border-[2.5px] transition-all duration-300 pointer-events-none ${getLedStyles()}`}
        />

        {/* Center Tactile Button Cap */}
        <button
          type="button"
          onClick={handlePress}
          aria-label="Nút bấm đặt hàng vật lý Smart Order"
          className={`relative ${buttonCapDimensions} rounded-full cursor-pointer flex flex-col items-center justify-center text-center outline-none transition-all duration-150 ${
            isPressed
              ? 'translate-y-1 shadow-[inset_0_3px_6px_rgba(0,0,0,0.1)] bg-slate-100'
              : 'hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_2px_rgba(255,255,255,0.8)] bg-white hover:bg-slate-50'
          } border border-slate-200/90 active:scale-[0.98]`}
        >
          {/* Central Blue Icon */}
          <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-1.5 shadow-sm">
            <Radio className="w-6 h-6 text-[#2563EB]" />
          </div>

          {/* Action Label */}
          <span className="text-xs sm:text-sm font-bold text-[#0F172A] tracking-tight">
            {label ? label : isPressed ? 'Đang Gửi Lệnh...' : 'Nhấn Để Đặt Hàng'}
          </span>
          <span className="text-[11px] text-[#64748B] mt-0.5 font-medium">
            {subLabel ? subLabel : 'Chạm 1 lần'}
          </span>
        </button>
      </div>

      {/* Realtime Status Feedback Text */}
      {!hideFeedbackFooter && (
        <div className="mt-4 flex flex-col items-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A] shadow-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                activeLedState === 'green'
                  ? 'bg-[#10B981]'
                  : activeLedState === 'yellow'
                  ? 'bg-[#F59E0B]'
                  : activeLedState === 'red'
                  ? 'bg-[#EF4444]'
                  : 'bg-[#2563EB]'
              }`}
            />
            <span>{activeStatusText}</span>
          </div>
          <p className="text-[11px] text-[#64748B]">Bấm thử để trải nghiệm mô phỏng đặt hàng</p>
        </div>
      )}
    </div>
  );
};
