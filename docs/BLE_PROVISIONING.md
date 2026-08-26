# BLE 5 PROVISIONING ARCHITECTURE & GATT PROTOCOL

## 1. Overview
The Smart Order Button features **Bluetooth Low Energy (BLE 5)** provisioning out of the box. Devices leave the factory with zero hardcoded Wi-Fi network credentials. When powered on for the first time or when the physical button is held for $\ge 5.0$ seconds, the ESP32 initiates BLE 5 Advertising.

---

## 2. GATT Service & Characteristics

- **Primary Service UUID**: `0000FFF0-0000-1000-8000-00805F9B34FB`

| Characteristic Name | UUID | Permissions | Data Format | Description |
|---|---|---|---|---|
| **Device Info** | `0000FFF1-...` | READ | String | Returns `deviceId` (e.g., `BTN-8829-WTR`) and firmware version. |
| **Wi-Fi Credential Write** | `0000FFF2-...` | WRITE | String / Encrypted | Transmits `SSID:PASSWORD` payload from the mobile app. |
| **Provisioning Status** | `0000FFF3-...` | NOTIFY | 1-Byte Hex | Real-time status: `0x01` (Connecting), `0x02` (Testing Cloud), `0x03` (Success), `0xEE` (Auth Fail). |

---

## 3. Provisioning Sequence

```
[ Customer Mobile App ]                                     [ ESP32 Smart Button ]
         |                                                            |
         | --- (1) Scan Advertisements ("SmartButton-XXXX") --------> |
         |                                                            |
         | <--- (2) BLE 5 Connect & Read Device Info (0xFFF1) ------- |
         |                                                            |
         | --- (3) Write Wi-Fi Credentials (0xFFF2, "SSID:Pass") ---> |
         |                                                            |
         |                                                            | [ Save to NVS ]
         |                                                            | [ Test AP Connect ]
         |                                                            |
         | <--- (4) Notify Status: 0x03 (SUCCESS) (0xFFF3) ---------- |
         |                                                            |
         |                                                            | [ Power Down BLE Radio ]
         |                                                            | [ Enter Deep Sleep ]
```

---

## 4. Timeout & Power Safety
If no mobile phone pairs within **180 seconds (3 minutes)**:
- The BLE radio is de-initialized.
- SoftAP is torn down.
- LED turns OFF and the microcontroller enters Deep Sleep to prevent accidental battery drainage.
