# Application Routes & User Flows

This document details the route architecture and primary user flows across the application.

---

## 1. Route Map

| URL Path | Component Path | Roles Allowed | Description |
|---|---|---|---|
| `/` | `pages/LandingPage.tsx` | Public | Hero landing page showcasing the 1-click IoT replenishment ecosystem |
| `/login` | `pages/auth/LoginPage.tsx` | Public | Fast multi-role sign-in with 1-click demo login buttons |
| `/quick-setup` | `pages/QuickSetupPage.tsx` | Public / Customer | Zero-touch hardware onboarding & SoftAP Wi-Fi provisioning guide |
| `/app` | `pages/customer/CustomerHomePage.tsx` | `CUSTOMER` | Primary consumer portal: device card grid, 1-click reorder, 60s cancel grace window |
| `/merchant` | `pages/store/StoreDashboard.tsx` | `STORE_OWNER`, `STORE_MANAGER`, `STORE_STAFF` | Merchant order management terminal with real-time audio announcements |
| `/merchant/devices` | `pages/store/StoreDevicesPage.tsx` | `STORE_OWNER` | Merchant IoT button provisioning, laser code claiming, inventory assignment |
| `/admin` | `pages/admin/AdminDashboard.tsx` | `SUPER_ADMIN` | Master platform telemetry, security logs, fleet diagnostics |
| `/tech` | `pages/tech-business/TechBusinessDashboard.tsx` | `TECHNICIAN`, `SUPER_ADMIN` | Field engineering diagnostic tool for Wi-Fi signal, battery curve, HMAC keys |

---

## 2. Core User Flows

### Flow A: Resident 1-Click Order
1. User presses the physical ESP32 button (or clicks the tactile button on `/app`).
2. ESP32 signs HMAC-SHA256 and calls `/api/iot/events` over home Wi-Fi.
3. Backend receives, validates, and emits `BUTTON_PRESSING` via Socket.io.
4. The Web UI receives socket event:
   - Device card scales down and glows with amber halo ring.
   - Audio chime plays.
   - Confetti bursts.
   - Order Success Modal opens with a live 60-second cancel countdown timer.
5. If resident double-clicks the button within 60s, the order is safely cancelled without penalty.

### Flow B: Merchant Instant Fulfillment
1. Incoming order arrives via `ORDER_CREATED` WebSocket event.
2. Web browser speaks aloud the order announcement (Vietnamese Voice Synthesis + Bank Chime).
3. Merchant verifies address and clicks "Tiếp Nhận Đơn" -> "Đang Giao Hàng" -> "Hoàn Tất".
4. Status syncs back to customer app in real-time.
