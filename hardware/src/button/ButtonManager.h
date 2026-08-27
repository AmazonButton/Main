#ifndef BUTTON_MANAGER_H
#define BUTTON_MANAGER_H

#include <Arduino.h>
#include "config.h"

enum ButtonGesture {
  GESTURE_NONE,
  GESTURE_SHORT_PRESS,
  GESTURE_DOUBLE_PRESS,
  GESTURE_FIVE_CLICKS_PAIR,
  GESTURE_HOLD_5S_ACTIVATE,
  GESTURE_HOLD_10S_PROVISION,
  GESTURE_HOLD_15S_FACTORY_RESET
};

class ButtonManager {
public:
  static void init();
  static ButtonGesture detectGesture();
};

#endif
