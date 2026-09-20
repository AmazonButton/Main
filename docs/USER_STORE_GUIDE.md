# HƯỚNG DẪN VẬN HÀNH & KỊCH BẢN DEMO HỆ THỐNG
## SMART ORDER BUTTON PLATFORM

---

## 1. Danh Sách Tài Khoản Mẫu (Demo Credentials)

> Tất cả các tài khoản thử nghiệm bên dưới đều sử dụng chung mật khẩu: `Password123!`

| Vai Trò (Role) | Email Đăng Nhập | Chức Năng Chính |
|---|---|---|
| **Store Owner** | `store@smartorder.local` | Quản lý cửa hàng Gia Định, nhận đơn realtime, xem kho & thiết bị |
| **Store Staff** | `staff@smartorder.local` | Tiếp nhận đơn, cập nhật trạng thái chuẩn bị & xuất kho giao hàng |
| **Customer** | `customer@smartorder.local` | Khách hàng Nguyễn Văn An (Apt 1204 Sun Tower), sở hữu Nút Nước Lavie |
| **Super Admin** | `admin@smartorder.local` | Quản trị viên tối cao: Xét duyệt cửa hàng mới đăng ký, xem audit log |
| **Technician** | `tech@smartorder.local` | Kỹ sư IoT: Kiểm tra thông số telemetry, điện áp pin và RSSI |

---

## 2. Kịch Bản Thử Nghiệm Hoàn Chỉnh (End-to-End Demo Flow)

### Bước 1: Mở Bảng Điều Khiển Cửa Hàng (Store Dashboard)
1. Mở trình duyệt truy cập: `http://localhost:5173/login`
2. Nhấn nút nhanh **"Chủ Cửa Hàng"** (`store@smartorder.local`) $\to$ Đăng Nhập.
3. Chuyển vào menu **"Đơn Hàng Trực Tiếp"** (`/store/dashboard`).
4. Để mở cửa sổ này trên nửa màn hình bên phải.

### Bước 2: Mô Phỏng Nút Bấm Vật Lý (ESP32 Simulator Bridge)
1. Mở tab mới truy cập: `http://localhost:5173/simulator` (hoặc mở terminal chạy `cd simulator && npx tsx src/cli.ts`).
2. Màn hình mô phỏng hiển thị hình ảnh nút bấm 3D kèm đèn LED và thông số pin LiPo (94%).
3. **Nhấn vào nút tròn xanh "NHẤN NÚT (1)"**:
   - ESP32 phát tín hiệu thức dậy (RTC Wakeup).
   - Đèn LED chuyển **XANH DƯƠNG** (kết nối Wi-Fi) $\to$ **VÀNG** (ký HMAC-SHA256 và truyền dữ liệu).
   - Cloud xác thực thành công $\to$ Đèn LED chuyển **XANH LÁ** (Thành công!).
   - Hiệu ứng pháo hoa ăn mừng xuất hiện trên màn hình.
   - Đồng thời, ở cửa sổ **Store Dashboard**: **Chuông reo báo đơn mới vang lên**, banner thông báo xanh bật lên và đơn hàng mới xuất hiện tức thì ở trạng thái `CHỜ XÁC NHẬN` mà **không cần tải lại trang**!

### Bước 3: Thử Nghiệm Cửa Sổ Hủy Đơn (60-Second Cancel Window)
1. Đăng nhập tài khoản **"Khách Hàng"** (`customer@smartorder.local`) tại `http://localhost:5173/customer/home`.
2. Bấm vào nút **"ĐẶT NGAY BẰNG 1 CHẠM"**.
3. Một banner màu vàng đếm ngược 60 giây xuất hiện trên màn hình:
   - Nếu nhấn **"Hủy Đơn Ngay"** trong vòng 60 giây: Đơn hàng lập tức chuyển sang trạng thái `ĐÃ HỦY` và số lượng tồn kho dự trữ được hoàn lại kho ngay lập tức.
   - Nếu để hết 60 giây: Đơn hàng khóa hủy tự động và chuyển cho cửa hàng xử lý.

### Bước 4: Thử Nghiệm Luồng Xét Duyệt Cửa Hàng Mới (Approval Flow)
1. Vào `http://localhost:5173/register`, chọn tab **"Chủ Đại Lý / Cửa Hàng"**.
2. Điền thông tin đại lý mới $\to$ Nhấn "Gửi Đăng Ký".
3. Màn hình hiển thị: **"Hồ Sơ Đang Chờ Xét Duyệt (PENDING_APPROVAL)"**.
4. Đăng nhập bằng tài khoản Super Admin (`admin@smartorder.local`) tại `http://localhost:5173/admin/dashboard`.
5. Trong mục **"Đơn Đăng Ký Đại Lý Chờ Xét Duyệt"**, xem thông tin cửa hàng vừa đăng ký và nhấn **"Phê Duyệt Mở Bán"**.
6. Cửa hàng lập tức được kích hoạt sang trạng thái `ACTIVE`!
