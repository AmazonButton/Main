#include "StateMachine.h"
#include "../power/PowerManager.h"
#include "../led/LedManager.h"
#include "../buzzer/BuzzerManager.h"
#include "../button/ButtonManager.h"
#include "../wifi/WiFiManager.h"
#include "../ble/BLEProvisioning.h"
#include "../api/ApiClient.h"
#include "config.h"

// Hardcoded device credentials for this firmware build (or read from NVS)
static const String DEVICE_ID = "BTN-8829-WTR";
static const String DEVICE_SECRET = "sec_smart_button_8829_wtr_key_99";
static const String BACKEND_URL = DEFAULT_BACKEND_URL;

void StateMachine::run() {
  Serial.begin(115200);
  delay(50);

  Serial.println("\n==================================================");
  Serial.println("🔘 SMART ORDER BUTTON — ESP32 ULTRA LOW POWER FIRMWARE");
  Serial.printf("Device ID: %s | Model: ESP32-WROOM-32E\n", DEVICE_ID.c_str());
  Serial.println("==================================================");

  // Initialize hardware drivers
  LedManager::init();
  BuzzerManager::init();
  ButtonManager::init();
  PowerManager::init();

  // WHITE: Device Boot visual indicator
  LedManager::setColor(LED_WHITE);
  delay(120);

  uint32_t batteryMv = PowerManager::readBatteryMillivolts();
  uint8_t batteryPct = PowerManager::calculateBatteryPercentage(batteryMv);
  Serial.printf("[POWER] Battery: %u mV (%u%%)\n", batteryMv, batteryPct);

  // 1. Detect Gesture (Non-blocking thresholds)
  ButtonGesture gesture = ButtonManager::detectGesture();

  // Gesture: Hold 15s -> Factory Reset
  if (gesture == GESTURE_HOLD_15S_FACTORY_RESET) {
    Serial.println("[RESET] Hold 15s detected: FACTORY RESETTING DEVICE...");
    WiFiManager::clearCredentials();
    LedManager::blink(LED_RED, 5, 100);
    PowerManager::enterDeepSleep();
    return;
  }

  // Gesture: 5 Clicks (Quick Pairing Mode) or Hold 10s -> BLE 5 Auto-Pairing & WiFi Provisioning Mode
  if (gesture == GESTURE_FIVE_CLICKS_PAIR || gesture == GESTURE_HOLD_10S_PROVISION || !WiFiManager::hasCredentials()) {
    Serial.println("[MODE] BLUE LED: 5-Clicks or Provision detected -> Starting BLE Auto-Pairing");
    LedManager::setColor(LED_BLUE);
    BuzzerManager::beepBoot();

    // Name format: SOB-<DEVICE_ID> (e.g. SOB-BTN-8829-WTR) so Mobile app can auto-detect without typing ID
    String bleName = "SOB-" + DEVICE_ID;
    BLEProvisioning::start(bleName, DEVICE_ID);
    WiFiManager::startCaptivePortal(bleName + "-AP");

    unsigned long provisionStart = millis();
    while (millis() - provisionStart < (BLE_PROVISION_TIMEOUT_S * 1000)) {
      // Blink BLUE LED softly during pairing
      if ((millis() / 500) % 2 == 0) {
        LedManager::setColor(LED_BLUE);
      } else {
        LedManager::setColor(LED_OFF);
      }

      WiFiManager::handleCaptivePortal();
      delay(20);
    }

    BLEProvisioning::stop();
    WiFiManager::stopWiFi();
    LedManager::setColor(LED_OFF);
    PowerManager::enterDeepSleep();
    return;
  }

  // Gesture: Hold 5s -> Wake / Activate / Config Sync
  if (gesture == GESTURE_HOLD_5S_ACTIVATE) {
    Serial.println("[MODE] PURPLE LED: Device Configuration / Activation Sync");
    LedManager::setColor(LED_PURPLE);
    // Continue to connect Wi-Fi and sync config
  }

  if (gesture == GESTURE_NONE) {
    Serial.println("[GESTURE] Transient electrical bounce. Deep sleep immediately.");
    PowerManager::enterDeepSleep();
    return;
  }

  // 2. Wi-Fi Connection & Data Transmission -> YELLOW LED
  LedManager::setColor(LED_YELLOW);

  bool connected = false;
  for (int retry = 1; retry <= WIFI_MAX_RETRIES; retry++) {
    Serial.printf("[WIFI] Attempt %d/%d...\n", retry, WIFI_MAX_RETRIES);
    if (WiFiManager::connect(WIFI_CONNECT_TIMEOUT_MS)) {
      connected = true;
      break;
    }
    delay(200);
  }

  if (!connected) {
    Serial.println("[WIFI] Connection failed. RED LED Error indication.");
    LedManager::setColor(LED_RED);
    BuzzerManager::beepError();
    delay(1500);
    WiFiManager::stopWiFi();
    LedManager::setColor(LED_OFF);
    PowerManager::enterDeepSleep();
    return;
  }

  // 3. Dispatch Event to Cloud
  String eventTypeStr = "SINGLE_PRESS";
  if (gesture == GESTURE_DOUBLE_PRESS) {
    eventTypeStr = "DOUBLE_PRESS"; // Cancel order gesture
  } else if (gesture == GESTURE_HOLD_5S_ACTIVATE) {
    eventTypeStr = "ACTIVATE";
  }

  String requestId = "esp32_" + String(millis()) + "_" + String(random(1000, 9999));
  int8_t rssi = WiFi.RSSI();

  Serial.printf("[API] Transmitting event: %s (Req: %s, Batt: %d%%, RSSI: %d dBm)\n",
                eventTypeStr.c_str(), requestId.c_str(), batteryPct, rssi);

  ApiClient apiClient(BACKEND_URL, DEVICE_ID, DEVICE_SECRET);
  ApiResponse response = apiClient.sendEvent(eventTypeStr, requestId, batteryPct, rssi);

  // 4. Visual & Audio Feedback
  if (response.success) {
    if (gesture == GESTURE_DOUBLE_PRESS) {
      Serial.println("[SUCCESS] Order cancelled successfully by Double-Press.");
      LedManager::setColor(LED_RED); // Red confirms cancellation
      BuzzerManager::beepBoot();
    } else {
      Serial.println("[SUCCESS] GREEN LED: Order created & confirmed by Cloud!");
      LedManager::setColor(LED_GREEN);
      BuzzerManager::beepSuccess();
    }
    delay(1500);
  } else {
    Serial.printf("[ERROR] RED LED: Cloud rejected request (%d: %s)\n",
                  response.statusCode, response.message.c_str());
    LedManager::setColor(LED_RED);
    BuzzerManager::beepError();
    delay(1500);
  }

  // 5. Radio Shutdown & Deep Sleep Entry
  Serial.println("[POWER] Shutting down Wi-Fi radio and entering Deep Sleep (~15uA)...");
  WiFiManager::stopWiFi();
  LedManager::setColor(LED_OFF);
  PowerManager::enterDeepSleep();
}
