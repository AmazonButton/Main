# Smart Order Mobile - Ứng Dụng Flutter

Ứng dụng di động được xây dựng hoàn toàn bằng **Flutter**, kết nối trực tiếp với backend Smart Order Button để quản lý nút bấm IoT, đặt hàng 1-chạm, hủy đơn trong 60 giây và cấu hình mạng Wi-Fi cho ESP32.

---

## 🌟 Các Tính Năng Nổi Bật (Chuẩn UI/UX Pro Max)

1. **Đồng Bộ Tức Thì 2 Chiều (Realtime WebSocket)**:
   - Tích hợp **Socket.IO** lắng nghe trực tiếp từ Backend NestJS.
   - **Header Live Sync Indicator**: Hiển thị chấm xanh nhấp nháy xác nhận đang kết nối thời gian thực với Cloud và Nút ESP32.
   - **Banner Nhận Tín Hiệu Nút Bấm ESP32**: Hiển thị ngay khi nút vật lý được nhấn giữ.

2. **Cửa Sổ Hủy Đơn 60 Giây Siêu Đẹp**:
   - Thiết kế Gradient Cam Đỏ (`Color(0xFFD97706)` → `Color(0xFFDC2626)`).
   - **Animated Linear Progress Bar** co dần từ 60s về 0s theo thời gian thực.
   - Nút **HỦY ĐƠN** to rõ, dễ thao tác kèm hướng dẫn "BẤM ĐÚP ĐỂ HỦY".

3. **Quản Lý Nút Bấm & Đặt Hàng 1 Chạm (Home Screen)**:
   - Thẻ thiết bị phong cách Glassmorphism / Neumorphic mềm mại.
   - Hiển thị mức pin LiPo (%), cường độ sóng Wi-Fi (dBm), đèn LED trạng thái (ONLINE/OFFLINE).
   - Nút to nổi bật: **👉 ĐẶT NGAY BẰNG 1 CHẠM**.
   - Hỗ trợ đổi Wi-Fi nhanh bằng mã PIN 6 chữ số và chuyển nhượng quyền sở hữu nút.

4. **Đăng Nhập Khách Hàng Siêu Tiện Lợi**:
   - Tự động đăng nhập vào tài khoản mẫu Nguyễn Văn An (`customer@smartorder.local` / `Password123!`).
   - Tích hợp hộp thoại đổi địa chỉ máy chủ (Localhost, Android Emulator `10.0.2.2`, hoặc IP LAN Wi-Fi `192.168.1.126:5000`).

5. **Wizard 5 Bước Ghép Nối Nút Bấm (Quét QR)**:
   - **Bước 1**: Nhập mã PIN 6 số (mẫu `882910`) hoặc quét mã QR tem nút bấm.
   - **Bước 2**: Nhận diện thiết bị (thông tin sản phẩm, đơn giá, đại lý).
   - **Bước 3**: Quét và chọn sóng Wi-Fi 2.4GHz gia đình + nhập mật khẩu Wi-Fi.
   - **Bước 4**: Tiến trình kết nối tự động (BLE Handshake -> Nạp Wi-Fi vào ESP32 -> ESP32 vào mạng -> Cloud Bootstrap).
   - **Bước 5**: Kích hoạt nút ngay lập tức.

---

## 🚀 Cách Chạy Ứng Dụng

### Cách 1: Click đúp vào file `run_mobile.bat` (Thư mục gốc)
File script sẽ tự động kiểm tra dependencies và cho phép bạn chọn chạy trên Web Chrome, Android hay Windows Desktop.

### Cách 2: Chạy lệnh từ Terminal
```bash
cd mobile

# Cài đặt thư viện
flutter pub get

# Chạy trên trình duyệt Chrome (Nhẹ nhất, mở 2 cửa sổ test đồng bộ cùng Web):
flutter run -d chrome

# Hoặc chạy trên điện thoại thật / máy ảo Android:
flutter run -d android

# Hoặc chạy ứng dụng Windows Desktop:
flutter run -d windows
```

---

## 📱 Cấu Hình IP Kết Nối Backend
- Khi chạy trên **Chrome Web** hoặc **Windows Desktop**: Ứng dụng tự động kết nối tới `http://localhost:5000/api`.
- Khi chạy trên **Máy ảo Android (Emulator)**: Ứng dụng tự động dùng `http://10.0.2.2:5000/api`.
- Khi chạy trên **Điện thoại Android/iPhone thật**:
  - Mở app -> Bấm biểu tượng bánh răng **⚙ Cài đặt Server IP** góc trên bên phải.
  - Nhập địa chỉ IP Wi-Fi của máy tính: **`http://192.168.1.126:5000`** -> Bấm **Lưu & Kết Nối Lại**.
