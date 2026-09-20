#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// =========================================================================
// HARDWARE PIN DEFINITIONS (ESP32-WROOM-32E / ESP32-C3)
// =========================================================================

// Button & RTC Wakeup Pin
// GPIO 33 is RTC_GPIO8, supporting deep sleep wake from active LOW
#define PIN_BUTTON              GPIO_NUM_33

// Status RGB LED (Common Cathode)
#define PIN_LED_BLUE            25   // Connecting / Processing
#define PIN_LED_GREEN           26   // Order Success
#define PIN_LED_RED             27   // Error / Cancelled

// Optional Piezo Buzzer
#define PIN_BUZZER              14   // PWM Tone output

// Battery ADC Voltage Divider (100k / 100k to GND)
#define PIN_BATTERY_ADC         34   // ADC1_CH6 (Input only)

// =========================================================================
// GESTURE & TIMING CONSTANTS (Non-blocking & configurable from backend)
// =========================================================================
#define DEBOUNCE_MS                 50    // Debounce threshold
#define SHORT_PRESS_MAX_MS          800   // Short press (<800ms) -> Order
#define DOUBLE_PRESS_WINDOW_MS      1200  // Double press (<1200ms) -> Cancel
#define HOLD_5S_ACTIVATE_MS         5000  // Hold 5s -> Wake / Activate / Start Action
#define HOLD_10S_PROVISION_MS       10000 // Hold 10s -> WiFi Provisioning (BLE 5 + SoftAP)
#define HOLD_15S_FACTORY_RESET_MS   15000 // Hold 15s -> Factory Reset (NVS Clear)

#define WIFI_CONNECT_TIMEOUT_MS     5000  // Max 5s to connect Wi-Fi before sleep
#define WIFI_MAX_RETRIES            3     // Prevent battery drain loops
#define BLE_PROVISION_TIMEOUT_S     180   // 3 minutes BLE advertising timeout

// =========================================================================
// BLE 5 GATT SERVICE & CHARACTERISTICS UUIDs
// =========================================================================
#define BLE_SERVICE_UUID        "0000FFF0-0000-1000-8000-00805F9B34FB"
#define BLE_CHAR_INFO_UUID      "0000FFF1-0000-1000-8000-00805F9B34FB" // Read Device Info
#define BLE_CHAR_WIFI_UUID      "0000FFF2-0000-1000-8000-00805F9B34FB" // Write SSID + Pass
#define BLE_CHAR_STATUS_UUID    "0000FFF3-0000-1000-8000-00805F9B34FB" // Notify Status

// =========================================================================
// DEFAULT CLOUD BACKEND URL (Overrides from NVS)
// =========================================================================
#define DEFAULT_BACKEND_URL     "http://192.168.1.50:5000"

#endif // CONFIG_H
