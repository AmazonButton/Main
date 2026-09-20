#include "PowerManager.h"
#include <driver/rtc_io.h>

void PowerManager::init() {
  pinMode(PIN_BATTERY_ADC, INPUT);
  // Configure RTC GPIO wakeup on PIN_BUTTON (active LOW)
  esp_sleep_enable_ext0_wakeup(PIN_BUTTON, 0);
  rtc_gpio_pullup_en(PIN_BUTTON);
  rtc_gpio_pulldown_dis(PIN_BUTTON);
}

void PowerManager::enterDeepSleep() {
  Serial.println("[POWER] Preparing peripheral shutdown. Entering DEEP SLEEP (~15uA)...");
  Serial.flush();
  
  // Power down Wi-Fi and Bluetooth radios completely
  esp_sleep_enable_ext0_wakeup(PIN_BUTTON, 0);
  esp_deep_sleep_start();
}

esp_sleep_wakeup_cause_t PowerManager::getWakeupCause() {
  return esp_sleep_get_wakeup_cause();
}

uint32_t PowerManager::readBatteryMillivolts() {
  // 12-bit ADC reading on 3.3V reference with 2:1 divider (100k/100k)
  uint32_t raw = analogRead(PIN_BATTERY_ADC);
  // ADC mV = raw * (3300 / 4095) * 2
  uint32_t batteryMv = (raw * 3300 * 2) / 4095;
  return batteryMv;
}

uint8_t PowerManager::calculateBatteryPercentage(uint32_t millivolts) {
  // LiPo voltage curve: 3.3V (0%) to 4.2V (100%)
  if (millivolts >= 4200) return 100;
  if (millivolts <= 3300) return 0;
  return (uint8_t)(((millivolts - 3300) * 100) / (4200 - 3300));
}
