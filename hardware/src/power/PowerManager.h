#ifndef POWER_MANAGER_H
#define POWER_MANAGER_H

#include <Arduino.h>
#include <esp_sleep.h>
#include "config.h"

class PowerManager {
public:
  static void init();
  static void enterDeepSleep();
  static esp_sleep_wakeup_cause_t getWakeupCause();
  static uint32_t readBatteryMillivolts();
  static uint8_t calculateBatteryPercentage(uint32_t millivolts);
};

#endif
