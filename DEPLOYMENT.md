# 🚀 HƯỚNG DẪN DEPLOY TOÀN DIỆN & ĐẨY CODE LÊN GITHUB
## Hệ Thống Smart Order Button IoT Platform

---

## 📌 PHẦN 1: DỰ ÁN NÀY DEPLOY ĐƯỢC NHỮNG THÀNH PHẦN NÀO?

Hệ sinh thái Smart Order Button gồm **5 thành phần chính**, dưới đây là bảng phân tích khả năng deploy và nền tảng khuyến nghị:

| Thành phần | Khả năng Deploy | Nền tảng khuyến nghị | Chi phí | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| **1. Frontend Web** (`frontend/`) | ✅ **Deploy Cloud ngay** | **Vercel** / **Netlify** / Cloudflare Pages | **Miễn phí 100%** | SPA React + Vite. Đã có file `vercel.json` định tuyến không bị lỗi 404 khi F5. |
| **2. Backend API & WebSocket** (`backend/`) | ✅ **Deploy Cloud ngay** | **Render.com** / **Railway.app** / VPS Docker | **Miễn phí / Giá rẻ** | NestJS Core + Socket.IO realtime. Cần nền tảng hỗ trợ WebSocket liên tục. |
| **3. Database** (`backend/prisma/`) | ✅ **Deploy Cloud ngay** | **Neon.tech** / **Supabase** / Render Postgres | **Miễn phí 100%** | PostgreSQL Cloud chuẩn Production. Đã có schema `schema.postgresql.prisma`. |
| **4. Mobile App** (`mobile/`) | 📱 **Xuất bản APK** | **GitHub Releases** / Google Play Console | **Miễn phí** | Đã có script `build_apk.bat`. Đẩy file APK lên GitHub Releases để người dùng tải về cài đặt. |
| **5. Hardware Firmware** (`hardware/`) | ⚡ **Nạp Board Vật Lý** | Nạp qua cáp USB Type-C (PlatformIO / Arduino) | Phần cứng thực tế | Cấu hình Wi-Fi trực tiếp không cần code lại nhờ **Web Bluetooth Provisioner** tại `/quick-setup`. |

---

## 🌐 PHẦN 2: HƯỚNG DẪN DEPLOY CLOUD NHANH NHẤT (FREE 100%)

### Bước 1: Tạo Database PostgreSQL Miễn Phí (Neon.tech hoặc Supabase)
1. Đăng ký tài khoản tại [Neon.tech](https://neon.tech) hoặc [Supabase.com](https://supabase.com).
2. Tạo một dự án mới (Project name: `smart-order-db`).
3. Lấy chuỗi kết nối `DATABASE_URL` (dạng `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`).

### Bước 2: Deploy Backend lên Render.com (Hỗ trợ WebSocket Realtime)
1. Đăng nhập [Render.com](https://render.com) bằng GitHub.
2. Chọn **New +** ➔ **Web Service** ➔ Chọn repo GitHub `Capstone_Button_IOT`.
3. Cấu hình thông số:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npx prisma generate --schema=prisma/schema.postgresql.prisma && npm run build`
   - **Start Command**: `npm run start:prod`
4. Cài đặt các **Environment Variables** trong tab Environment:
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require
   JWT_SECRET=smart_button_prod_super_secret_jwt_key_2026_9948
   JWT_REFRESH_SECRET=smart_button_prod_refresh_secret_key_2026_8832
   DEVICE_DEFAULT_SECRET=smart_order_device_master_secret_2026
   CORS_ORIGIN=*
   ```
5. Bấm **Deploy Web Service**. Sau khi deploy xong, bạn sẽ có URL: `https://your-backend.onrender.com`.

### Bước 3: Deploy Frontend Web lên Vercel (Cực Nhanh & Miễn Phí)
1. Đăng nhập [Vercel.com](https://vercel.com) bằng GitHub.
2. Chọn **Add New...** ➔ **Project** ➔ Import repo `Capstone_Button_IOT`.
3. Cấu hình thông số:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Cài đặt biến môi trường trong **Environment Variables**:
   - `VITE_API_URL`: Điền URL Backend Render vừa tạo ở Bước 2 (ví dụ: `https://your-backend.onrender.com`).
5. Bấm **Deploy**. Sau 30 giây, website của bạn đã online toàn cầu với chứng chỉ SSL HTTPS miễn phí!

---

## 🐳 PHẦN 3: DEPLOY TRÊN MÁY CHỦ RIÊNG (VPS / DOCKER COMPOSE)

Nếu bạn có máy chủ Cloud VPS riêng (Ubuntu / Debian / CentOS):

1. Clone repo về máy chủ:
   ```bash
   git clone https://github.com/TanTai1904/Capstone_Button_IOT.git
   cd Capstone_Button_IOT
   ```
2. Khởi chạy toàn bộ hệ thống (PostgreSQL + NestJS API + Nginx Frontend):
   ```bash
   docker compose up --build -d
   ```
3. Xem trạng thái các container:
   ```bash
   docker compose ps
   ```

---

## 🚀 PHẦN 4: HƯỚNG DẪN ĐẨY CODE LÊN GITHUB AN TOÀN

Dự án đã được cấu hình `.gitignore` chuẩn để:
- Không bao giờ đẩy file APK nặng (>100MB làm lỗi GitHub).
- Không đẩy thư mục `node_modules/`, `dist/`, `.env` nhạy cảm và file database local `.db`.
- Đã gỡ bỏ toàn bộ phần simulation giả lập.

### Các lệnh đẩy lên GitHub:
```bash
git add .
git commit -m "feat: clean simulation, optimize for github and production deployment"
git push origin main
```
Sau khi push lên GitHub, Vercel và Render sẽ tự động bắt đầu quy trình CI/CD build và cập nhật phiên bản mới nhất hoàn toàn tự động!
