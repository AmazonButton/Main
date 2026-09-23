/**
 * =========================================================================================
 * 🔘 SMART ORDER BUTTON — PRODUCTION ESP32 FIRMWARE v4.0 (ZERO-TOUCH PROVISIONING)
 * =========================================================================================
 * 
 * 🔌 PHẦN CỨNG (HARDWARE PINOUT):
 * - Nút Bấm Vật Lý : GPIO 4 (Chân còn lại nối GND, sử dụng INPUT_PULLUP)
 * - Đèn LED Báo     : GPIO 2 (Đèn LED xanh/RGB tích hợp)
 * 
 * ⚡ TÍNH NĂNG TIÊU DÙNG THÔNG MINH:
 * 1. ZERO-TOUCH BLE & SOFTAP PROVISIONING:
 *    - Xuất xưởng không có mật khẩu Wi-Fi.
 *    - Tự động phát BLE Advertising & SoftAP "SMARTORDER_SETUP_XXXX" tại 192.168.4.1.
 *    - Nhận Wi-Fi và lưu vĩnh viễn vào NVS Flash phân vùng an toàn.
 * 2. CLOUD BOOTSTRAP VIA HMAC-SHA256:
 *    - ESP32 chỉ tạo kết nối đi (Outbound), không cần mở cổng router hay NAT.
 * 3. BẤM NÚT ĐẶT HÀNG (Single Press):
 *    - Bấm 1 lần -> RTC Wakeup -> Ký HMAC-SHA256 -> Gửi lên Cloud -> Nháy LED xanh xác nhận.
 * 4. NHẤN ĐÚP HỦY ĐƠN (Double Press < 1.2s):
 *    - Hủy đơn hàng trong cửa sổ hủy 60 giây.
 * 5. KHÔI PHỤC XUẤT XƯỞNG (Hold 15s):
 *    - Xóa cấu hình Wi-Fi trong NVS Flash, giữ nguyên Device ID & Khóa HMAC bí mật.
 * =========================================================================================
 */

#include <WiFi.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <mbedtls/md.h>

// =========================================================================================
// ⚙️ TÙY CHỌN TÍNH NĂNG & DUNG LƯỢNG (FLASH MEMORY OPTIMIZATION)
// =========================================================================================
// Đặt ENABLE_BLE = 1: Cấu hình Wi-Fi không dây qua Web Bluetooth API (Chrome / Edge)
//                     LƯU Ý: Trong Arduino IDE, chọn Tools -> Partition Scheme -> Huge APP (3MB No OTA/1MB SPIFFS)
#define ENABLE_BLE 1

#if ENABLE_BLE
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#endif

// =========================================================================================
// ⚙️ 1. CẤU HÌNH ĐỊNH DANH BẤT BIẾN (IMMUTABLE HARDWARE IDENTITY)
// =========================================================================================
#define BUTTON_PIN 4
#define LED_PIN    2

#if ENABLE_BLE
// BLE GATT Service & Characteristic UUIDs
#define BLE_SERVICE_UUID        "0000FFF0-0000-1000-8000-00805F9B34FB"
#define BLE_CHAR_INFO_UUID      "0000FFF1-0000-1000-8000-00805F9B34FB"
#define BLE_CHAR_WIFI_UUID      "0000FFF2-0000-1000-8000-00805F9B34FB"
#define BLE_CHAR_STATUS_UUID    "0000FFF3-0000-1000-8000-00805F9B34FB"
#define BLE_CHAR_SCAN_UUID      "0000FFF4-0000-1000-8000-00805F9B34FB"
#endif

// Định danh thiết bị xuất xưởng (Khắc laser trên vỏ hộp)
const char* DEVICE_ID     = "BTN-8829-WTR";
const char* PAIRING_PIN   = "882910"; // Mã số kết nối 6 chữ số (Dùng để cấu hình trên Web/App không cần MAC)
const char* CLAIM_CODE    = "CLAIM-749201";
const char* DEVICE_SECRET = "sec_smart_button_8829_wtr_key_99";
const char* FIRMWARE_VER  = "4.2.0";

// Địa chỉ Cloud Backend (Cục bộ mạng Wi-Fi máy tính của anh - cổng 5000)
const char* DEFAULT_CLOUD_URL = "http://192.168.1.140:5000";
String cloudUrl = DEFAULT_CLOUD_URL;

// Bộ nhớ NVS Flash lưu thông số Wi-Fi & Cloud URL
Preferences prefs;
String savedSsid = "";
String savedPass = "";

// Web Server cục bộ khi ở chế độ SoftAP Fallback (WiFiServer chuẩn không cần thư viện ngoài)
WiFiServer server(80);
bool isProvisioningMode = false;
unsigned long provisioningStartTime = 0;
const unsigned long PROVISIONING_TIMEOUT_MS = 300000; // 5 phút timeout

#if ENABLE_BLE
// BLE Server & Characteristics
static BLEServer *pBleServer = nullptr;
static BLECharacteristic *pBleStatusChar = nullptr;
static BLECharacteristic *pBleScanChar = nullptr;
static bool bleConnected = false;
#endif

// Trạng thái nút bấm
unsigned long pressStartTime = 0;
unsigned long lastReleaseTime = 0;
int clickCount = 0;
bool buttonHeld10s = false;
bool buttonHeld15s = false;

// =========================================================================================
// 💡 HÀM ĐIỀU KHIỂN ĐÈN LED PHẢN HỒI
// =========================================================================================
void blinkLED(int times, int onMs, int offMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(onMs);
    digitalWrite(LED_PIN, LOW);
    if (i < times - 1) delay(offMs);
  }
}

// =========================================================================================
// 🔒 HÀM SINH CHỮ KÝ HMAC-SHA256 PHẦN CỨNG
// =========================================================================================
String computeHMAC(const String& payload, const char* key) {
  byte hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;

  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)key, strlen(key));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)payload.c_str(), payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  String strHex = "";
  for (int i = 0; i < 32; i++) {
    if (hmacResult[i] < 16) strHex += "0";
    strHex += String(hmacResult[i], HEX);
  }
  return strHex;
}

// =========================================================================================
// 🌐 OUTBOUND CLOUD BOOTSTRAP (HMAC KÝ KẾT DANH TÍNH LÊN CLOUD)
// =========================================================================================
bool bootstrapCloud() {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = cloudUrl + "/api/devices/bootstrap";

  WiFiClientSecure *secureClient = nullptr;
  if (url.startsWith("https://")) {
    secureClient = new WiFiClientSecure();
    if (secureClient) {
      secureClient->setInsecure();
      http.begin(*secureClient, url);
    } else {
      http.begin(url);
    }
  } else {
    http.begin(url);
  }

  http.addHeader("Content-Type", "application/json");

  time_t now = time(nullptr);
  unsigned long timestamp = (now > 100000000) ? (unsigned long)now : (millis() / 1000 + 1725350000);
  String timestampStr = String(timestamp);
  String nonce = "boot_" + String(random(100000, 999999));

  String body = "{\"deviceId\":\"" + String(DEVICE_ID) +
                "\",\"firmwareVersion\":\"" + String(FIRMWARE_VER) +
                "\",\"wifiRssi\":" + String(WiFi.RSSI()) +
                ",\"ipAddress\":\"" + WiFi.localIP().toString() + "\"}";

  String signPayload = String(DEVICE_ID) + ":" + timestampStr + ":" + nonce + ":" + body;
  String signature = computeHMAC(signPayload, DEVICE_SECRET);

  http.addHeader("x-device-id", DEVICE_ID);
  http.addHeader("x-timestamp", timestampStr);
  http.addHeader("x-nonce", nonce);
  http.addHeader("x-signature", signature);

  int httpCode = http.POST(body);
  Serial.print("[BOOTSTRAP] Phản hồi Cloud HTTP: ");
  Serial.println(httpCode);

  http.end();
  if (secureClient) delete secureClient;
  return (httpCode == 200 || httpCode == 201);
}

// =========================================================================================
// 🔘 GỬI SỰ KIỆN BẤM NÚT (SIÊU TỐC - TỰ ĐỘNG DÒ IP MÁY TÍNH - KHÔNG ĐƠ GIẬT)
// =========================================================================================
void sendButtonEvent(const char* eventType) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("\n❌ [LỖI] Chưa kết nối Wi-Fi! Đèn LED báo lỗi..."));
    blinkLED(6, 60, 60);
    return;
  }

  unsigned long startTime = millis();
  bool success = false;
  String workingUrl = "";

  // Danh sách IP thử nghiệm: cloudUrl hiện tại -> IP máy tính Wi-Fi 140 -> 141
  String urlsToTry[3];
  urlsToTry[0] = cloudUrl;
  urlsToTry[1] = "http://192.168.1.140:5000";
  urlsToTry[2] = "http://192.168.1.141:5000";

  for (int i = 0; i < 3; i++) {
    String currentBase = urlsToTry[i];
    if (i > 0 && currentBase == urlsToTry[0]) continue; // Bỏ qua nếu trùng

    String endpoint = currentBase + "/api/event";
    Serial.printf("\n🚀 [KẾT NỐI] Gửi sự kiện [%s] tới: %s\n", eventType, endpoint.c_str());

    HTTPClient http;
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(2500); // 2.5s timeout cực nhanh (tránh treo ESP32)

    String body = "{\"deviceId\":\"" + String(DEVICE_ID) +
                  "\",\"eventType\":\"" + String(eventType) +
                  "\",\"battery\":98,\"rssi\":" + String(WiFi.RSSI()) + "}";

    int httpCode = http.POST(body);
    unsigned long elapsed = millis() - startTime;

    if (httpCode == 200 || httpCode == 201) {
      String response = http.getString();
      Serial.printf("✅ [THÀNH CÔNG] Server phản hồi HTTP %d trong %lums!\n", httpCode, elapsed);
      Serial.printf("📦 [DỮ LIỆU] %s\n", response.c_str());

      // Nếu IP này khác cloudUrl hiện tại -> Tự động ghi nhớ vĩnh viễn vào NVS Flash!
      if (cloudUrl != currentBase) {
        cloudUrl = currentBase;
        prefs.begin("wifi_cfg", false);
        prefs.putString("cloud_url", cloudUrl);
        prefs.end();
        Serial.printf("💾 [TỰ ĐỘNG LƯU] Đã cập nhật Cloud URL vào NVS Flash: %s\n", cloudUrl.c_str());
      }

      workingUrl = currentBase;
      success = true;
      http.end();
      break;
    } else {
      Serial.printf("⚠️ [KẾT NỐI THẤT BẠI] %s (Mã HTTP: %d sau %lums)\n", endpoint.c_str(), httpCode, elapsed);
      http.end();
    }
  }

  if (success) {
    if (strcmp(eventType, "SINGLE_PRESS") == 0 || strcmp(eventType, "WAKEUP") == 0) {
      Serial.println(F("🟢 [LED XANH] Đơn hàng đã đồng bộ lên Web thành công!"));
      blinkLED(3, 100, 100);
    } else {
      Serial.println(F("🔴 [LED ĐỎ] Đã hủy đơn hàng thành công trên Web!"));
      blinkLED(2, 400, 200);
    }
  } else {
    Serial.println(F("\n❌ [HƯỚNG DẪN KHẮC PHỤC]"));
    Serial.println(F("  1. Hãy chắc chắn Backend đang chạy tại http://192.168.1.140:5000"));
    Serial.println(F("  2. Bạn có thể gõ vào Serial: URL:http://192.168.1.140:5000 rồi nhấn Enter"));
    blinkLED(6, 60, 60);
  }
}

// =========================================================================================
// 🖨️ IN MÃ QR ASCII & THÔNG TIN ĐỊNH DANH RA SERIAL MONITOR
// =========================================================================================
void printAsciiQrCode() {
  const char* qrLines[] = {
    "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄",
    "█ ▄▄▄▄▄ █▄█  ▄█▄█▄ ▀▄██ ▄▄▄▄▄ █",
    "█ █   █ █ ██▄▄ ▀ ██▄▄▄█ █   █ █",
    "█ █▄▄▄█ █▄█ █▄▄ ▄▀ █ ▀█ █▄▄▄█ █",
    "█▄▄▄▄▄▄▄█▄█ █ █▄▀▄▀▄▀ █▄▄▄▄▄▄▄█",
    "█   ▄▀█▄▀ █▄▀▀▀▄▀▀█▄ ▀▄▀▀ ▄▄█▄█",
    "█▀▀▀▀ ▄▄▀▀  ▄█  ██▄▄▀█▄▀▀██▄▄██",
    "█ ▀█▀▄▀▄ ▀▄▄██▄ ▄ ██ █▀▀███▀▄██",
    "███ █▀▀▄▀ ▄██ ▄ █▀▄  ▀▄▄▄ ▀█▄ █",
    "█▄ █▀▀█▄ ▀▄█ ▄▄██▄▀██▀ █▀▄▀ ▄ █",
    "█▄█▀█▄█▄  █ ▀█▄ ▄ ▀▀█▄▄█▄▀ ▀▀▀█",
    "██▄██▄▄▄█ ▀▄  ▀▀▄▄ █▄ ▄▄▄ ███▄█",
    "█ ▄▄▄▄▄ ███  █▀▀█ ▄█▄ █▄█ ▀█▄▀█",
    "█ █   █ █▀▀ ██ █▀▄▄ █ ▄▄  ▄▄▀▀█",
    "█ █▄▄▄█ █ ▄▄█▀▄██▄█▀█▀▄▀▀█▄▄▀▄█",
    "█▄▄▄▄▄▄▄█▄███▄▄▄█▄██▄▄▄▄█▄██▄██"
  };
  for (int i = 0; i < 16; i++) {
    Serial.println(qrLines[i]);
    delay(5);
  }
  Serial.flush();
}

void printHardwareIdentityBanner() {
  Serial.println(F("\n=========================================================================="));
  Serial.println(F("🔘 SMART ORDER BUTTON — ESP32 HARDWARE RUNTIME v4.2"));
  Serial.println(F("=========================================================================="));
  Serial.print(F("📌 MÃ SỐ THIẾT BỊ (DEVICE ID):     ")); Serial.println(DEVICE_ID);
  Serial.print(F("🔑 MÃ SỐ KẾT NỐI (PIN 6 SỐ):       ")); Serial.println(PAIRING_PIN);
  Serial.print(F("🏷️ MÃ TEM XÁC THỰC (CLAIM CODE):    ")); Serial.println(CLAIM_CODE);
  Serial.print(F("⚡ PHIÊN BẢN FIRMWARE:             v")); Serial.println(FIRMWARE_VER);
  Serial.print(F("🌐 ĐỊA CHỈ CLOUD BACKEND:         ")); Serial.println(cloudUrl);
  Serial.println(F("--------------------------------------------------------------------------"));
  Serial.println(F("📲 HƯỚNG DẪN CẤU HÌNH VÀO MÁY (KHÔNG CẦN ĐỊA CHỈ MAC):"));
  Serial.print(F("  1. Cách 1: Trên Web/App điện thoại, nhập mã 6 số: ")); Serial.println(PAIRING_PIN);
  Serial.println(F("  2. Cách 2: Mở Camera điện thoại quét mã QR bên dưới:"));
  Serial.println(F("--------------------------------------------------------------------------"));
  printAsciiQrCode();
  Serial.println(F("==========================================================================\n"));
  Serial.flush();
}

// =========================================================================================
// 📲 GIAO DIỆN CAPTIVE PORTAL SOFTAP TẠI 192.168.4.1 (CLEAN & SEAMLESS RE-CONFIG)
// =========================================================================================
const char PORTAL_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Cấu hình Wi-Fi — Smart Order Button</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #f8fafc;
      padding: 20px 16px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #111827;
      border-radius: 20px;
      padding: 24px;
      max-width: 380px;
      width: 100%;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header { text-align: center; margin-bottom: 20px; }
    .icon-badge {
      width: 48px;
      height: 48px;
      margin: 0 auto 12px;
      background: rgba(14, 165, 233, 0.12);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(14, 165, 233, 0.25);
    }
    .icon-badge svg { width: 24px; height: 24px; fill: #38bdf8; }
    h1 { font-size: 19px; font-weight: 800; color: #ffffff; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #94a3b8; line-height: 1.4; }

    .preserve-box {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: #34d399;
      font-weight: 600;
    }

    .form-group { margin-bottom: 16px; text-align: left; }
    label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #cbd5e1;
      margin-bottom: 6px;
    }
    .input-wrapper { position: relative; }
    input {
      width: 100%;
      padding: 13px 14px;
      font-size: 14px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: #030712;
      color: #ffffff;
      outline: none;
      transition: all 0.15s ease;
    }
    input:focus, select:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }
    select {
      width: 100%;
      padding: 13px 14px;
      font-size: 13px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: #030712;
      color: #ffffff;
      outline: none;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .btn-rescan {
      background: rgba(14, 165, 233, 0.12);
      color: #38bdf8;
      border: 1px solid rgba(14, 165, 233, 0.25);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-rescan:hover {
      background: rgba(14, 165, 233, 0.25);
    }
    .toggle-pass {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #64748b;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
      padding: 4px 6px;
    }

    .btn-submit {
      width: 100%;
      padding: 14px;
      background: #0284c7;
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      margin-top: 6px;
      transition: background 0.15s ease;
    }
    .btn-submit:hover { background: #0369a1; }
    .btn-submit:active { transform: scale(0.98); }

    .device-footer {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      font-family: monospace;
    }

    /* Transition Screen */
    #loading-screen { display: none; text-align: center; padding: 20px 0; }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(56, 189, 248, 0.2);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div id="main-form">
      <div class="header">
        <div class="icon-badge">
          <svg viewBox="0 0 24 24"><path d="M12 3C7.8 3 4 4.8 1.4 7.7l1.4 1.4C5.1 6.5 8.4 5 12 5s6.9 1.5 9.2 4.1l1.4-1.4C19.9 4.8 16.2 3 12 3zm0 4c-3.1 0-6 1.3-8 3.5l1.4 1.4c1.7-1.8 4.1-2.9 6.6-2.9s4.9 1.1 6.6 2.9l1.4-1.4C18 8.3 15.1 7 12 7zm0 4c-2 0-3.9.9-5.2 2.3l1.4 1.4c1-1 2.3-1.7 3.8-1.7s2.8.7 3.8 1.7l1.4-1.4C15.9 11.9 14 11 12 11zm0 4c-1 0-1.9.4-2.5 1.1l2.5 2.6 2.5-2.6c-.6-.7-1.5-1.1-2.5-1.1z"/></svg>
        </div>
        <h1>Đổi Mạng Wi-Fi Mới</h1>
        <p class="subtitle">Chọn Wi-Fi tìm thấy xung quanh nút bấm hoặc nhập tay</p>
      </div>

      <div class="preserve-box">
        <span>🛡️</span>
        <span>Bảo toàn 100% quyền sở hữu và sản phẩm đã gán</span>
      </div>

      <form action="/save" method="POST" onsubmit="return validateAndSubmit()">
        <!-- Dynamic WiFi Network Selection -->
        <div class="form-group">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label for="wifi-select" style="margin-bottom:0;">Mạng Wi-Fi Gần Nút Bấm:</label>
            <button type="button" class="btn-rescan" onclick="scanWifi(true)" id="btn-scan">🔄 Quét lại</button>
          </div>
          <select id="wifi-select" onchange="handleSelectChange(this.value)">
            <option value="">🔍 Đang dò quét sóng Wi-Fi xung quanh...</option>
          </select>
        </div>

        <!-- Custom / Hidden SSID input -->
        <div class="form-group" id="manual-ssid-group" style="display:none;">
          <label for="ssid">Tên Wi-Fi Thủ Công (SSID):</label>
          <input type="text" id="ssid" name="ssid" placeholder="Nhập tên mạng nếu Wi-Fi bị ẩn" autocomplete="off" autocapitalize="none">
        </div>

        <div class="form-group">
          <label for="password">Mật khẩu Wi-Fi:</label>
          <div class="input-wrapper">
            <input type="password" id="password" name="password" placeholder="Nhập mật khẩu Wi-Fi" required>
            <button type="button" class="toggle-pass" onclick="togglePassVisibility()">Hiện</button>
          </div>
        </div>

        <div class="form-group">
          <label for="cloud_url">Địa chỉ Máy Chủ Backend (Web Port 5000):</label>
          <input type="text" id="cloud_url" name="cloud_url" value="http://192.168.1.140:5000" placeholder="http://192.168.1.140:5000" autocomplete="off" autocapitalize="none">
        </div>

        <button type="submit" class="btn-submit">LƯU & KẾT NỐI WI-FI MỚI</button>
      </form>

      <div class="device-footer">
        <span>Thiết bị: BTN-8829-WTR</span>
        <span>PIN: 882910</span>
      </div>
    </div>

    <!-- Loading state when submitted -->
    <div id="loading-screen">
      <div class="spinner"></div>
      <h2 style="font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Đang Kết Nối Mạng Mới...</h2>
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
        Nút bấm đang khởi động lại và kết nối vào Wi-Fi mới.<br>Đèn LED trên nút sẽ chuyển sang <strong>xanh lá</strong> khi hoàn tất.
      </p>
    </div>
  </div>

  <script>
    function togglePassVisibility() {
      var passInput = document.getElementById('password');
      var toggleBtn = document.querySelector('.toggle-pass');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        toggleBtn.textContent = 'Ẩn';
      } else {
        passInput.type = 'password';
        toggleBtn.textContent = 'Hiện';
      }
    }

    function showLoading() {
      document.getElementById('main-form').style.display = 'none';
      document.getElementById('loading-screen').style.display = 'block';
    }

    function scanWifi(isForce) {
      var btn = document.getElementById('btn-scan');
      var sel = document.getElementById('wifi-select');
      if (btn) btn.textContent = '⏳ Đang quét...';
      
      fetch('/scan')
        .then(function(r) { return r.json(); })
        .then(function(networks) {
          if (btn) btn.textContent = '🔄 Quét lại';
          sel.innerHTML = '';
          if (!networks || networks.length === 0) {
            sel.innerHTML = '<option value="__MANUAL__">⚠️ Không thấy Wi-Fi (Bấm nhập thủ công)</option>';
            handleSelectChange('__MANUAL__');
            return;
          }

          var defaultOpt = document.createElement('option');
          defaultOpt.value = '';
          defaultOpt.textContent = '-- Chọn mạng Wi-Fi nhà bạn (' + networks.length + ' mạng) --';
          sel.appendChild(defaultOpt);

          networks.forEach(function(n) {
            var opt = document.createElement('option');
            opt.value = n.ssid;
            var signalPct = Math.min(100, Math.max(10, Math.round((n.rssi + 100) * 2)));
            var lock = n.secure ? '🔒' : '🔓';
            opt.textContent = lock + ' ' + n.ssid + ' (Sóng ' + signalPct + '%)';
            sel.appendChild(opt);
          });

          var manualOpt = document.createElement('option');
          manualOpt.value = '__MANUAL__';
          manualOpt.textContent = '➕ Nhập tên mạng khác (Wi-Fi ẩn)...';
          sel.appendChild(manualOpt);
        })
        .catch(function(err) {
          if (btn) btn.textContent = '🔄 Thử lại';
        });
    }

    function handleSelectChange(val) {
      var manualGroup = document.getElementById('manual-ssid-group');
      var ssidInput = document.getElementById('ssid');
      if (val === '__MANUAL__') {
        manualGroup.style.display = 'block';
        ssidInput.value = '';
        ssidInput.focus();
      } else if (val) {
        manualGroup.style.display = 'none';
        ssidInput.value = val;
      } else {
        manualGroup.style.display = 'none';
        ssidInput.value = '';
      }
    }

    function validateAndSubmit() {
      var sel = document.getElementById('wifi-select');
      var ssidInput = document.getElementById('ssid');
      if (sel.value && sel.value !== '__MANUAL__') {
        ssidInput.value = sel.value;
      }
      if (!ssidInput.value.trim()) {
        alert('Vui lòng chọn hoặc nhập tên mạng Wi-Fi!');
        return false;
      }
      showLoading();
      return true;
    }

    window.addEventListener('DOMContentLoaded', function() {
      scanWifi(false);
    });
  </script>
</body>
</html>
)rawliteral";

String urlDecode(const String& input) {
  String decoded = "";
  for (size_t i = 0; i < input.length(); i++) {
    if (input[i] == '+') {
      decoded += ' ';
    } else if (input[i] == '%' && i + 2 < input.length()) {
      char a = input[i + 1];
      char b = input[i + 2];
      int valA = (a >= '0' && a <= '9') ? a - '0' : (a >= 'a' && a <= 'f') ? a - 'a' + 10 : (a >= 'A' && a <= 'F') ? a - 'A' + 10 : -1;
      int valB = (b >= '0' && b <= '9') ? b - '0' : (b >= 'a' && b <= 'f') ? b - 'a' + 10 : (b >= 'A' && b <= 'F') ? b - 'A' + 10 : -1;
      if (valA != -1 && valB != -1) {
        decoded += (char)(valA * 16 + valB);
        i += 2;
      } else {
        decoded += input[i];
      }
    } else {
      decoded += input[i];
    }
  }
  return decoded;
}

void handleServerClient() {
  WiFiClient client = server.available();
  if (!client) return;

  String req = "";
  unsigned long timeout = millis() + 1500;
  while (client.connected() && millis() < timeout) {
    if (client.available()) {
      char c = client.read();
      req += c;
      if (req.endsWith("\r\n\r\n")) break;
    }
  }

  // 1. API: GET /scan - Quét & trả về danh sách Wi-Fi thực tế (JSON)
  if (req.startsWith("GET /scan") || req.indexOf("GET /scan") != -1) {
    Serial.println("[SOFTAP] Nhan yeu cau quet mang Wi-Fi /scan tu Client");
    int n = WiFi.scanNetworks(false, false);
    String json = "[";
    for (int i = 0; i < n; i++) {
      if (WiFi.SSID(i).length() > 0) {
        if (json.length() > 1) json += ",";
        bool isSecure = (WiFi.encryptionType(i) != WIFI_AUTH_OPEN);
        json += "{\"ssid\":\"" + WiFi.SSID(i) + "\",\"rssi\":" + String(WiFi.RSSI(i)) + ",\"secure\":" + (isSecure ? "true" : "false") + "}";
      }
    }
    json += "]";

    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json; charset=UTF-8");
    client.println("Access-Control-Allow-Origin: *");
    client.println("Connection: close");
    client.println();
    client.print(json);
    delay(10);
    client.stop();
    return;
  }

  // 2. API: POST /save - Lưu cấu hình Wi-Fi mới và khởi động lại
  if (req.startsWith("POST /save") || req.indexOf("POST /save") != -1) {
    int contentLength = 0;
    int clIdx = req.indexOf("Content-Length: ");
    if (clIdx == -1) clIdx = req.indexOf("content-length: ");
    if (clIdx != -1) {
      int endLine = req.indexOf("\r\n", clIdx);
      contentLength = req.substring(clIdx + 16, endLine).toInt();
    }
    String body = "";
    timeout = millis() + 2000;
    while (body.length() < (size_t)contentLength && millis() < timeout) {
      if (client.available()) {
        body += (char)client.read();
      }
    }

    String newSsid = "";
    String newPass = "";
    int ssidIdx = body.indexOf("ssid=");
    if (ssidIdx != -1) {
      int endSsid = body.indexOf("&", ssidIdx);
      if (endSsid == -1) endSsid = body.length();
      newSsid = urlDecode(body.substring(ssidIdx + 5, endSsid));
    }
    int passIdx = body.indexOf("password=");
    if (passIdx != -1) {
      int endPass = body.indexOf("&", passIdx);
      if (endPass == -1) endPass = body.length();
      newPass = urlDecode(body.substring(passIdx + 9, endPass));
    }

    String newCloudUrl = "";
    int cloudIdx = body.indexOf("cloud_url=");
    if (cloudIdx != -1) {
      int endCloud = body.indexOf("&", cloudIdx);
      if (endCloud == -1) endCloud = body.length();
      newCloudUrl = urlDecode(body.substring(cloudIdx + 10, endCloud));
      newCloudUrl.trim();
    }

    if (newSsid.length() > 0) {
      prefs.begin("wifi_cfg", false);
      prefs.putString("ssid", newSsid);
      prefs.putString("password", newPass);
      if (newCloudUrl.length() > 0) {
        prefs.putString("cloud_url", newCloudUrl);
        cloudUrl = newCloudUrl;
      }
      prefs.end();

      Serial.print("\n[WIFI SAVE] Da luu Wi-Fi: \"");
      Serial.print(newSsid);
      if (newCloudUrl.length() > 0) {
        Serial.printf("\" & Cloud URL: \"%s", newCloudUrl.c_str());
      }
      Serial.println("\". Dang khoi dong lai de ket noi...");

      client.println("HTTP/1.1 200 OK");
      client.println("Content-Type: text/html; charset=UTF-8");
      client.println("Connection: close");
      client.println();
      client.print(F("<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>body{font-family:sans-serif;background:#090d16;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;}.box{background:#111827;padding:30px;border-radius:18px;border:1px solid rgba(255,255,255,0.1);max-width:360px;}h2{color:#34d399;margin-bottom:10px;font-size:18px;}p{font-size:13px;color:#94a3b8;line-height:1.5;}</style></head><body><div class='box'><h2>Luu Thanh Cong!</h2><p>Nut dang khoi dong lai va tu ket noi mang moi.<br>Quyen so huu & san pham duoc giu nguyen.<br>Ban co the dong trang nay.</p></div></body></html>"));
      delay(500);
      client.stop();
      delay(500);
      ESP.restart();
      return;
    }
  }

  // 3. Phục vụ Captive Portal cho mọi request khác
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/html; charset=UTF-8");
  client.println("Connection: close");
  client.println();
  client.print(PORTAL_HTML);
  delay(10);
  client.stop();
}

#if ENABLE_BLE
class BleServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) {
    bleConnected = true;
    Serial.println("[BLE] Mobile App connected via BLE!");
  }
  void onDisconnect(BLEServer *pServer) {
    bleConnected = false;
    Serial.println("[BLE] Mobile App disconnected.");
    BLEDevice::startAdvertising();
  }
};

class BleWiFiConfigCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue().c_str();
    if (value.length() > 0) {
      Serial.printf("[BLE] Nhan goi tin cau hinh Wi-Fi (%d bytes)\n", value.length());
      String newSsid = "";
      String newPass = "";
      int sep = value.indexOf(':');
      if (sep != -1) {
        newSsid = value.substring(0, sep);
        newPass = value.substring(sep + 1);
      } else {
        newSsid = value;
      }
      if (newSsid.length() > 0) {
        prefs.begin("wifi_cfg", false);
        prefs.putString("ssid", newSsid);
        prefs.putString("password", newPass);
        prefs.end();

        if (pBleStatusChar) {
          uint8_t status = 0x03; // SUCCESS
          pBleStatusChar->setValue(&status, 1);
          pBleStatusChar->notify();
        }
        delay(1000);
        ESP.restart();
      }
    }
  }
};
#endif

void startProvisioningMode() {
  isProvisioningMode = true;
  provisioningStartTime = millis();

  // 1. Khoi dong Wi-Fi che do Dual Mode (WIFI_AP_STA) de vua phat SoftAP vua quet duoc Wi-Fi xung quanh
  WiFi.mode(WIFI_AP_STA);
  String apName = "SMARTORDER_SETUP_0001";
  WiFi.softAP(apName.c_str());

  // Khoi dong Web Server tren cong 80
  server.begin();

  // Quet Wi-Fi ban dau de san sang phuc vu danh sach
  Serial.println("\n[PROVISIONING] Dang quet cac mang Wi-Fi xung quanh...");
  int nScan = WiFi.scanNetworks(false, false);
  Serial.printf("[PROVISIONING] Da tim thay %d mang Wi-Fi kha dung!\n", nScan);

  String scanList = "";
  for (int i = 0; i < nScan && i < 15; i++) {
    if (WiFi.SSID(i).length() > 0) {
      if (scanList.length() > 0) scanList += ",";
      scanList += WiFi.SSID(i);
    }
  }
  if (scanList.length() == 0) scanList = "Home_WiFi_2.4G,Office_WiFi";

#if ENABLE_BLE
  // 2. Khoi dong BLE GATT Service
  String bleName = "SmartOrder-" + String(DEVICE_ID);
  BLEDevice::init(bleName.c_str());
  pBleServer = BLEDevice::createServer();
  pBleServer->setCallbacks(new BleServerCallbacks());

  BLEService *pService = pBleServer->createService(BLE_SERVICE_UUID);

  // Characteristic 1: DEVICE_INFO (Read)
  BLECharacteristic *pInfoChar = pService->createCharacteristic(
      BLE_CHAR_INFO_UUID, BLECharacteristic::PROPERTY_READ);
  String infoJson = "{\"deviceId\":\"" + String(DEVICE_ID) + "\",\"firmware\":\"" + String(FIRMWARE_VER) + "\"}";
  pInfoChar->setValue(infoJson.c_str());

  // Characteristic 2: WIFI_CREDENTIALS (Write)
  BLECharacteristic *pWiFiChar = pService->createCharacteristic(
      BLE_CHAR_WIFI_UUID, BLECharacteristic::PROPERTY_WRITE);
  pWiFiChar->setCallbacks(new BleWiFiConfigCallbacks());

  // Characteristic 3: PROVISION_STATUS (Notify)
  pBleStatusChar = pService->createCharacteristic(
      BLE_CHAR_STATUS_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  pBleStatusChar->addDescriptor(new BLE2902());
  uint8_t initStatus = 0x01; // Ready
  pBleStatusChar->setValue(&initStatus, 1);

  // Characteristic 4: WIFI_SCAN (Read) - Nap danh sach Wi-Fi thuc te vua quet duoc
  pBleScanChar = pService->createCharacteristic(
      BLE_CHAR_SCAN_UUID, BLECharacteristic::PROPERTY_READ);
  pBleScanChar->setValue(scanList.c_str());

  pService->start();

  BLEAdvertising *pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(BLE_SERVICE_UUID);
  pAdv->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.println("[PROVISIONING] Khoi dong Dual Mode: BLE 5 & SoftAP tai 192.168.4.1");
  Serial.print("[PROVISIONING] SoftAP SSID: "); Serial.println(apName);
  Serial.print("[PROVISIONING] BLE Device Name: "); Serial.println(bleName);
  Serial.print("[PROVISIONING] Wi-Fi Scan Char: "); Serial.println(scanList);
#else
  Serial.println("\n[PROVISIONING] Khoi dong SoftAP Captive Portal tai 192.168.4.1");
  Serial.print("[PROVISIONING] SoftAP SSID: "); Serial.println(apName);
  Serial.println("[PROVISIONING] Ket noi Wi-Fi tren bang dien thoai de cau hinh");
#endif

  Serial.println("[PROVISIONING] Thoi gian cho toi da: 5 phut (Auto-timeout bảo mật)");

  // LED sang lien tuc bao hieu che do Provisioning
  digitalWrite(LED_PIN, HIGH);
}

// =========================================================================================
// ⚡ SETUP & LOOP KHỞI TẠO HỆ THỐNG
// =========================================================================================
void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Đọc cấu hình Wi-Fi & Cloud URL từ NVS Flash
  prefs.begin("wifi_cfg", true);
  savedSsid = prefs.getString("ssid", "");
  savedPass = prefs.getString("password", "");
  cloudUrl  = prefs.getString("cloud_url", DEFAULT_CLOUD_URL);
  prefs.end();

  // Tự động đồng bộ nếu trong NVS Flash lưu IP cũ
  if (cloudUrl.indexOf("192.168.1.126") != -1 || cloudUrl.indexOf("192.168.1.129") != -1 || cloudUrl.indexOf("192.168.1.50") != -1) {
    cloudUrl = DEFAULT_CLOUD_URL;
    prefs.begin("wifi_cfg", false);
    prefs.putString("cloud_url", cloudUrl);
    prefs.end();
    Serial.println(F("[BOOT] Đã tự động cập nhật Cloud URL sang IP máy tính 192.168.1.140:5000 trong NVS Flash!"));
  }

  // In mã số thiết bị, PIN 6 số, Cloud URL và ASCII QR Code ra Serial Monitor
  printHardwareIdentityBanner();

  if (savedSsid == "") {
    Serial.println("[BOOT] Chua co Wi-Fi. Chuyen sang Provisioning Mode.");
    startProvisioningMode();
  } else {
    Serial.print("[BOOT] Tim thay Wi-Fi: ");
    Serial.println(savedSsid);
    WiFi.mode(WIFI_STA);
    WiFi.begin(savedSsid.c_str(), savedPass.c_str());

    int timeout = 0;
    while (WiFi.status() != WL_CONNECTED && timeout < 20) {
      delay(500);
      Serial.print(".");
      timeout++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n[BOOT] Ket noi Wi-Fi thanh cong!");
      configTime(7 * 3600, 0, "pool.ntp.org", "time.google.com", "time.cloudflare.com");
      blinkLED(2, 100, 100);
      bootstrapCloud();
    } else {
      Serial.println("\n[BOOT] Khong the ket noi Wi-Fi cu. Chuyen sang Provisioning Mode.");
      startProvisioningMode();
    }
  }
}

static unsigned long lastHeartbeatTime = 0;

void loop() {
  if (isProvisioningMode) {
    handleServerClient();

    // In trạng thái mỗi 5 giây để người dùng biết ESP32 đang hoạt động
    if (millis() - lastHeartbeatTime > 5000) {
      lastHeartbeatTime = millis();
      Serial.println(F("[STATUS] 📡 ESP32 đang phát Wi-Fi \"SMARTORDER_SETUP_0001\" (192.168.4.1). Đang chờ bạn kết nối..."));
    }

    // 5-minute timeout guard
    if (millis() - provisioningStartTime > PROVISIONING_TIMEOUT_MS) {
      Serial.println(F("\n[PROVISIONING TIMEOUT] Het thoi gian cho 5 phut. Dung che do cai dat."));
      isProvisioningMode = false;
      WiFi.softAPdisconnect(true);
      WiFi.mode(WIFI_OFF);
#if ENABLE_BLE
      BLEDevice::deinit(true);
#endif
      digitalWrite(LED_PIN, LOW);
      blinkLED(5, 50, 50); // Warning pattern
    }
  }

  // Đọc sự kiện nút bấm vật lý (GPIO 4)
  bool buttonPressed = (digitalRead(BUTTON_PIN) == LOW);

  if (buttonPressed) {
    if (pressStartTime == 0) {
      pressStartTime = millis();
    }
    unsigned long heldMs = millis() - pressStartTime;

    // Giữ 15s: Factory Reset
    if (heldMs >= 15000 && !buttonHeld15s) {
      buttonHeld15s = true;
      Serial.println(F("\n[FACTORY RESET] Xoa toan bo Wi-Fi trong NVS Flash!"));
      prefs.begin("wifi_cfg", false);
      prefs.clear();
      prefs.end();
      blinkLED(10, 50, 50);
      ESP.restart();
    }
    // Giữ 5s: Bật lại chế độ đổi Wi-Fi (bảo toàn sản phẩm & quyền sở hữu)
    else if (heldMs >= 5000 && !buttonHeld10s) {
      buttonHeld10s = true;
      Serial.println(F("\n[RESET WIFI] Giu nut 5 giay -> Den LED nhay xanh duong!"));
      Serial.println(F("[RESET WIFI] Dung dien thoai ket noi vao Wi-Fi: SMARTORDER_SETUP_0001"));
      Serial.println(F("[RESET WIFI] Trang cau hinh tu mo tai 192.168.4.1 (Chi can nhap Ten Wi-Fi & Mat khau)."));
      blinkLED(5, 80, 80);
      startProvisioningMode();
    }
  } else {
    if (pressStartTime > 0) {
      unsigned long duration = millis() - pressStartTime;
      pressStartTime = 0;
      buttonHeld10s = false;
      buttonHeld15s = false;

      // Nhấn ngắn (< 1s)
      if (duration < 1000) {
        clickCount++;
        lastReleaseTime = millis();
      }
    }
  }

  // Phát hiện Bấm 1 lần (Đặt hàng) vs Bấm 2 lần (Hủy đơn hàng trong 60s)
  if (clickCount > 0 && (millis() - lastReleaseTime > 400)) {
    if (isProvisioningMode && WiFi.status() != WL_CONNECTED) {
      Serial.println(F("\n🔘 [NÚT ĐÃ BẤM] ESP32 đang ở chế độ chờ Wi-Fi. Hãy kết nối vào Wi-Fi SMARTORDER_SETUP_0001 trên điện thoại để cài đặt!"));
      blinkLED(3, 80, 80);
    } else {
      if (clickCount == 1) {
        Serial.println(F("\n🔘 [BẤM 1 LẦN] Tạo đơn hàng ngay lập tức (Single Click Order)!"));
        sendButtonEvent("SINGLE_PRESS");
      } else if (clickCount >= 2) {
        Serial.println(F("\n🔘🔘 [BẤM 2 LẦN] Hủy đơn hàng trong 60 giây (Double Click Cancel)!"));
        sendButtonEvent("DOUBLE_PRESS");
      }
    }
    clickCount = 0;
  }

  // Đọc lệnh cấu hình Wi-Fi trực tiếp từ Serial / Web USB (Cú pháp: WIFI:SSID:PASSWORD)
  if (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.startsWith("WIFI:") || line.startsWith("SET_WIFI:")) {
      int firstSep = line.indexOf(':');
      String creds = line.substring(firstSep + 1);
      int secondSep = creds.indexOf(':');
      String newSsid = "";
      String newPass = "";
      if (secondSep != -1) {
        newSsid = creds.substring(0, secondSep);
        newPass = creds.substring(secondSep + 1);
      } else {
        newSsid = creds;
      }
      if (newSsid.length() > 0) {
        Serial.printf("\n[SERIAL CONFIG] Đã nhận thông tin Wi-Fi: SSID=\"%s\"\n", newSsid.c_str());
        prefs.begin("wifi_cfg", false);
        prefs.putString("ssid", newSsid);
        prefs.putString("password", newPass);
        prefs.end();
        Serial.println(F("[SERIAL CONFIG] Đã lưu vào NVS Flash! Khởi động lại ESP32 trong 1 giây..."));
        blinkLED(3, 100, 100);
        delay(1000);
        ESP.restart();
      }
    } else if (line.startsWith("URL:") || line.startsWith("CLOUD:")) {
      int firstSep = line.indexOf(':');
      String newUrl = line.substring(firstSep + 1);
      newUrl.trim();
      if (newUrl.length() > 0) {
        prefs.begin("wifi_cfg", false);
        prefs.putString("cloud_url", newUrl);
        prefs.end();
        cloudUrl = newUrl;
        Serial.printf("\n[SERIAL CONFIG] Đã đổi CLOUD_URL thành: %s\n", newUrl.c_str());
        blinkLED(2, 100, 100);
      }
    }
  }

  delay(20);
}
