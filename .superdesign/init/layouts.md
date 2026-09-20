# Shared Layout Components

This file documents the core application shell and navigation layouts used across all views.

---

## 1. Top Navbar Layout

- **File Path**: `frontend/src/layouts/Navbar.tsx`
- **Description**: Sticky responsive top navigation bar featuring ambient theme toggler, current authenticated user profile dropdown, quick role switching badge (Customer, Merchant, Admin, Technician), and real-time backend connection status indicator.

```tsx
// Key visual properties:
// - Glassmorphism: bg-white/80 dark:bg-[#090A0F]/80 backdrop-blur-xl
// - Border: border-b border-slate-200/80 dark:border-zinc-800/80
// - Realtime status indicator with green pulse dot
// - Sound context mute/unmute quick toggle
```

---

## 2. App Shell / Root Layout

- **File Path**: `frontend/src/App.tsx`
- **Description**: Master React Router wrapper providing `AuthProvider`, `OrderSoundProvider`, and global WebSocket listeners. It establishes dark/light theme classes on `<html>` and mounts route guards.

```tsx
// Provides:
// - AuthProvider
// - OrderSoundProvider
// - Toast notifications & Sound alerts
// - Dynamic role-based route switching
```

---

## 3. Modal Shell Standard

- Centered flex backdrop: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm`
- Container: `relative w-full max-w-lg bg-white dark:bg-[#101014] rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-zinc-800 space-y-4 animate-in fade-in zoom-in-95 duration-200`
