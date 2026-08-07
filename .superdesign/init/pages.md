# Component Dependency Tree of Key Pages

This file outlines the dependency tree for each primary page in the application.

---

## 1. `/app` (Customer Home Portal)
Entry: `frontend/src/pages/customer/CustomerHomePage.tsx`
Dependencies:
- `frontend/src/services/api.ts`
- `frontend/src/services/socket.ts`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/context/OrderSoundContext.tsx`
- `frontend/src/components/3d/Floating3DCard.tsx`
- `frontend/src/components/devices/WhiteDeviceAirPodsModal.tsx`
  - `frontend/src/data/storeProductsData.ts`
- `frontend/src/components/devices/WebBluetoothProvisioner.tsx`

---

## 2. `/merchant` (Store Dashboard)
Entry: `frontend/src/pages/store/StoreDashboard.tsx`
Dependencies:
- `frontend/src/services/api.ts`
- `frontend/src/services/socket.ts`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/context/OrderSoundContext.tsx`

---

## 3. `/admin` (Platform Super Admin)
Entry: `frontend/src/pages/admin/AdminDashboard.tsx`
Dependencies:
- `frontend/src/services/api.ts`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/components/AnalyticsChart.jsx`
