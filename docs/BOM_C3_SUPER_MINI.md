# 📋 DANH SÁCH LINH KIỆN & SƠ ĐỒ LẮP RÁP — ESP32-C3 SUPER MINI
> *Smart Order Button (Amazon Dash Button Clone) — Thiết kế phần cứng v4.2*

---

## 🛒 1. Bảng Linh Kiện Chi Tiết (BOM - Bill of Materials)

| STT | Tên Linh Kiện | Thông Số / Chủng Loại | Số Lượng | Từ Khóa Tìm Trên Shopee | Giá Ước Tính | Mục Đích Sử Dụng |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **1** | **ESP32-C3 Super Mini** | Vi điều khiển RISC-V, Wi-Fi 2.4GHz + BLE 5, có cổng Type-C | 1 cái | `"ESP32 C3 Super Mini"` | ~35.000đ – 45.000đ | Xử lý logic, ký HMAC-SHA256, gửi HTTP, Deep Sleep |
| **2** | **Mạch sạc pin TP4056 Type-C** | Có mạch bảo vệ (chip DW01A + FS8205A) | 1 cái | `"TP4056 Type C có bảo vệ"` | ~6.000đ – 10.000đ | Sạc pin Li-Po an toàn, chống quá sạc / xả cạn |
| **3** | **Pin Li-Po 3.7V** | Dung lượng **2000mAh** (hoặc 500-1000mAh nếu muốn siêu mỏng) | 1 cục | `"pin lipo 3.7v 2000mah"` hoặc `"lipo 3.7v 1000mah"` | ~25.000đ – 40.000đ | Nguồn nuôi toàn bộ mạch, thời lượng 12-18 tháng |
| **4** | **Nút nhấn 12mm** | Nút nhấn nhả tactile 4 chân (12x12x7.3mm) có nắp tròn | 2-5 cái | `"nút nhấn 12mm tactile"` | ~2.000đ – 5.000đ / gói | Bấm 1 lần (Wakeup), bấm đúp (Order/Cancel), giữ 5s (Wi-Fi) |
| **5** | **LED RGB 5mm** | Loại **Common Cathode** (Chân âm chung) | 2-5 cái | `"LED RGB 5mm common cathode"` | ~3.000đ – 6.000đ / gói | Báo hiệu 3 pha trạng thái (Đỏ, Xanh Lá, Xanh Dương) |
| **6** | **Còi Buzzer thụ động (Passive)**| 5V / 3.3V Passive Buzzer (phát nhạc đa âm PWM) | 1 cái | `"buzzer passive 5v"` (hoặc còi chíp thụ động) | ~3.000đ – 5.000đ | Âm thanh bíp xác nhận đơn hàng, cảnh báo lỗi |
| **7** | **Điện trở hạn dòng 220Ω** | 220 Ohm (1/4W) | 1 gói (10-20 con)| `"điện trở 220 ohm"` | ~1.000đ – 2.000đ | Nối nối tiếp với 3 chân màu của LED RGB chống cháy LED |
| **8** | **Điện trở phân áp 100kΩ** | 100k Ohm (chính xác 1%) | 1 gói (10 con) | `"điện trở 100k ohm"` | ~1.000đ – 2.000đ | Cầu chia đôi điện áp pin (4.2V -> 2.1V) đo mức pin ADC |
| **9** | **Breadboard 830 / 400 lỗ** | Bo mạch cắm thử nghiệm không cần hàn | 1 cái | `"breadboard 400 lỗ"` hoặc 830 lỗ | ~12.000đ – 20.000đ | Cắm linh kiện test trước khi hàn cố định |
| **10**| **Dây cắm Jumper Đực - Đực** | Dây nối dài 10cm - 20cm (bó 40 sợi) | 1 tép | `"dây jumper đực đực breadboard"` | ~8.000đ – 15.000đ | Đấu nối linh kiện trên breadboard |
| **11**| **Cáp sạc USB Type-C** | Cáp truyền dữ liệu + cấp nguồn | 1 sợi | Sẵn có ở nhà (cáp điện thoại) | 0đ | Nạp code firmware vào ESP32 và sạc pin |

> 💰 **Tổng chi phí ước tính:** ~**95.000đ – 140.000đ** (chưa tới một bữa ăn lẩu, cực kỳ tiết kiệm!)

---

## 📌 2. Sơ Đồ Đấu Nối Chân (ESP32-C3 Super Mini Pinout)

ESP32-C3 Super Mini chỉ có các chân `GPIO 0` đến `GPIO 10`. Sơ đồ nối dây tối ưu tránh xung đột Bootloader:

```text
               ┌───────────────────────────┐
               │    ESP32-C3 SUPER MINI    │
               │                           │
  [GPIO 9] ────┤ GPIO 9             5V / IN ├───◄ TP4056 [OUT+] (Nguồn pin 3.7V - 4.2V)
               │                       GND ├───► TP4056 [OUT-] & GND toàn mạch
  [GPIO 0] ────┤ GPIO 0 (Trở 220Ω ➔ LED Đỏ)│
  [GPIO 1] ────┤ GPIO 1 (Trở 220Ω ➔ LED Xanh Lá)
  [GPIO 2] ────┤ GPIO 2 (Trở 220Ω ➔ LED Xanh Dương)
  [GPIO 3] ────┤ GPIO 3 (Dự phòng / Wakeup)│
  [GPIO 4] ────┤ GPIO 4 (ADC đo Pin)       │
  [GPIO 5] ────┤ GPIO 5 (Buzzer PWM)       │
               └───────────────────────────┘
```

### Chi tiết các đường dây:
1. **Nút nhấn 12mm**:
   - Chân A nối vào **GPIO 9** (có thể dùng GPIO 9 làm nút Boot sẵn hoặc kéo chân ngoài).
   - Chân B nối vào **GND**.
   *(Firmware bật `INPUT_PULLUP`, khi bấm nút thì chân tụt về mức LOW).*

2. **Đèn LED RGB 5mm (Common Cathode)**:
   - Chân dài nhất (Cathode chung): Nối thẳng vào **GND**.
   - Chân Đỏ (Red): Nối tiếp qua trở **220Ω** $\to$ cắm vào **GPIO 0**.
   - Chân Xanh Lá (Green): Nối tiếp qua trở **220Ω** $\to$ cắm vào **GPIO 1**.
   - Chân Xanh Dương (Blue): Nối tiếp qua trở **220Ω** $\to$ cắm vào **GPIO 2**.

3. **Còi Buzzer thụ động (Passive)**:
   - Chân dương (+): Cắm vào **GPIO 5**.
   - Chân âm (-): Cắm vào **GND**.

4. **Cầu chia áp đo dung lượng Pin (Battery ADC)**:
   - Nối `VBAT (OUT+ TP4056)` $\to$ Trở **100kΩ** $\to$ Điểm giữa (nối vào **GPIO 4**) $\to$ Trở **100kΩ** $\to$ **GND**.

5. **Nguồn Pin & Sạc (TP4056 Module)**:
   - Pin Li-Po dây Đỏ $\to$ chân **B+** của TP4056.
   - Pin Li-Po dây Đen $\to$ chân **B-** của TP4056.
   - Chân **OUT+** của TP4056 $\to$ Chân **5V** (hoặc VBUS) của ESP32-C3.
   - Chân **OUT-** của TP4056 $\to$ Chân **GND** của ESP32-C3.

---

## ⚡ 3. Check-list Khi Hàng Về Đến Nơi
- [ ] Cắm ESP32-C3 vào máy tính qua cáp Type-C kiểm tra đèn đỏ sáng và nhận cổng COM.
- [ ] Cắm các linh kiện lên Breadboard theo sơ đồ trên (chưa cần hàn chì).
- [ ] Sạc đầy pin Li-Po qua module TP4056 đến khi đèn đổi từ Đỏ $\to$ Xanh Dương/Xanh Lá.
- [ ] Mở dự án và nạp firmware cập nhật chân C3.
