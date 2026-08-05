# 🌐 SMARTSUPPLY (Button V2) — Intelligent Household Replenishment & IoT Service Platform
> *"Từ thao tác vật lý thông minh đến quản trị hộ gia đình, dự đoán chu kỳ tiêu thụ và điều phối dịch vụ thời gian thực."*

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Smart%20Household%20IoT%20Platform-06B6D4?style=for-the-badge&logo=iot&logoColor=white" alt="SmartSupply Architecture" />
  <img src="https://img.shields.io/badge/Mobile-Flutter%203%20%7C%205--Tab%20Architecture-02569B?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter Mobile" />
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%206%20%7C%20Tailwind-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Frontend" />
  <img src="https://img.shields.io/badge/Backend-NestJS%2010%20%7C%20Prisma%20ORM-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS Backend" />
  <img src="https://img.shields.io/badge/Prediction-Explainable%20Statistical%20Gauss-10B981?style=for-the-badge&logo=analytics&logoColor=white" alt="Statistical Prediction" />
  <img src="https://img.shields.io/badge/Realtime-Socket.io%20Room%20Sync-F59E0B?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO" />
</p>

---

## 🎯 1. Tầm Nhìn Chiến Lược: SmartSupply Không Phải Dash Button Clone

Các nút bấm thế hệ cũ (như Amazon Dash Button) thất bại vì một lý do cốt lõi: **"Bấm là mua" quá cứng nhắc**, dẫn đến đơn trùng lặp, thiếu ngữ cảnh gia đình và biến nút bấm thành một công cụ quảng cáo đơn điệu.

**SmartSupply định nghĩa lại hoàn toàn trải nghiệm:**

$$\text{Sự kiện IoT Vật Lý} \longrightarrow \text{Ngữ Cảnh Gia Đình} \longrightarrow \text{Theo Dõi Tiêu Thụ} \longrightarrow \text{Dự Đoán Thống Kê} \longrightarrow \text{Điều Phối Dịch Vụ / Đơn Hàng Gộp}$$

| Tiêu Chí | Nút Bấm Đơn Điệu Cũ (Dash Clone) | Nền Tảng SmartSupply (Button V2) |
|---|---|---|
| **Mô hình** | 1 Nút = 1 Sản phẩm = 1 Lệnh mua ngay | Nút IoT đa chức năng gán theo vị trí/khu vực gia đình |
| **Cơ chế tương tác** | Chỉ nhận 1 lần click | **Behavior Designer**: 1 click, 2 click, giữ 3s, giữ 5s |
| **Trí tuệ hệ thống** | Không có (Hoàn toàn thụ động) | **Mô hình thống kê minh bạch**: Chu kỳ $\mu$, độ lệch $\sigma$, độ tin cậy % |
| **Dịch vụ phi thương mại** | Không hỗ trợ | Hỗ trợ yêu cầu kỹ thuật, đổi vỏ bình, kiểm tra rò rỉ gas |
| **Bảo vệ an toàn** | Cảnh báo cơ bản | Cảnh báo khẩn cấp rò rỉ gas/nước với còi báo thời gian thực |
| **Chi phí vận chuyển** | Đặt lẻ tẻ từng đơn | **Order Batching**: Gộp cả giỏ nhu yếu phẩm vào 1 lần giao |
| **Quản trị gia đình** | 1 tài khoản đơn lẻ | **RBAC Đa Cấp**: Chủ hộ (Owner), Quản trị (Admin), Thành viên |

---

## 🏗️ 2. Kiến Trúc Hệ Thống Toàn Diện

```
                             ┌──────────────────────────────────────┐
                             │    🔘 NÚT BẤM VẬT LÝ ESP32           │
                             │    • Single Press (1 click)          │
                             │    • Double Press (2 clicks)         │
                             │    • Long Press 3s / 5s              │
                             │    • Deep Sleep (<15µA, 1.5 năm pin) │
                             └──────────────────┬───────────────────┘
                                                │ HTTPS + HMAC-SHA256
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 🚀 SMARTSUPPLY BACKEND (NESTJS)                         │
│  Port 5000 (Bind 0.0.0.0)                                                              │
│  ┌──────────────────────┬──────────────────────┬──────────────────────┬─────────────┐  │
│  │  Households & RBAC   │  Behavior Designer   │ Statistical Engine   │ Service Hub │  │
│  │  (Owner/Admin/Member)│  (Action Dispatcher) │ (Gauss Interval)     │ (Tech/Alert)│  │
│  └──────────────────────┴──────────────────────┴──────────────────────┴─────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      Prisma ORM & SQLite Storage (dev.db)                        │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │ Socket.io Global / Room Feed
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐
│     📱 MOBILE APP (FLUTTER 3)        │ │      🌐 WEB POS & ADMIN (REACT)      │
│     5 Tab UI Hiện Đại                │ │      Port 5173                       │
│ • Home: Live Sync & Gợi ý bổ sung    │ │ • Live Order & Service Request Feed  │
│ • Insights: Chu kỳ tiêu dùng Gauss   │ │ • Store Inventory & Batching Dispatch│
│ • Devices: Health Score & Behavior   │ │ • Simulator Lab: Kiểm thử 4 cử chỉ   │
│ • Orders: Đếm ngược 60s hủy đơn      │ │ • Loa thông báo đơn & kỹ thuật       │
│ • Household: Mua sắm gộp & Dịch vụ   │ │ • Quản lý đội nút bấm phân bổ        │
└──────────────────────────────────────┘ └──────────────────────────────────────┘
```

---

## ⚙️ 3. Lập Trình Hành Vi Nút Bấm (Behavior Designer)

Mỗi nút bấm vật lý trong SmartSupply có thể được lập trình trực tiếp từ ứng dụng di động:

```
[Nhấn 1 lần]  ──────────► Đặt hàng trực tiếp (Kích hoạt cửa sổ hủy 60s)
[Nhấn 2 lần]  ──────────► Thêm sản phẩm vào Danh Sách Mua Sắm chung của Căn Hộ
[Giữ 3 giây]  ──────────► Gửi yêu cầu dịch vụ kỹ thuật (Bảo dưỡng, thay van, kiểm tra nước)
[Giữ 5 giây]  ──────────► Phát báo động khẩn cấp (Rò rỉ van gas / ngập nước)
```

Tất cả cấu hình được lưu trữ tại bảng `DeviceConfiguration` và tự động cập nhật xuống bộ nhớ RTC / API của thiết bị.

---

## 📊 4. Mô Hình Thống Kê Chu Kỳ Tiêu Thụ (Explainable Prediction Engine)

SmartSupply **tuyệt đối không dùng khái niệm "AI ảo"**. Mọi dự đoán đều được tính toán bằng mô hình thống kê xác suất minh bạch:

1. **Khoảng thời gian trung bình (Mean Interval $\mu$):**
   $$\mu = \frac{1}{N-1} \sum_{i=1}^{N-1} (t_{i+1} - t_i)$$
2. **Độ lệch chuẩn (Standard Deviation $\sigma$):**
   $$\sigma = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N-1} (\Delta t_i - \mu)^2}$$
3. **Mốc thời gian dự kiến hết hàng ($T_{\text{expected}}$):**
   $$T_{\text{expected}} = t_{\text{last}} + \mu$$
4. **Điểm tin cậy (Confidence Score $C \in [45\%, 98\%]$):**
   Dựa trên số lượng mẫu $N$ và tính ổn định $\frac{\sigma}{\mu}$.

**Giải thích trực quan hiển thị cho người dùng:**
> *"Dựa trên chu kỳ tiêu dùng trung bình 7.0 ngày qua 5 lần gần nhất (độ lệch ±0.8 ngày). Dự kiến hết nước trong 1-2 ngày tới."*

---

## 🩺 5. Chỉ Số Sức Khỏe Thiết Bị (Device Health Score 0–100)

Hệ thống tính toán sức khỏe từng nút bấm theo thời gian thực dựa trên 3 trụ cột:
- 🔋 **Mức pin (0–40 điểm):** $\text{Battery\%} \times 0.4$
- 📶 **Chất lượng sóng Wi-Fi (0–40 điểm):**
  - $\text{RSSI} \ge -60\text{ dBm} \implies 40$ điểm (Tuyệt vời)
  - $-70 \le \text{RSSI} < -60 \implies 32$ điểm (Tốt)
  - $-80 \le \text{RSSI} < -70 \implies 22$ điểm (Bình thường)
  - $\text{RSSI} < -80 \implies 14$ điểm (Yếu, cần đổi vị trí)
- 🛡️ **Độ tin cậy truyền tin (0–20 điểm):** $\max(0, 20 - \text{ErrorCount} \times 2)$

**Phân hạng:** `OPTIMAL` ($\ge 85$) | `GOOD` ($65-84$) | `ATTENTION` ($45-64$) | `CRITICAL` ($<45$).

---

## 📱 6. Giao Diện Di Động Flutter (5 Tabs)

1. **🏠 Tab 1 — Trang Chủ (Home):**
   - Header ngữ cảnh Căn hộ (`Căn hộ 1204 Sunwah Pearl`) & Vai trò thành viên (`Chủ Hộ`).
   - Đèn báo Live Sync WebSocket xanh lá đồng bộ tức thì.
   - Thẻ cảnh báo **Gợi Ý Bổ Sung Thông Minh** (Kèm nút *Đặt Ngay*, *Thêm Vào Danh Sách*, *Nhắc Lại Sau 3 Ngày*).
   - Thẻ **Cửa Sổ Hủy Đơn 60s** kèm thanh đếm ngược động (Progress Bar).
   - Tóm tắt chỉ số nhanh (Nút IoT, Món cần mua, Dự đoán).
2. **📈 Tab 2 — Dự Đoán & Tiêu Dùng (Insights):**
   - Bảng theo dõi chu kỳ từng sản phẩm: Nước khoáng 20L, Bình gas 12kg, Gạo ST25.
   - Thẻ giải thích thuật toán Gauss minh bạch, không mập mờ.
   - Nút 1-click đưa sản phẩm dự kiến hết vào danh sách mua sắm.
3. **🔘 Tab 3 — Nút Bấm IoT (Devices):**
   - Giám sát sức khỏe từng nút bấm (Điểm sức khỏe 96/100, Mức pin, RSSI).
   - **Behavior Designer Modal**: Lập trình hành vi 1 click, 2 click, giữ 3s, giữ 5s.
   - Nút bấm mô phỏng kiểm thử 4 cử chỉ trực tiếp từ app.
4. **📦 Tab 4 — Đơn Hàng (Orders):**
   - Lịch sử đơn hàng với Timeline trạng thái thời gian thực.
   - Gợi ý gộp đơn (Order Batching) để tiết kiệm cước vận chuyển.
5. **🏡 Tab 5 — Gia Đình & Dịch Vụ (Household):**
   - **Danh Sách Mua Sắm Chung**: Tự động nhận diện món hàng được bấm từ nút vật lý, nút bấm *Đặt Hàng Gộp Toàn Bộ Danh Sách*.
   - **Yêu Cầu Dịch Vụ Kỹ Thuật**: Quản lý lịch sửa chữa, kiểm tra rò rỉ van gas.
   - **Thành Viên Căn Hộ**: Phân quyền Chủ hộ (Owner), Quản trị (Admin), Thành viên (Member).

---

## 🚀 7. Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### 1. Khởi chạy Backend (NestJS)
```powershell
cd backend
npm install
npx prisma db push
npm run prisma:seed
npm run start:dev
```
*Backend chạy tại `http://localhost:5000` (LAN IP: `http://192.168.1.126:5000`).*

### 2. Khởi chạy Web Dashboard (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
*Web POS chạy tại `http://localhost:5173`.*

### 3. Khởi chạy Ứng Dụng Mobile (Flutter)
```powershell
cd mobile
flutter pub get
flutter run -d chrome # Hoặc thiết bị Android / iOS
```

---

## 🔒 8. Tài Khoản Kiểm Thử Mặc Định (Demo Accounts)

| Vai trò | Email / Username | Mật khẩu | Chức năng chính |
|---|---|---|---|
| **Chủ Căn Hộ (Owner)** | `customer@smartorder.local` | `Password123!` | Quản lý toàn quyền căn hộ 1204, lập trình nút, đặt hàng gộp |
| **Quản Trị Gia Đình (Admin)** | `thao.le@smartorder.local` | `Password123!` | Thêm bớt danh sách mua sắm, nhận cảnh báo khẩn cấp |
| **Thành Viên (Member)** | `tuananh@smartorder.local` | `Password123!` | Bấm nút thêm vào danh sách mua sắm |
| **Chủ Cửa Hàng (Store POS)** | `store@smartorder.local` | `Password123!` | Tiếp nhận đơn hàng, yêu cầu kỹ thuật & cảnh báo gas |
| **Kỹ Thuật Viên IoT** | `tech@smartorder.local` | `Password123!` | Cấu hình phần cứng, gán SKU, kiểm tra telemetry |
| **Super Admin** | `admin@smartorder.local` | `Password123!` | Quản trị toàn hệ thống, cấp phát kho nút bấm |

---

## 🏆 9. Trạng Thái Hoàn Thành

- ✅ **Thư mục mới độc lập**: `Button V2` (`c:\Users\ADMIN\OneDrive\Desktop\Button V2`).
- ✅ **Database Schema**: Toàn bộ quan hệ Household, Behavior, Consumption, Reminders, ShoppingList, ServiceRequest.
- ✅ **Clean Data Seed**: Tạo hộ gia đình mẫu `Căn hộ 1204 Sunwah Pearl`, lịch sử tiêu thụ La Vie 20L 5 chu kỳ, nhắc nhở thông minh.
- ✅ **NestJS Domain Modules**: `households`, `consumption`, `prediction`, `reminders`, `shopping-list`, `service-requests`.
- ✅ **Behavior Designer IoT Service**: Xử lý 4 hành vi cử chỉ vật lý, tính toán điểm sức khỏe thiết bị.
- ✅ **Flutter 5-Tab Architecture**: Home, Insights, Devices, Orders, Household không tacky glassmorphism.
- ✅ **Web POS & Simulator**: Đồng bộ 2 chiều qua Socket.io.
- ✅ **Tất cả các bản build biên dịch 0 lỗi** (NestJS TypeScript, Vite React, Flutter Analysis).
