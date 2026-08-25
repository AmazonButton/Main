# WI-FI PROVISIONING & CAPTIVE PORTAL FALLBACK

## 1. Concept
If the customer does not have the mobile application or BLE 5 is unavailable on their phone, the device provides an automatic **Captive Portal fallback**:
1. Concurrently with BLE 5 advertising, the ESP32 starts an unencrypted SoftAP: `SmartButton-XXXX-AP`.
2. The user connects their smartphone or laptop Wi-Fi to this network.
3. The internal DNS server intercepts all port 53 DNS requests and redirects the browser directly to `http://192.168.4.1`.
4. A clean, responsive mobile web page appears allowing the user to select their home Wi-Fi and input the password.
5. Upon tapping "LƯU VÀ KẾT NỐI", credentials are written to flash NVS, the AP is terminated, and the device restarts and connects.

---

## 2. Captive Portal Technical Architecture

- **SoftAP IP**: `192.168.4.1`
- **Subnet Mask**: `255.255.255.0`
- **DNS Server Port**: `53` (Wildcard `*` redirecting to `192.168.4.1`)
- **HTTP Server**: Arduino `WebServer` on port `80`
- **Endpoints**:
  - `GET /`: Serves mobile-optimized HTML setup form
  - `POST /save`: Parses `s` (SSID) and `p` (Password), persists to NVS, initiates restart

---

## 3. Wi-Fi Reconnection & Failure Policy
- **Maximum Retries**: 3 attempts.
- **Connection Timeout**: 5000 ms per attempt.
- **On Failure**: If the router is off or password changed, the LED blinks RED 3 times with warning buzzer tones, and the device immediately returns to Deep Sleep.
- **Anti-Drain Guarantee**: The firmware NEVER loops or retries infinitely.
