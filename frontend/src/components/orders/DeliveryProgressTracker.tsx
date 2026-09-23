import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Radio,
  XCircle,
  AlertCircle,
  Sparkles,
  MapPin,
  Store,
  ChevronRight,
} from 'lucide-react';

interface DeliveryProgressTrackerProps {
  order: Order;
  onCancelOrder?: (orderId: string) => void;
  isCancelling?: boolean;
}

export const DeliveryProgressTracker: React.FC<DeliveryProgressTrackerProps> = ({
  order,
  onCancelOrder,
  isCancelling = false,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (order.status !== 'PENDING') return 0;
    const createdAt = new Date(order.createdAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - createdAt) / 1000);
    const windowSec = order.device?.configuration?.cancelWindowSeconds ?? 60;
    return Math.max(0, windowSec - elapsed);
  });

  useEffect(() => {
    if (order.status !== 'PENDING') return;

    const timer = setInterval(() => {
      const createdAt = new Date(order.createdAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - createdAt) / 1000);
      const windowSec = order.device?.configuration?.cancelWindowSeconds ?? 60;
      const rem = Math.max(0, windowSec - elapsed);
      setSecondsRemaining(rem);
      if (rem <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [order.createdAt, order.status, order.device]);

  // Determine active step index (0 to 3)
  const getStepIndex = () => {
    const status = order.status as string;
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
      case 'PREPARING':
      case 'PROCESSING':
        return 1;
      case 'OUT_FOR_DELIVERY':
      case 'SHIPPING':
        return 2;
      case 'COMPLETED':
      case 'DELIVERED':
        return 3;
      case 'CANCELLED':
      case 'REJECTED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex();
  const isCancelled = order.status === 'CANCELLED';

  const steps = [
    { label: 'Bấm Nút Đặt', desc: 'Thiết bị kích hoạt tức thì', icon: Radio },
    { label: 'Đại Lý Tiếp Nhận', desc: 'Đang chuẩn bị hàng', icon: Package },
    { label: 'Shipper Giao Tốc Hành', desc: 'Đang chuyển đến cửa căn hộ', icon: Truck },
    { label: 'Giao Thành Công', desc: 'Hoàn tất đơn hàng', icon: CheckCircle2 },
  ];

  const totalCancelWindow = order.device?.configuration?.cancelWindowSeconds ?? 60;
  const progressRatio = totalCancelWindow > 0 ? secondsRemaining / totalCancelWindow : 0;
  const strokeDashoffset = 100 - progressRatio * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5 transition-all">
      {/* Top Banner: Status Header & ETA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
              isCancelled
                ? 'bg-[#FEF2F2] text-[#EF4444] border border-red-200'
                : currentStep === 3
                ? 'bg-[#ECFDF5] text-[#10B981] border border-emerald-200'
                : currentStep === 2
                ? 'bg-[#EFF6FF] text-[#2563EB] border border-blue-200 animate-pulse'
                : 'bg-[#FFFBEB] text-[#F59E0B] border border-amber-200'
            }`}
          >
            {isCancelled ? (
              <XCircle className="w-5 h-5" />
            ) : currentStep === 2 ? (
              <Truck className="w-5 h-5" />
            ) : currentStep === 3 ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Radio className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-tight text-[#0F172A]">
                #{order.orderNumber || order.id.slice(0, 8)}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isCancelled
                    ? 'bg-[#FEF2F2] text-[#EF4444] border border-red-200'
                    : currentStep === 3
                    ? 'bg-[#ECFDF5] text-[#10B981] border border-emerald-200'
                    : currentStep === 2
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-blue-200'
                    : 'bg-[#FFFBEB] text-[#F59E0B] border border-amber-200'
                }`}
              >
                {isCancelled
                  ? 'Đã Hủy Đơn'
                  : currentStep === 3
                  ? 'Đã Giao Xong'
                  : currentStep === 2
                  ? 'Đang Giao Tận Cửa'
                  : currentStep === 1
                  ? 'Đang Chuẩn Bị'
                  : 'Chờ Xử Lý (Bấm Đúp Để Hủy)'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5">
              <span>Nút: <strong className="text-[#0F172A]">{order.device?.customName || order.deviceId}</strong></span>
              <span>•</span>
              <span>SL: <strong className="text-[#0F172A]">{order.items?.reduce((sum, item) => sum + item.quantity, 0) || order.device?.configuration?.defaultQuantity || 1}</strong></span>
              <span>•</span>
              <span className="text-[#2563EB] font-bold font-mono">
                {order.totalAmount ? Number(order.totalAmount).toLocaleString('vi-VN') + ' đ' : 'Miễn phí'}
              </span>
            </p>
          </div>
        </div>

        {/* Live Cancellation Countdown Widget (if PENDING) */}
        {order.status === 'PENDING' && secondsRemaining > 0 && onCancelOrder && (
          <div className="flex items-center gap-3 bg-[#FFFBEB] border border-amber-200 px-3.5 py-2 rounded-xl">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-amber-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#F59E0B] transition-all duration-1000 ease-linear"
                  strokeDasharray="100, 100"
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono text-[10px] font-bold text-[#F59E0B]">
                {secondsRemaining}s
              </span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#92400E]">
                Cửa sổ hủy an toàn: {secondsRemaining}s
              </p>
              <button
                type="button"
                onClick={() => onCancelOrder(order.id)}
                disabled={isCancelling}
                className="text-[11px] font-bold text-[#EF4444] hover:underline flex items-center gap-1"
              >
                <span>Bấm vào đây để hủy đơn</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animated Route Timeline */}
      {!isCancelled ? (
        <div className="py-2">
          {/* Progress Bar with Moving Bike / Indicator */}
          <div className="relative mb-6">
            {/* Background Line */}
            <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-blue-500 to-emerald-500 rounded-full transition-all duration-700 relative"
                style={{
                  width: `${(Math.min(currentStep, 3) / 3) * 100}%`,
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>

            {/* Moving Animated Shipper Avatar */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 z-10"
              style={{
                left: `${Math.max(6, Math.min(94, (currentStep / 3) * 100))}%`,
              }}
            >
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white shadow-md flex items-center justify-center text-xs animate-bounce">
                {currentStep >= 2 ? (
                  <Truck className="w-4 h-4" />
                ) : (
                  <Radio className="w-3.5 h-3.5 animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* 4 Stage Stepper Pills - Responsive 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {steps.map((st, idx) => {
              const isPast = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div
                  key={st.label}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#EFF6FF] border-blue-300 shadow-sm ring-1 ring-blue-400/20'
                      : isPast
                      ? 'bg-[#ECFDF5] border-emerald-200'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-[#2563EB] text-white shadow-sm'
                          : isPast
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span className="text-[11px] font-bold text-[#0F172A] truncate">
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] truncate pl-6">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-red-200 text-[#EF4444] text-xs flex items-center gap-2.5">
          <XCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
          <span>Đơn hàng đã được hủy an toàn. Không có khoản phí nào phát sinh. Bạn có thể bấm nút bất kỳ lúc nào để đặt lại.</span>
        </div>
      )}

      {/* Bottom Dispatch / Store Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-[#64748B]">
        <div className="flex items-center gap-1.5 font-medium">
          <Store className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Đại lý phục vụ: <strong className="text-[#0F172A]">Đại lý Nước & Gas Gia Định</strong></span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span>Căn hộ: <strong className="text-[#0F172A]">{order.deliveryAddress || '1204 - Sapphire'}</strong></span>
        </div>
      </div>
    </div>
  );
};
