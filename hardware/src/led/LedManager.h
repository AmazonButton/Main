#ifndef LED_MANAGER_H
#define LED_MANAGER_H

#include <Arduino.h>
#include "config.h"

enum LedColor {
  LED_OFF,
  LED_BLUE,
  LED_YELLOW,
  LED_GREEN,
  LED_RED,
  LED_PURPLE,
  LED_WHITE
};

class LedManager {
public:
  static void init();
  static void setColor(LedColor color);
  static void blink(LedColor color, int times, int intervalMs);
};

#endif
