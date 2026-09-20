# Smart Order Button V2 — Design System & Visual Specification

This document defines the persistent design system and visual language for the **Smart Order Button V2** ecosystem, following the [Superdesign](https://superdesign.dev) specification. Every AI coding agent, web frontend component, and mobile screen must adhere to these tokens, principles, and component standards.

---

## 1. Product Context & Philosophy

- **Product Vision**: Zero-touch, one-click replenishment and immediate household utility delivery through physical IoT buttons (ESP32-based) synchronized in real-time with Web and Mobile apps.
- **Key Personas**:
  - **Residents / Consumers**: Instant re-order with a physical tactile button, 60s cancellation safety window, live order progress tracking, battery & Wi-Fi diagnostics.
  - **Local Merchants / Store Owners**: High-velocity order queue with authentic bank-speaker audio chime, quick fulfillment dispatching, real-time stock alert protection.
  - **System Admins & Technicians**: Fleet telemetry, zero-touch BLE provisioning, cryptographic HMAC-SHA256 device lifecycle management.
- **Design Metaphor**: *"Apple Hardware meets Precision Industrial Dashboard"* — pristine white surfaces, deep dark mode obsidian backgrounds, neon cyan/amber/emerald indicators, tactile haptic feedback, and glassmorphism.

---

## 2. Design Tokens

### 2.1 Color Palette

#### Neutral Surface Scale (Light & Dark)
- `--bg-canvas-light`: `#F8FAFC` (Slate 50)
- `--bg-surface-light`: `#FFFFFF`
- `--border-subtle-light`: `#E2E8F0` (Slate 200)
- `--text-primary-light`: `#0F172A` (Slate 900)
- `--text-muted-light`: `#64748B` (Slate 500)

- `--bg-canvas-dark`: `#090A0F` (Deep Obsidian Void)
- `--bg-surface-dark`: `#11141C` (Muted Card Surface)
- `--bg-surface-elevated-dark`: `#181C26` (Floating Modal & Dropdown)
- `--border-subtle-dark`: `#1E2433` (Precision Hairline Border)
- `--text-primary-dark`: `#F8FAFC`
- `--text-muted-dark`: `#94A3B8`

#### Semantic Accents
- **Primary Brand (Cyan / Sky Tech)**:
  - `500`: `#0EA5E9` (Sky 500) | `600`: `#0284C7` (Sky 600)
  - Glow filter: `0 0 24px rgba(14, 165, 233, 0.35)`
- **Tactile Hardware Accent (Amber Gold / Warning)**:
  - `500`: `#F59E0B` | `400`: `#FBBF24`
  - Glow filter: `0 0 20px rgba(245, 158, 11, 0.45)`
  - Used for physical button press pulses, pending orders, and 60s cancel countdown.
- **Success & Hardware Online (Emerald Teal)**:
  - `500`: `#10B981` | `400`: `#34D399`
  - Glow filter: `0 0 16px rgba(16, 185, 129, 0.4)`
- **Destructive / Cancellation (Rose Red)**:
  - `500`: `#F43F5E` | `600`: `#E11D48`
- **Merchant Brand Accent (Indigo / Violet)**:
  - `500`: `#6366F1` | `600`: `#4F46E5`

### 2.2 Typography Scale
- **Primary Display & Sans**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace (Device ID, Order Numbers, Timestamps)**: `JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `display-2xl` | 32px / 2rem | 900 (Black) | 1.15 | Hero page greeting & marketing banner |
| `heading-xl` | 24px / 1.5rem | 800 (ExtraBold) | 1.25 | Section headings, modal title |
| `heading-lg` | 18px / 1.125rem | 700 (Bold) | 1.35 | Card titles, device names |
| `body-base` | 14px / 0.875rem | 500 (Medium) | 1.5 | Primary body content, table data |
| `caption-sm` | 12px / 0.75rem | 600 (SemiBold) | 1.4 | Badges, metadata, status labels |
| `mono-xs` | 11px / 0.6875rem | 700 (Bold) | 1.3 | Order codes (`#ORD-...`), Device IDs (`BTN-...`) |

### 2.3 Elevation & Shadows
- **Card Base**: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- **Elevated Hover**: `0 12px 30px -10px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)`
- **Hardware Tactile Press**: `0 0 0 4px rgba(245, 158, 11, 0.3), 0 10px 25px -5px rgba(245, 158, 11, 0.4)`
- **Glassmorphism Backdrop**: `backdrop-filter: blur(16px); background: rgba(17, 20, 28, 0.75);`

### 2.4 Border Radius
- `rounded-lg`: 8px (Buttons, badges)
- `rounded-xl`: 12px (Form inputs, pill switches)
- `rounded-2xl`: 16px (Card containers, metric widgets)
- `rounded-3xl`: 24px (Master Hero panels, AirPods pairing modal)
- `rounded-full`: 9999px (Status dots, circular indicators)

---

## 3. Motion & Interaction Patterns

1. **Hardware Button Physical Tactile Response**:
   - When an incoming `BUTTON_PRESSING` socket event arrives:
     - The corresponding device card scales down to `0.98` with `transition: transform 120ms ease-out`.
     - An ambient amber aura expands outward (`ring-4 ring-amber-400/50 shadow-amber-500/30`).
     - A subtle haptic click sound (`880Hz -> 1760Hz` frequency ramp) fires instantly.
     - State holds for 2.0 - 2.5 seconds before settling smoothly back to normal.
2. **Order Creation Celebration**:
   - Canvas confetti burst (60-80 particles, dual origin).
   - Melodic two-tone chime (`F#5 -> C#6`).
   - Modal zooms in (`zoom-in-95 fade-in duration-200`).
3. **Graceful Cancellation Countdown**:
   - Linear progress bar decrementing smoothly across 60 seconds.
   - Dual-tap or double-click to immediately trigger `DOUBLE_PRESS` cancel.

---

## 4. Key Component Blueprints

1. **DeviceCard (Floating3DCard)**:
   - Left: Product image thumbnail with subtle gradient overlay and model badge.
   - Middle: Device ID in mono, live status pill (Online / Deep Sleep / Disabled), Custom Name, Product Price.
   - Right: Physical tactile button visualizer that reacts to real ESP32 button presses.
2. **WhiteDeviceAirPodsModal**:
   - Authentic Apple-style bottom-up sheet / center modal.
   - Step 1: Scanning & BLE signal discovery.
   - Step 2: Instant Wi-Fi credential entry with 1-touch sync.
   - Step 3: Fast commodity product binding.
3. **StoreOrderQueueItem**:
   - Chronological card with customer address, phone, item quantities, and status action buttons (Accept, Prepare, Ship, Complete).
