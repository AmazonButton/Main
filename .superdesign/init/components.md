# Shared UI Primitives & Core Components

This file contains the foundational, reusable UI components for the Smart Order Button frontend.

---

## 1. Floating3DCard

- **File Path**: `frontend/src/components/3d/Floating3DCard.tsx`
- **Description**: Interactive card container supporting 3D perspective mouse tilt, smooth spring physics, and glassmorphic reflection.

```tsx
import React, { useRef, useState } from 'react';

interface Floating3DCardProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
}

export const Floating3DCard: React.FC<Floating3DCardProps> = ({
  children,
  className = '',
  depth = 15,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -depth;
    const rotY = ((x - centerX) / centerX) * depth;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
      className={`transform-gpu ${className}`}
    >
      {children}
    </div>
  );
};
```

---

## 2. WhiteDeviceAirPodsModal

- **File Path**: `frontend/src/components/devices/WhiteDeviceAirPodsModal.tsx`
- **Description**: Apple AirPods-style modal for 1-touch Bluetooth BLE discovery, immediate Wi-Fi provisioning, and commodity assignment.

```tsx
// Excerpt of primary interface
export interface WhiteDeviceAirPodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceBound?: (deviceData: any) => void;
}
```

---

## 3. WebBluetoothProvisioner

- **File Path**: `frontend/src/components/devices/WebBluetoothProvisioner.tsx`
- **Description**: Web Bluetooth & Web Serial direct hardware flash utility for ESP32 Wi-Fi setup without needing 192.168.4.1.

---

## 4. Tactile Button Visualizer

- **File Path**: Embedded in `frontend/src/pages/customer/CustomerHomePage.tsx`
- **Description**: Real-time physical button state indicator that mirrors hardware presses with haptic ripple animations and amber neon glow.

```tsx
<div
  onClick={() => handleSimulatePress(dev.deviceId)}
  className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 cursor-pointer transition-all shadow-inner group ${
    isDevicePressing
      ? 'bg-amber-400 border-amber-300 text-amber-950 scale-95 shadow-amber-500/30 ring-4 ring-amber-400/40 animate-pulse'
      : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 border-slate-200 dark:border-zinc-700/80 text-slate-500 dark:text-zinc-400 active:scale-95'
  }`}
  title="Bấm nút vật lý hoặc bấm vào đây để đặt hàng"
>
  <Radio className={`w-5 h-5 transition-transform ${isDevicePressing ? 'scale-125 text-amber-950 animate-bounce' : 'group-hover:scale-110'}`} />
  <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">
    {isDevicePressing ? 'BẤM' : 'ẤN ĐẶT'}
  </span>
</div>
```
