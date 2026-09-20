#ifndef STATE_MACHINE_H
#define STATE_MACHINE_H

#include <Arduino.h>

enum SystemState {
  STATE_BOOT,
  STATE_DETECT_GESTURE,
  STATE_BLE_PROVISIONING,
  STATE_WIFI_CONNECTING,
  STATE_SENDING_EVENT,
  STATE_LED_FEEDBACK,
  STATE_ENTER_DEEP_SLEEP
};

class StateMachine {
public:
  static void run();
};

#endif
