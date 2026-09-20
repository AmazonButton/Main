# Design System & Theme Tokens

This document contains the compact design token summary and raw theme configurations.

---

## Part 1 — Compact Token Summary

### Color Tokens (HSL / Hex)
- **Background Light**: `#F8FAFC` (`slate-50`)
- **Card Surface Light**: `#FFFFFF`
- **Text Light**: `#0F172A` (`slate-900`)
- **Background Dark**: `#090A0F` (`zinc-950+`)
- **Card Surface Dark**: `#11141C`
- **Text Dark**: `#F8FAFC`
- **Primary Brand (Cyan / Sky)**: `#0EA5E9` (Light) / `#38BDF8` (Dark)
- **Hardware Tactile Accent (Amber)**: `#F59E0B`
- **Success (Emerald)**: `#10B981`
- **Danger (Rose)**: `#F43F5E`

### Spacing & Grid
- Base unit: 4px
- Card padding: `1.25rem` (20px) to `1.5rem` (24px)
- Page container: `max-w-5xl` (1024px) or `max-w-7xl` (1280px)
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-12`

---

## Part 2 — Raw Source Dumps

### 1. `frontend/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#090A0F',
        darkCard: '#11141C',
        darkSurface: '#181C26',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
```
